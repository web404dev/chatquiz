import { CLUE_KINDS, CLUE_SILHOUETTE_KINDS, initGenshinBank, scrubHint } from "./genshin-bank.js";
import { pushClue } from "./clue-bank.js";
import {
  BA_KINDS,
  HSR_KINDS,
  LOL_KINDS,
  POKE_KINDS,
  VAL_KINDS,
  initBaBank,
  initHsrBank,
  initLolBank,
  initPokemonBank,
  initValorantBank,
} from "./game-banks.js";
import {
  DOTA_KINDS,
  FN_KINDS,
  OW_KINDS,
  PUBG_KINDS,
  TFT_KINDS,
  initDotaBank,
  initFortniteBank,
  initOwBank,
  initPubgBank,
  initTftBank,
  KART_KINDS,
  MC_KINDS,
  initKartBank,
  initMinecraftBank,
} from "./extra-game-banks.js?v=191";
import { FGO_KINDS, HS_KINDS, YGO_KINDS, initFgoBank, initHsBank, initYgoBank } from "./kr-game-banks.js";
import { LAFTEL_KINDS, initLaftelBank } from "./laftel-bank.js";
import { WEBTOON_KINDS, initWebtoonBank } from "./webtoon-bank.js";
import { MOVIE_GENRES, MOVIE_KINDS, initMovieBank } from "./movie-bank.js?v=168";

export { MOVIE_GENRES };

export const GAME_NAME_KIND = "게임이름";

const GAME_NAME_HINTS = [
  { word: "원신", hint: "호요버스 오픈월드 액션 RPG. 티바트 대륙에서 일곱 원소로 싸운다." },
  { word: "붕괴: 스타레일", hint: "우주 열차를 타고 행성을 도는 턴제 RPG. 운명의 길을 고른다." },
  { word: "리그 오브 레전드", hint: "소환사의 협곡에서 다섯 명이 넥서스를 부수는 대전형." },
  { word: "발로란트", hint: "요원 스킬이 있는 라운드제 전술 슈터. 스파이크를 설치한다." },
  { word: "포켓몬스터", hint: "몬스터를 잡아 체육관 배지를 모으는 시리즈. 피카츄로 유명하다." },
  { word: "블루 아카이브", hint: "학원 소녀들이 총으로 싸우는 모바일. 선생님과 샬레." },
  { word: "배틀그라운드", hint: "100명이 떨어져 마지막 한 명이 남는 배틀로얄." },
  { word: "오버워치 2", hint: "영웅마다 역할이 다른 팀 슈터." },
  { word: "전략적 팀 전투", hint: "라이엇의 자동 체스. 작은 전설이와 시너지 조합으로 이긴다." },
  { word: "포트나이트", hint: "폭풍이 줄어드는 섬에서 건축하며 싸우는 배틀로얄." },
  { word: "카트라이더", hint: "넥슨의 아이템전 레이스. 캐릭터가 작은 차를 타고 부스터를 쓴다." },
  { word: "마인크래프트", hint: "네모난 블록으로 세상을 짓는 샌드박스. 밤에 크리퍼가 따라온다." },
  { word: "페이트/그랜드 오더", hint: "영령을 소환해 성배를 다투는 모바일. 서번트를 키운다." },
  { word: "유희왕", hint: "몬스터 카드를 소환해 싸우는 카드 게임." },
  { word: "하스스톤", hint: "블리자드의 온라인 카드 게임. 영웅 능력과 전설 카드." },
];

export const GAME_NAME_CLUES = GAME_NAME_HINTS.map((item) => ({
  word: item.word,
  genre: GAME_NAME_KIND,
  hint: scrubHint(item.hint, item.word),
}));

export function initGameNameBank() {
  return Promise.resolve({
    version: 1,
    title: "게임이름 단서",
    fetchedAt: Date.now(),
    kinds: [GAME_NAME_KIND],
    items: GAME_NAME_CLUES.map((item) => ({ ...item })),
  });
}

function pack(id, field, label, kinds, silhouettes, init, extra = {}) {
  return { id, field, label, kinds, silhouettes, init, ...extra };
}

