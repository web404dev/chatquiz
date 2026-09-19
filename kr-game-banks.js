import { scrubHint } from "./genshin-bank.js";
import { fetchJson, makeCachedBank, packSnapshot, pushClue } from "./clue-bank.js";

const FGO_SERVANTS = "https://api.atlasacademy.io/export/KR/basic_servant.json";
const YGO_STAPLE = "https://db.ygoprodeck.com/api/v7/cardinfo.php?language=ko&staple=yes";
const HS_CARDS = "https://api.hearthstonejson.com/v1/latest/koKR/cards.collectible.json";
const HS_ART = "https://art.hearthstonejson.com/v1/render/latest/koKR/256x";

const FGO_CLASS = {
  saber: "세이버",
  archer: "아처",
  lancer: "랜서",
  rider: "라이더",
  caster: "캐스터",
  assassin: "어새신",
  berserker: "버서커",
  ruler: "룰러",
  avenger: "어벤저",
  moonCancer: "문캔서",
  alterEgo: "얼터에고",
  foreigner: "포리너",
  pretender: "프리텐더",
  shielder: "실더",
  beast: "비스트",
};

const HS_CLASS = {
  MAGE: "마법사",
  WARRIOR: "전사",
  WARLOCK: "흑마법사",
  PRIEST: "사제",
  DRUID: "드루이드",
  ROGUE: "도적",
  HUNTER: "사냥꾼",
  PALADIN: "성기사",
  SHAMAN: "주술사",
  DEMONHUNTER: "악마사냥꾼",
  DEATHKNIGHT: "죽음의 기사",
  NEUTRAL: "중립",
};

export const FGO_KINDS = ["서번트"];
export const YGO_KINDS = ["카드"];
export const HS_KINDS = ["카드"];

function asList(raw) {
  if (Array.isArray(raw)) return raw.filter((item) => item && typeof item === "object");
  if (raw && typeof raw === "object") return Object.values(raw).filter((item) => item && typeof item === "object");
  return [];
}

function stripText(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[0-9]+\}/g, "n")
    .replace(/\$[0-9]+/g, "n")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildFgoBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const row of asList(raw.servants)) {
    const word = String(row.name || "").trim();
    const klass = FGO_CLASS[row.className] || row.className || "";
    const rare = Number(row.rarity) ? `${row.rarity}성` : "";
    const original = String(row.originalName || "").trim();
    pushClue(
      items,
      seen,
      {
        word,
        genre: "서번트",
        hint: [klass, rare].filter(Boolean).join(" · ") || "페이트/그랜드 오더 서번트",
        image: String(row.face || "").trim(),
        aliases: original && original !== word ? [original] : [],
      },
      FGO_KINDS,
    );
  }
  return { version: 1, title: "페이트/그랜드 오더 단서", fetchedAt, kinds: FGO_KINDS, items };
}

export function buildYgoBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const row of asList(raw.cards)) {
    const word = String(row.name || "").trim();
    const kind = String(row.humanReadableCardType || row.type || "카드").trim();
    const hint = scrubHint(stripText(row.desc), word) || kind;
    const images = Array.isArray(row.card_images) ? row.card_images[0] : null;
    const en = String(row.name_en || "").trim();
    pushClue(
      items,
      seen,
      {
        word,
        genre: "카드",
        hint: [kind, hint].filter(Boolean).join("\n"),
        image: String(images?.image_url_small || images?.image_url || "").trim(),
        aliases: en && en !== word ? [en] : [],
      },
      YGO_KINDS,
    );
  }
  return { version: 1, title: "유희왕 단서", fetchedAt, kinds: YGO_KINDS, items };
}

export function buildHsBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const row of asList(raw.cards)) {
    if (row.collectible === false) continue;
    if (row.type !== "MINION" && row.type !== "SPELL") continue;
    if (row.rarity !== "LEGENDARY") continue;
    const word = String(row.name || "").trim();
    const klass = HS_CLASS[row.cardClass] || row.cardClass || "";
    const kind = row.type === "SPELL" ? "주문" : "하수인";
    const hint = [klass, kind, scrubHint(stripText(row.text || row.flavor), word)].filter(Boolean).join(" · ");
    pushClue(
      items,
      seen,
      {
        word,
        genre: "카드",
        hint: hint || "하스스톤 전설 카드",
        image: row.id ? `${HS_ART}/${row.id}.png` : "",
      },
      HS_KINDS,
    );
  }
  return { version: 1, title: "하스스톤 단서", fetchedAt, kinds: HS_KINDS, items };
}

export async function fetchFgoRaw() {
  return { servants: await fetchJson(FGO_SERVANTS, {}, 28000) };
}

export async function fetchYgoRaw() {
  const json = await fetchJson(YGO_STAPLE, {}, 28000);
  return { cards: json?.data || [] };
}

export async function fetchHsRaw() {
  return { cards: await fetchJson(HS_CARDS, {}, 40000) };
}

const fgo = makeCachedBank({
  cacheKey: "clueFgoBank:v1",
  title: "페이트/그랜드 오더 단서",
  kinds: FGO_KINDS,
  fetchRaw: fetchFgoRaw,
  build: buildFgoBank,
  snapshot: packSnapshot("fgo"),
});
const yugioh = makeCachedBank({
  cacheKey: "clueYgoBank:v1",
  title: "유희왕 단서",
  kinds: YGO_KINDS,
  fetchRaw: fetchYgoRaw,
  build: buildYgoBank,
  snapshot: packSnapshot("yugioh"),
});
const hearthstone = makeCachedBank({
  cacheKey: "clueHsBank:v1",
  title: "하스스톤 단서",
  kinds: HS_KINDS,
  fetchRaw: fetchHsRaw,
  build: buildHsBank,
  snapshot: packSnapshot("hearthstone"),
});

export const initFgoBank = fgo.init;
export const initYgoBank = yugioh.init;
export const initHsBank = hearthstone.init;
