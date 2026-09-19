import { isPlayableName, scrubHint } from "./genshin-bank.js";
import { fetchJson, makeCachedBank, pushClue } from "./clue-bank.js";
import { MOVIE_CURATED } from "./movie-curated.js";

export const MOVIE_KINDS = ["영화이름", "배우", "감독", "캐릭터", "명대사", "장소", "시리즈"];
export const MOVIE_GENRES = [
  "액션",
  "코미디",
  "드라마",
  "로맨스",
  "스릴러",
  "SF",
  "호러",
  "범죄",
  "판타지",
  "애니메이션",
  "전쟁",
  "음악",
  "미스터리",
  "모험",
  "히어로",
  "재난",
  "스포츠",
  "역사",
  "전기",
  "가족",
  "서부",
  "스파이",
  "무협",
  "청춘",
  "좀비",
];

const WD_API = "https://www.wikidata.org/w/api.php";
const WD_SPARQL = "https://query.wikidata.org/sparql";
const KO_WIKI = "https://ko.wikipedia.org/w/api.php";
const WORKER = "https://chzzk-chat-quiz.web404dev.workers.dev";

const GENRE_Q = {
  Q188473: "액션",
  Q157443: "코미디",
  Q130232: "드라마",
  Q860626: "로맨스",
  Q182015: "스릴러",
  Q2484376: "스릴러",
  Q471839: "SF",
  Q200092: "호러",
  Q7444358: "범죄",
  Q959790: "범죄",
  Q496523: "범죄",
  Q157394: "판타지",
  Q202866: "애니메이션",
  Q369747: "전쟁",
  Q842256: "음악",
  Q319221: "모험",
  Q1200678: "미스터리",
  Q20443008: "코미디",
  Q1054574: "로맨스",
  Q846544: "재난",
  Q846046: "재난",
  Q1339864: "스포츠",
  Q17013749: "역사",
  Q645928: "전기",
  Q1361932: "가족",
  Q172980: "서부",
  Q1535153: "히어로",
  Q2297927: "스파이",
  Q1033891: "무협",
  Q1146335: "청춘",
  Q3072049: "좀비",
};

const GENRE_ALIAS = {
  어드벤처: "모험",
  모험영화: "모험",
  "과학 소설": "SF",
  공상과학: "SF",
  공상과학영화: "SF",
  슈퍼히어로: "히어로",
  히어로영화: "히어로",
  서부극: "서부",
  무술: "무협",
  무협영화: "무협",
  전기물: "전기",
  스파이영화: "스파이",
  좀비영화: "좀비",
  재난영화: "재난",
  가족영화: "가족",
};

const FILM_TYPE = new Set(["Q11424", "Q24869", "Q202866", "Q29168811", "Q229390", "Q25110269"]);

const SEED_IDS = [
  "Q61448040",
  "Q44578",
  "Q47703",
  "Q172241",
  "Q163872",
  "Q25188",
  "Q13417189",
  "Q275416",
  "Q23780914",
  "Q738304",
  "Q182718",
  "Q83495",
  "Q192047",
  "Q127367",
  "Q155241",
  "Q482719",
  "Q496177",
  "Q482598",
  "Q625680",
  "Q20741037",
  "Q55639284",
  "Q15270634",
  "Q19824761",
  "Q23999685",
  "Q39071900",
  "Q116213928",
  "Q123511564",
  "Q65979430",
  "Q108868506",
  "Q115478040",
  "Q13424450",
  "Q193138",
  "Q116813",
];

