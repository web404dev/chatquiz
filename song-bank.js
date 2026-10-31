import { filterSongs, pickPlayableSongs, pickSong } from "./song-quiz.js";

let cache = null;

export async function loadSongs() {
  if (cache) return cache;
  const res = await fetch(new URL("./songs.json?v=6", import.meta.url));
  if (!res.ok) throw new Error("songs.json을 못 읽음");
  cache = pickPlayableSongs(await res.json());
  return cache;
}

export async function takeSong(used = new Set(), genres) {
  return pickSong(await loadSongs(), used, genres);
}

export function takeSongSync(used = new Set(), genres) {
  if (!cache?.length) throw new Error("들을 노래가 없습니다");
  return pickSong(cache, used, genres);
}

/** 불러온 노래 전체(세 곡 모드가 고르기·붙여넣기 검사에 쓴다). */
export function allSongsSync() {
  return cache || [];
}

export function songCount(genres) {
  return filterSongs(cache || [], genres).length;
}
