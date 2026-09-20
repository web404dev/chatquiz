import { readFile, writeFile } from "node:fs/promises";
import {
  applyStillByTitle,
  isOfficialCoverUrl,
  isPlayableWebtoonRow,
  mergeWebtoonCatalog,
  titlesNeedingStill,
  webtoonSeriesTitle,
} from "./webtoon-bank.js";
import { searchStill } from "./still-search.js";

const NAVER = "https://comic.naver.com";
const KAKAO = "https://gateway-kw.kakao.com/section/v2/pages/general-weekdays";
const WEEKS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "dailyPlus"];
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function hangulCount(text) {
  return [...String(text || "")].filter((ch) => {
    const code = ch.codePointAt(0);
    return code >= 0xac00 && code <= 0xd7a3;
  }).length;
}

function koreanGenres(list = []) {
  return [...new Set(list.map((item) => String(item || "").trim()).filter((item) => hangulCount(item) >= 2))].slice(0, 6);
}

function slim(row) {
  return {
    source: row.source,
    id: row.id,
    name: String(row.name || "").trim(),
    content: String(row.content || "").replace(/\s+/g, " ").trim(),
    genres: koreanGenres(row.genres),
    adult: Boolean(row.adult) || Number(row.age) > 15,
    age: Number(row.age) || (row.adult ? 19 : 0),
    image: String(row.image || "").trim(),
  };
}

async function getJson(url, headers, ms = 8000) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

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

async function stillFor(title) {
  const image = await searchStill("웹툰", title, {
    getText: (url, headers) => getText(url, headers, 15000),
    byteSize,
    ua: UA,
    tries: 3,
    rejectUrl: isOfficialCoverUrl,
    sleep: async (ms) => {
      console.log(`검색 재시도 ${title}`);
      await new Promise((ok) => setTimeout(ok, ms));
    },
  });
  return image && !isOfficialCoverUrl(image) ? image : "";
}

async function naverList() {
  const byId = new Map();
  await Promise.all(
    WEEKS.map(async (week) => {
      const data = await getJson(`${NAVER}/api/webtoon/titlelist/weekday?week=${week}`, {
        accept: "application/json",
        referer: `${NAVER}/`,
        "user-agent": UA,
      });
      for (const row of data.titleList || []) {
        if (!row?.titleId || byId.has(row.titleId)) continue;
        byId.set(row.titleId, row);
      }
    }),
  );
  return [...byId.values()];
}

async function naverDetail(titleId, listed = {}) {
  const info = await getJson(`${NAVER}/api/article/list/info?titleId=${titleId}`, {
    accept: "application/json",
    referer: `${NAVER}/webtoon/list?titleId=${titleId}`,
    "user-agent": UA,
  });
  const ad = info.gfpAdCustomParam || {};
  return slim({
    source: "naver",
    id: `naver:${titleId}`,
    name: info.titleName,
    content: info.synopsis,
    genres: [
      ...(info.curationTagList || []).filter((tag) => String(tag.curationType || "").startsWith("GENRE")).map((tag) => tag.tagName),
      ...(ad.tags || []),
    ],
    age: naverAge(info, ad.adultYn === "Y"),
    adult: false,
    image: "",
  });
}

function naverAge(info, listedAdult) {
  const t = String(info?.age?.type || "");
  if (listedAdult || t === "RATE_18" || t === "RATE_19") return 18;
  if (t === "RATE_15") return 15;
  if (t === "RATE_12") return 12;
  return 0;
}

function walkKakao(node, out = []) {
  if (Array.isArray(node)) {
    for (const item of node) walkKakao(item, out);
    return out;
  }
  if (!node || typeof node !== "object") return out;
  const content = node.content && typeof node.content === "object" ? node.content : node;
  if (content.title && (content.synopsis || content.description)) {
    out.push(content);
    return out;
  }
  for (const value of Object.values(node)) walkKakao(value, out);
  return out;
}

