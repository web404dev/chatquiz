const THROW_SLUGS = new Set([
  "stun_grenade",
  "frag_grenade",
  "molotov_cocktail",
  "sticky_bomb",
  "smoke_grenade",
  "c4",
  "bz_grenade",
]);

const MELEE_ITEMS = new Set([
  "Item_Weapon_Pan_C",
  "Item_Weapon_Cowbar_C",
  "Item_Weapon_Machete_C",
  "Item_Weapon_Sickle_C",
]);

export const PUBG_SLUG_TO_ITEM = {
  m16a4: "Item_Weapon_M16A4_C",
  m416: "Item_Weapon_HK416_C",
  "scar-l": "Item_Weapon_SCAR-L_C",
  g36c: "Item_Weapon_G36C_C",
  qbz95: "Item_Weapon_QBZ95_C",
  k2: "Item_Weapon_K2_C",
  aug_a3: "Item_Weapon_AUG_C",
  famas_g2: "Item_Weapon_FAMAS_C",
  akm: "Item_Weapon_AK47_C",
  beryl_m762: "Item_Weapon_BerylM762_C",
  mk47_mutant: "Item_Weapon_Mk47Mutant_C",
  groza: "Item_Weapon_Groza_C",
  ace32: "Item_Weapon_ACE32_C",
  mini14: "Item_Weapon_Mini14_C",
  mk12: "Item_Weapon_Mk12_C",
  sks: "Item_Weapon_SKS_C",
  slr: "Item_Weapon_FNFal_C",
  mk14: "Item_Weapon_Mk14_C",
  vss: "Item_Weapon_VSS_C",
  dragunov: "Item_Weapon_Dragunov_C",
  tommy_gun: "Item_Weapon_Thompson_C",
  ump45: "Item_Weapon_UMP_C",
  micro_uzi: "Item_Weapon_UZI_C",
  vector: "Item_Weapon_Vector_C",
  mp5k: "Item_Weapon_MP5K_C",
  mp9: "Item_Weapon_MP9_C",
  p90: "Item_Weapon_P90_C",
  js9: "Item_Weapon_JS9_C",
  kar98k: "Item_Weapon_Kar98k_C",
  m24: "Item_Weapon_M24_C",
  awm: "Item_Weapon_AWM_C",
  win94: "Item_Weapon_Win1894_C",
  lynx_amr: "Item_Weapon_L6_C",
  s12k: "Item_Weapon_Saiga12_C",
  s1897: "Item_Weapon_Winchester_C",
  s686: "Item_Weapon_Berreta686_C",
  dbs: "Item_Weapon_DP12_C",
  sawed_off: "Item_Weapon_Sawnoff_C",
  o12: "Item_Weapon_OriginS12_C",
  p18c: "Item_Weapon_G18_C",
  p92: "Item_Weapon_M9_C",
  skorpion: "Item_Weapon_vz61Skorpion_C",
  deagle: "Item_Weapon_DesertEagle_C",
  r1895: "Item_Weapon_NagantM1895_C",
  crowbar: "Item_Weapon_Cowbar_C",
  machete: "Item_Weapon_Machete_C",
  pan: "Item_Weapon_Pan_C",
  sickle: "Item_Weapon_Sickle_C",
  stun_grenade: "Item_Weapon_FlashBang_C",
  frag_grenade: "Item_Weapon_Grenade_C",
  molotov_cocktail: "Item_Weapon_Molotov_C",
  sticky_bomb: "Item_Weapon_StickyGrenade_C",
  smoke_grenade: "Item_Weapon_SmokeBomb_C",
  c4: "Item_Weapon_C4_C",
  bz_grenade: "Item_Weapon_BluezoneGrenade_C",
  m249: "Item_Weapon_M249_C",
  mg3: "Item_Weapon_MG3_C",
  m79: "Item_Weapon_M79_C",
  crossbow: "Item_Weapon_Crossbow_C",
  mortar: "Item_Weapon_Mortar_C",
  panzerfaust: "Item_Weapon_PanzerFaust100M_C",
  stun_gun: "Item_Weapon_StunGun_C",
};

