import { readFile, writeFile } from "node:fs/promises";
import { isPlayableWebtoonRow, mergeWebtoonCatalog, webtoonSeriesTitle } from "./webtoon-bank.js";
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

function sleep(ms) {
  return new Promise((ok) => setTimeout(ok, ms));
}

function firstHttp(...values) {
  for (const value of values) {
    if (value && typeof value === "object") {
      const nested = firstHttp(value.url, value.src, value.imageUrl, value.thumbnailUrl, value.image);
      if (nested) return nested;
      continue;
    }
    const text = String(value || "").trim();
    if (/^https?:\/\//i.test(text)) return text;
  }
  return "";
}

function coverOf(row = {}) {
  return firstHttp(
    row.thumbnailUrl,
    row.thumbnail,
    row.imageUrl,
    row.image,
    row.poster,
    row.thumbUrl,
    row.thumbnailImage,
    row.featuredCharacterImageA,
    row.featuredCharacterImageB,
    row.backgroundImage,
  );
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
  return searchStill("웹툰", title, { getText, byteSize, ua: UA, tries: 3 });
}

async function stillUntilGot(title, fallback = "") {
  for (let i = 0; i < 10; i += 1) {
    const url = await stillFor(title);
    if (url) return url;
    console.log(`대기 ${title} ${i + 1}/10`);
    await sleep(2000 + i * 1000);
  }
  return fallback;
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
    image: coverOf(info) || coverOf(listed),
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
      image: coverOf(content),
    }));
  }
  return [...byId.values()];
}

const out = new URL("./webtoon-snapshot.json", import.meta.url);

async function save(items) {
  await writeFile(out, `${JSON.stringify({ fetchedAt: Date.now(), items })}\n`);
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
          image: coverOf(row),
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

const filled = [];
for (const row of added) {
  let image = String(row.image || "").trim();
  if (!image && isPlayableWebtoonRow(row)) {
    image = await stillUntilGot(webtoonSeriesTitle(row.name), "");
    if (!image) {
      console.error(`새 작품 그림 실패 ${row.name} — 파일 유지, 커밋 안 함`);
      process.exit(1);
    }
    await sleep(1500);
  }
  filled.push({ ...row, image });
  console.log(`new ${filled.length}/${added.length} ${row.name}`);
}

await save([...kept, ...filled]);
console.log(`wrote ${kept.length + filled.length} rows (+${filled.length}) → ${out.pathname}`);
