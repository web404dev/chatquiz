import {
  buildSongAliases,
  cutWikiTitle,
  foldSong,
  isArtistPageTitle,
  pickWikiSongTitle,
  songIdFrom,
  storeTitle,
} from "./song-quiz.js";

export const ITUNES_COUNTRIES = ["US", "JP"];

function sleep(ms) {
  return new Promise((ok) => setTimeout(ok, ms));
}

export async function fetchJson(url, init = {}) {
  let last = "";
  for (let i = 0; i < 4; i += 1) {
    const res = await fetch(url, init);
    if (res.status === 429) {
      last = `429 ${url}`;
      await sleep(1200 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }
  throw new Error(last || `429 ${url}`);
}

export function itunesSearchUrl(term, country) {
  const q = new URL("https://itunes.apple.com/search");
  q.searchParams.set("term", term);
  q.searchParams.set("entity", "song");
  q.searchParams.set("country", country);
  q.searchParams.set("limit", "8");
  return q.toString();
}

export function pickItunesTrack(results = [], seed = {}) {
  const rows = (results || []).filter((row) => String(row?.previewUrl || "").startsWith("http"));
  if (!rows.length) return null;
  const artist = String(seed.itunesArtist || seed.artistKo || "").toLowerCase();
  const title = String(seed.itunesTitle || seed.titleKo || "").toLowerCase();
  return (
    rows.find((row) => {
      const a = String(row.artistName || "").toLowerCase();
      const t = String(row.trackName || "").toLowerCase();
      return (!artist || a.includes(artist) || artist.includes(a)) && (!title || t.includes(title) || title.includes(t));
    }) || rows[0]
  );
}

export async function searchItunes(seed, getJson = fetchJson) {
  const term = [seed.itunesArtist || seed.artistKo, seed.itunesTitle || seed.titleKo].filter(Boolean).join(" ");
  for (const country of ITUNES_COUNTRIES) {
    const data = await getJson(itunesSearchUrl(term, country));
    const track = pickItunesTrack(data?.results, seed);
    if (track) return { track, country };
  }
  return null;
}

export function wikiSearchUrl(query) {
  const q = new URL("https://en.wikipedia.org/w/api.php");
  q.searchParams.set("action", "query");
  q.searchParams.set("list", "search");
  q.searchParams.set("srsearch", query);
  q.searchParams.set("srlimit", "8");
  q.searchParams.set("format", "json");
  q.searchParams.set("origin", "*");
  return q.toString();
}

export function wikiLanglinkUrl(title) {
  const q = new URL("https://en.wikipedia.org/w/api.php");
  q.searchParams.set("action", "query");
  q.searchParams.set("prop", "langlinks");
  q.searchParams.set("lllang", "ko");
  q.searchParams.set("titles", title);
  q.searchParams.set("format", "json");
  q.searchParams.set("origin", "*");
  return q.toString();
}

export function koTitleFromLanglinks(data) {
  const pages = data?.query?.pages || {};
  for (const page of Object.values(pages)) {
    const ko = page?.langlinks?.[0]?.["*"];
    if (ko && !isArtistPageTitle(ko)) return cutWikiTitle(ko);
  }
  return "";
}

export async function lookupKoTitle(track, getJson = fetchJson) {
  const trackName = String(track.trackName || "").trim();
  const artistName = String(track.artistName || "").trim();
  if (!trackName) return "";
  const query = `${trackName} ${artistName} song`.trim();
  const search = await getJson(wikiSearchUrl(query));
  const enTitle = pickWikiSongTitle(search?.query?.search, trackName);
  if (!enTitle) return "";
  const links = await getJson(wikiLanglinkUrl(enTitle));
  return koTitleFromLanglinks(links);
}

export async function composeSong(seed, getJson = fetchJson) {
  const hit = await searchItunes(seed, getJson);
  if (!hit) return null;
  const { track, country } = hit;
  const wikiTitle = await lookupKoTitle(track, getJson).catch(() => "");
  const artistKo = String(seed.artistKo || "").trim();
  const keepEnglish = /[A-Za-z]/.test(String(seed.titleKo || "")) && !/[가-힣]/.test(String(seed.titleKo || ""));
  const finalTitle = keepEnglish
    ? storeTitle(seed.titleKo)
    : storeTitle(wikiTitle || seed.titleKo || track.trackName);
  return {
    id: seed.id || songIdFrom(artistKo, finalTitle),
    artistKo,
    titleKo: finalTitle,
    aliases: buildSongAliases({
      artistKo,
      titleKo: finalTitle,
      itunesArtist: track.artistName,
      itunesTitle: track.trackName,
    }),
    artistAliases: [track.artistName].filter((name) => foldSong(name) && foldSong(name) !== foldSong(artistKo)),
    titleAliases: [track.trackName].filter((name) => foldSong(name) && foldSong(name) !== foldSong(finalTitle)),
    genres: Array.isArray(seed.genres) ? [...new Set(seed.genres.map((name) => String(name || "").trim()).filter(Boolean))] : [],
    itunesTrackId: Number(track.trackId) || 0,
    previewUrl: String(track.previewUrl || ""),
    itunesCountry: country,
  };
}