const SPARQL = {
  oscar: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P166 wd:Q102427. } LIMIT 90`,
  cannes: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P166 wd:Q179808. } LIMIT 70`,
  korea: `SELECT DISTINCT ?item WHERE {
    ?item wdt:P31 wd:Q11424 ; wdt:P495 wd:Q884 ; wdt:P166 ?award ; wdt:P577 ?d .
    FILTER(YEAR(?d) >= 1990 && YEAR(?d) <= 2025)
    ?w schema:about ?item ; schema:isPartOf <https://ko.wikipedia.org/> .
  } LIMIT 70`,
  mcu: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P179 wd:Q642878. } LIMIT 40`,
  ghibli: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P272 wd:Q179718. } LIMIT 35`,
  pixar: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P272 wd:Q127552. } LIMIT 30`,
  disney: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P272 wd:Q221526. } LIMIT 25`,
  potter: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P179 wd:Q216930. } LIMIT 12`,
  starwars: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P179 wd:Q462. } LIMIT 16`,
  lotr: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P179 wd:Q190050. } LIMIT 8`,
  dceu: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P179 wd:Q182547. } LIMIT 20`,
  berlin: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P166 wd:Q154590. } LIMIT 30`,
  venice: `SELECT DISTINCT ?item WHERE { ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P166 wd:Q209459. } LIMIT 30`,
  auteurs: `SELECT DISTINCT ?item WHERE {
    ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P57 ?dir .
    VALUES ?dir { wd:Q41159 wd:Q315484 wd:Q483367 wd:Q6962448 wd:Q25191 wd:Q53407 wd:Q42574 wd:Q495588 wd:Q16177722 }
  } LIMIT 70`,
  horror: `SELECT DISTINCT ?item WHERE {
    ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P136/wdt:P279* wd:Q200092 ; wdt:P577 ?d .
    FILTER(YEAR(?d) >= 1960 && YEAR(?d) <= 2026)
    ?w schema:about ?item ; schema:isPartOf <https://ko.wikipedia.org/> .
  } LIMIT 80`,
  zombie: `SELECT DISTINCT ?item WHERE {
    ?item wdt:P31/wdt:P279* wd:Q11424 ; wdt:P136 wd:Q3072049 .
    ?w schema:about ?item ; schema:isPartOf <https://ko.wikipedia.org/> .
  } LIMIT 25`,
};

function claimIds(entity, prop) {
  return (entity?.claims?.[prop] || [])
    .map((row) => row?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);
}

function claimYear(entity) {
  const time = entity?.claims?.P577?.[0]?.mainsnak?.datavalue?.value?.time;
  const match = String(time || "").match(/(-?\d{4})/);
  return match ? Number(match[1]) : 0;
}

function claimFile(entity) {
  const name = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  return name ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=400` : "";
}

function koLabel(entity) {
  return String(entity?.labels?.ko?.value || "").trim();
}

function koDesc(entity) {
  return String(entity?.descriptions?.ko?.value || "").trim();
}

function isFilmEntity(entity) {
  const types = claimIds(entity, "P31");
  if (types.some((id) => id === "Q5398426" || id === "Q15416" || id === "Q1344")) return false;
  return !types.length || types.some((id) => FILM_TYPE.has(id));
}

function normalizeGenreName(label) {
  const raw = String(label || "")
    .replace(/\s*영화\s*$/g, "")
    .replace(/\s+/g, "")
    .trim();
  return GENRE_ALIAS[raw] || GENRE_ALIAS[String(label || "").trim()] || String(label || "").replace(/\s*영화\s*$/g, "").trim();
}

