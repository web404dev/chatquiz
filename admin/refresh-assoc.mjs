import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ASSOC_MIN_EASY_HINTS, ASSOC_MIN_HINTS, buildAssocPool, chooseAssocHints, isDisambiguationHtml, isUsableHintPhoto, linkTitlesFromHtml, pageTitleFromHtml } from "../assoc-bank.js";

// 연상 퀴즈: 정답 단어마다 한국어 위키백과 문서 본문의 링크 단어를 힌트로 모은다(키 없음). 문서는 저장하지 않고 링크 제목만 남긴다.
// 힌트는 위키낱말사전 「부록:자주 쓰이는 한국어 낱말 5800」에 든 쉬운 말을 먼저 쓰고, 모자라면 문서 앞부분 링크로 채운다(사용자 2026-11-15).
// 정답 후보: zoom-pics.json 의 사물 단어(연예인 제외, 위키데이터 → 한국어 문서) + words.json 단어 은행(같은 제목 문서가 있을 때).
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "assoc.json");
const excludePath = join(root, "assoc-exclude.json");
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const PAGE_HTML = "https://ko.wikipedia.org/api/rest_v1/page/html/";
const KOWIKI_API = "https://ko.wikipedia.org/w/api.php";
const KOWIKT_API = "https://ko.wiktionary.org/w/api.php";
/** 쉬운 낱말 목록 문서(위키낱말사전, CC BY-SA). 문서의 낱말 링크만 읽는다. */
const EASY_WORDS_PAGE = "부록:자주 쓰이는 한국어 낱말 5800";
const MIN_EASY_WORDS = 3000;
const UA = "chatquiz-assoc/1.0 (https://web404dev.github.io/chatquiz/)";
const MIN_ITEMS = 60;
const GAP_MS = 1100;
/** 사진 힌트: 힌트 단어 문서의 대표 사진(pageimages) 썸네일 폭. 사진 파일은 받지 않고 주소만 남긴다. */
const PHOTO_SIZE = 480;

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
    // links: 본문 링크 전체(나온 순서), leadCount: 그중 앞부분 묶음(예전 힌트 자리, 쉬운 힌트가 모자랄 때 채움).
    fetched.push({ word: row.word, genre: row.genre, aliases, page, links: linkTitlesFromHtml(html, Infinity), leadCount: linkTitlesFromHtml(html).length });
  }
  return fetched;
}

/** 위키낱말사전 쉬운 낱말 목록 → Set. 너무 적게 받히면 멈춘다(예전 자료를 그대로 둔다). */
async function fetchEasyWords() {
  const params = new URLSearchParams({ action: "parse", page: EASY_WORDS_PAGE, prop: "links", format: "json", formatversion: "2" });
  const data = await (await fetchRetry(`${KOWIKT_API}?${params}`)).json();
  const words = new Set((data?.parse?.links || []).filter((link) => link.ns === 0).map((link) => String(link.title || "").trim()).filter(Boolean));
  if (words.size < MIN_EASY_WORDS) throw new Error(`쉬운 낱말 목록이 ${words.size}개뿐이라 멈춥니다`);
  return words;
}

/** 위키백과 문서 제목들 → Map(원래 제목 → { file, url, en }). 넘겨주기·표기 정리를 따라간 뒤 원래 제목으로 돌려 놓는다. en: 영어판 문서 제목. */
async function pageImages(titles, { en = false } = {}) {
  const out = new Map();
  const list = [...new Set(titles.filter(Boolean))];
  for (let i = 0; i < list.length; i += 50) {
    const batch = list.slice(i, i + 50);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      redirects: "1",
      prop: en ? "pageimages|langlinks" : "pageimages",
      piprop: "thumbnail|name",
      pithumbsize: String(PHOTO_SIZE),
      pilimit: "50",
      titles: batch.join("|"),
    });
    if (en) {
      params.set("lllang", "en");
      params.set("lllimit", "500");
    }
    const data = await (await fetchRetry(`${KOWIKI_API}?${params}`)).json();
    const q = data?.query || {};
    const from = new Map();
    const addFrom = (to, name) => from.set(to, [...(from.get(to) || []), name]);
    const normalized = new Map((q.normalized || []).map((n) => [n.to, n.from]));
    for (const title of batch) if (![...normalized.values()].includes(title)) addFrom(title, title);
    for (const [to, orig] of normalized) addFrom(to, orig);
    for (const r of q.redirects || []) for (const orig of from.get(r.from) || [r.from]) addFrom(r.to, orig);
    for (const page of q.pages || []) {
      const info = { file: page.pageimage || "", url: String(page.thumbnail?.source || "").split("?")[0], en: (page.langlinks || [])[0]?.title || "" };
      for (const orig of from.get(page.title) || [page.title]) out.set(orig, info);
    }
    await pause(GAP_MS);
  }
  return out;
}

/**
 * 힌트 단어마다 문서 대표 사진 주소를 붙인다(photos: { 힌트: 주소 }). 정답이 보일 만한 사진(정답 문서와 같은 사진,
 * 파일 이름에 정답 한글·영어 이름)과 assoc-exclude.json 의 photos(파일 이름)는 뺀다. 한 문제에서 같은 사진은 한 번만.
 */
