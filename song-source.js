import {
  buildSongAliases,
  cutWikiTitle,
  foldSong,
  isArtistPageTitle,
  pickWikiSongTitle,
  songIdFrom,
  storeTitle,
} from "./song-quiz.js";
import { collectExtraTitleAliases, uniqueAliasNames } from "./song-alias.js";

export const ITUNES_COUNTRIES = ["US", "JP"];

function sleep(ms) {
  return new Promise((ok) => setTimeout(ok, ms));
}

export async function fetchJson(url, init = {}) {
  let last = "";
  const headers = {
    ...(url.includes("melon.com")
      ? {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://www.melon.com/",
          Accept: "application/json",
        }
      : {}),
    ...init.headers,
  };
  for (let i = 0; i < 4; i += 1) {
    const res = await fetch(url, { ...init, headers });
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

export function itunesLookupUrl(id, country = "US") {
  const q = new URL("https://itunes.apple.com/lookup");
  q.searchParams.set("id", String(id));
  q.searchParams.set("entity", "song");
  q.searchParams.set("country", country);
  return q.toString();
}

function foldItunes(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

export function itunesTitleHits(trackName, seed = {}) {
  const track = foldItunes(trackName);
  if (!track) return false;
  const wants = [seed.itunesTitle, seed.titleKo].map(foldItunes).filter(Boolean);
  if (!wants.length) return false;
  return wants.some((want) => {
    if (track === want) return true;
    if (track.startsWith(`${want} `) || track.includes(` ${want} `) || track.endsWith(` ${want}`)) return true;
    return want.length >= 4 && track.includes(want);
  });
}

function artistHits(trackArtist, seed = {}) {
  const artist = foldItunes(seed.itunesArtist || seed.artistKo);
  if (!artist) return true;
  const a = foldItunes(trackArtist);
  if (!a) return false;
  const compact = a.replace(/\s+/g, "");
  const artistCompact = artist.replace(/\s+/g, "");
  return a.includes(artist) || artist.includes(a) || compact.includes(artistCompact) || artistCompact.includes(compact);
}

export function pickItunesTrack(results = [], seed = {}) {
  const rows = (results || []).filter((row) => String(row?.previewUrl || "").startsWith("http"));
  if (!rows.length) return null;
  return rows.find((row) => artistHits(row.artistName, seed) && itunesTitleHits(row.trackName, seed)) || null;
}

export async function lookupItunesTrack(id, getJson = fetchJson, countries = ITUNES_COUNTRIES) {
  const tid = Number(id) || 0;
  if (!tid) return null;
  for (const country of countries) {
    const data = await getJson(itunesLookupUrl(tid, country));
    const track = (data?.results || []).find(
      (row) => Number(row.trackId) === tid && String(row.previewUrl || "").startsWith("http"),
    );
    if (track) return { track, country };
  }
  return null;
}

export async function searchItunes(seed, getJson = fetchJson) {
  const artist = seed.itunesArtist || seed.artistKo;
  const titles = [...new Set([seed.titleKo, seed.itunesTitle].filter(Boolean))];
  for (const title of titles) {
    const term = [artist, title].filter(Boolean).join(" ");
    for (const country of ITUNES_COUNTRIES) {
      const data = await getJson(itunesSearchUrl(term, country));
      const track = pickItunesTrack(data?.results, seed);
      if (track) return { track, country };
    }
  }
  return null;
}

export async function resolveItunesTrack(seed, getJson = fetchJson) {
  const locked = Number(seed.itunesTrackId) || 0;
  if (locked) {
    const first = seed.itunesCountry;
    const countries = first
      ? [first, ...ITUNES_COUNTRIES.filter((country) => country !== first)]
      : ITUNES_COUNTRIES;
    return lookupItunesTrack(locked, getJson, countries);
  }
  return searchItunes(seed, getJson);
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
  const hit = await resolveItunesTrack(seed, getJson);
  if (!hit) return null;
  const { track, country } = hit;
  const artistKo = String(seed.artistKo || "").trim();
  const finalTitle = storeTitle(seed.titleKo) || storeTitle(track.trackName);
  if (!artistKo || !finalTitle) return null;
  const extraTitles = await collectExtraTitleAliases({ ...seed, titleKo: finalTitle }, track, getJson);
  const titleAliases = uniqueAliasNames([track.trackName, ...extraTitles], finalTitle, {
    ...seed,
    titleKo: finalTitle,
    itunesTitle: seed.itunesTitle || track.trackName,
    itunesArtist: seed.itunesArtist || track.artistName,
    trackName: track.trackName,
  });
  const artistAliases = [track.artistName].filter((name) => foldSong(name) && foldSong(name) !== foldSong(artistKo));
  return {
    id: seed.id || songIdFrom(artistKo, finalTitle),
    artistKo,
    titleKo: finalTitle,
    aliases: [...new Set([...buildSongAliases({
      artistKo,
      titleKo: finalTitle,
      itunesArtist: track.artistName,
      itunesTitle: track.trackName,
    }), ...titleAliases])],
    artistAliases,
    titleAliases,
    genres: Array.isArray(seed.genres) ? [...new Set(seed.genres.map((name) => String(name || "").trim()).filter(Boolean))] : [],
    itunesTrackId: Number(track.trackId) || 0,
    previewUrl: String(track.previewUrl || ""),
    itunesCountry: country,
  };
}