async function kakaoList() {
  const data = await getJson(KAKAO, {
    accept: "application/json",
    origin: "https://webtoon.kakao.com",
    referer: "https://webtoon.kakao.com/",
    "user-agent": UA,
  }, 12000);
  const byId = new Map();
  for (const content of walkKakao(data)) {
    const id = content.id || content.seoId || content.title;
    if (!id || byId.has(id)) continue;
    byId.set(id, slim({
      source: "kakao",
      id: `kakao:${id}`,
      name: content.title,
      content: content.synopsis || content.description,
      genres: [content.genre, ...(content.genres || []), ...(content.categoryList || []).map((item) => item?.name || item)],
      age: Number(content.ageLimit) || (content.adult ? 19 : 0),
      adult: Boolean(content.adult),
      image: "",
    }));
  }
  return [...byId.values()];
}

const out = new URL("./webtoon-snapshot.json", import.meta.url);
const FILL_ALL = process.argv.includes("--fill-stills");
const FILL_MISSING = process.argv.includes("--fill-missing");

async function save(items) {
  await writeFile(out, `${JSON.stringify({ fetchedAt: Date.now(), items })}\n`);
}

function playableTitles(items = []) {
  return [...new Set(items.filter(isPlayableWebtoonRow).map((row) => webtoonSeriesTitle(row.name)).filter(Boolean))];
}

function stillKept(items, title) {
  const key = webtoonSeriesTitle(title);
  const row = items.find((item) => webtoonSeriesTitle(item.name) === key);
  return String(row?.image || "").trim();
}

async function fillAvailable(items, { all = false } = {}) {
  const titles = all ? playableTitles(items) : titlesNeedingStill(items);
  console.log(`명장면→말풍선→명대사 ${titles.length}`);
  let next = items;
  let got = 0;
  let skip = 0;
  await save(next);
  for (let i = 0; i < titles.length; i += 1) {
    const title = titles[i];
    const image = await stillFor(title);
    if (image) {
      next = applyStillByTitle(next, title, image);
      got += 1;
      await save(next);
      console.log(`fill ${i + 1}/${titles.length} ${title}`);
    } else {
      skip += 1;
      const kept = stillKept(next, title);
      console.log(kept
        ? `건너뜀 ${i + 1}/${titles.length} ${title} 표지 유지`
        : `건너뜀 ${i + 1}/${titles.length} ${title} 빈칸 다음 재시도`);
    }
  }
  console.log(`그림 받음 ${got} 건너뜀 ${skip}`);
  return next;
}

if (FILL_ALL || FILL_MISSING) {
  let items = [];
  try {
    items = JSON.parse(await readFile(out, "utf8")).items || [];
  } catch {
    console.error("웹툰 스냅샷 없음 — 파일 유지");
    process.exit(1);
  }
  const next = await fillAvailable(items, { all: FILL_ALL });
  await save(next);
  console.log(`wrote ${next.length} rows, stills ${playableTitles(next).length} → ${out.pathname}`);
  process.exit(0);
}

const listed = await naverList();
const naverKids = listed.filter((row) => !row.adult);
const naverItems = [];
for (let i = 0; i < naverKids.length; i += 20) {
  const chunk = naverKids.slice(i, i + 20);
  const rows = await Promise.all(
    chunk.map(async (row) => {
      try {
        return await naverDetail(row.titleId, row);
      } catch {
        return slim({
          source: "naver",
          id: `naver:${row.titleId}`,
          name: row.titleName,
          content: "",
          genres: [],
          adult: row.adult,
          image: "",
        });
      }
    }),
  );
  naverItems.push(...rows);
  console.log(`naver ${naverItems.length}/${naverKids.length}`);
}
const kakaoItems = await kakaoList();
const incoming = [...naverItems, ...kakaoItems].filter((row) => row.name);
let prevItems = [];
try {
  prevItems = JSON.parse(await readFile(out, "utf8")).items || [];
} catch {
  prevItems = [];
}
const { kept, added } = mergeWebtoonCatalog(prevItems, incoming);
console.log(`catalog naver ${naverItems.length} kakao ${kakaoItems.length} 유지 ${kept.length} 신규 ${added.length}`);

const items = [...kept, ...added];
const next = await fillAvailable(items);
await save(next);
console.log(`wrote ${next.length} rows (+${added.length}) → ${out.pathname}`);
