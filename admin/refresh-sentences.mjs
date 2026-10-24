import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanProverbTitles,
  fetchProverbTitles,
  fetchSpeakerImages,
  fetchWikidataSpeakerImages,
  fetchWikiquotePages,
  curatedLineSentences,
  movieQuoteSentences,
  proverbImageQueries,
  PROVERB_LICENSE,
  PROVERB_SOURCE,
  QUOTE_LICENSE,
  QUOTE_SOURCE,
  quoteImageQueries,
  wikiquoteFilmQuotes,
  wikiquoteQuotes,
} from "../sentence-bank.js";
import { searchStill } from "../still-search.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "sentences.json");
const excludePath = join(root, "sentence-exclude.json");
const MIN_PROVERBS = 100;
const MIN_QUOTES = 100;
const MIN_FILM_LINES = 5;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const redoImages = process.argv.includes("--redo-images");

async function getText(url, headers, ms = 8000) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}

async function byteSize(url) {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "user-agent": UA }, signal: AbortSignal.timeout(4000) });
    return Number(res.headers.get("content-length") || 0) || 0;
  } catch {
    return 0;
  }
}

async function readPrevious() {
  try {
    const raw = JSON.parse(await readFile(outPath, "utf8"));
    const images = new Map((raw.items || []).filter((row) => row.image).map((row) => [row.word, row.image]));
    const speakers = new Map((raw.items || []).filter((row) => row.who && row.image).map((row) => [row.who, row.image]));
    return { images, speakers, quoteImages: raw.quoteImages || {} };
  } catch {
    return { images: new Map(), speakers: new Map(), quoteImages: {} };
  }
}

const MIN_BYTES = 20 * 1024;
const MAX_BYTES = 1.5 * 1024 * 1024;

/** 다음 검색의 잘린 썸네일(…/argon/100x100_85_c/…)은 그림 일부라 쓰지 않는다. */
function isCroppedThumb(url) {
  return /\/argon\/\d+x\d+_\d+_c\//.test(String(url || ""));
}

/** 결과 화면에 전체 그림이 보이도록 너무 작지도 크지도 않은 것 중 가장 큰 그림을 고른다. */
function pickFullStill(candidates = []) {
  const rows = candidates.filter((row) => row?.url && !isCroppedThumb(row.url) && Number(row.bytes) > 0);
  const fit = rows.filter((row) => row.bytes >= MIN_BYTES && row.bytes <= MAX_BYTES).sort((a, b) => b.bytes - a.bytes);
  if (fit.length) return fit[0].url;
  return rows.sort((a, b) => b.bytes - a.bytes).find((row) => row.bytes <= MAX_BYTES)?.url || "";
}

async function imageOk(url) {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "user-agent": UA }, signal: AbortSignal.timeout(6000) });
    return res.ok && /^image\//i.test(res.headers.get("content-type") || "");
  } catch {
    return false;
  }
}

/** 프록시 주소가 막히면(403 등) 원본 주소를 쓴다. 둘 다 안 열리면 버린다. */
async function usableImage(url) {
  if (!url || isCroppedThumb(url)) return "";
  if (await imageOk(url)) return url;
  let src = "";
  try {
    src = new URL(url).searchParams.get("src") || "";
  } catch {
    src = "";
  }
  return src && (await imageOk(src)) ? src : "";
}

/** 프록시 주소와 원본 주소를 같은 그림으로 본다. */
function imageKey(url) {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("src") || parsed.href;
  } catch {
    return String(url || "");
  }
}

function sentenceText(text) {
  return String(text || "").trim().split(/\s+/).join(" ");
}

let rejectedImages = {};
let redoWords = new Set();

/** sentence-exclude.json images 에 적힌 문장은 지금 그림을 '다시 쓰지 않을 그림'으로 옮기고 다른 그림을 찾는다. */
function rejectCurrent(word, current) {
  if (!redoWords.has(word) || !current) return;
  const list = rejectedImages[word] || [];
  if (!list.includes(current)) list.push(current);
  rejectedImages[word] = list;
}

