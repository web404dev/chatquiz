import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ZOOM_GENRES, ZOOM_IDS, ZOOM_PEOPLE_GENRE, ZOOM_WORDS } from "../zoom-bank.js";

// 확대 사진: 단어마다 위키데이터 대표 그림(P18)을 찾아 위키미디어 공용 2560px 주소만 저장한다. 파일은 받지 않는다.
// 대표 그림이 작으면(짧은 변 1200px 미만) 빼지 않고 큰 사진을 고른다: 같은 항목의 다른 대표 그림 → 그 항목이 찍힌 품질 사진(사람은 찍힌 사진).
// 연예인은 위키데이터에서 한국 국적 배우·가수·방송인·코미디언을 위키 문서가 많은 순으로 받는다.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "zoom-pics.json");
const excludePath = join(root, "zoom-exclude.json");
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const SPARQL = "https://query.wikidata.org/sparql";
const UA = "chatquiz-zoom/1.0 (https://web404dev.github.io/chatquiz/)";
const PAUSE_MS = 1000;
/** 원본이 작으면 크게 확대했을 때 뭉개지니 짧은 변이 이 이상인 사진만 쓴다. */
const MIN_SIDE = 1200;
const MIN_ITEMS = 30;
const PEOPLE_LIMIT = 200;

const pause = (ms = PAUSE_MS) => new Promise((ok) => setTimeout(ok, ms));