async function addHintPhotos(items, excludeFiles = []) {
  const answers = await pageImages(items.map((row) => row.page || row.word), { en: true });
  const images = await pageImages(items.flatMap((row) => row.hints || []));
  let kept = 0;
  let dropped = 0;
  const out = items.map(({ photos: _old, ...row }) => {
    const answer = answers.get(row.page || row.word) || {};
    const answerNames = [row.word, row.page, ...(row.aliases || []), answer.en].filter(Boolean);
    const photos = {};
    const used = new Set();
    for (const hint of row.hints || []) {
      const img = images.get(hint);
      if (!img?.url || used.has(img.url)) continue;
      if (!isUsableHintPhoto(img.file, { answerFile: answer.file, answerNames, exclude: excludeFiles, word: row.word })) {
        dropped += 1;
        continue;
      }
      used.add(img.url);
      photos[hint] = img.url;
      kept += 1;
    }
    return { ...row, photos };
  });
  const ready = out.filter((row) => Object.keys(row.photos).length >= ASSOC_MIN_HINTS).length;
  console.log(`힌트 사진 ${kept}장 · 정답이 보일 만한 사진·제외 목록 ${dropped}장 뺌 · 사진 ${ASSOC_MIN_HINTS}장 이상 문제 ${ready}개`);
  return out;
}

/** --photos-only: 힌트는 그대로 두고 사진만 다시 받는다(제외 목록을 고친 뒤 등). */
async function refreshPhotosOnly(exclude) {
  const current = await readJson(outPath, null);
  if (!current?.items?.length) throw new Error("assoc.json 이 없어 사진만 받을 수 없습니다");
  const items = await addHintPhotos(current.items, exclude.photos || []);
  await writeFile(outPath, `${JSON.stringify({ ...current, photosAt: Date.now(), items }, null, 1)}\n`);
  console.log(`assoc.json 사진만 저장: ${items.length}개`);
}

async function main() {
  const exclude = await readJson(excludePath, {});
  if (process.argv.includes("--photos-only")) return refreshPhotosOnly(exclude);
  const dropWords = new Set(exclude.words || []);
  const dropHints = new Set(exclude.hints || []);
  const rows = candidates(await readJson(join(root, "zoom-pics.json"), []), await readJson(join(root, "words.json"), []));
  const cache = linksCachePath();
  let fetched = cache ? await readJson(cache, null) : null;
  if (!fetched) {
    fetched = await fetchRows(rows);
    if (cache) await writeFile(cache, JSON.stringify(fetched));
  }
  // hints: 「힌트」는 모든 문제에서, 「정답|힌트」는 그 정답 문제에서만 뺀다. 앞부분 묶음 수(leadCount)도 뺀 만큼 줄인다.
  fetched = fetched
    .filter((row) => !dropWords.has(row.word))
    .map((row) => {
      const keep = (link) => !dropHints.has(link) && !dropHints.has(`${row.word}|${link}`);
      const leadCount = Number.isFinite(row.leadCount) ? row.links.slice(0, row.leadCount).filter(keep).length : undefined;
      return { ...row, links: row.links.filter(keep), leadCount };
    });
  // 쉬운 말: 위키낱말사전 목록 + assoc-exclude.json 의 easy(목록에 없지만 누구나 아는 말: 남극·치타·텐트 등).
  const easyWords = new Set([...(await fetchEasyWords()), ...(exclude.easy || [])]);
  const chosen = chooseAssocHints(fetched, { easyWords });
  console.log(`쉬운 힌트 ${ASSOC_MIN_EASY_HINTS}개가 안 돼 뺀 문제 ${chosen.filter((row) => !row.hints.length).length}개`);
  const pool = buildAssocPool({ items: chosen });
  const keep = new Set(pool.items.map((row) => row.word));
  const items = chosen.filter((row) => keep.has(row.word)).map(({ word, genre, aliases, page, hints }) => ({ word, genre, aliases, page, hints }));
  const easyHints = items.reduce((n, row) => n + row.hints.filter((hint) => easyWords.has(hint)).length, 0);
  const allHints = items.reduce((n, row) => n + row.hints.length, 0);
  console.log(`정답 후보 ${rows.length} · 문서 ${fetched.length} · 힌트 ${ASSOC_MIN_HINTS}개 이상 ${items.length} · 쉬운 낱말 ${easyWords.size}개 중 힌트로 쓴 것 ${easyHints}/${allHints}`);
  if (items.length < MIN_ITEMS) throw new Error(`연상 문제가 ${items.length}개뿐이라 저장하지 않습니다`);
  const withPhotos = await addHintPhotos(items, exclude.photos || []);
  await writeFile(outPath, `${JSON.stringify({ fetchedAt: Date.now(), photosAt: Date.now(), source: "ko.wikipedia.org (CC BY-SA 4.0) · 쉬운 낱말: ko.wiktionary.org 부록:자주 쓰이는 한국어 낱말 5800", items: withPhotos }, null, 1)}\n`);
  console.log(`assoc.json 저장: ${items.length}개`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
