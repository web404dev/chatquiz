import { scrubHint } from "./genshin-bank.js";
import { fetchJson, makeCachedBank, packSnapshot, pushClue } from "./clue-bank.js";
import {
  PUBG_MAP_EN,
  pubgEnglishAliases,
  pubgMapImage,
  pubgVehicleImage,
  pubgWeaponImage,
} from "./pubg-official.js";

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
export const KART_KINDS = ["캐릭터", "카트", "트랙"];
export const MC_KINDS = ["몹", "아이템", "블록"];

export const KART_CATALOG = [
  ["다오", "캐릭터", "노란 머리 기본 캐릭터"],
  ["배찌", "캐릭터", "파란 머리 기본 캐릭터"],
  ["디지니", "캐릭터", "분홍 머리 기본 캐릭터"],
  ["우니", "캐릭터", "흰 머리 기본 캐릭터"],
  ["에띠", "캐릭터", "초록 머리 기본 캐릭터"],
  ["케피", "캐릭터", "주황 머리 기본 캐릭터"],
  ["마리드", "캐릭터", "긴 생머리 여성 캐릭터"],
  ["티이라", "캐릭터", "보라 머리 여성 캐릭터"],
  ["크리스", "캐릭터", "기사 갑옷 캐릭터"],
  ["황금마린", "카트", "바다를 닮은 황금 카트"],
  ["솔리드", "카트", "단단한 기본형 카트"],
  ["버스트", "카트", "순간 가속이 센 카트"],
  ["코튼", "카트", "구름처럼 가벼운 카트"],
  ["파이어 마르스", "카트", "불꽃 테마 카트"],
  ["비치 해변 드라이브", "트랙", "바다 옆을 달리는 초반 트랙"],
  ["포레스트 통나무", "트랙", "숲속 통나무 트랙"],
  ["아이스 익스트림", "트랙", "미끄러운 얼음 트랙"],
  ["공동묘지 유령의 계곡", "트랙", "묘지 테마 트랙"],
  ["팩토리 원통 제작소", "트랙", "공장 원통 트랙"],
  ["노르테유 익스프레스", "트랙", "설원 도시 고속 트랙"],
];

export const MC_CATALOG = [
  ["크리퍼", "몹", "가까이 오면 부푸는 초록 폭발 몹"],
  ["좀비", "몹", "밤에 나오는 초록 언데드"],
  ["스켈레톤", "몹", "활을 쏘는 뼈다귀"],
  ["엔더맨", "몹", "눈을 마주치면 다가오는 키 큰 몹"],
  ["슬라임", "몹", "맞으면 쪼개지는 초록 덩어리"],
  ["블레이즈", "몹", "네더에서 화염구를 던지는 몹"],
  ["가스트", "몹", "네더 하늘에서 폭탄을 뱉는 몹"],
  ["워든", "몹", "딥 다크에서 소리를 듣고 쫓는 몹"],
  ["위더", "몹", "세 머리가 있는 보스"],
  ["엔더 드래곤", "몹", "엔드 차원의 최종 보스"],
  ["다이아몬드", "아이템", "파란 보석 광물"],
  ["네더라이트", "아이템", "네더에서 얻는 최상위 광물"],
  ["레드스톤", "아이템", "회로를 만드는 빨간 가루"],
  ["엔더 진주", "아이템", "던지면 그곳으로 순간이동"],
  ["겉날개", "아이템", "엔드에서 얻어 활강하는 날개"],
  ["황금사과", "아이템", "먹으면 흡수와 재생이 생기는 과일"],
  ["흑요석", "아이템", "물과 용암이 만나 생기는 검은 블록"],
  ["기반암", "블록", "세상에 가장 아래 깔린 부술 수 없는 층"],
  ["발광석", "블록", "네더에서 캐는 노란 빛 블록"],
  ["네더랙", "블록", "네더 땅을 이루는 붉은 블록"],
];

