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
} from "./extra-game-banks.js";
import { MANGA_GENRES, MANGA_KINDS, initMangaBank } from "./manga-bank.js?v=164";
import { MOVIE_GENRES, MOVIE_KINDS, initMovieBank } from "./movie-bank.js?v=165";

export { MANGA_GENRES, MOVIE_GENRES };

export const GAME_NAME_KIND = "게임이름";

const GAME_NAME_HINTS = [
  { word: "원신", hint: "호요버스 오픈월드 액션 RPG. 티바트 대륙에서 일곱 원소로 싸운다." },
  { word: "스타레일", hint: "우주 열차를 타고 행성을 도는 턴제 RPG. 운명의 길을 고른다." },
  { word: "롤", hint: "소환사의 협곡에서 다섯 명이 넥서스를 부수는 대전형." },
  { word: "발로란트", hint: "요원 스킬이 있는 라운드제 전술 슈터. 스파이크를 설치한다." },
  { word: "포켓몬", hint: "몬스터를 잡아 체육관 배지를 모으는 시리즈. 피카츄로 유명하다." },
  { word: "블루아카", hint: "학원 소녀들이 총으로 싸우는 모바일. 선생님과 샬레." },
  { word: "배틀그라운드", hint: "100명이 떨어져 마지막 한 명이 남는 배틀로얄." },
  { word: "도타2", hint: "밸브의 5대5 공성전. 고대 수호자를 부순다." },
  { word: "오버워치", hint: "영웅마다 역할이 다른 6대6 팀 슈터." },
  { word: "롤토체스", hint: "라이엇의 자동 체스. 작은 전설이와 시너지 조합으로 이긴다." },
  { word: "포트나이트", hint: "폭풍이 줄어드는 섬에서 건축하며 싸우는 배틀로얄." },
];

export const GAME_NAME_CLUES = GAME_NAME_HINTS.map((item) => ({
  word: item.word,
  genre: GAME_NAME_KIND,
  hint: scrubHint(item.hint, item.word),
}));

function pack(id, field, label, kinds, silhouettes, init) {
  return { id, field, label, kinds, silhouettes, init };
}

export const CLUE_PACKS = {
  genshin: pack("genshin", "game", "원신", CLUE_KINDS, CLUE_SILHOUETTE_KINDS, initGenshinBank),
  hsr: pack("hsr", "game", "스타레일", HSR_KINDS, ["캐릭터", "광추", "유물"], initHsrBank),
  lol: pack("lol", "game", "롤", LOL_KINDS, ["챔피언", "아이템"], initLolBank),
  valorant: pack("valorant", "game", "발로란트", VAL_KINDS, ["요원", "무기"], initValorantBank),
  pokemon: pack("pokemon", "game", "포켓몬", POKE_KINDS, ["포켓몬"], initPokemonBank),
  bluearchive: pack("bluearchive", "game", "블루아카", BA_KINDS, ["학생"], initBaBank),
  pubg: pack("pubg", "game", "배틀그라운드", PUBG_KINDS, ["무기", "차량"], initPubgBank),
  dota: pack("dota", "game", "도타2", DOTA_KINDS, ["영웅", "아이템"], initDotaBank),
  overwatch: pack("overwatch", "game", "오버워치", OW_KINDS, ["영웅"], initOwBank),
  tft: pack("tft", "game", "TFT", TFT_KINDS, ["챔피언"], initTftBank),
  fortnite: pack("fortnite", "game", "포트나이트", FN_KINDS, ["스킨"], initFortniteBank),
  manga: pack("manga", "manga", "만화", MANGA_KINDS, ["캐릭터"], initMangaBank),
  movie: pack("movie", "movie", "영화", MOVIE_KINDS, ["배우", "감독", "캐릭터"], initMovieBank),
};

export function gamePacks() {
  return Object.values(CLUE_PACKS).filter((item) => item.field === "game");
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
  return CLUE_PACKS[id] || CLUE_PACKS.genshin;
}
