import { scrubHint } from "./genshin-bank.js";
import { fetchJson, makeCachedBank, pushClue } from "./clue-bank.js";

const HSR_CDN = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master";
const HSR_INDEX = `${HSR_CDN}/index_min/kr`;
const LOL_DDRAGON = "https://ddragon.leagueoflegends.com";
const VAL_API = "https://valorant-api.com/v1";
const POKE_KO = "https://raw.githubusercontent.com/sindresorhus/pokemon/main/data/ko.json";
const POKE_DEX = "https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json";
const POKE_ART = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";
const SCHALE = "https://schaledb.com/data/kr/students.min.json";

const HSR_PATH = {
  Knight: "보존",
  Warrior: "파멸",
  Rogue: "수렵",
  Mage: "지식",
  Shaman: "조화",
  Warlock: "공허",
  Priest: "풍요",
  Memory: "기억",
};
const HSR_ELEMENT = {
  Ice: "얼음",
  Fire: "불",
  Lightning: "번개",
  Wind: "바람",
  Physical: "물리",
  Quantum: "양자",
  Imaginary: "허수",
};
const LOL_TAG = {
  Mage: "마법사",
  Assassin: "암살자",
  Fighter: "전사",
  Tank: "탱커",
  Marksman: "원거리 딜러",
  Support: "서포터",
};
const POKE_TYPE = {
  Normal: "노말",
  Fire: "불꽃",
  Water: "물",
  Grass: "풀",
  Electric: "전기",
  Ice: "얼음",
  Fighting: "격투",
  Poison: "독",
  Ground: "땅",
  Flying: "비행",
  Psychic: "에스퍼",
  Bug: "벌레",
  Rock: "바위",
  Ghost: "고스트",
  Dragon: "드래곤",
  Dark: "악",
  Steel: "강철",
  Fairy: "페어리",
};
const BA_SCHOOL = {
  Abydos: "아비도스",
  Gehenna: "게헨나",
  Millennium: "밀레니엄",
  Trinity: "트리니티",
  Hyakkiyako: "백귀야행",
  RedWinter: "붉은겨울",
  Shanhaijing: "산해경",
  Valkyrie: "발키리",
  Arius: "아리우스",
  SRT: "SRT",
  Schale: "샬레",
  WildHunt: "와일드헌트",
  Highlander: "하이랜더",
  Tokiwadai: "토키와다이",
};

export const HSR_KINDS = ["캐릭터", "스킬명", "광추", "유물"];
export const LOL_KINDS = ["챔피언", "스킬명", "아이템"];
export const VAL_KINDS = ["요원", "스킬명", "맵", "무기"];
export const POKE_KINDS = ["포켓몬"];
export const BA_KINDS = ["학생"];

function hsrUrl(path) {
  return path ? `${HSR_CDN}/${String(path).replace(/^\//, "")}` : "";
}

function stripMarkup(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{[^}]+\}\}/g, "n")
    .replace(/#\d+\[[^\]]+\]/g, "n")
    .replace(/\s+/g, " ")
    .trim();
}

function asObjectList(raw) {
  if (Array.isArray(raw)) return raw.filter((item) => item && typeof item === "object");
  if (raw && typeof raw === "object") return Object.values(raw).filter((item) => item && typeof item === "object");
  return [];
}