const DOTA_ATTR = { 0: "힘", 1: "민첩", 2: "지능", 3: "만능" };
const OW_ROLE = { tank: "돌격", damage: "공격", support: "지원" };
const CREEP_REST = /^(khan|ogre|troll|wolf|golem|courier|roshan|necronomicon|backdoor)(_|$)/;

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
  ["엘포조", "지명", "미라마 시장 마을"],
  ["파라다이스 리조트", "지명", "사녹 리조트"],
  ["고성", "지명", "태이고 성곽 지역"],
  ["본햄", "지명", "데스턴 도시"],
  ["AKM", "무기", "돌격소총", pubgWeaponImage("akm", PUBG_ICON)],
  ["M416", "무기", "돌격소총", pubgWeaponImage("m416", PUBG_ICON)],
  ["베릴 M762", "무기", "돌격소총", pubgWeaponImage("beryl_m762", PUBG_ICON)],
  ["SCAR-L", "무기", "돌격소총", pubgWeaponImage("scar-l", PUBG_ICON)],
  ["그로자", "무기", "돌격소총", pubgWeaponImage("groza", PUBG_ICON)],
  ["AUG", "무기", "돌격소총", pubgWeaponImage("aug_a3", PUBG_ICON)],
  ["Kar98k", "무기", "저격소총", pubgWeaponImage("kar98k", PUBG_ICON)],
  ["AWM", "무기", "저격소총", pubgWeaponImage("awm", PUBG_ICON)],
  ["SLR", "무기", "지정사수소총", pubgWeaponImage("slr", PUBG_ICON)],
  ["미니14", "무기", "지정사수소총", pubgWeaponImage("mini14", PUBG_ICON)],
  ["SKS", "무기", "지정사수소총", pubgWeaponImage("sks", PUBG_ICON)],
  ["UMP", "무기", "기관단총", pubgWeaponImage("ump45", PUBG_ICON)],
  ["벡터", "무기", "기관단총", pubgWeaponImage("vector", PUBG_ICON)],
  ["프라이팬", "무기", "근접 무기", pubgWeaponImage("pan", PUBG_ICON)],
  ["쇠지렛대", "무기", "근접 무기", pubgWeaponImage("crowbar", PUBG_ICON)],
  ["마체테", "무기", "근접 무기", pubgWeaponImage("machete", PUBG_ICON)],
  ["석궁", "무기", "특수 무기", pubgWeaponImage("crossbow", PUBG_ICON)],
  ["수류탄", "투척", "투척 무기", pubgWeaponImage("frag_grenade", PUBG_ICON)],
  ["연막탄", "투척", "투척 무기", pubgWeaponImage("smoke_grenade", PUBG_ICON)],
  ["섬광탄", "투척", "투척 무기", pubgWeaponImage("stun_grenade", PUBG_ICON)],
  ["화염병", "투척", "투척 무기", pubgWeaponImage("molotov_cocktail", PUBG_ICON)],
  ["버기", "차량", "오픈형 경차량"],
  ["다시아", "차량", "세단"],
  ["UAZ", "차량", "오프로드 차량"],
  ["미라도", "차량", "쿠페"],
  ["모터사이클", "차량", "이륜차"],
  ["보트", "차량", "수상 이동"],
  ["미니버스", "차량", "대형 차량"],
  ["BRDM-2", "차량", "방탄 차량"],
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

const PUBG_WORD_EN = {
  에란겔: ["Erangel"],
  미라마: ["Miramar"],
  사녹: ["Sanhok"],
  비켄디: ["Vikendi"],
  태이고: ["Taego"],
  데스턴: ["Deston"],
  론도: ["Rondo"],
  카라킨: ["Karakin"],
  파라모: ["Paramo"],
  포친키: ["Pochinki"],
  게오르고폴: ["Georgopol"],
  야스나야: ["Yasnaya", "Yasnaya Polyana"],
  노보레즈노예: ["Novorepnoye"],
  "밀리터리 베이스": ["Military Base"],
  로즈하임: ["Rozhok"],
  리포브카: ["Lipovka"],
  페카도: ["Pecado"],
  엘포조: ["El Pozo"],
  "파라다이스 리조트": ["Paradise Resort"],
  고성: ["Gosan"],
  본햄: ["Bonham"],
  버기: ["Buggy"],
  다시아: ["Dacia"],
  미라도: ["Mirado"],
  모터사이클: ["Motorcycle"],
  보트: ["Boat"],
  미니버스: ["Minibus"],
  구급상자: ["First Aid Kit", "First Aid"],
  "의료용 키트": ["Med Kit", "Medkit"],
  "에너지 드링크": ["Energy Drink"],
  진통제: ["Painkiller"],
  아드레날린: ["Adrenaline"],
  붕대: ["Bandage"],
};

