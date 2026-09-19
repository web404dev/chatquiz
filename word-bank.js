const CACHE_KEY = "quizWordBank:v2";
const SOURCE_URL = "./words-easy.json";
const FALLBACK_URL = "./words.json";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const DEFAULT_MIN_LEN = 2;
export const DEFAULT_MAX_LEN = 4;

function hangulLen(word) {
  return [...String(word || "")].length;
}

function isHangulWord(word) {
  return /^[\uAC00-\uD7A3]+$/.test(String(word || ""));
}

function normalizeBank(raw, fetchedAt = Date.now()) {
  let list = [];
  if (Array.isArray(raw)) {
    list = raw.map((item) =>
      typeof item === "string"
        ? { word: item, genre: "전체" }
        : { word: item.word, genre: item.genre || "전체" },
    );
  } else if (raw && Array.isArray(raw.words)) {
    list = raw.words.map((item) =>
      typeof item === "string"
        ? { word: item, genre: "전체" }
        : { word: item.word, genre: item.genre || "전체" },
    );
  }
  const words = list
    .map((item) => ({
      word: String(item.word || "").trim(),
      genre: String(item.genre || "전체").trim() || "전체",
    }))
    .filter((item) => item.word && isHangulWord(item.word));
  return {
    version: Number(raw?.version) || 1,
    title: raw?.title || "단어 목록",
    fetchedAt,
    words,
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.words?.length) return null;
    return normalizeBank(parsed, parsed.fetchedAt || 0);
  } catch {
    return null;
  }
}

function writeCache(bank) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(bank));
  } catch {
    // quota / private mode — ignore
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  return res.json();
}

async function fetchBank() {
  try {
    const data = await fetchJson(SOURCE_URL);
    return normalizeBank(data, Date.now());
  } catch {
    const data = await fetchJson(FALLBACK_URL);
    return normalizeBank(data, Date.now());
  }
}

function normalizeGenreFilter(options = {}) {
  if (Array.isArray(options.genres)) {
    const cleaned = options.genres.map((g) => String(g || "").trim()).filter(Boolean);
    if (!cleaned.length || cleaned.includes("all")) return null;
    return cleaned;
  }
  const genre = options.genre || "all";
  if (!genre || genre === "all") return null;
  return [genre];
}

export function filterWords(bank, options = {}) {
  const minLen = Number(options.minLen ?? DEFAULT_MIN_LEN);
  const maxLen = Number(options.maxLen ?? DEFAULT_MAX_LEN);
  const genres = normalizeGenreFilter(options);
  const words = bank?.words || [];
  return words.filter((item) => {
    const len = hangulLen(item.word);
    if (len < minLen || len > maxLen) return false;
    if (genres && !genres.includes(item.genre)) return false;
    return true;
  });
}

export function pickWordEntriesFromBank(bank, options = {}, count = 1) {
  const n = Math.max(1, Math.min(3, Math.floor(Number(count) || 1)));
  const exclude = options.exclude instanceof Set ? options.exclude : null;
  const all = filterWords(bank, options);
  let pool = exclude ? all.filter((item) => !exclude.has(item.word)) : all.slice();
  if (!pool.length && all.length && exclude) {
    exclude.clear();
    pool = all.slice();
  }
  if (!pool.length) {
    throw new Error("조건에 맞는 쉬운 단어가 없음");
  }
  const out = [];
  const used = new Set();
  while (out.length < n && pool.length) {
    const item = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    if (!item?.word || used.has(item.word)) continue;
    used.add(item.word);
    out.push(item);
  }
  return out;
}

export function pickWordEntryFromBank(bank, options = {}) {
  return pickWordEntriesFromBank(bank, options, 1)[0];
}

export function pickWordFromBank(bank, options = {}) {
  return pickWordEntryFromBank(bank, options).word;
}

export async function refreshWordBankQuietly(current) {
  const age = Date.now() - (current?.fetchedAt || 0);
  if (current?.words?.length && age < MAX_AGE_MS) return current;
  const fresh = await fetchBank();
  writeCache(fresh);
  return fresh;
}

export async function initWordBank() {
  let bank = readCache();
  if (!bank?.words?.length) {
    bank = await fetchBank();
    writeCache(bank);
    return bank;
  }
  refreshWordBankQuietly(bank).catch(() => {});
  return bank;
}

export function getWordBankStats(bank, options = {}) {
  const pool = filterWords(bank, options);
  return {
    total: bank?.words?.length || 0,
    matched: pool.length,
    fetchedAt: bank?.fetchedAt || 0,
  };
}