export const CLUE_PACKS = {
  genshin: pack("genshin", "game", "원신", CLUE_KINDS, CLUE_SILHOUETTE_KINDS, initGenshinBank),
  hsr: pack("hsr", "game", "붕괴: 스타레일", HSR_KINDS, ["캐릭터", "광추", "유물"], initHsrBank),
  lol: pack("lol", "game", "리그 오브 레전드", LOL_KINDS, ["챔피언", "아이템"], initLolBank),
  valorant: pack("valorant", "game", "발로란트", VAL_KINDS, ["요원", "무기"], initValorantBank),
  pokemon: pack("pokemon", "game", "포켓몬스터", POKE_KINDS, ["포켓몬"], initPokemonBank),
  bluearchive: pack("bluearchive", "game", "블루 아카이브", BA_KINDS, ["학생"], initBaBank),
  pubg: pack("pubg", "game", "배틀그라운드", PUBG_KINDS, ["무기", "차량"], initPubgBank),
  dota: pack("dota", "game", "도타 2", DOTA_KINDS, ["영웅", "아이템"], initDotaBank, { hidden: true }),
  overwatch: pack("overwatch", "game", "오버워치 2", OW_KINDS, ["영웅"], initOwBank),
  tft: pack("tft", "game", "전략적 팀 전투", TFT_KINDS, ["챔피언"], initTftBank),
  fortnite: pack("fortnite", "game", "포트나이트", FN_KINDS, ["스킨"], initFortniteBank),
  fgo: pack("fgo", "game", "페이트/그랜드 오더", FGO_KINDS, ["서번트"], initFgoBank),
  yugioh: pack("yugioh", "game", "유희왕", YGO_KINDS, ["카드"], initYgoBank),
  hearthstone: pack("hearthstone", "game", "하스스톤", HS_KINDS, ["카드"], initHsBank),
  titles: pack("titles", "game", "게임이름", [GAME_NAME_KIND], [], initGameNameBank),
  kartrider: pack("kartrider", "game", "카트라이더", KART_KINDS, ["캐릭터", "카트"], initKartBank),
  minecraft: pack("minecraft", "game", "마인크래프트", MC_KINDS, ["몹", "아이템"], initMinecraftBank),
  webtoon: pack("webtoon", "webtoon", "웹툰", WEBTOON_KINDS, [], initWebtoonBank),
  anime: pack("anime", "anime", "애니", LAFTEL_KINDS, [], initLaftelBank),
  movie: pack("movie", "movie", "영화", MOVIE_KINDS, ["배우", "감독", "캐릭터"], initMovieBank),
};

export function gamePacks() {
  return Object.values(CLUE_PACKS).filter((item) => item.field === "game" && !item.hidden);
}

export function allGameKinds() {
  const seen = [GAME_NAME_KIND];
  for (const item of gamePacks()) {
    for (const kind of item.kinds || []) {
      if (!seen.includes(kind)) seen.push(kind);
    }
  }
  return seen;
}

function pushGameNameClue(items, seen, item) {
  const word = String(item?.word || "").trim();
  const hint = String(item?.hint || "").trim();
  if (!word || !hint) return;
  const key = `${GAME_NAME_KIND}\0${word.replace(/\s+/g, "")}`;
  if (seen.has(key)) return;
  seen.add(key);
  items.push({ word, genre: GAME_NAME_KIND, hint });
}

export function buildAllGameBank(packResults = [], fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const { pack, bank } of packResults) {
    const series = String(pack?.label || "").trim();
    for (const item of bank?.items || []) {
      pushClue(items, seen, series && !item.series ? { ...item, series } : item);
    }
  }
  for (const clue of GAME_NAME_CLUES) pushGameNameClue(items, seen, clue);
  return {
    version: 1,
    title: "게임 전체",
    fetchedAt,
    kinds: allGameKinds(),
    items,
  };
}

export async function initAllGameBank() {
  const packs = gamePacks();
  const settled = await Promise.allSettled(packs.map((item) => item.init()));
  const packResults = packs.map((pack, index) => ({
    pack,
    bank: settled[index].status === "fulfilled" ? settled[index].value : { items: [] },
  }));
  const bank = buildAllGameBank(packResults, Date.now());
  if (!bank.items.length) throw new Error("전체 단서를 불러오지 못했습니다");
  return bank;
}

let allPackMemo = null;

export function allGamePack() {
  if (!allPackMemo) {
    allPackMemo = {
      id: "all",
      field: "game",
      label: "전체",
      kinds: allGameKinds(),
      silhouettes: [],
      init: initAllGameBank,
    };
  }
  return allPackMemo;
}

export function getCluePack(id) {
  if (id === "all") return allGamePack();
  return CLUE_PACKS[id] || allGamePack();
}