function mapGenres(ids, byId) {
  const out = [];
  for (const id of ids) {
    const mapped = GENRE_Q[id] || normalizeGenreName(koLabel(byId[id]));
    if (MOVIE_GENRES.includes(mapped) && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

function chunks(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export function buildMovieBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const film of raw.films || []) {
    const title = String(film.title || "").replace(/\s*\(영화\)\s*$/, "").trim();
    const year = Number(film.year) || 0;
    const genres = Array.isArray(film.genres) ? film.genres.filter((g) => MOVIE_GENRES.includes(g)) : [];
    const director = String(film.director || "").trim();
    const extract = scrubHint(String(film.extract || film.description || ""), title, director, ...(film.cast || []));
    const meta = [year ? `${year}년` : "", genres.join(" · "), director ? `감독 ${director}` : ""].filter(Boolean).join(" · ");
    const image = String(film.image || "").trim();
    pushClue(
      items,
      seen,
      {
        word: title,
        genre: "영화이름",
        hint: [meta, extract].filter(Boolean).join("\n") || "영화 제목",
        image,
        year,
        mediaGenres: genres,
        series: title,
      },
      MOVIE_KINDS,
    );
    if (isPlayableName(director)) {
      pushClue(
        items,
        seen,
        {
          word: director,
          genre: "감독",
          hint: [title ? `「${title}」 감독` : "", meta, extract].filter(Boolean).join("\n"),
          image,
          year,
          mediaGenres: genres,
          series: title,
        },
        MOVIE_KINDS,
      );
    }
    for (const actor of film.cast || []) {
      const word = String(actor || "").trim();
      if (!isPlayableName(word) || word === title || word === director) continue;
      pushClue(
        items,
        seen,
        {
          word,
          genre: "배우",
          hint: [title ? `「${title}」 출연` : "", meta, scrubHint(extract, word)].filter(Boolean).join("\n"),
          year,
          mediaGenres: genres,
          series: title,
        },
        MOVIE_KINDS,
      );
    }
    for (const character of film.characters || []) {
      const word = String(character || "").trim();
      if (!isPlayableName(word) || word === title) continue;
      pushClue(
        items,
        seen,
        {
          word,
          genre: "캐릭터",
          hint: title ? `「${title}」 캐릭터` : "영화 캐릭터",
          year,
          mediaGenres: genres,
          series: title,
        },
        MOVIE_KINDS,
      );
    }
    for (const seriesName of film.seriesNames || []) {
      const word = String(seriesName || "").replace(/\s*영화 시리즈\s*$/, "").trim();
      if (!isPlayableName(word) || word === title) continue;
      pushClue(
        items,
        seen,
        {
          word,
          genre: "시리즈",
          hint: title ? `「${title}」이 속한 시리즈` : "영화 시리즈",
          year,
          mediaGenres: genres,
          series: word,
        },
        MOVIE_KINDS,
      );
    }
  }
  for (const extra of raw.curated || MOVIE_CURATED) {
    pushClue(
      items,
      seen,
      {
        ...extra,
        hint: extra.hint || extra.series || extra.genre,
        year: extra.year || 0,
        mediaGenres: extra.mediaGenres || [],
      },
      MOVIE_KINDS,
    );
  }
  return { version: 1, title: "영화 단서", fetchedAt, kinds: MOVIE_KINDS, items };
}

async function fetchSparql(name, query) {
  try {
    const json = await fetchJson(`${WORKER}/movie?q=${encodeURIComponent(name)}`, {}, 12000);
    const rows = json?.results?.bindings || json?.ids;
    if (Array.isArray(rows) && rows.length) return json;
  } catch {
    // worker 미배포면 직접
  }
  return fetchJson(
    `${WD_SPARQL}?query=${encodeURIComponent(query)}`,
    { headers: { accept: "application/sparql-results+json" } },
    20000,
  );
}

function qidsFromSparql(json) {
  if (Array.isArray(json?.ids)) return json.ids;
  return (json?.results?.bindings || [])
    .map((row) => String(row.item?.value || "").split("/").pop())
    .filter((id) => /^Q\d+$/.test(id));
}

async function fetchEntities(ids) {
  const out = {};
  for (const part of chunks([...new Set(ids)].filter(Boolean), 32)) {
    const url =
      `${WD_API}?action=wbgetentities&ids=${part.join("|")}` +
      `&props=labels|descriptions|claims|sitelinks&languages=ko&format=json&origin=*`;
    const json = await fetchJson(url, {}, 20000);
    Object.assign(out, json.entities || {});
  }
  return out;
}

async function fetchWikiPages(titles) {
  const out = {};
  const clean = [...new Set(titles.filter(Boolean))];
  for (const part of chunks(clean, 40)) {
    const url =
      `${KO_WIKI}?action=query&format=json&origin=*&prop=extracts|pageimages` +
      `&exintro=1&explaintext=1&exchars=240&piprop=thumbnail&pithumbsize=400` +
      `&titles=${part.map((t) => encodeURIComponent(t)).join("|")}`;
    try {
      const json = await fetchJson(url, {}, 16000);
      for (const page of Object.values(json.query?.pages || {})) {
        if (!page?.title) continue;
        out[page.title] = {
          extract: String(page.extract || "").replace(/\s+/g, " ").trim(),
          image: page.thumbnail?.source || "",
        };
      }
    } catch {
      // ignore page batch
    }
  }
  return out;
}

async function fetchSparqlWave(names) {
  const bags = await Promise.all(
    names.map(async (name) => {
      try {
        return qidsFromSparql(await fetchSparql(name, SPARQL[name]));
      } catch {
        return [];
      }
    }),
  );
  return bags.flat();
}

export async function fetchMovieRaw() {
  const ids = new Set(SEED_IDS);
  const names = Object.keys(SPARQL);
  for (const id of await fetchSparqlWave(names.slice(0, 7))) ids.add(id);
  for (const id of await fetchSparqlWave(names.slice(7))) ids.add(id);
  const filmsWd = await fetchEntities([...ids]);
  const extraIds = [];
  for (const entity of Object.values(filmsWd)) {
    if (!isFilmEntity(entity)) continue;
    extraIds.push(...claimIds(entity, "P57"));
    extraIds.push(...claimIds(entity, "P161").slice(0, 5));
    extraIds.push(...claimIds(entity, "P136"));
    extraIds.push(...claimIds(entity, "P674").slice(0, 4));
    extraIds.push(...claimIds(entity, "P179").slice(0, 2));
  }
  const people = await fetchEntities([...new Set(extraIds)].slice(0, 400));
  const byId = { ...filmsWd, ...people };
  const wikiTitles = Object.values(filmsWd)
    .map((entity) => entity?.sitelinks?.kowiki?.title)
    .filter(Boolean);
  const wiki = await fetchWikiPages(wikiTitles);
  const films = [];
  for (const entity of Object.values(filmsWd)) {
    if (!entity || entity.missing || !isFilmEntity(entity)) continue;
    const title = koLabel(entity);
    if (!isPlayableName(title)) continue;
    const wikiPage = wiki[entity.sitelinks?.kowiki?.title] || {};
    const directors = claimIds(entity, "P57").map((id) => koLabel(byId[id])).filter(isPlayableName);
    const cast = claimIds(entity, "P161")
      .slice(0, 5)
      .map((id) => koLabel(byId[id]))
      .filter(isPlayableName);
    const characters = claimIds(entity, "P674")
      .slice(0, 6)
      .map((id) => koLabel(byId[id]))
      .filter(isPlayableName);
    const seriesNames = claimIds(entity, "P179")
      .slice(0, 2)
      .map((id) => koLabel(byId[id]))
      .filter(isPlayableName);
    films.push({
      title,
      year: claimYear(entity),
      genres: mapGenres(claimIds(entity, "P136"), byId),
      director: directors[0] || "",
      cast,
      characters,
      seriesNames,
      extract: wikiPage.extract || koDesc(entity),
      image: wikiPage.image || claimFile(entity),
    });
  }
  return { films, curated: MOVIE_CURATED };
}

const movie = makeCachedBank({
  cacheKey: "clueMovieBank:v3",
  title: "영화 단서",
  kinds: MOVIE_KINDS,
  fetchRaw: fetchMovieRaw,
  build: buildMovieBank,
});

export const initMovieBank = movie.init;