export const PUBG_SLUG_EN = {
  m16a4: "M16A4",
  m416: "M416",
  "scar-l": "SCAR-L",
  g36c: "G36C",
  qbz95: "QBZ",
  k2: "K2",
  aug_a3: "AUG",
  famas_g2: "FAMAS",
  akm: "AKM",
  beryl_m762: "Beryl M762",
  mk47_mutant: "Mk47 Mutant",
  groza: "Groza",
  ace32: "ACE32",
  mini14: "Mini14",
  mk12: "Mk12",
  sks: "SKS",
  slr: "SLR",
  mk14: "Mk14",
  vss: "VSS",
  dragunov: "Dragunov",
  tommy_gun: "Tommy Gun",
  ump45: "UMP",
  micro_uzi: "Micro UZI",
  vector: "Vector",
  mp5k: "MP5K",
  mp9: "MP9",
  p90: "P90",
  js9: "JS9",
  kar98k: "Kar98k",
  m24: "M24",
  awm: "AWM",
  win94: "Win94",
  lynx_amr: "Lynx AMR",
  s12k: "S12K",
  s1897: "S1897",
  s686: "S686",
  dbs: "DBS",
  sawed_off: "Sawed-Off",
  o12: "O12",
  p18c: "P18C",
  p92: "P92",
  skorpion: "Skorpion",
  deagle: "Deagle",
  r1895: "R1895",
  crowbar: "Crowbar",
  machete: "Machete",
  pan: "Pan",
  sickle: "Sickle",
  pickaxe: "Pickaxe",
  stun_grenade: "Stun Grenade",
  frag_grenade: "Frag Grenade",
  molotov_cocktail: "Molotov Cocktail",
  sticky_bomb: "Sticky Bomb",
  smoke_grenade: "Smoke Grenade",
  c4: "C4",
  bz_grenade: "BZ Grenade",
  m249: "M249",
  mg3: "MG3",
  rpd: "RPD",
  m79: "M79",
  crossbow: "Crossbow",
  mortar: "Mortar",
  panzerfaust: "Panzerfaust",
  stun_gun: "Stun Gun",
};

const PUBG_SLUG_EN_EXTRA = {
  beryl_m762: ["Beryl"],
  mini14: ["Mini 14"],
  stun_grenade: ["Flashbang", "Flash"],
  frag_grenade: ["Frag", "Grenade"],
  smoke_grenade: ["Smoke"],
  molotov_cocktail: ["Molotov", "Molly"],
  pan: ["Frying Pan"],
  sawed_off: ["Sawed Off"],
};

export function pubgEnglishAliases(slug, officialName = "", extras = []) {
  const names = [PUBG_SLUG_EN[slug], ...(PUBG_SLUG_EN_EXTRA[slug] || []), ...extras];
  const seen = new Set();
  const official = String(officialName || "").trim().toLowerCase();
  const out = [];
  for (const name of names) {
    const word = String(name || "").trim();
    if (!word) continue;
    const key = word.toLowerCase();
    if (key === official || seen.has(key)) continue;
    seen.add(key);
    out.push(word);
  }
  return out;
}

export function pubgWeaponImage(slug, iconBase) {
  const id = PUBG_SLUG_TO_ITEM[slug];
  if (!id || !iconBase) return "";
  const folder = MELEE_ITEMS.has(id) ? "Melee" : "Main";
  return `${iconBase}/Item/Weapon/${folder}/${id}.png`;
}

function isWeaponSlug(slug) {
  return /^[a-z][a-z0-9_\-]{1,24}$/.test(slug)
    && !slug.startsWith("add-on")
    && !slug.startsWith("img")
    && !/(buttstock|magazine|muzzle|sight|rail|fore_grip)/.test(slug);
}

function addOfficialWeapon(bySlug, slug, name) {
  const key = String(slug || "").trim();
  const word = String(name || "").trim();
  if (!isWeaponSlug(key) || !word) return;
  if (/마지막 업데이트|지향사격|반동|정확도/.test(word)) return;
  if (bySlug.has(key)) return;
  bySlug.set(key, {
    slug: key,
    name: word,
    genre: THROW_SLUGS.has(key) ? "투척" : "무기",
  });
}

export const PUBG_MAP_EN = {
  erangel: "Erangel",
  miramar: "Miramar",
  sanhok: "Sanhok",
  karakin: "Karakin",
  paramo: "Paramo",
  haven: "Haven",
  taego: "Taego",
  deston: "Deston",
  vikendi: "Vikendi",
  rondo: "Rondo",
};

