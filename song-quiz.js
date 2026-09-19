import { normalizeAnswer } from "./quiz.js";

export function foldSong(text) {
  return normalizeAnswer(text);
}

export function cutWikiTitle(title) {
  return String(title || "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function storeTitle(text) {
  const cut = cutWikiTitle(text);
  if (!cut) return "";
  if (/[가-힣]/.test(cut) && !/[A-Za-z]/.test(cut)) return cut.replace(/\s+/g, "");
  return cut;
}

export function isArtistPageTitle(title) {
  return /\((entertainer|singer|rapper|band|group|musician|actress|actor)\)/i.test(String(title || ""));
}

export function isSongPageTitle(title, trackName = "") {
  const raw = String(title || "");
  if (isArtistPageTitle(raw)) return false;
  if (/\bsong\b/i.test(raw)) return true;
  const track = cutWikiTitle(trackName);
  if (track && raw.toLowerCase().includes(track.toLowerCase()) && raw !== track) return true;
  return false;
}

export function pickWikiSongTitle(results = [], trackName = "") {
  const rows = (results || []).map((row) => String(row?.title || "").trim()).filter(Boolean);
  return rows.find((title) => isSongPageTitle(title, trackName)) || rows.find((title) => !isArtistPageTitle(title)) || "";
}

function needles(primary, extras = []) {
  return [...new Set([primary, ...extras].map(foldSong).filter((item) => item.length >= 1))];
}

function leftoverBucket(name) {
  return /\s/.test(String(name || "").trim()) ? "title" : "artist";
}

export function songNeedles(song = {}) {
  const artist = foldSong(song.artistKo);
  const title = foldSong(song.titleKo);
  const artistExtra = [...(song.artistAliases || [])];
  const titleExtra = [...(song.titleAliases || [])];
  for (const name of song.aliases || []) {
    const fold = foldSong(name);
    if (!fold) continue;
    if (fold === artist || fold.includes(artist) || artist.includes(fold)) artistExtra.push(name);
    else if (fold === title || fold.includes(title) || title.includes(fold)) titleExtra.push(name);
    else if (leftoverBucket(name) === "title") titleExtra.push(name);
    else artistExtra.push(name);
  }
  return {
    artists: needles(song.artistKo, artistExtra),
    titles: needles(song.titleKo, titleExtra),
  };
}

export const LISTEN_ANSWER_MODES = ["all", "artist", "title", "both"];
export const LISTEN_ANSWER_ROUNDS = ["artist", "title", "both"];

export function normalizeListenAnswerMode(mode) {
  return LISTEN_ANSWER_MODES.includes(mode) ? mode : "title";
}

export function listenAnswerModeLabel(mode) {
  if (mode === "artist") return "가수";
  if (mode === "both") return "가수 + 노래 제목";
  if (mode === "all") return "전체";
  return "노래 제목";
}

export function pickListenAnswerMode(selected = "title", rng = Math.random) {
  const mode = normalizeListenAnswerMode(selected);
  if (mode !== "all") return mode;
  return LISTEN_ANSWER_ROUNDS[Math.floor(Number(rng()) * LISTEN_ANSWER_ROUNDS.length)] || "title";
}

export function listenAnswerPrompt(mode) {
  if (mode === "artist") return "노래를 듣고 가수를 치세요";
  if (mode === "both") return "노래를 듣고 가수와 제목을 치세요";
  return "노래를 듣고 노래 제목을 치세요";
}

export function listenAnswerStatus(mode) {
  if (mode === "artist") return "듣기 · 가수를 채팅으로";
  if (mode === "both") return "듣기 · 가수와 제목을 채팅으로";
  return "듣기 · 노래 제목을 채팅으로";
}

export function isSongCorrect(guess, song, mode = "both") {
  const g = foldSong(guess);
  if (!g) return false;
  const { artists, titles } = songNeedles(song);
  const hasArtist = artists.some((item) => g.includes(item));
  const hasTitle = titles.some((item) => g.includes(item));
  if (mode === "artist") return hasArtist;
  if (mode === "title") return hasTitle;
  return hasArtist && hasTitle;
}

export function songDisplayAnswer(song = {}, mode = "both") {
  const artist = String(song.artistKo || "").trim();
  const title = String(song.titleKo || "").trim();
  if (mode === "artist") return artist;
  if (mode === "title") return title;
  return `${artist} ${title}`.replace(/\s+/g, " ").trim();
}

export function songIdFrom(artistKo, titleKo) {
  return foldSong(`${artistKo}-${titleKo}`) || "song";
}

export function buildSongAliases({ artistKo, titleKo, itunesArtist = "", itunesTitle = "" } = {}) {
  const artistAliases = [itunesArtist].filter((name) => foldSong(name) && foldSong(name) !== foldSong(artistKo));
  const titleAliases = [itunesTitle, cutWikiTitle(titleKo)].filter((name) => foldSong(name) && foldSong(name) !== foldSong(titleKo));
  return [...new Set([...artistAliases, ...titleAliases, artistKo, titleKo])];
}

export function playableSong(row) {
  const artistKo = String(row?.artistKo || "").trim();
  const titleKo = storeTitle(row?.titleKo || "");
  const previewUrl = String(row?.previewUrl || "").trim();
  if (!artistKo || !titleKo || !previewUrl) return null;
  return {
    id: String(row.id || songIdFrom(artistKo, titleKo)),
    artistKo,
    titleKo,
    aliases: Array.isArray(row.aliases) ? row.aliases.map((name) => String(name || "").trim()).filter(Boolean) : [],
    artistAliases: Array.isArray(row.artistAliases) ? row.artistAliases.map((name) => String(name || "").trim()).filter(Boolean) : [],
    titleAliases: Array.isArray(row.titleAliases) ? row.titleAliases.map((name) => String(name || "").trim()).filter(Boolean) : [],
    genres: Array.isArray(row.genres) ? [...new Set(row.genres.map((name) => String(name || "").trim()).filter(Boolean))] : [],
    itunesTrackId: Number(row.itunesTrackId) || 0,
    previewUrl,
  };
}

export function pickPlayableSongs(raw = []) {
  const items = Array.isArray(raw) ? raw : raw.items;
  return (items || []).map(playableSong).filter(Boolean);
}

export const SONG_GENRE_TREE = [
  {
    id: "kpop",
    label: "K-POP",
    icon: "💜",
    kids: [
      { id: "kpop-boy", label: "보이그룹", icon: "🕺" },
      { id: "kpop-girl", label: "걸그룹", icon: "💃" },
      { id: "kpop-coed", label: "혼성", icon: "🎤" },
      { id: "kpop-solo", label: "솔로", icon: "⭐" },
    ],
  },
  {
    id: "era",
    label: "시대",
    icon: "📅",
    kids: [
      { id: "era-7080", label: "7080", icon: "📻" },
      { id: "era-90s", label: "1990년대", icon: "📼" },
      { id: "era-00s", label: "2000년대", icon: "💿" },
      { id: "era-10s", label: "2010년대", icon: "📱" },
      { id: "era-20s", label: "2020년대", icon: "🪩" },
    ],
  },
  {
    id: "style",
    label: "스타일",
    icon: "🎶",
    kids: [
      { id: "ballad", label: "발라드", icon: "💙" },
      { id: "dance", label: "댄스", icon: "🕺" },
      { id: "hiphop", label: "힙합", icon: "🎧" },
      { id: "rnb", label: "R&B", icon: "🍷" },
      { id: "trot", label: "트로트", icon: "🎺" },
      { id: "indie", label: "인디", icon: "🌿" },
      { id: "rock", label: "록", icon: "🎸" },
      { id: "band", label: "밴드", icon: "🥁" },
      { id: "folk", label: "포크", icon: "🪕" },
      { id: "edm", label: "EDM", icon: "⚡" },
    ],
  },
  {
    id: "world",
    label: "세계",
    icon: "🌍",
    kids: [
      { id: "pop", label: "팝송", icon: "🌐" },
      { id: "oldpop", label: "올드팝", icon: "🎹" },
      { id: "citypop", label: "시티팝", icon: "🌃" },
      { id: "jpop", label: "J-POP", icon: "🌸" },
    ],
  },
  {
    id: "ost",
    label: "OST",
    icon: "🎬",
    kids: [
      { id: "ost-drama", label: "드라마 OST", icon: "📺" },
      { id: "ost-movie", label: "영화 OST", icon: "🎥" },
      { id: "ost-ani", label: "애니 OST", icon: "🎞️" },
    ],
  },
];

export function flattenSongGenres() {
  const out = [{ id: "all", label: "전체", icon: "🎲" }];
  for (const group of SONG_GENRE_TREE) {
    out.push({ id: group.id, label: group.label, icon: group.icon, group: true });
    for (const kid of group.kids || []) {
      out.push({ id: kid.id, label: kid.label, icon: kid.icon, parentId: group.id });
    }
  }
  return out;
}

export function kidsOfSongGenre(id) {
  return (SONG_GENRE_TREE.find((group) => group.id === id)?.kids || []).map((kid) => kid.id);
}

export function expandSongGenres(selected) {
  if (!selected?.length || selected.includes("all")) return null;
  const out = new Set();
  for (const id of selected) {
    out.add(id);
    for (const kid of kidsOfSongGenre(id)) out.add(kid);
  }
  return out;
}

export function songMatchesGenres(song, selected) {
  const want = expandSongGenres(selected);
  if (!want) return true;
  return (song.genres || []).some((id) => want.has(id));
}

export function filterSongs(songs, selected) {
  return (songs || []).filter((song) => songMatchesGenres(song, selected));
}

export function pickSong(songs, used = new Set(), selected) {
  const filtered = filterSongs(songs, selected);
  const fresh = filtered.filter((song) => !used.has(song.id));
  const pool = fresh.length ? fresh : filtered;
  if (!pool.length) throw new Error("선택한 장르에 들을 노래가 없습니다");
  return pool[Math.floor(Math.random() * pool.length)];
}