export function buildHsrBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  const chars = asObjectList(raw.characters);
  const skills = raw.skills && typeof raw.skills === "object" ? raw.skills : {};
  const byId = Object.fromEntries(chars.map((c) => [String(c.id), c]));
  for (const obj of chars) {
    const word = String(obj.name || "").trim();
    if (/개척자|Trailblazer/i.test(word)) continue;
    const meta = [HSR_ELEMENT[obj.element] || obj.element, HSR_PATH[obj.path] || obj.path, obj.rarity ? `${obj.rarity}성` : ""]
      .filter(Boolean)
      .join(" · ");
    pushClue(
      items,
      seen,
      {
        word,
        genre: "캐릭터",
        hint: meta || "스타레일 캐릭터",
        image: hsrUrl(obj.icon),
        imageReveal: hsrUrl(obj.portrait || obj.preview || obj.icon),
      },
      HSR_KINDS,
    );
  }
  for (const skill of asObjectList(skills)) {
    if (skill.type !== "BPSkill" && skill.type !== "Ultra") continue;
    const word = String(skill.name || "").trim();
    const char = byId[String(skill.id || "").slice(0, 4)];
    const charName = String(char?.name || "").trim();
    if (!charName || word === charName || /개척자|Trailblazer/i.test(charName)) continue;
    const label = skill.type === "Ultra" ? "필살기" : "전투 스킬";
    pushClue(
      items,
      seen,
      {
        word,
        genre: "스킬명",
        hint: [`${charName}의 ${label}`, scrubHint(stripMarkup(skill.desc || skill.simple_desc), word, charName)]
          .filter(Boolean)
          .join("\n"),
        image: hsrUrl(skill.icon),
      },
      HSR_KINDS,
    );
  }
  for (const obj of asObjectList(raw.lightCones)) {
    const word = String(obj.name || "").trim();
    pushClue(
      items,
      seen,
      {
        word,
        genre: "광추",
        hint: [HSR_PATH[obj.path] || obj.path, scrubHint(stripMarkup(obj.desc), word)].filter(Boolean).join("\n") || "스타레일 광추",
        image: hsrUrl(obj.icon),
      },
      HSR_KINDS,
    );
  }
  for (const obj of asObjectList(raw.relicSets)) {
    const word = String(obj.name || "").trim();
    const desc = Array.isArray(obj.desc) ? obj.desc.join("\n") : obj.desc;
    pushClue(
      items,
      seen,
      {
        word,
        genre: "유물",
        hint: scrubHint(stripMarkup(desc), word) || "스타레일 유물 세트",
        image: hsrUrl(obj.icon),
      },
      HSR_KINDS,
    );
  }
  return { version: 1, title: "스타레일 단서", fetchedAt, kinds: HSR_KINDS, items };
}

export function buildLolBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  const ver = String(raw.version || "").trim();
  const img = (group, file) =>
    ver && file ? `${LOL_DDRAGON}/cdn/${ver}/img/${group}/${file}` : "";
  for (const champ of asObjectList(raw.champions)) {
    const word = String(champ.name || "").trim();
    const tags = (champ.tags || []).map((t) => LOL_TAG[t] || t).filter(Boolean).join(" · ");
    pushClue(
      items,
      seen,
      {
        word,
        genre: "챔피언",
        hint: [champ.title, tags, scrubHint(stripMarkup(champ.blurb || champ.lore), word)].filter(Boolean).join("\n"),
        image: img("champion", champ.image?.full || `${champ.id}.png`),
        imageReveal: champ.id ? `${LOL_DDRAGON}/cdn/img/champion/splash/${champ.id}_0.jpg` : "",
      },
      LOL_KINDS,
    );
    for (const spell of champ.spells || []) {
      const skill = String(spell.name || "").trim();
      if (!skill || skill === word) continue;
      pushClue(
        items,
        seen,
        {
          word: skill,
          genre: "스킬명",
          hint: [`${word}의 스킬`, scrubHint(stripMarkup(spell.description), skill, word)].filter(Boolean).join("\n"),
          image: img("spell", spell.image?.full),
        },
        LOL_KINDS,
      );
    }
  }
  for (const item of asObjectList(raw.items)) {
    if (item.gold && item.gold.purchasable === false) continue;
    const word = String(item.name || "").trim();
    const hint = scrubHint(stripMarkup(item.plaintext || item.description), word);
    if (!hint) continue;
    pushClue(
      items,
      seen,
      {
        word,
        genre: "아이템",
        hint,
        image: img("item", item.image?.full),
      },
      LOL_KINDS,
    );
  }
  return { version: 1, title: "롤 단서", fetchedAt, kinds: LOL_KINDS, items };
}