const PUBG_MAP_ICON = {
  erangel: "Erangel_Main.png",
  miramar: "Desert_Main.png",
  sanhok: "Savage_Main.png",
  vikendi: "DihorOtok_Main.png",
  karakin: "Summerland_Main.png",
};

export function pubgVehicleImage(slug) {
  const key = String(slug || "").trim();
  if (!key) return "";
  return `https://wstatic-prod.pubg.com/web/live/static/game-info/vehicles/images/viewer/img-vehicles-${key}.webp`;
}

export function pubgMapImage(slug, iconBase) {
  const file = PUBG_MAP_ICON[slug];
  if (!file || !iconBase) return "";
  return `${iconBase}/Map/${file}`;
}

function addOfficialNamed(bySlug, slug, name, genre) {
  const key = String(slug || "").trim();
  const word = String(name || "").trim();
  if (!isWeaponSlug(key) || !word) return;
  if (/마지막 업데이트|지향사격|반동|정확도|주요 기능|갤러리/.test(word)) return;
  if (bySlug.has(key)) return;
  bySlug.set(key, { slug: key, name: word, genre });
}

export function parsePubgOfficialCards(html, kind, genre) {
  const src = String(html || "").replace(/\\u002F/g, "/");
  const bySlug = new Map();
  const cardRe = new RegExp(
    `img-${kind}-([a-z0-9_\\-]+)\\.webp"[^>]*>\\s*<span class="${kind}-card__name"[^>]*>([^<]+)</span>`,
    "g",
  );
  const nuxtRe = new RegExp(
    `"([a-z][a-z0-9_\\-]{1,24})","([^"\\\\]{1,40})","https://wstatic-prod\\.pubg\\.com/[^"]*img-${kind}-([a-z0-9_\\-]+)\\.webp"`,
    "g",
  );
  let match;
  while ((match = cardRe.exec(src))) addOfficialNamed(bySlug, match[1], match[2], genre);
  while ((match = nuxtRe.exec(src))) addOfficialNamed(bySlug, match[1], match[2], genre);
  return [...bySlug.values()];
}

export function parsePubgOfficialVehicles(html) {
  return parsePubgOfficialCards(html, "vehicles", "차량");
}

function decodeNuxtText(text) {
  return String(text || "").replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export function parsePubgOfficialMaps(html) {
  const src = String(html || "");
  const bySlug = new Map();
  const i18nRe = /"game-info-maps__([a-z]+)":"([^"]+)"/g;
  const tabRe = /href="\/(?:ko|en)\/game-info\/maps\/([a-z]+)"[^>]*>\s*<span class="game-info-tab__link-text"[^>]*>([^<]+)<\/span>/g;
  let match;
  while ((match = i18nRe.exec(src))) {
    const name = decodeNuxtText(match[2]).replace(/<[^>]+>/g, "").trim();
    if (!name || /<br|x8|x4|x3|x2|x1/.test(name)) continue;
    addOfficialNamed(bySlug, match[1], name, "맵");
  }
  while ((match = tabRe.exec(src))) addOfficialNamed(bySlug, match[1], match[2].trim(), "맵");
  return [...bySlug.values()];
}

export function parsePubgOfficialWeapons(html) {
  const src = String(html || "").replace(/\\u002F/g, "/");
  const bySlug = new Map();
  const cardRe = /img-weapons-([a-z0-9_\-]+)\.webp"[^>]*>\s*<span class="weapons-card__name"[^>]*>([^<]+)<\/span>/g;
  const nuxtRe =
    /"([a-z][a-z0-9_\-]{1,24})","([^"\\]{1,40})","https:\/\/wstatic-prod\.pubg\.com\/[^"]*img-weapons-([a-z0-9_\-]+)\.webp"/g;
  let match;
  while ((match = cardRe.exec(src))) addOfficialWeapon(bySlug, match[1], match[2]);
  while ((match = nuxtRe.exec(src))) {
    const slug = PUBG_SLUG_TO_ITEM[match[1]] || !PUBG_SLUG_TO_ITEM[match[3]] ? match[1] : match[3];
    addOfficialWeapon(bySlug, slug, match[2]);
  }
  return [...bySlug.values()];
}