async function api(base, params) {
  const url = new URL(base);
  url.search = new URLSearchParams({ format: "json", ...params }).toString();
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (res.status === 429 || res.status === 503) {
      await pause(10000 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${base} ${res.status}`);
    return res.json();
  }
  throw new Error(`${base} 429`);
}

function chunks(list, size = 50) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function commonsUrl(file) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=2560`;
}

function fileOfUrl(url) {
  const name = String(url || "").split("/Special:FilePath/")[1] || "";
  return decodeURIComponent(name.split("?")[0]).replace(/_/g, " ");
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

/** 사진으로 쓸 만한 크기·모양인지(그림 파일·긴 파노라마는 뺀다). */
function goodShape(info) {
  const w = Number(info?.width) || 0;
  const h = Number(info?.height) || 0;
  if (Math.min(w, h) < MIN_SIDE || !/^image\/jpeg$/i.test(info?.mime || "")) return false;
  const ratio = w / h;
  return ratio >= 0.6 && ratio <= 1.8;
}

async function fileInfos(files) {
  const infos = new Map();
  for (const part of chunks([...new Set(files)])) {
    const data = await api(COMMONS_API, { action: "query", prop: "imageinfo", iiprop: "size|mime", titles: part.map((file) => `File:${file}`).join("|") });
    const back = new Map((data.query?.normalized || []).map((row) => [row.to, row.from]));
    for (const page of Object.values(data.query?.pages || {})) {
      const info = page.imageinfo?.[0];
      const title = (back.get(page.title) || page.title).replace(/^File:/, "");
      if (info) infos.set(title, info);
    }
    await pause();
  }
  return infos;
}

/**
 * 그 항목이 찍혔다고 표시된(depicts) 사진 중 품질 사진을 고른다. 분류에서 가장 큰 사진을 고르면 풍경·지도 등 엉뚱한 사진이 잡혀서 쓰지 않는다.
 * 사람은 품질 사진이 드물어 품질 표시가 없어도 관련 높은 순으로 고른다.
 */
async function pickDepicted(id, { person = false } = {}) {
  const searches = [`haswbstatement:P180=${id} filetype:bitmap incategory:Quality_images`];
  if (person) searches.push(`haswbstatement:P180=${id} filetype:bitmap`);
  for (const search of searches) {
    const data = await api(COMMONS_API, { action: "query", generator: "search", gsrnamespace: "6", gsrlimit: "20", gsrsearch: search, prop: "imageinfo", iiprop: "size|mime" });
    await pause();
    const pages = Object.values(data.query?.pages || {}).sort((a, b) => a.index - b.index);
    const hit = pages.find((page) => goodShape(page.imageinfo?.[0]));
    if (hit) return hit.title.replace(/^File:/, "");
  }
  return "";
}

async function fetchPeople(skipPeople) {
  const query = `SELECT ?p ?name (SAMPLE(?img) AS ?image) (MAX(?n) AS ?links) (GROUP_CONCAT(DISTINCT ?alt; separator="|") AS ?alts) WHERE {
  ?p wdt:P31 wd:Q5; wdt:P27 wd:Q884; wdt:P18 ?img; wikibase:sitelinks ?n; rdfs:label ?name.
  FILTER(LANG(?name) = "ko")
  VALUES ?occ { wd:Q33999 wd:Q177220 wd:Q10800557 wd:Q10798782 wd:Q947873 wd:Q245068 wd:Q2252262 wd:Q2259451 }
  ?p wdt:P106 ?occ.
  FILTER NOT EXISTS { ?p wdt:P570 ?died }
  FILTER NOT EXISTS { ?p wdt:P106 wd:Q82955 }
  OPTIONAL { ?p skos:altLabel ?alt. FILTER(LANG(?alt) = "ko") }
} GROUP BY ?p ?name ORDER BY DESC(?links) LIMIT ${PEOPLE_LIMIT}`;
  const url = `${SPARQL}?format=json&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/sparql-results+json" } });
  if (!res.ok) throw new Error(`sparql ${res.status}`);
  const rows = (await res.json()).results?.bindings || [];
  const seen = new Set();
  const people = [];
  for (const row of rows) {
    const word = String(row.name?.value || "").trim();
    const id = String(row.p?.value || "").split("/").pop();
    if (!word || !/^[가-힣 ]+$/.test(word) || seen.has(word) || skipPeople.has(word)) continue;
    seen.add(word);
    const aliases = String(row.alts?.value || "")
      .split("|")
      .map((name) => name.trim())
      .filter((name) => name && name !== word);
    people.push({ word, genre: ZOOM_PEOPLE_GENRE, aliases: [...new Set(aliases)].slice(0, 6), id });
  }
  return people;
}

async function main() {
  const previous = await readJson(outPath, {});
  const prevRows = new Map((previous.items || []).map((row) => [row.word, row]));
  const exclude = await readJson(excludePath, {});
  const skip = new Set(Array.isArray(exclude.words) ? exclude.words : []);
  const skipPeople = new Set(Array.isArray(exclude.people) ? exclude.people : []);
  const words = ZOOM_WORDS.filter((row) => !skip.has(row.word));

  // 1) 단어 → 위키데이터 항목(직접 적은 항목 > 지난번 항목 > 한국어 검색 첫 결과)
  const ids = new Map();
  for (const row of words) {
    let id = ZOOM_IDS[row.word] || prevRows.get(row.word)?.wikidata || "";
    if (!id) {
      const found = await api(WIKIDATA_API, { action: "wbsearchentities", search: row.word, language: "ko", uselang: "ko", limit: "1" });
      id = found.search?.[0]?.id || "";
      await pause();
    }
    if (id) ids.set(row.word, id);
    else console.log(`못 찾음 ${row.word}`);
  }
  let people = [];
  try {
    people = await fetchPeople(skipPeople);
  } catch (err) {
    // 연예인 질의가 막혀도 나머지는 갱신하고, 지난번 연예인은 그대로 둔다.
    console.log(`연예인 목록 실패 · 지난번 유지 (${err.message})`);
    people = (previous.items || []).filter((row) => row.genre === ZOOM_PEOPLE_GENRE).map((row) => ({ ...row, id: row.wikidata }));
  }
  for (const row of people) ids.set(row.word, row.id);
  const all = [...words, ...people];

  // 2) 항목 → 대표 그림 전부(50개씩)
  const claims = new Map();
  for (const part of chunks([...new Set(ids.values())])) {
    const data = await api(WIKIDATA_API, { action: "wbgetentities", ids: part.join("|"), props: "claims" });
    for (const id of part) {
      const c = data.entities?.[id]?.claims || {};
      claims.set(id, {
        files: (c.P18 || []).map((s) => s.mainsnak?.datavalue?.value).filter(Boolean),
      });
    }
    await pause();
  }

  // 3) 대표 그림 크기 → 큰 것이 없으면 지난번에 고른 사진, 그래도 없으면 그 항목이 찍힌 사진에서 고른다.
  const infos = await fileInfos([...claims.values()].flatMap((c) => c.files));
  const items = [];
  const picked = [];
  const none = [];
  for (const row of all) {
    const id = ids.get(row.word);
    const c = id ? claims.get(id) : null;
    if (!c) continue;
    let file = c.files.find((name) => goodShape(infos.get(name))) || "";
    if (!file) {
      const before = fileOfUrl(prevRows.get(row.word)?.image);
      if (before && !c.files.includes(before)) file = before;
    }
    if (!file) {
      file = await pickDepicted(id, { person: row.genre === ZOOM_PEOPLE_GENRE });
      if (file) picked.push(row.word);
    }
    if (!file) {
      none.push(row.word);
      continue;
    }
    items.push({ word: row.word, genre: row.genre, aliases: row.aliases || [], image: commonsUrl(file), wikidata: id });
  }
  if (picked.length) console.log(`찍힌 사진에서 큰 사진 고름 ${picked.length}: ${picked.join(" ")}`);
  if (none.length) console.log(`쓸 사진 없음 ${none.length}: ${none.join(" ")}`);
  if (items.length < MIN_ITEMS) throw new Error(`사진 ${items.length}개뿐이라 기존 파일을 유지합니다`);
  const out = {
    version: 3,
    fetchedAt: Date.now(),
    title: "확대 사진 (단어 목록·한국 연예인 + 위키데이터·위키미디어 공용 사진)",
    note: "사진 파일은 저장하지 않고 위키미디어 공용 주소만 둔다. 사진 저작권·라이선스는 각 파일 문서를 따른다. 빼고 싶은 단어는 zoom-exclude.json words, 사람은 people 에 적고 다시 갱신한다.",
    genres: ZOOM_GENRES,
    items,
  };
  await writeFile(outPath, `${JSON.stringify(out, null, 1)}\n`);
  const byGenre = ZOOM_GENRES.map((genre) => `${genre} ${items.filter((row) => row.genre === genre).length}`).join(" · ");
  console.log(`확대 사진 ${items.length}/${all.length} (${byGenre}) → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
