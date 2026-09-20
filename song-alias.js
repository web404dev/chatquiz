import { cutWikiTitle, foldSong, pickWikiSongTitle, storeTitle } from "./song-quiz.js";

export function melonKeywordUrl(query) {
  const q = new URL("https://www.melon.com/search/keyword/index.json");
  q.searchParams.set("query", query);
  return q.toString();
}

export function wikidataEntityUrl(enTitle) {
  const q = new URL("https://www.wikidata.org/w/api.php");
  q.searchParams.set("action", "wbgetentities");
  q.searchParams.set("sites", "enwiki");
  q.searchParams.set("titles", enTitle);
  q.searchParams.set("props", "labels|aliases");
  q.searchParams.set("languages", "ko");
  q.searchParams.set("format", "json");
  q.searchParams.set("origin", "*");
  return q.toString();
}

export function koNamesFromWikidata(data) {
  const out = [];
  for (const ent of Object.values(data?.entities || {})) {
    if (!ent || ent.missing) continue;
    const label = ent.labels?.ko?.value;
    if (label) out.push(label);
    for (const row of ent.aliases?.ko || []) {
      if (row?.value) out.push(row.value);
    }
  }
  return out;
}

const WORD_HANGUL = {
  attention: "어텐션",
  dynamite: "다이너마이트",
  super: "슈퍼",
  shy: "샤이",
  how: "하우",
  you: "유",
  like: "라이크",
  that: "댓",
  cheer: "치어",
  up: "업",
  tell: "텔",
  me: "미",
  love: "러브",
  dive: "다이브",
  next: "넥스트",
  level: "레벨",
  rising: "라이징",
  sun: "선",
  right: "라이트",
  gods: "갓츠",
  god: "갓",
  menu: "메뉴",
  rainism: "레이니즘",
  seven: "세븐",
  solo: "솔로",
  meteor: "메테오",
  fly: "플라이",
  beautiful: "뷰티풀",
  instagram: "인스타그램",
  shape: "셰이프",
  of: "오브",
  blinding: "블라인딩",
  lights: "라이츠",
  uptown: "업타운",
  funk: "펑크",
  shake: "셰이크",
  off: "오프",
  rolling: "롤링",
  in: "인",
  the: "더",
  deep: "딥",
  bad: "배드",
  guy: "가이",
  romance: "로맨스",
  dancing: "댄싱",
  queen: "퀸",
  bohemian: "보헤미안",
  rhapsody: "랩소디",
  billie: "빌리",
  jean: "진",
  hey: "헤이",
  jude: "주드",
  always: "올웨이즈",
  plastic: "플라스틱",
  christmas: "크리스마스",
  eve: "이브",
  first: "퍼스트",
  pretender: "프리텐더",
  lemon: "레몬",
  kick: "킥",
  back: "백",
  stay: "스테이",
  with: "위드",
  let: "렛",
  it: "잇",
  go: "고",
  wake: "웨이크",
  this: "디스",
  what: "왓",
  came: "케임",
  for: "포",
  tomboy: "톰보이",
  antifragile: "안티프래자일",
  gee: "지",
  tt: "티티",
  dont: "돈",
  care: "케어",
  i: "아이",
};

const CLUSTERS = [
  ["tion", "션"],
  ["sion", "전"],
  ["ture", "쳐"],
  ["ight", "이트"],
  ["ough", "우"],
  ["augh", "오"],
  ["eer", "이어"],
  ["air", "에어"],
  ["our", "아워"],
  ["ow", "오우"],
  ["ou", "아우"],
  ["oi", "오이"],
  ["oy", "오이"],
  ["oo", "우"],
  ["ee", "이"],
  ["ea", "이"],
  ["ai", "에이"],
  ["ay", "에이"],
  ["oa", "오"],
  ["au", "오"],
  ["aw", "오"],
  ["ew", "유"],
  ["ar", "아"],
  ["er", "어"],
  ["ir", "어"],
  ["ur", "어"],
  ["or", "오"],
  ["ch", "치"],
  ["sh", "시"],
  ["th", "스"],
  ["ph", "프"],
  ["wh", "워"],
  ["ck", "크"],
  ["ng", "잉"],
  ["qu", "쿠"],
];

const LETTERS = {
  a: "아",
  b: "브",
  c: "크",
  d: "드",
  e: "에",
  f: "프",
  g: "그",
  h: "흐",
  i: "이",
  j: "지",
  k: "크",
  l: "ㄹ",
  m: "므",
  n: "느",
  o: "오",
  p: "프",
  q: "크",
  r: "르",
  s: "스",
  t: "트",
  u: "우",
  v: "브",
  w: "우",
  x: "엑스",
  y: "이",
  z: "즈",
};