export function buildValorantBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const agent of asObjectList(raw.agents)) {
    if (agent.isPlayableCharacter === false) continue;
    const word = String(agent.displayName || "").trim();
    const role = agent.role?.displayName || "";
    pushClue(
      items,
      seen,
      {
        word,
        genre: "요원",
        hint: [role, scrubHint(stripMarkup(agent.description), word)].filter(Boolean).join("\n"),
        image: agent.displayIcon || "",
        imageReveal: agent.fullPortrait || agent.fullPortraitV2 || agent.displayIcon || "",
      },
      VAL_KINDS,
    );
    for (const ab of agent.abilities || []) {
      const skill = String(ab.displayName || "").trim();
      if (!skill || skill === word) continue;
      pushClue(
        items,
        seen,
        {
          word: skill,
          genre: "스킬명",
          hint: [`${word}의 스킬`, scrubHint(stripMarkup(ab.description), skill, word)].filter(Boolean).join("\n"),
          image: ab.displayIcon || "",
        },
        VAL_KINDS,
      );
    }
  }
  for (const map of asObjectList(raw.maps)) {
    const word = String(map.displayName || "").trim();
    if (/사격장|Range/i.test(word)) continue;
    const hint = scrubHint(stripMarkup(map.narrativeDescription || map.tacticalDescription), word);
    pushClue(
      items,
      seen,
      {
        word,
        genre: "맵",
        hint: hint || "발로란트 맵",
        image: map.splash || map.listViewIcon || map.displayIcon || "",
      },
      VAL_KINDS,
    );
  }
  for (const gun of asObjectList(raw.weapons)) {
    const word = String(gun.displayName || "").trim();
    if (/스킨|컬렉션/i.test(word)) continue;
    const cat = String(gun.category || "").split("::").pop();
    const catKo =
      { Heavy: "중기관", Rifle: "소총", Sniper: "스나이퍼", Shotgun: "샷건", SMG: "기관단총", Sidearm: "보조무기", Melee: "근접" }[cat] ||
      cat;
    pushClue(
      items,
      seen,
      {
        word,
        genre: "무기",
        hint: catKo ? `${catKo} 무기` : "발로란트 무기",
        image: gun.displayIcon || gun.killStreamIcon || "",
      },
      VAL_KINDS,
    );
  }
  return { version: 1, title: "발로란트 단서", fetchedAt, kinds: VAL_KINDS, items };
}

export function buildPokemonBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  const names = Array.isArray(raw.names) ? raw.names : [];
  const dex = Object.fromEntries(
    asObjectList(raw.dex).map((row) => [Number(row.id), row]),
  );
  names.forEach((name, idx) => {
    const id = idx + 1;
    const word = String(name || "").trim();
    const types = (dex[id]?.type || []).map((t) => POKE_TYPE[t] || t).filter(Boolean);
    pushClue(
      items,
      seen,
      {
        word,
        genre: "포켓몬",
        hint: [types.length ? `타입 ${types.join(" · ")}` : "", `전국 도감 ${id}번`].filter(Boolean).join("\n"),
        image: `${POKE_ART}/${id}.png`,
      },
      POKE_KINDS,
    );
  });
  return { version: 1, title: "포켓몬 단서", fetchedAt, kinds: POKE_KINDS, items };
}

