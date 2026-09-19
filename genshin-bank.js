import { matchMediaTags } from "./media-filter.js";

const CACHE_KEY = "clueGenshinBank:v6";
const API_BASE = "https://genshin-db-api.vercel.app/api/v5";
const IMAGE_PROXY = "https://chzzk-chat-quiz.web404dev.workers.dev/img";
const IMAGE_CDNS = ["https://enka.network/ui", "https://gi.yatta.moe/assets/UI"];
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function clueImageName(filename) {
  return String(filename || "").trim().replace(/_HD$/, "");
}

export function clueImageKey(urlOrName) {
  const raw = String(urlOrName || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) && !/[?&]n=/.test(raw)) return raw;
  try {
    const parsed = new URL(raw, "https://local.invalid");
    const fromQuery = parsed.searchParams.get("n");
    if (fromQuery) return clueImageName(fromQuery);
    const base = parsed.pathname.split("/").pop() || "";
    return clueImageName(base.replace(/\.png$/i, ""));
  } catch {
    return clueImageName(raw.replace(/\.png$/i, ""));
  }
}

export function clueImageUrl(filename) {
  const name = clueImageName(filename);
  return name ? `${IMAGE_PROXY}?n=${encodeURIComponent(name)}` : "";
}

export function clueImageCandidates(urlOrName) {
  const raw = String(urlOrName || "").trim();
  if (/^https?:\/\//i.test(raw) && !/[?&]n=/.test(raw)) {
    const list = [raw];
    if (/\/icon\.png$/i.test(raw)) {
      list.push(raw.replace(/\/icon\.png$/i, "/smallicon.png"), raw.replace(/\/icon\.png$/i, "/featured.png"));
    }
    return list;
  }
  const name = clueImageKey(urlOrName) || clueImageName(urlOrName);
  if (!name) return [];
  const list = [
    `${IMAGE_PROXY}?n=${encodeURIComponent(name)}`,
    `${IMAGE_CDNS[0]}/${name}.png`,
    `${IMAGE_CDNS[1]}/${name}.png`,
    `https://api.ambr.top/assets/UI/${name}.png`,
  ];
  if (name.startsWith("UI_MonsterIcon_")) {
    list.push(`${IMAGE_CDNS[1]}/monster/${name}.png`);
  }
  if (/UI_Codex_Scenery/i.test(name)) {
    list.push(`${IMAGE_CDNS[1]}/teyvat/${name}.png`);
  }
  return list;
}

export function clueImageFallbackUrl(url) {
  const list = clueImageCandidates(url);
  const src = String(url || "");
  const idx = list.indexOf(src);
  return idx >= 0 ? list[idx + 1] || "" : list[1] || "";
}

export const CLUE_KINDS = [
  "캐릭터",
  "스킬명",
  "무기",
  "성유물",
  "음식",
  "보스",
  "지역",
];

export const CLUE_SILHOUETTE_KINDS = ["캐릭터", "무기", "성유물", "보스"];

export function isClueSilhouetteKind(kind, list = CLUE_SILHOUETTE_KINDS) {
  return (list || CLUE_SILHOUETTE_KINDS).includes(String(kind || ""));
}

export const CLUE_TITLE_ART_KINDS = ["만화이름", "게임이름"];

export function isClueTitleArtKind(kind) {
  return CLUE_TITLE_ART_KINDS.includes(String(kind || ""));
}

export function cluePlayImages(item) {
  const image = String(item?.image || "").trim();
  const imageReveal = String(item?.imageReveal || "").trim();
  if (isClueTitleArtKind(item?.genre)) {
    return { image: "", imageReveal: imageReveal || image };
  }
  return { image, imageReveal };
}

function pickImage(images, ...keys) {
  if (!images || typeof images !== "object") return "";
  for (const key of keys) {
    const url = clueImageUrl(images[key]);
    if (url) return url;
  }
  for (const [key, value] of Object.entries(images)) {
    if (!String(key).startsWith("filename_")) continue;
    const url = clueImageUrl(value);
    if (url) return url;
  }
  return "";
}