function pubgAliases(word, slug, extras) {
  const mapEn = PUBG_MAP_EN[slug] ? [PUBG_MAP_EN[slug]] : [];
  return pubgEnglishAliases(slug, word, [...(PUBG_WORD_EN[word] || []), ...mapEn, ...(extras || [])]);
}

function pushPubgRow(items, seen, word, genre, hint, image, aliases) {
  pushClue(items, seen, { word, genre, hint, image, aliases }, PUBG_KINDS, { allowLatin: true });
}

export function buildPubgBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  const catalog = Array.isArray(raw.catalog) && raw.catalog.length ? raw.catalog : PUBG_CATALOG;
  const officialWeapons = Array.isArray(raw.officialWeapons) ? raw.officialWeapons : [];
  const officialVehicles = Array.isArray(raw.officialVehicles) ? raw.officialVehicles : [];
  const officialMaps = Array.isArray(raw.officialMaps) ? raw.officialMaps : [];
  const crawled = officialWeapons.length || officialVehicles.length || officialMaps.length;
  for (const row of catalog) {
    const word = String(row?.[0] || "").trim();
    const genre = String(row?.[1] || "").trim();
    const hint = String(row?.[2] || "").trim();
    const image = String(row?.[3] || "").trim();
    if ((genre === "무기" || genre === "투척") && officialWeapons.length) continue;
    if (genre === "차량" && officialVehicles.length) continue;
    if ((genre === "맵" || genre === "지명" || genre === "회복") && crawled) continue;
    pushPubgRow(items, seen, word, genre, hint, image, pubgAliases(word));
  }
  for (const map of officialMaps) {
    const word = String(map?.name || "").trim();
    const image = String(map?.image || pubgMapImage(map?.slug, PUBG_ICON) || "").trim();
    pushPubgRow(items, seen, word, "맵", "배틀그라운드 맵", image, pubgAliases(word, map?.slug, map?.aliases));
  }
  for (const car of officialVehicles) {
    const word = String(car?.name || "").trim();
    const image = String(car?.image || pubgVehicleImage(car?.slug) || "").trim();
    pushPubgRow(items, seen, word, "차량", "배틀그라운드 탈것", image, pubgAliases(word, car?.slug, car?.aliases));
  }
  for (const gun of officialWeapons) {
    const word = String(gun?.name || "").trim();
    const genre = String(gun?.genre || "무기").trim();
    const hint = genre === "투척" ? "투척 무기" : "배틀그라운드 무기";
    const image = String(gun?.image || pubgWeaponImage(gun?.slug, PUBG_ICON) || "").trim();
    pushPubgRow(items, seen, word, genre, hint, image, pubgAliases(word, gun?.slug, gun?.aliases));
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
    const hint = [attr, hero.complexity ? `난이도 ${hero.complexity}` : ""].filter(Boolean).join(" · ") || "도타 2 영웅";
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
      const hint = tier >= 0 ? `중립 ${tier + 1}티어` : "도타 2 아이템";
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
    const hint = scrubHint(owner ? `${owner} 스킬` : "도타 2 스킬", word);
    pushClue(
      items,
      seen,
      { word, genre: "스킬명", hint, image: `${DOTA_IMG}/abilities/${key}.png` },
      DOTA_KINDS,
    );
  }
  return { version: 1, title: "도타 2 단서", fetchedAt, kinds: DOTA_KINDS, items };
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
    const hint = [role, place].filter(Boolean).join(" · ") || "오버워치 2 영웅";
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
          hint: hintText || "오버워치 2 스킬",
          image: String(skill.icon || ""),
        },
        OW_KINDS,
      );
    }
  }
  return { version: 1, title: "오버워치 2 단서", fetchedAt, kinds: OW_KINDS, items };
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
  return { version: 1, title: "전략적 팀 전투 단서", fetchedAt, kinds: TFT_KINDS, items };
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

const PUBG_WORKER = "https://chzzk-chat-quiz.web404dev.workers.dev";

