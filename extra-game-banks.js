import { scrubHint } from "./genshin-bank.js";
import { fetchJson, makeCachedBank, pushClue } from "./clue-bank.js";

const DOTA_FEED = "https://www.dota2.com/datafeed";
const DOTA_IMG = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react";
const OW_API = "https://overfast-api.tekrop.fr";
const LOL_DDRAGON = "https://ddragon.leagueoflegends.com";
const FN_API = "https://fortnite-api.com";
const PUBG_ICON = "https://cdn.jsdelivr.net/gh/pubg/api-assets/Assets/Icons";

export const PUBG_KINDS = ["맵", "지명", "무기", "투척", "차량", "회복"];
export const DOTA_KINDS = ["영웅", "스킬명", "아이템"];
export const OW_KINDS = ["영웅", "스킬명"];
export const TFT_KINDS = ["챔피언"];
export const FN_KINDS = ["지명", "스킨", "곡괭이", "글라이더"];

const DOTA_ATTR = { 0: "힘", 1: "민첩", 2: "지능", 3: "만능" };
const OW_ROLE = { tank: "돌격", damage: "공격", support: "지원" };
const CREEP_REST = /^(khan|ogre|troll|wolf|golem|courier|roshan|necronomicon|backdoor)(_|$)/;

function pubgMain(file) {
  return `${PUBG_ICON}/Item/Weapon/Main/${file}`;
}

function pubgMelee(file) {
  return `${PUBG_ICON}/Item/Weapon/Melee/${file}`;
}

export const PUBG_CATALOG = [
  ["에란겔", "맵", "클래식 섬 전장"],
  ["미라마", "맵", "사막 전장"],
  ["사녹", "맵", "동남아시아 섬 전장"],
  ["비켄디", "맵", "설원 전장"],
  ["태이고", "맵", "한국 전장"],
  ["데스턴", "맵", "미국 남부 전장"],
  ["론도", "맵", "중국 전장"],
  ["카라킨", "맵", "소형 섬 전장"],
  ["파라모", "맵", "화산 전장"],
  ["포친키", "지명", "에란겔 중앙 도시"],
  ["게오르고폴", "지명", "에란겔 북서쪽 항구 도시"],
  ["야스나야", "지명", "에란겔 동쪽 마을"],
  ["노보레즈노예", "지명", "에란겔 남쪽 도시"],
  ["밀리터리 베이스", "지명", "에란겔 섬 군사 기지"],
  ["로즈하임", "지명", "에란겔 북쪽 마을"],
  ["리포브카", "지명", "에란겔 동북쪽 마을"],
  ["페카도", "지명", "미라마 카지노 도시"],
  ["로조비타", "지명", "미라마 해안 도시"],
  ["임브로글리오", "지명", "미라마 언덕 마을"],
  ["엘포조", "지명", "미라마 시장 마을"],
  ["파라다이스 리조트", "지명", "사녹 리조트"],
  ["캄탄", "지명", "사녹 도시"],
  ["하이퐁", "지명", "사녹 항구"],
  ["코사티카", "지명", "비켄디 도시"],
  ["고성", "지명", "태이고 성곽 지역"],
  ["본햄", "지명", "데스턴 도시"],
  ["에이케엠", "무기", "7.62 자동소총", pubgMain("Item_Weapon_AK47_C.png")],
  ["엠포", "무기", "5.56 자동소총", pubgMain("Item_Weapon_HK416_C.png")],
  ["베릴", "무기", "7.62 자동소총", pubgMain("Item_Weapon_BerylM762_C.png")],
  ["스카", "무기", "5.56 자동소총", pubgMain("Item_Weapon_SCAR-L_C.png")],
  ["그로자", "무기", "크레이트 자동소총"],
  ["오그", "무기", "크레이트 자동소총"],
  ["카구팔", "무기", "볼트액션 저격총", pubgMain("Item_Weapon_Kar98k_C.png")],
  ["에이더블유엠", "무기", "크레이트 저격총", pubgMain("Item_Weapon_AWM_C.png")],
  ["모신나강", "무기", "볼트액션 저격총"],
  ["에스엘알", "무기", "지정사수소총", pubgMain("Item_Weapon_FNFal_C.png")],
  ["미니십사", "무기", "지정사수소총", pubgMain("Item_Weapon_Mini14_C.png")],
  ["에스케이에스", "무기", "지정사수소총"],
  ["유엠피", "무기", "기관단총", pubgMain("Item_Weapon_UMP_C.png")],
  ["벡터", "무기", "기관단총"],
  ["디피투에잇", "무기", "경기관총"],
  ["프라이팬", "무기", "근접 무기", pubgMelee("Item_Weapon_Pan_C.png")],
  ["크로우바", "무기", "근접 무기", pubgMelee("Item_Weapon_Cowbar_C.png")],
  ["마체테", "무기", "근접 무기"],
  ["석궁", "무기", "특수 무기"],
  ["수류탄", "투척", "폭발 투척물"],
  ["연막탄", "투척", "시야를 가리는 투척물"],
  ["섬광탄", "투척", "시야를 멀게 하는 투척물"],
  ["화염병", "투척", "불을 붙이는 투척물"],
  ["버기", "차량", "오픈형 경차량"],
  ["다치아", "차량", "세단"],
  ["유에이제트", "차량", "오프로드 차량"],
  ["미라도", "차량", "쿠페"],
  ["모터사이클", "차량", "이륜차"],
  ["보트", "차량", "수상 이동"],
  ["버스", "차량", "대형 차량"],
  ["장갑차", "차량", "방탄 차량"],
  ["구급상자", "회복", "체력을 크게 회복"],
  ["의료용 키트", "회복", "체력을 최대까지 회복"],
  ["에너지 드링크", "회복", "부스트를 올리는 음료"],
  ["진통제", "회복", "부스트를 올리는 알약"],
  ["아드레날린", "회복", "부스트를 가득 채우는 주사"],
  ["붕대", "회복", "체력을 조금 회복"],
];

