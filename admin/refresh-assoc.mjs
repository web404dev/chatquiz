import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ASSOC_MIN_HINTS, buildAssocPool, chooseAssocHints, isDisambiguationHtml, linkTitlesFromHtml, pageTitleFromHtml } from "../assoc-bank.js";

// 연상 퀴즈: 정답 단어마다 한국어 위키백과 문서 앞부분의 링크 단어를 힌트로 모은다(키 없음). 문서는 저장하지 않고 링크 제목만 남긴다.
// 정답 후보: zoom-pics.json 의 사물 단어(연예인 제외, 위키데이터 → 한국어 문서) + words.json 단어 은행(같은 제목 문서가 있을 때).
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "assoc.json");
const excludePath = join(root, "assoc-exclude.json");
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const PAGE_HTML = "https://ko.wikipedia.org/api/rest_v1/page/html/";
const UA = "chatquiz-assoc/1.0 (https://web404dev.github.io/chatquiz/)";
const MIN_ITEMS = 60;
const GAP_MS = 1100;

const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function fetchRetry(url, accept = "application/json") {
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(url, { headers: { "user-agent": UA, accept } }).catch(() => null);
    if (res && res.ok) return res;
    if (res && res.status === 404) return res;
    await pause(4000 * (i + 1));
  }
  throw new Error(`요청 실패: ${url}`);
}

async function kowikiTitles(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = `${WIKIDATA}?action=wbgetentities&ids=${batch.join("|")}&props=sitelinks&sitefilter=kowiki&format=json`;
    const data = await (await fetchRetry(url)).json();
    for (const id of batch) {
      const title = data?.entities?.[id]?.sitelinks?.kowiki?.title;
      if (title) out.set(id, title);
    }
    await pause(GAP_MS);
  }
  return out;
}

function candidates(zoomRaw, wordsRaw) {
  const rows = [];
  const seen = new Set();
  const zoom = Array.isArray(zoomRaw) ? zoomRaw : zoomRaw?.items || [];
  for (const row of zoom) {
    const word = String(row?.word || "").trim();
    if (!word || row.genre === "연예인" || seen.has(word)) continue;
    seen.add(word);
    rows.push({ word, genre: String(row.genre || ""), aliases: (row.aliases || []).filter(Boolean), wikidata: String(row.wikidata || "") });
  }
  const words = Array.isArray(wordsRaw) ? wordsRaw : wordsRaw?.items || wordsRaw?.words || [];
  for (const item of words) {
    const word = String(typeof item === "string" ? item : item?.word || "").trim();
    if (!word || seen.has(word)) continue;
    seen.add(word);
    rows.push({ word, genre: "", aliases: [], wikidata: "" });
  }
  return rows;
}

/** --links <파일>: 받은 링크를 그 파일에 남기고, 파일이 있으면 위키백과를 다시 부르지 않는다(거르기 규칙만 바꿔 볼 때). */
function linksCachePath() {
  const i = process.argv.indexOf("--links");
  return i > 0 ? process.argv[i + 1] : "";
}

async function fetchRows(rows) {
  const titles = await kowikiTitles(rows.map((row) => row.wikidata).filter((id) => /^Q\d+$/.test(id)));
  const fetched = [];
  const pages = new Set();
  let n = 0;
  for (const row of rows) {
    n += 1;
    const title = titles.get(row.wikidata) || row.word;
    const res = await fetchRetry(PAGE_HTML + encodeURIComponent(title.replace(/ /g, "_")), "text/html");
    await pause(GAP_MS);
    if (n % 25 === 0) console.log(`${n}/${rows.length} 받음`);
    if (!res.ok) continue;
    const html = await res.text();
    if (isDisambiguationHtml(html)) continue;
    const page = pageTitleFromHtml(html, title);
    // 같은 문서로 넘어가는 두 단어(이어폰·헤드폰)는 힌트가 똑같아서 먼저 나온 것만.
    if (pages.has(page)) continue;
    pages.add(page);
    const aliases = [...row.aliases];
    if (page !== row.word && /^[가-힣]+( [가-힣]+)?$/.test(page)) aliases.push(page);
    fetched.push({ word: row.word, genre: row.genre, aliases, page, links: linkTitlesFromHtml(html) });
  }
  return fetched;
}

async function main() {
  const exclude = await readJson(excludePath, {});
  const dropWords = new Set(exclude.words || []);
  const dropHints = new Set(exclude.hints || []);
  const rows = candidates(await readJson(join(root, "zoom-pics.json"), []), await readJson(join(root, "words.json"), []));
  const cache = linksCachePath();
  let fetched = cache ? await readJson(cache, null) : null;
  if (!fetched) {
    fetched = await fetchRows(rows);
    if (cache) await writeFile(cache, JSON.stringify(fetched));
  }
  fetched = fetched
    .filter((row) => !dropWords.has(row.word))
    .map((row) => ({ ...row, links: row.links.filter((link) => !dropHints.has(link)) }));
  const chosen = chooseAssocHints(fetched);
  const pool = buildAssocPool({ items: chosen });
  const keep = new Set(pool.items.map((row) => row.word));
  const items = chosen.filter((row) => keep.has(row.word)).map(({ word, genre, aliases, page, hints }) => ({ word, genre, aliases, page, hints }));
  console.log(`정답 후보 ${rows.length} · 문서 ${fetched.length} · 힌트 ${ASSOC_MIN_HINTS}개 이상 ${items.length}`);
  if (items.length < MIN_ITEMS) throw new Error(`연상 문제가 ${items.length}개뿐이라 저장하지 않습니다`);
  await writeFile(outPath, `${JSON.stringify({ fetchedAt: Date.now(), source: "ko.wikipedia.org (CC BY-SA 4.0)", items }, null, 1)}\n`);
  console.log(`assoc.json 저장: ${items.length}개`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