export async function fetchPubgRaw() {
  let officialWeapons = [];
  let officialVehicles = [];
  let officialMaps = [];
  try {
    const json = await fetchJson(`${PUBG_WORKER}/pubg/official`, {}, 25000);
    officialWeapons = Array.isArray(json?.weapons) ? json.weapons : [];
    officialVehicles = Array.isArray(json?.vehicles) ? json.vehicles : [];
    officialMaps = Array.isArray(json?.maps) ? json.maps : [];
  } catch {
    try {
      const json = await fetchJson(`${PUBG_WORKER}/pubg/weapons`, {}, 20000);
      officialWeapons = Array.isArray(json?.weapons) ? json.weapons : [];
    } catch {
      officialWeapons = [];
    }
  }
  return { catalog: PUBG_CATALOG, officialWeapons, officialVehicles, officialMaps };
}

export async function fetchDotaRaw() {
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

export async function fetchOwRaw() {
  const heroes = await fetchJson(`${OW_API}/heroes?locale=ko-kr`, {}, 20000);
  const list = asList(heroes);
  const details = await mapLimit(list, 6, async (hero) => {
    const detail = await fetchJson(`${OW_API}/heroes/${hero.key}?locale=ko-kr`, {}, 10000);
    return detail ? { ...detail, key: hero.key } : null;
  });
  return { heroes: list, details: details.filter(Boolean) };
}

export async function fetchTftRaw() {
  const versions = await fetchJson(`${LOL_DDRAGON}/api/versions.json`);
  const version = versions[0];
  const json = await fetchJson(`${LOL_DDRAGON}/cdn/${version}/data/ko_KR/tft-champion.json`, {}, 28000);
  return { version, champions: json.data || {} };
}

export async function fetchFortniteRaw() {
  const map = await fetchJson(`${FN_API}/v1/map?language=ko`, {}, 20000);
  const shop = await fetchJson(`${FN_API}/v2/shop?language=ko`, {}, 40000).catch(() => ({ data: { entries: [] } }));
  return {
    pois: map?.data?.pois || [],
    entries: shop?.data?.entries || [],
  };
}

const pubg = makeCachedBank({
  cacheKey: "cluePubgBank:v5",
  title: "배틀그라운드 단서",
  kinds: PUBG_KINDS,
  fetchRaw: fetchPubgRaw,
  build: buildPubgBank,
  snapshot: packSnapshot("pubg"),
});
const dota = makeCachedBank({
  cacheKey: "clueDotaBank:v1",
  title: "도타 2 단서",
  kinds: DOTA_KINDS,
  fetchRaw: fetchDotaRaw,
  build: buildDotaBank,
  snapshot: packSnapshot("dota"),
});
const overwatch = makeCachedBank({
  cacheKey: "clueOwBank:v1",
  title: "오버워치 2 단서",
  kinds: OW_KINDS,
  fetchRaw: fetchOwRaw,
  build: buildOwBank,
  snapshot: packSnapshot("overwatch"),
});
const tft = makeCachedBank({
  cacheKey: "clueTftBank:v1",
  title: "전략적 팀 전투 단서",
  kinds: TFT_KINDS,
  fetchRaw: fetchTftRaw,
  build: buildTftBank,
  snapshot: packSnapshot("tft"),
});
const fortnite = makeCachedBank({
  cacheKey: "clueFnBank:v1",
  title: "포트나이트 단서",
  kinds: FN_KINDS,
  fetchRaw: fetchFortniteRaw,
  build: buildFortniteBank,
  snapshot: packSnapshot("fortnite"),
});

function buildCatalogBank(title, kinds, catalog, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const row of catalog) {
    const word = String(row?.[0] || "").trim();
    const genre = String(row?.[1] || "").trim();
    const hint = String(row?.[2] || "").trim();
    pushClue(items, seen, { word, genre, hint }, kinds);
  }
  return { version: 1, title, fetchedAt, kinds: kinds.slice(), items };
}

export function initKartBank() {
  return Promise.resolve(buildCatalogBank("카트라이더 단서", KART_KINDS, KART_CATALOG));
}

export function initMinecraftBank() {
  return Promise.resolve(buildCatalogBank("마인크래프트 단서", MC_KINDS, MC_CATALOG));
}

export const initPubgBank = pubg.init;
export const initDotaBank = dota.init;
export const initOwBank = overwatch.init;
export const initTftBank = tft.init;
export const initFortniteBank = fortnite.init;