function asList(raw) {
  if (Array.isArray(raw)) return raw.filter((item) => item && typeof item === "object");
  if (raw && typeof raw === "object") return Object.values(raw).filter((item) => item && typeof item === "object");
  return [];
}

function dotaSlug(name) {
  return String(name || "").replace(/^npc_dota_hero_/, "");
}

function dotaSkillHero(name, slugs) {
  const raw = String(name || "");
  for (const slug of slugs) {
    if (raw === slug || raw.startsWith(`${slug}_`)) return slug;
  }
  return "";
}

async function mapLimit(list, limit, fn) {
  const items = asList(list);
  const out = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        out[index] = await fn(items[index], index);
      } catch {
        out[index] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) || 0 }, worker));
  return out;
}

export function buildPubgBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  const catalog = Array.isArray(raw.catalog) && raw.catalog.length ? raw.catalog : PUBG_CATALOG;
  for (const row of catalog) {
    const word = String(row?.[0] || "").trim();
    const genre = String(row?.[1] || "").trim();
    const hint = String(row?.[2] || "").trim();
    const image = String(row?.[3] || "").trim();
    pushClue(items, seen, { word, genre, hint, image }, PUBG_KINDS);
  }
  return { version: 1, title: "배틀그라운드 단서", fetchedAt, kinds: PUBG_KINDS, items };
}