const SKIP_NAME =
  /별인형|아이테르|루미네|여행자|^가명$|남성$|여성$/;

function hangulCount(text) {
  return [...String(text || "")].filter((ch) => {
    const code = ch.codePointAt(0);
    return code >= 0xac00 && code <= 0xd7a3;
  }).length;
}

export function isPlayableName(word, options = {}) {
  const text = String(word || "").trim();
  if (!text || SKIP_NAME.test(text)) return false;
  if (hangulCount(text) >= 2) return true;
  if (!options.allowLatin) return false;
  const compact = text.replace(/[^0-9A-Za-z\uAC00-\uD7A3]/g, "");
  return compact.length >= 2 && /[A-Za-z]/.test(compact);
}

export const YEAR_BANDS = {
  "1990s": [1990, 1999],
  "2000s": [2000, 2009],
  "2010s": [2010, 2019],
  "2020s": [2020, 2029],
};

export function normalizeKinds(kinds, allowed) {
  if (!Array.isArray(kinds) || !kinds.length || kinds.includes("all")) return null;
  const cleaned = kinds.map((k) => String(k || "").trim()).filter(Boolean);
  const allow = Array.isArray(allowed) ? allowed : CLUE_KINDS;
  return cleaned.filter((k) => allow.includes(k));
}

