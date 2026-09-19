import { isPlayableName, scrubHint } from "./genshin-bank.js";
import { fetchJson, makeCachedBank, pushClue } from "./clue-bank.js";
import { mapAnimeMediaTags } from "./media-filter.js";

export const LAFTEL_KINDS = ["애니이름"];

const TAG_PREFIX = /^\((자막|더빙|무삭제)\)\s*/;
const TRAILING_SEASON =
  /\s*(?:\d+\s*기(?:\s*part\s*\d+)?|\(\s*\d+\s*기\s*\)|시즌\s*\d+|season\s*\d+|part\s*\d+|the\s+final(?:\s+season)?(?:\s*part\s*\d+)?|파이널|최종장|제\s*\d+\s*막|\d+\s*부|oad|ova|oav|리마스터|hd)\s*$/i;
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

export function laftelHomeImage(row = {}) {
  for (const image of row.images || []) {
    const url = String(image?.img_url || "").trim();
    if (/\/home\//i.test(url)) return url;
  }
  return "";
}

export function laftelSeriesTitle(name) {
  let text = String(name || "").trim().replace(TAG_PREFIX, "");
  for (let i = 0; i < 8; i += 1) {
    const cutColon = text.replace(ARC_COLON, "");
    const next = (hangulCount(cutColon) >= 2 ? cutColon : text).replace(TRAILING_SEASON, "").replace(/\s+S$/i, "").trim();
    if (next === text) break;
    text = next;
  }
  return text;
}

export function laftelSeriesKey(name) {
  return laftelSeriesTitle(name).replace(/\s+/g, "").toLowerCase();
}

function isSeriesPrefix(longTitle, shortTitle) {
  if (!shortTitle || longTitle === shortTitle || !longTitle.startsWith(shortTitle)) return false;
  return /[\s!:：\-–—(（]/.test(longTitle.charAt(shortTitle.length));
}

export function foldSeriesTitle(title, titles = []) {
  const shorter = titles
    .filter((other) => isSeriesPrefix(title, other))
    .sort((a, b) => a.length - b.length || a.localeCompare(b, "ko"));
  return shorter[0] || title;
}

function seasonRank(name) {
  const text = String(name || "");
  const season = Number((text.match(/(\d+)\s*기/) || [])[1] || 1);
  const part = Number((text.match(/part\s*(\d+)/i) || [])[1] || 1);
  return season * 10 + part;
}

function betterRow(next, cur) {
  const nextHome = Boolean(laftelHomeImage(next));
  const curHome = Boolean(laftelHomeImage(cur));
  if (nextHome !== curHome) return nextHome;
  const nextSeason = seasonRank(next.name);
  const curSeason = seasonRank(cur.name);
  if (nextSeason !== curSeason) return nextSeason < curSeason;
  const nextHint = hangulCount(next.content);
  const curHint = hangulCount(cur.content);
  if (nextHint !== curHint) return nextHint > curHint;
  return TAG_PREFIX.test(String(cur.name || "")) && !TAG_PREFIX.test(String(next.name || ""));
}

function collapseSeries(rows) {
  const first = new Map();
  for (const row of rows) {
    if (row?.is_adult || Number(row.rating) > 15) continue;
    const word = laftelSeriesTitle(row.name);
    const key = laftelSeriesKey(row.name);
    if (!key || !isPlayableName(word)) continue;
    const cur = first.get(key);
    if (!cur || betterRow(row, cur.row)) first.set(key, { row, word });
  }
  const titles = [...first.values()].map((entry) => entry.word);
  const groups = new Map();
  for (const { row, word } of first.values()) {
    const folded = foldSeriesTitle(word, titles);
    const key = folded.replace(/\s+/g, "").toLowerCase();
    const cur = groups.get(key);
    if (!cur || betterRow(row, cur.row)) groups.set(key, { row, word: folded });
  }
  return groups;
}

export function buildLaftelBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  const rows = Array.isArray(raw.items) ? raw.items : [];
  const collapsed = collapseSeries(rows);
  const aliasesByKey = new Map();
  const titles = [...collapsed.values()].map((entry) => entry.word);
  for (const row of rows) {
    const word = foldSeriesTitle(laftelSeriesTitle(row?.name), titles);
    const key = word.replace(/\s+/g, "").toLowerCase();
    if (!key) continue;
    const names = [String(row.name || "").trim(), laftelSeriesTitle(row.name), word].filter(Boolean);
    aliasesByKey.set(key, [...new Set([...(aliasesByKey.get(key) || []), ...names])]);
  }
  for (const [key, { row, word }] of collapsed) {
    const image = laftelHomeImage(row);
    if (!image) continue;
    const aliases = (aliasesByKey.get(key) || []).filter((name) => name !== word);
    const hint = [
      onlyHangul(scrubHint(row.content, word, ...aliases)),
      (row.genres || []).filter((genre) => hangulCount(genre)).join(" · "),
      hangulCount(row.air_year_quarter) ? String(row.air_year_quarter).trim() : "",
    ]
      .filter(Boolean)
      .join("\n");
    const yearMatch = String(row.air_year_quarter || "").match(/(\d{4})/);
    pushClue(
      items,
      seen,
      {
        word,
        genre: "애니이름",
        hint,
        image,
        aliases,
        year: yearMatch ? Number(yearMatch[1]) : 0,
        mediaGenres: mapAnimeMediaTags(row.genres),
        series: word,
      },
      LAFTEL_KINDS,
    );
  }
  return { version: 1, title: "애니 단서", fetchedAt, kinds: LAFTEL_KINDS, items };
}

async function fetchLaftelRaw() {
  const snap = await fetchJson(new URL("./laftel-snapshot.json", import.meta.url), {}, 12000);
  return { items: snap?.items || [] };
}

const laftel = makeCachedBank({
  cacheKey: "clueLaftelBank:v3",
  title: "애니 단서",
  kinds: LAFTEL_KINDS,
  fetchRaw: fetchLaftelRaw,
  build: buildLaftelBank,
});

export const initLaftelBank = laftel.init;