export function buildDotaBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  const heroes = asList(raw.heroes);
  const abilities = asList(raw.abilities);
  const slugs = heroes.map((hero) => dotaSlug(hero.name)).filter(Boolean).sort((a, b) => b.length - a.length);
  const heroName = Object.fromEntries(heroes.map((hero) => [dotaSlug(hero.name), String(hero.name_loc || "").trim()]));
  for (const hero of heroes) {
    const word = String(hero.name_loc || "").trim();
    const slug = dotaSlug(hero.name);
    const attr = DOTA_ATTR[hero.primary_attr] || "";
    const hint = [attr, hero.complexity ? `난이도 ${hero.complexity}` : ""].filter(Boolean).join(" · ") || "도타2 영웅";
    pushClue(
      items,
      seen,
      { word, genre: "영웅", hint, image: slug ? `${DOTA_IMG}/heroes/${slug}.png` : "" },
      DOTA_KINDS,
    );
  }
  for (const row of abilities) {
    const key = String(row.name || "").trim();
    const word = String(row.name_loc || "").trim();
    if (!key || !word || word.startsWith("+") || word === "능력치 보너스") continue;
    if (key.startsWith("item_")) {
      if (key.startsWith("item_recipe_") || /조합/.test(word)) continue;
      const tier = Number(row.neutral_item_tier);
      const hint = tier >= 0 ? `중립 ${tier + 1}티어` : "도타2 아이템";
      pushClue(
        items,
        seen,
        { word, genre: "아이템", hint, image: `${DOTA_IMG}/items/${key.replace(/^item_/, "")}.png` },
        DOTA_KINDS,
      );
      continue;
    }
    if (key.startsWith("special_bonus") || key.startsWith("generic_")) continue;
    const slug = dotaSkillHero(key, slugs);
    if (!slug) continue;
    const rest = key.slice(slug.length + 1);
    if (CREEP_REST.test(rest)) continue;
    const owner = heroName[slug] || "";
    const hint = scrubHint(owner ? `${owner} 스킬` : "도타2 스킬", word);
    pushClue(
      items,
      seen,
      { word, genre: "스킬명", hint, image: `${DOTA_IMG}/abilities/${key}.png` },
      DOTA_KINDS,
    );
  }
  return { version: 1, title: "도타2 단서", fetchedAt, kinds: DOTA_KINDS, items };
}

export function buildOwBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  const heroes = asList(raw.heroes);
  const details = asList(raw.details);
  const byKey = Object.fromEntries(details.filter((hero) => hero.key).map((hero) => [String(hero.key), hero]));
  const byName = Object.fromEntries(details.map((hero) => [String(hero.name || ""), hero]));
  for (const hero of heroes) {
    const word = String(hero.name || "").trim();
    const detail = byKey[String(hero.key || "")] || byName[word] || hero;
    const role = OW_ROLE[hero.role] || OW_ROLE[detail.role] || "";
    const place = String(detail.location || "").trim();
    const hint = [role, place].filter(Boolean).join(" · ") || "오버워치 영웅";
    pushClue(
      items,
      seen,
      { word, genre: "영웅", hint, image: String(hero.portrait || detail.portrait || "") },
      OW_KINDS,
    );
    for (const skill of asList(detail.abilities)) {
      const skillWord = String(skill.name || "").trim();
      if (/^(기본 공격|역할)$/.test(skillWord)) continue;
      const hintText = scrubHint(skill.description || `${word} 스킬`, skillWord, word);
      pushClue(
        items,
        seen,
        {
          word: skillWord,
          genre: "스킬명",
          hint: hintText || "오버워치 스킬",
          image: String(skill.icon || ""),
        },
        OW_KINDS,
      );
    }
  }
  return { version: 1, title: "오버워치 단서", fetchedAt, kinds: OW_KINDS, items };
}

export function buildTftBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  const version = String(raw.version || "").trim();
  const champs = raw.champions && typeof raw.champions === "object" ? raw.champions : {};
  for (const obj of Object.values(champs)) {
    const id = String(obj.id || "").trim();
    const word = String(obj.name || "").trim();
    if (/Tutorial|Debug|테스트/i.test(id)) continue;
    const cost = Number(obj.cost || 0);
    if (cost <= 0) continue;
    const champId = id.replace(/^TFT\d+_/, "");
    const image = version && /^[A-Za-z0-9]+$/.test(champId)
      ? `${LOL_DDRAGON}/cdn/${version}/img/champion/${champId}.png`
      : "";
    pushClue(
      items,
      seen,
      { word, genre: "챔피언", hint: `${cost}코스트`, image },
      TFT_KINDS,
    );
  }
  return { version: 1, title: "TFT 단서", fetchedAt, kinds: TFT_KINDS, items };
}

