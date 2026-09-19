const CACHE_KEY = "quizWordBank:v5";
const SOURCE_URL = "./words-easy.json";
const FALLBACK_URL = "./words.json";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const GENRE_ALIASES = { 생활: "물건" };

export const GENRE_TREE = [
  { id: "동물", icon: "🐾", kids: [
    { id: "포유류", icon: "🐾" },
    { id: "새", icon: "🐦" },
    { id: "벌레", icon: "🐛" },
    { id: "바다생물", icon: "🐟" },
    { id: "공룡", icon: "🦖" },
  ]},
  { id: "음식", icon: "🍜", kids: [
    { id: "한식", icon: "🍚" },
    { id: "분식", icon: "🍢" },
    { id: "디저트", icon: "🍰" },
    { id: "과일", icon: "🍓" },
    { id: "음료", icon: "🥤" },
    { id: "양식", icon: "🍔" },
    { id: "중식", icon: "🥟" },
  ]},
  { id: "장소", icon: "📍", kids: [
    { id: "공공기관", icon: "🏛️" },
    { id: "가게", icon: "🏪" },
    { id: "자연명소", icon: "🏞️" },
    { id: "도시", icon: "🌆" },
  ]},
  { id: "자연", icon: "🌿", kids: [
    { id: "식물", icon: "🌸" },
    { id: "하늘", icon: "🌈" },
    { id: "날씨", icon: "☔" },
    { id: "물", icon: "🌊" },
  ]},
  { id: "물건", icon: "📦", kids: [
    { id: "가전", icon: "📺" },
    { id: "가구", icon: "🛋️" },
    { id: "옷", icon: "👟" },
    { id: "소지품", icon: "🔑" },
    { id: "욕실", icon: "🧴" },
    { id: "장난감", icon: "🧸" },
    { id: "악기", icon: "🎸" },
  ]},
  { id: "사람", icon: "👤", kids: [
    { id: "가족", icon: "👨‍👩‍👧" },
    { id: "친구", icon: "🤝" },
  ]},
  { id: "직업", icon: "💼", kids: [
    { id: "의료", icon: "🩺" },
    { id: "공공", icon: "🚓" },
    { id: "예술", icon: "🎨" },
    { id: "서비스", icon: "🍳" },
  ]},
  { id: "학교", icon: "📚", kids: [
    { id: "문구", icon: "✏️" },
    { id: "학교시설", icon: "🏫" },
    { id: "수업", icon: "📝" },
  ]},
  { id: "스포츠", icon: "⚽", kids: [
    { id: "구기", icon: "⚽" },
    { id: "겨울운동", icon: "🎿" },
    { id: "격투", icon: "🥋" },
    { id: "수영", icon: "🏊" },
    { id: "육상", icon: "🏃" },
  ]},
  { id: "교통", icon: "🚗", kids: [
    { id: "탈것", icon: "🚌" },
    { id: "교통시설", icon: "🚦" },
  ]},
  { id: "캐릭터", icon: "⭐", kids: [] },
  { id: "영화", icon: "🎬", kids: [] },
  { id: "만화", icon: "🗯️", kids: [] },
];

export function flattenGenreChips() {
  const out = [{ id: "all", label: "전체", icon: "🎲" }];
  for (const group of GENRE_TREE) {
    out.push({ id: group.id, label: group.id, icon: group.icon, group: true });
    for (const kid of group.kids) {
      out.push({ id: kid.id, label: kid.id, icon: kid.icon, parentId: group.id });
    }
  }
  return out;
}

export function kidsOfGenre(id) {
  const group = GENRE_TREE.find((item) => item.id === id);
  return group ? group.kids.map((kid) => kid.id) : [];
}

export function expandGenreIds(options) {
  const raw = normalizeGenreFilter(options);
  if (!raw) return null;
  const out = new Set();
  for (const id of raw) {
    const mapped = GENRE_ALIASES[id] || id;
    out.add(id);
    out.add(mapped);
    for (const kid of kidsOfGenre(mapped)) out.add(kid);
    for (const kid of kidsOfGenre(id)) out.add(kid);
  }
  return [...out];
}

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
  const genres = expandGenreIds(options);
  const words = bank?.words || [];
  return words.filter((item) => {
    const len = hangulLen(item.word);
    if (len < minLen || len > maxLen) return false;
    if (!genres) return true;
    const mapped = GENRE_ALIASES[item.genre] || item.genre;
    return genres.includes(item.genre) || genres.includes(mapped);
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