function transliterateWord(word) {
  let rest = word;
  let out = "";
  while (rest) {
    const hit = CLUSTERS.find(([from]) => rest.startsWith(from));
    if (hit) {
      out += hit[1];
      rest = rest.slice(hit[0].length);
      continue;
    }
    out += LETTERS[rest[0]] || "";
    rest = rest.slice(1);
  }
  return out;
}

export function latinToHangul(text) {
  const words = String(text || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return words.map((word) => WORD_HANGUL[word] || transliterateWord(word)).join("");
}

export function hangulTitleCandidates(title) {
  const cut = cutWikiTitle(title);
  if (!cut || !/[A-Za-z]/.test(cut) || /[가-힣]/.test(cut)) return [];
  const joined = latinToHangul(cut);
  const spaced = String(cut)
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => WORD_HANGUL[word] || transliterateWord(word))
    .join(" ");
  return [...new Set([joined, spaced].filter((item) => foldSong(item).length >= 3))];
}

function foldedWants(values) {
  return values.map((text) => foldSong(cutWikiTitle(text))).filter((item) => item.length >= 2);
}

function exactHits(name, wants) {
  const got = foldSong(cutWikiTitle(name));
  if (!got || got.length < 2 || !wants.length) return false;
  return wants.some((want) => got === want);
}

function aliasSeed(seed = {}, track = {}) {
  return {
    artistKo: seed.artistKo,
    itunesArtist: seed.itunesArtist || track.artistName,
    artistName: seed.artistName || track.artistName,
    artistAliases: seed.artistAliases || [],
    titleKo: seed.titleKo || track.trackName,
    itunesTitle: seed.itunesTitle || track.trackName,
    trackName: track.trackName || seed.itunesTitle,
  };
}

export function isSafeTitleAlias(name, seed = {}) {
  const raw = storeTitle(cutWikiTitle(name));
  const fold = foldSong(raw);
  if (!fold || fold.length < 2) return false;
  if (/\(.*노래\)$/.test(String(name || "").trim())) return false;
  if (/인기가요|모음|앨범|생방송/.test(raw)) return false;
  const artists = foldedWants([seed.artistKo, seed.itunesArtist, seed.artistName, ...(seed.artistAliases || [])]);
  if (artists.includes(fold)) return false;
  const titles = [seed.titleKo, seed.itunesTitle, seed.trackName].filter(Boolean);
  if (foldedWants(titles).includes(fold)) return true;
  return titles.some((title) => hangulTitleCandidates(title).some((item) => foldSong(item) === fold));
}

export function pickMelonSong(results = [], seed = {}) {
  const rows = Array.isArray(results) ? results : [];
  const artists = foldedWants([seed.itunesArtist, seed.artistKo, seed.artistName]);
  const titles = foldedWants([seed.itunesTitle, seed.titleKo, seed.trackName]);
  return rows.find((row) => exactHits(row.ARTISTNAME || row.artistName, artists) && exactHits(row.SONGNAME || row.songName, titles)) || null;
}

export function uniqueAliasNames(names, titleKo, seed = {}) {
  const title = foldSong(titleKo);
  const out = [];
  const seen = new Set();
  const check = seed.titleKo || seed.itunesTitle || seed.trackName;
  for (const name of names || []) {
    const raw = storeTitle(cutWikiTitle(name));
    const fold = foldSong(raw);
    if (!fold || fold === title || seen.has(fold)) continue;
    if (check && !isSafeTitleAlias(name, { ...seed, titleKo })) continue;
    seen.add(fold);
    out.push(raw);
  }
  return out;
}

export async function collectExtraTitleAliases(seed, track = {}, getJson) {
  const extras = [...(seed.titleAliases || [])];
  const title = seed.titleKo || track.trackName;
  const artist = seed.itunesArtist || seed.artistKo;
  const matchSeed = aliasSeed(seed, track);
  const latinTitles = [seed.itunesTitle, track.trackName, title].filter((item) => /[A-Za-z]/.test(item || ""));

  if (typeof getJson !== "function") return uniqueAliasNames(extras, title, matchSeed);

  for (const query of [...new Set(latinTitles.flatMap((item) => hangulTitleCandidates(item)))]) {
    try {
      const data = await getJson(melonKeywordUrl(query));
      if (pickMelonSong(data?.SONGCONTENTS, matchSeed)) extras.push(query);
    } catch {
      // Melon is unofficial; a miss must not drop the song.
    }
  }

  if (artist && title) {
    try {
      const wiki = await getJson(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${title} ${artist} song`)}&srlimit=5&format=json&origin=*`,
      );
      const enTitle = pickWikiSongTitle(wiki?.query?.search, [title, seed.itunesTitle, track.trackName]);
      if (enTitle) {
        const wikiData = await getJson(wikidataEntityUrl(enTitle));
        extras.push(...koNamesFromWikidata(wikiData).filter((name) => isSafeTitleAlias(name, matchSeed)));
      }
    } catch {
      // keep going
    }
  }

  return uniqueAliasNames(extras, title, matchSeed);
}