export function buildFortniteBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const poi of asList(raw.pois)) {
    const word = String(poi.name || "").trim();
    if (/UnNamed|Landmark\.\d+$/i.test(String(poi.id || "")) && !word) continue;
    pushClue(items, seen, { word, genre: "지명", hint: "포트나이트 맵 지명" }, FN_KINDS);
  }
  const kindByType = { outfit: "스킨", pickaxe: "곡괭이", glider: "글라이더" };
  for (const entry of asList(raw.entries)) {
    for (const cosmetic of asList(entry.brItems)) {
      const type = String(cosmetic.type?.value || "");
      const genre = kindByType[type];
      if (!genre) continue;
      const word = String(cosmetic.name || "").trim();
      const rarity = String(cosmetic.rarity?.displayValue || "").trim();
      const set = String(cosmetic.set?.value || "").trim();
      const hint = scrubHint([rarity, set, `포트나이트 ${genre}`].filter(Boolean).join(" · "), word);
      const images = cosmetic.images || {};
      const image = String(images.small || images.icon || images.featured || "");
      pushClue(items, seen, { word, genre, hint, image }, FN_KINDS);
    }
  }
  return { version: 1, title: "포트나이트 단서", fetchedAt, kinds: FN_KINDS, items };
}

async function fetchPubgRaw() {
  return { catalog: PUBG_CATALOG };
}

async function fetchDotaRaw() {
  const [heroesJson, abilJson, itemJson] = await Promise.all([
    fetchJson(`${DOTA_FEED}/herolist?language=koreana`, {}, 20000),
    fetchJson(`${DOTA_FEED}/abilitylist?language=koreana`, {}, 40000),
    fetchJson(`${DOTA_FEED}/itemlist?language=koreana`, {}, 28000),
  ]);
  const abilities = abilJson?.result?.data?.itemabilities || [];
  const items = itemJson?.result?.data?.itemabilities || [];
  return {
    heroes: heroesJson?.result?.data?.heroes || [],
    abilities: abilities.concat(items),
  };
}

async function fetchOwRaw() {
  const heroes = await fetchJson(`${OW_API}/heroes?locale=ko-kr`, {}, 20000);
  const list = asList(heroes);
  const details = await mapLimit(list, 6, async (hero) => {
    const detail = await fetchJson(`${OW_API}/heroes/${hero.key}?locale=ko-kr`, {}, 10000);
    return detail ? { ...detail, key: hero.key } : null;
  });
  return { heroes: list, details: details.filter(Boolean) };
}

async function fetchTftRaw() {
  const versions = await fetchJson(`${LOL_DDRAGON}/api/versions.json`);
  const version = versions[0];
  const json = await fetchJson(`${LOL_DDRAGON}/cdn/${version}/data/ko_KR/tft-champion.json`, {}, 28000);
  return { version, champions: json.data || {} };
}

async function fetchFortniteRaw() {
  const map = await fetchJson(`${FN_API}/v1/map?language=ko`, {}, 20000);
  const shop = await fetchJson(`${FN_API}/v2/shop?language=ko`, {}, 40000).catch(() => ({ data: { entries: [] } }));
  return {
    pois: map?.data?.pois || [],
    entries: shop?.data?.entries || [],
  };
}

const pubg = makeCachedBank({
  cacheKey: "cluePubgBank:v1",
  title: "배틀그라운드 단서",
  kinds: PUBG_KINDS,
  fetchRaw: fetchPubgRaw,
  build: buildPubgBank,
});
const dota = makeCachedBank({
  cacheKey: "clueDotaBank:v1",
  title: "도타2 단서",
  kinds: DOTA_KINDS,
  fetchRaw: fetchDotaRaw,
  build: buildDotaBank,
});
const overwatch = makeCachedBank({
  cacheKey: "clueOwBank:v1",
  title: "오버워치 단서",
  kinds: OW_KINDS,
  fetchRaw: fetchOwRaw,
  build: buildOwBank,
});
const tft = makeCachedBank({
  cacheKey: "clueTftBank:v1",
  title: "TFT 단서",
  kinds: TFT_KINDS,
  fetchRaw: fetchTftRaw,
  build: buildTftBank,
});
const fortnite = makeCachedBank({
  cacheKey: "clueFnBank:v1",
  title: "포트나이트 단서",
  kinds: FN_KINDS,
  fetchRaw: fetchFortniteRaw,
  build: buildFortniteBank,
});

export const initPubgBank = pubg.init;
export const initDotaBank = dota.init;
export const initOwBank = overwatch.init;
export const initTftBank = tft.init;
export const initFortniteBank = fortnite.init;