async function findImage(row, queriesOf, known) {
  const current = known(row.word) || "";
  rejectCurrent(row.word, current);
  const badKeys = new Set((rejectedImages[row.word] || []).map(imageKey));
  const kept = !redoImages && !redoWords.has(row.word) ? current : "";
  const ready = badKeys.has(imageKey(kept)) ? "" : await usableImage(kept);
  if (ready) return ready;
  const bad = new Set([kept].filter(Boolean));
  const found = await searchStill("", row.word, {
    getText,
    byteSize,
    ua: UA,
    tries: 1,
    queries: queriesOf(row),
    rejectUrl: (url) => bad.has(url) || badKeys.has(imageKey(url)) || isCroppedThumb(url),
    pick: pickFullStill,
  }).catch(() => "");
  return badKeys.has(imageKey(found)) ? "" : usableImage(found);
}

/** 영화 스틸과 같은 방식: 이미지 검색 결과 주소만 저장한다. 이미 있는 주소는 열리는지만 다시 확인한다. */
async function fillImages(rows, queriesOf, known, label) {
  const out = {};
  let hit = 0;
  for (let i = 0; i < rows.length; i += 2) {
    const chunk = rows.slice(i, i + 2);
    const found = await Promise.all(chunk.map((row) => findImage(row, queriesOf, known)));
    chunk.forEach((row, index) => {
      if (found[index]) {
        out[row.word] = found[index];
        hit += 1;
      }
    });
    if ((i / 2) % 25 === 0) console.log(`${label} 이미지 ${Math.min(i + chunk.length, rows.length)}/${rows.length} hit ${hit}`);
    await new Promise((ok) => setTimeout(ok, 300));
  }
  console.log(`${label} 이미지 ${hit}/${rows.length}`);
  return out;
}

async function readExclude() {
  try {
    const raw = JSON.parse(await readFile(excludePath, "utf8"));
    if (Array.isArray(raw)) return { raw: { items: raw }, items: raw, speakers: [], images: [], rejectedImages: {} };
    return {
      raw,
      items: Array.isArray(raw.items) ? raw.items : [],
      speakers: Array.isArray(raw.speakers) ? raw.speakers : [],
      images: Array.isArray(raw.images) ? raw.images.map(sentenceText).filter(Boolean) : [],
      rejectedImages: raw.rejectedImages && typeof raw.rejectedImages === "object" ? raw.rejectedImages : {},
    };
  } catch {
    return { raw: {}, items: [], speakers: [], images: [], rejectedImages: {} };
  }
}

/** 다시 찾은 문장은 images 에서 지우고, 버린 그림 주소는 rejectedImages 에 남긴다. */
async function saveExcludeImages(exclude) {
  const next = { ...exclude.raw, images: [], rejectedImages };
  await writeFile(excludePath, `${JSON.stringify(next, null, 2)}\n`);
}

