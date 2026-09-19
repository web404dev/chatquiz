import { CLUE_KINDS, CLUE_SILHOUETTE_KINDS, initGenshinBank } from "./genshin-bank.js";
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

export function getCluePack(id) {
  return CLUE_PACKS[id] || CLUE_PACKS.genshin;
}