export function scrubHint(text, ...secrets) {
  let out = String(text || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  for (const secret of secrets) {
    const raw = String(secret || "").trim();
    if (!raw || raw.length < 2) continue;
    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "g"), "○○");
    const compact = raw.replace(/\s+/g, "");
    if (compact !== raw && compact.length >= 2) {
      out = out.replace(new RegExp(compact.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "○○");
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

function asList(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") return [raw];
  return [];
}

export function clueEntryKey(item) {
  return `${String(item?.genre || "")}\0${String(item?.word || "").replace(/\s+/g, "")}`;
}

function pushItem(items, seen, item) {
  const word = String(item?.word || "").trim();
  const kind = String(item?.genre || "").trim();
  const hint = String(item?.hint || "").trim();
  const image = String(item?.image || "").trim();
  const imageReveal = String(item?.imageReveal || "").trim();
  if (!isPlayableName(word) || !CLUE_KINDS.includes(kind) || !hint) return;
  const key = clueEntryKey({ word, genre: kind });
  if (seen.has(key)) return;
  seen.add(key);
  const row = { word, genre: kind, hint };
  if (image) row.image = image;
  if (imageReveal) row.imageReveal = imageReveal;
  items.push(row);
}

function mapCharacter(obj) {
  const word = String(obj?.name || "").trim();
  const images = obj?.images || {};
  const hint = [
    [obj?.elementText, obj?.weaponText, obj?.region].filter(Boolean).join(" · "),
    obj?.affiliation,
    scrubHint(obj?.description, word),
  ]
    .filter(Boolean)
    .join("\n");
  const play = images.filename_icon || images.filename_gachaSlice || images.filename_iconCard;
  const reveal = images.filename_iconCard || images.filename_icon || images.filename_gachaSlice;
  return {
    word,
    genre: "캐릭터",
    hint,
    image: clueImageUrl(play),
    imageReveal: clueImageUrl(reveal),
  };
}

function mapSkills(obj) {
  const charName = String(obj?.name || "").trim();
  if (!isPlayableName(charName)) return [];
  const slots = [
    [obj?.combat2, "원소전투 스킬", "filename_combat2"],
    [obj?.combat3, "원소폭발", "filename_combat3"],
  ];
  return slots
    .map(([skill, label, fileKey]) => {
      const word = String(skill?.name || "").trim();
      if (!word || word === charName) return null;
      const hint = [`${charName}의 ${label}`, scrubHint(skill?.description, word, charName)]
        .filter(Boolean)
        .join("\n");
      return { word, genre: "스킬명", hint, image: clueImageUrl(obj?.images?.[fileKey]) };
    })
    .filter(Boolean);
}

function mapWeapon(obj) {
  const word = String(obj?.name || "").trim();
  const meta = [obj?.weaponText, obj?.rarity ? `${obj.rarity}성` : ""]
    .filter(Boolean)
    .join(" · ");
  const hint = [meta, scrubHint(obj?.description, word)].filter(Boolean).join("\n");
  return {
    word,
    genre: "무기",
    hint,
    image: pickImage(obj?.images, "filename_icon", "filename_gacha"),
  };
}

function mapArtifact(obj) {
  const word = String(obj?.name || "").trim();
  const hint = [
    obj?.effect2Pc ? `2세트 ${scrubHint(obj.effect2Pc, word)}` : "",
    obj?.effect4Pc ? `4세트 ${scrubHint(obj.effect4Pc, word)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    word,
    genre: "성유물",
    hint,
    image: pickImage(obj?.images, "filename_flower", "filename_circlet"),
  };
}

function mapFood(obj) {
  const word = String(obj?.name || "").trim();
  const hint = [
    obj?.filterText,
    scrubHint(obj?.description, word),
    scrubHint(obj?.effect, word),
  ]
    .filter(Boolean)
    .join("\n");
  return { word, genre: "음식", hint, image: clueImageUrl(obj?.images?.filename_icon) };
}

function mapBoss(obj) {
  const word = String(obj?.name || "").trim();
  const hint = [
    obj?.type || obj?.kind || "보스",
    scrubHint(obj?.description || obj?.specialName, word),
  ]
    .filter(Boolean)
    .join("\n");
  return {
    word,
    genre: "보스",
    hint,
    image: pickImage(obj?.images, "filename_icon"),
  };
}

function mapRegion(obj) {
  const word = String(obj?.name || "").trim();
  const hint = [
    [obj?.area, obj?.region].filter(Boolean).join(" · "),
    scrubHint(obj?.description, word),
  ]
    .filter(Boolean)
    .join("\n");
  return {
    word,
    genre: "지역",
    hint: hint || "원신 지역",
    image: pickImage(obj?.images, "filename_image"),
  };
}

export function buildGenshinBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const obj of asList(raw.characters)) pushItem(items, seen, mapCharacter(obj));
  for (const obj of asList(raw.talents)) {
    for (const skill of mapSkills(obj)) pushItem(items, seen, skill);
  }
  for (const obj of asList(raw.weapons)) pushItem(items, seen, mapWeapon(obj));
  for (const obj of asList(raw.artifacts)) pushItem(items, seen, mapArtifact(obj));
  for (const obj of asList(raw.foods)) pushItem(items, seen, mapFood(obj));
  for (const obj of asList(raw.enemies)) pushItem(items, seen, mapBoss(obj));
  for (const obj of asList(raw.geographies)) pushItem(items, seen, mapRegion(obj));
  return { version: 1, title: "원신 단서", fetchedAt, kinds: CLUE_KINDS, items };
}

export function filterClueItems(bank, options = {}) {
  const kinds = normalizeKinds(options.kinds, options.allowedKinds || bank?.kinds);
  if (kinds && !kinds.length) return [];
  let items = bank?.items || [];
  items = items.filter((item) => !kinds || kinds.includes(item.genre));
  const genres = (options.mediaGenres || []).filter((g) => g && g !== "all");
  if (genres.length) {
    items = items.filter((item) =>
      options.mediaTree
        ? matchMediaTags(item.mediaGenres, options.mediaGenres, options.mediaTree)
        : (item.mediaGenres || []).some((g) => genres.includes(g)),
    );
  }
  const band = YEAR_BANDS[options.yearBand];
  if (band) {
    items = items.filter((item) => {
      const year = Number(item.year);
      return year >= band[0] && year <= band[1];
    });
  }
  return items;
}

export function pickClueEntries(bank, options = {}, count = 1) {
  const n = Math.max(1, Math.min(3, Math.floor(Number(count) || 1)));
  const exclude = options.exclude instanceof Set ? options.exclude : null;
  const all = filterClueItems(bank, options);
  let pool = exclude ? all.filter((item) => !exclude.has(clueEntryKey(item))) : all.slice();
  if (!pool.length && all.length && exclude) {
    exclude.clear();
    pool = all.slice();
  }
  if (!pool.length) throw new Error("선택한 종류에 맞는 단서가 없습니다");
  const out = [];
  const used = new Set();
  while (out.length < n && pool.length) {
    const item = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    if (!item?.word || used.has(item.word)) continue;
    used.add(item.word);
    out.push(item);
  }
  if (!out.length) throw new Error("선택한 종류에 맞는 단서가 없습니다");
  return out;
}

export function getClueBankStats(bank, options = {}) {
  const pool = filterClueItems(bank, options);
  return {
    total: bank?.items?.length || 0,
    matched: pool.length,
    fetchedAt: bank?.fetchedAt || 0,
  };
}

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "");
    if (!parsed?.items?.length) return null;
    return {
      version: 1,
      title: parsed.title || "원신 단서",
      fetchedAt: parsed.fetchedAt || 0,
      items: parsed.items.filter((item) => item?.word && item?.genre && item?.hint),
    };
  } catch {
    return null;
  }
}

function writeCache(bank) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(bank));
  } catch {
    // quota / private mode
  }
}

async function fetchFolder(folder, query, extra = "") {
  const url =
    `${API_BASE}/${folder}?query=${encodeURIComponent(query)}` +
    `&matchCategories=true&verboseCategories=true&resultLanguage=Korean${extra}`;
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`원신 ${folder} ${res.status}`);
  const data = await res.json();
  return asList(data).filter((item) => item && typeof item === "object" && item.name);
}

export async function fetchGenshinRaw() {
  const [characters, talents, weapons, artifacts, foods, enemies, geographies] = await Promise.all([
    fetchFolder("characters", "names"),
    fetchFolder("talents", "names"),
    fetchFolder("weapons", "names"),
    fetchFolder("artifacts", "names"),
    fetchFolder("foods", "names"),
    fetchFolder("enemies", "Boss", "&queryLanguages=English"),
    fetchFolder("geographies", "names"),
  ]);
  return { characters, talents, weapons, artifacts, foods, enemies, geographies };
}

async function loadGenshinSnapshot() {
  try {
    const res = await fetch(new URL("./snapshots/genshin.json", import.meta.url));
    if (!res.ok) return null;
    const snap = await res.json();
    return snap?.items?.length ? snap : null;
  } catch {
    return null;
  }
}

export async function refreshGenshinBankQuietly(current) {
  const snap = await loadGenshinSnapshot();
  if (snap && snap.fetchedAt >= (current?.fetchedAt || 0)) {
    writeCache(snap);
    return snap;
  }
  const age = Date.now() - (current?.fetchedAt || 0);
  if (current?.items?.length && age < MAX_AGE_MS) return current;
  const bank = buildGenshinBank(await fetchGenshinRaw(), Date.now());
  if (!bank.items.length) throw new Error("원신 단서를 비웠습니다");
  writeCache(bank);
  return bank;
}

export async function initGenshinBank() {
  const cached = readCache();
  const snap = await loadGenshinSnapshot();
  if (snap && snap.fetchedAt >= (cached?.fetchedAt || 0)) {
    writeCache(snap);
    return snap;
  }
  if (cached?.items?.length) {
    refreshGenshinBankQuietly(cached).catch(() => {});
    return cached;
  }
  const bank = buildGenshinBank(await fetchGenshinRaw(), Date.now());
  if (!bank.items.length) throw new Error("원신 단서를 불러오지 못했습니다");
  writeCache(bank);
  return bank;
}