async function main() {
  const exclude = await readExclude();
  rejectedImages = { ...exclude.rejectedImages };
  redoWords = new Set(exclude.images);
  if (redoWords.size) console.log(`그림 다시 찾기 ${redoWords.size}개: ${[...redoWords].join(" / ")}`);
  const titles = await fetchProverbTitles();
  const proverbs = cleanProverbTitles(titles, exclude.items);
  console.log(`속담 ${titles.length}개 받음 → 3어절 이상·20글자 이하·금칙어·제외 거르고 ${proverbs.length}개`);
  const pages = await fetchWikiquotePages(fetch, { pauseMs: 1200 });
  const proverbWords = new Set(proverbs.map((row) => row.word));
  const sayings = wikiquoteQuotes(pages, { exclude: exclude.items, skipSpeakers: exclude.speakers }).filter(
    (row) => !proverbWords.has(row.word),
  );
  console.log(`위키인용집 문서 ${pages.length}개 → 인물·3어절 이상·20글자 이하·금칙어·제외 사람(${exclude.speakers.length}명+분류) 거르고 명언 ${sayings.length}개`);
  const kinds = {};
  for (const row of sayings) kinds[row.genre] = (kinds[row.genre] || 0) + 1;
  console.log(`명언 종류: ${Object.entries(kinds).map(([genre, n]) => `${genre} ${n}`).join(" · ")}`);
  const sayingWords = new Set(sayings.map((row) => row.word));
  const filmLines = wikiquoteFilmQuotes(pages, { exclude: exclude.items }).filter(
    (row) => !proverbWords.has(row.word) && !sayingWords.has(row.word),
  );
  console.log(`위키인용집 한국 영화 대사 ${filmLines.length}개 (작품 ${new Set(filmLines.map((row) => row.series)).size}개)`);
  if (proverbs.length < MIN_PROVERBS || sayings.length < MIN_QUOTES || filmLines.length < MIN_FILM_LINES) {
    throw new Error(`속담 ${proverbs.length}개·명언 ${sayings.length}개뿐이라 기존 파일을 유지합니다`);
  }
  const previous = await readPrevious();
  const speakerNames = [...new Set(sayings.map((row) => row.who))];
  const missing = redoImages ? speakerNames : speakerNames.filter((name) => !previous.speakers.has(name));
  const speakerImages = {
    ...Object.fromEntries(redoImages ? [] : previous.speakers),
    ...(await fetchSpeakerImages(missing, fetch, { pauseMs: 1200 })),
  };
  const noPhoto = speakerNames.filter((name) => !speakerImages[name]);
  Object.assign(speakerImages, await fetchWikidataSpeakerImages(noPhoto, fetch, { pauseMs: 1200 }));
  console.log(`말한 사람 ${speakerNames.length}명 중 사진 ${speakerNames.filter((name) => speakerImages[name]).length}명 (위키백과 없을 때 위키데이터)`);
  const proverbImages = await fillImages(proverbs, (row) => proverbImageQueries(row.word), (word) => previous.images.get(word), "속담");
  const quotes = [...curatedLineSentences(), ...movieQuoteSentences()];
  const quoteImages = await fillImages(quotes, quoteImageQueries, (word) => previous.quoteImages[word], "명대사");
  const filmImages = await fillImages(filmLines, quoteImageQueries, (word) => previous.images.get(word), "위키 명대사");
  const items = [
    ...proverbs.map((row) => (proverbImages[row.word] ? { ...row, image: proverbImages[row.word] } : row)),
    ...sayings.map((row) => (speakerImages[row.who] ? { ...row, image: speakerImages[row.who] } : row)),
    ...filmLines.map((row) => (filmImages[row.word] ? { ...row, image: filmImages[row.word] } : row)),
  ];
  const head = {
    version: 3,
    title: "문장 (위키낱말사전 속담 + 위키인용집 명언·명대사)",
    sources: [
      { name: "위키낱말사전 속담", url: PROVERB_SOURCE, license: PROVERB_LICENSE, rows: proverbs.length },
      { name: "위키인용집 명언", url: QUOTE_SOURCE, license: QUOTE_LICENSE, rows: sayings.length },
      { name: "위키인용집 영화·드라마 대사", url: QUOTE_SOURCE, license: QUOTE_LICENSE, rows: filmLines.length },
    ],
    fetchedAt: Date.now(),
    imageNote:
      "속담·명대사 결과 이미지는 네이버·다음 이미지 검색 결과 주소(영화 스틸과 같은 방식). 명언은 말한 사람의 한국어 위키백과 대표 그림(위키미디어 공용).",
    quoteImages,
  };
  if (redoWords.size || Object.keys(rejectedImages).length !== Object.keys(exclude.rejectedImages).length) {
    await saveExcludeImages(exclude);
  }
  const body = JSON.stringify(head, null, 2).replace(/\n}$/, "");
  const lines = items.map((row) => `    ${JSON.stringify(row)}`).join(",\n");
  await writeFile(outPath, `${body},\n  "items": [\n${lines}\n  ]\n}\n`);
  console.log(`sentences ${items.length} (속담 ${proverbs.length} + 명언 ${sayings.length} + 위키 명대사 ${filmLines.length}) → ${outPath}`);
}

main().catch((err) => {
  console.error(String(err?.message || err));
  process.exit(1);
});
