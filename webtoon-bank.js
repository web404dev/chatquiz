import { isPlayableName, scrubHint } from "./genshin-bank.js";
import { fetchJson, makeCachedBank, pushClue } from "./clue-bank.js";
import { mapWebtoonMediaTags } from "./media-filter.js";

export const WEBTOON_KINDS = ["웹툰이름"];

const TRAILING_SEASON =
  /\s*(?:\d+\s*기|\(\s*\d+\s*기\s*\)|시즌\s*\d+|season\s*\d+|\d+\s*부|제\s*\d+\s*막)\s*$/i;
const ARC_COLON = /\s*[:：].+$/;

function hangulCount(text) {
  return [...String(text || "")].filter((ch) => {
    const code = ch.codePointAt(0);
    return code >= 0xac00 && code <= 0xd7a3;
  }).length;
}

function onlyHangul(text) {
  const cleaned = String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return hangulCount(cleaned) >= 8 ? cleaned : "";
}

export function webtoonSeriesTitle(name) {
  let text = String(name || "").trim();
  for (let i = 0; i < 6; i += 1) {
    const cutColon = text.replace(ARC_COLON, "");
    const next = (hangulCount(cutColon) >= 2 ? cutColon : text).replace(TRAILING_SEASON, "").trim();
    if (next === text) break;
    text = next;
  }
  return text;
}

export function webtoonSeriesKey(name) {
  return webtoonSeriesTitle(name).replace(/\s+/g, "").toLowerCase();
}

export function isPlayableWebtoonRow(row = {}) {
  if (row?.adult || Number(row.age) > 15) return false;
  if (hangulCount(row.content) < 8) return false;
  return isPlayableName(webtoonSeriesTitle(row.name));
}

export function isOfficialCoverUrl(url) {
  const image = String(url || "").trim();
  if (!image) return false;
  if (/image-comic\.pstatic\.net\/webtoon\/[^/]+\/thumbnail\//i.test(image)) return true;
  if (/thumbnail_IMAG/i.test(image)) return true;
  if (/kakaopagecdn\.com\/P\/C\/\d+\/c1\//i.test(image)) return true;
  return false;
}

export function isOfficialWebtoonCover(url) {
  return !String(url || "").trim() || isOfficialCoverUrl(url);
}

export function applyStillByTitle(items = [], title, image) {
  const key = webtoonSeriesTitle(title);
  const next = String(image || "").trim();
  if (!key || !next) return items;
  return items.map((row) => (webtoonSeriesTitle(row.name) === key ? { ...row, image: next } : row));
}

export function titlesNeedingStill(items = []) {
  const seen = new Set();
  const titles = [];
  for (const row of items) {
    if (!isPlayableWebtoonRow(row)) continue;
    const title = webtoonSeriesTitle(row.name);
    if (!title || seen.has(title) || !isOfficialWebtoonCover(row.image)) continue;
    seen.add(title);
    titles.push(title);
  }
  return titles;
}

export function mergeWebtoonCatalog(prevItems = [], incoming = []) {
  const kept = [];
  const seen = new Set();
  for (const row of prevItems) {
    const id = String(row?.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    kept.push(row);
  }
  const added = [];
  for (const row of incoming) {
    const id = String(row?.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    added.push(row);
  }
  return { kept, added };
}

function isSeriesPrefix(longTitle, shortTitle) {
  if (!shortTitle || longTitle === shortTitle || !longTitle.startsWith(shortTitle)) return false;
  return /[\s!:：\-–—(（]/.test(longTitle.charAt(shortTitle.length));
}

export function foldWebtoonTitle(title, titles = []) {
  const shorter = titles
    .filter((other) => isSeriesPrefix(title, other))
    .sort((a, b) => a.length - b.length || a.localeCompare(b, "ko"));
  return shorter[0] || title;
}

function betterRow(next, cur) {
  const nextHint = hangulCount(next.content);
  const curHint = hangulCount(cur.content);
  if (nextHint !== curHint) return nextHint > curHint;
  return (next.genres || []).length > (cur.genres || []).length;
}

function collapseSeries(rows) {
  const first = new Map();
  for (const row of rows) {
    if (row?.adult || Number(row.age) > 15) continue;
    const word = webtoonSeriesTitle(row.name);
    const key = webtoonSeriesKey(row.name);
    if (!key || !isPlayableName(word)) continue;
    const cur = first.get(key);
    if (!cur || betterRow(row, cur.row)) first.set(key, { row, word });
  }
  const titles = [...first.values()].map((entry) => entry.word);
  const groups = new Map();
  for (const { row, word } of first.values()) {
    const folded = foldWebtoonTitle(word, titles);
    const key = folded.replace(/\s+/g, "").toLowerCase();
    const cur = groups.get(key);
    if (!cur || betterRow(row, cur.row)) groups.set(key, { row, word: folded });
  }
  return groups;
}

export function buildWebtoonBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  const rows = Array.isArray(raw.items) ? raw.items : [];
  const collapsed = collapseSeries(rows);
  const titles = [...collapsed.values()].map((entry) => entry.word);
  const aliasesByKey = new Map();
  for (const row of rows) {
    const word = foldWebtoonTitle(webtoonSeriesTitle(row?.name), titles);
    const key = word.replace(/\s+/g, "").toLowerCase();
    if (!key) continue;
    const names = [String(row.name || "").trim(), webtoonSeriesTitle(row.name), word].filter(Boolean);
    aliasesByKey.set(key, [...new Set([...(aliasesByKey.get(key) || []), ...names])]);
  }
  for (const [key, { row, word }] of collapsed) {
    const aliases = (aliasesByKey.get(key) || []).filter((name) => name !== word);
    const hint = [
      onlyHangul(scrubHint(row.content, word, ...aliases)),
      (row.genres || []).filter((genre) => hangulCount(genre)).join(" · "),
    ]
      .filter(Boolean)
      .join("\n");
    pushClue(
      items,
      seen,
      {
        word,
        genre: "웹툰이름",
        hint,
        image: String(row.image || "").trim(),
        aliases,
        mediaGenres: mapWebtoonMediaTags(row),
        series: word,
      },
      WEBTOON_KINDS,
    );
  }
  return { version: 1, title: "웹툰 단서", fetchedAt, kinds: WEBTOON_KINDS, items };
}

async function fetchWebtoonRaw() {
  const snap = await fetchJson(new URL("./webtoon-snapshot.json", import.meta.url), {}, 12000);
  return { items: snap?.items || [] };
}

const webtoon = makeCachedBank({
  cacheKey: "clueWebtoonBank:v2",
  title: "웹툰 단서",
  kinds: WEBTOON_KINDS,
  fetchRaw: fetchWebtoonRaw,
  build: buildWebtoonBank,
});

export const initWebtoonBank = webtoon.init;