export function buildBaBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const stu of asObjectList(raw.students)) {
    const released = stu.IsReleased;
    if (Array.isArray(released) && !released.some(Boolean)) continue;
    const word = String(stu.Name || stu.PersonalName || "").trim();
    const school = BA_SCHOOL[stu.School] || stu.School || "";
    const hint = [
      [school, stu.Club, stu.WeaponType].filter(Boolean).join(" · "),
      stu.Hobby ? `취미 ${stu.Hobby}` : "",
      scrubHint(stripMarkup(stu.ProfileIntroduction), word, stu.PersonalName, stu.FamilyName),
    ]
      .filter(Boolean)
      .join("\n");
    const path = String(stu.PathName || stu.DevName || "").trim();
    pushClue(
      items,
      seen,
      {
        word,
        genre: "학생",
        hint: hint || "블루 아카이브 학생",
        image: path ? `https://schaledb.com/images/student/collection/${path}.webp` : "",
      },
      BA_KINDS,
    );
  }
  return { version: 1, title: "블루아카 단서", fetchedAt, kinds: BA_KINDS, items };
}

async function fetchHsrRaw() {
  const [characters, skills, lightCones, relicSets] = await Promise.all([
    fetchJson(`${HSR_INDEX}/characters.json`),
    fetchJson(`${HSR_INDEX}/character_skills.json`),
    fetchJson(`${HSR_INDEX}/light_cones.json`),
    fetchJson(`${HSR_INDEX}/relic_sets.json`),
  ]);
  return { characters, skills, lightCones, relicSets };
}

async function fetchLolRaw() {
  const versions = await fetchJson(`${LOL_DDRAGON}/api/versions.json`);
  const version = versions[0];
  let champions = {};
  try {
    const full = await fetchJson(`${LOL_DDRAGON}/cdn/${version}/data/ko_KR/championFull.json`, {}, 28000);
    champions = full.data || {};
  } catch {
    const slim = await fetchJson(`${LOL_DDRAGON}/cdn/${version}/data/ko_KR/champion.json`);
    champions = slim.data || {};
  }
  const itemsJson = await fetchJson(`${LOL_DDRAGON}/cdn/${version}/data/ko_KR/item.json`);
  return { version, champions, items: itemsJson.data || {} };
}

async function fetchValorantRaw() {
  const [agents, maps, weapons] = await Promise.all([
    fetchJson(`${VAL_API}/agents?language=ko-KR&isPlayableCharacter=true`),
    fetchJson(`${VAL_API}/maps?language=ko-KR`),
    fetchJson(`${VAL_API}/weapons?language=ko-KR`, {}, 45000).catch(() => ({ data: [] })),
  ]);
  return { agents: agents.data || [], maps: maps.data || [], weapons: weapons.data || [] };
}

async function fetchPokemonRaw() {
  const [names, dex] = await Promise.all([fetchJson(POKE_KO), fetchJson(POKE_DEX)]);
  return { names, dex };
}

async function fetchBaRaw() {
  return { students: await fetchJson(SCHALE, {}, 28000) };
}

const hsr = makeCachedBank({
  cacheKey: "clueHsrBank:v1",
  title: "스타레일 단서",
  kinds: HSR_KINDS,
  fetchRaw: fetchHsrRaw,
  build: buildHsrBank,
});
const lol = makeCachedBank({
  cacheKey: "clueLolBank:v1",
  title: "롤 단서",
  kinds: LOL_KINDS,
  fetchRaw: fetchLolRaw,
  build: buildLolBank,
});
const valorant = makeCachedBank({
  cacheKey: "clueValBank:v1",
  title: "발로란트 단서",
  kinds: VAL_KINDS,
  fetchRaw: fetchValorantRaw,
  build: buildValorantBank,
});
const pokemon = makeCachedBank({
  cacheKey: "cluePokeBank:v1",
  title: "포켓몬 단서",
  kinds: POKE_KINDS,
  fetchRaw: fetchPokemonRaw,
  build: buildPokemonBank,
});
const ba = makeCachedBank({
  cacheKey: "clueBaBank:v1",
  title: "블루아카 단서",
  kinds: BA_KINDS,
  fetchRaw: fetchBaRaw,
  build: buildBaBank,
});

export const initHsrBank = hsr.init;
export const initLolBank = lol.init;
export const initValorantBank = valorant.init;
export const initPokemonBank = pokemon.init;
export const initBaBank = ba.init;
