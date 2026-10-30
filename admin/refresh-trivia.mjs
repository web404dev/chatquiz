import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assignTriviaLevels,
  cityDisplayName,
  countryDisplayName,
  currencyDisplayName,
  hangulNames,
  hasHangul,
  isTrivialAnswer,
  objectParticle,
  personAliases,
  TRIVIA_ELEMENT_EXTRA,
  TRIVIA_ELEMENT_MAX,
  TRIVIA_GENRES,
  wordAliases,
} from "../trivia-bank.js";

// 상식 퀴즈: 위키데이터 질의(키 없음)로 수도·화폐·원소 기호·명화·문학 문제를 만든다. 명화는 그림 주소만 둔다(파일은 받지 않음).
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "trivia.json");
const excludePath = join(root, "trivia-exclude.json");
const SPARQL = "https://query.wikidata.org/sparql";
const KOWIKI = "https://ko.wikipedia.org/w/api.php";
const UA = "chatquiz-trivia/1.0 (https://web404dev.github.io/chatquiz/)";
/** 잘 알려진 나라만: 위키 문서 수가 많은 순으로 이만큼. */
const COUNTRY_LIMIT = 110;
/** 유로를 쓰는 나라는 많아서 잘 알려진 몇 나라만 화폐 문제로 낸다. */
const EURO_LIMIT = 4;
const PAINTING_MIN_LINKS = 30;
const BOOK_MIN_LINKS = 45;
const KOREAN_BOOK_MIN_LINKS = 5;
const MIN_ITEMS = 60;

const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function sparql(query) {
  const url = `${SPARQL}?format=json&query=${encodeURIComponent(query)}`;
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/sparql-results+json" } });
    if (res.status === 429 || res.status === 503) {
      await pause(15000 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`sparql ${res.status}`);
    const rows = (await res.json()).results?.bindings || [];
    await pause(1500);
    return rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v.value])));
  }
  throw new Error("sparql 429");
}

const qid = (uri) => String(uri || "").split("/").pop();
const split = (text) => String(text || "").split("|").filter(Boolean);

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function commonsUrl(uri) {
  const file = decodeURIComponent(String(uri || "").split("/Special:FilePath/")[1] || "");
  return file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1280` : "";
}

/** 지금 있는 나라(해체된 나라 제외)와 수도. 수도가 하나인 나라만 수도 문제로 낸다. */
async function countries() {
  const rows = await sparql(`SELECT ?c ?cL (GROUP_CONCAT(DISTINCT ?cA; separator="|") AS ?cAs) ?n
    (GROUP_CONCAT(DISTINCT CONCAT(STR(?cap), "~", ?capL); separator="|") AS ?caps) WHERE {
    ?c wdt:P31 wd:Q6256; wikibase:sitelinks ?n.
    FILTER NOT EXISTS { ?c wdt:P576 ?end }
    ?c rdfs:label ?cL. FILTER(LANG(?cL) = "ko")
    OPTIONAL { ?c skos:altLabel ?cA. FILTER(LANG(?cA) = "ko") }
    OPTIONAL { ?c wdt:P36 ?cap. ?cap rdfs:label ?capL. FILTER(LANG(?capL) = "ko") }
  } GROUP BY ?c ?cL ?n ORDER BY DESC(?n)`);
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const id = qid(row.c);
    if (seen.has(id)) continue;
    seen.add(id);
    const alts = split(row.cAs);
    const name = countryDisplayName(row.cL, alts);
    if (!hasHangul(name)) continue;
    const caps = split(row.caps).map((pair) => {
      const [uri, label] = pair.split("~");
      return { id: qid(uri), label };
    });
    out.push({ id, name, names: [...new Set([row.cL, name, ...hangulNames(alts)])], links: Number(row.n) || 0, caps });
  }
  return out.slice(0, COUNTRY_LIMIT);
}

async function capitalAlts(ids) {
  if (!ids.length) return new Map();
  const rows = await sparql(`SELECT ?x (GROUP_CONCAT(DISTINCT ?a; separator="|") AS ?as) WHERE {
    VALUES ?x { ${ids.map((id) => `wd:${id}`).join(" ")} }
    OPTIONAL { ?x skos:altLabel ?a. FILTER(LANG(?a) = "ko") }
  } GROUP BY ?x`);
  return new Map(rows.map((row) => [qid(row.x), split(row.as)]));
}

async function capitalQuestions(list) {
  const single = list.filter((c) => c.caps.length === 1 && hasHangul(c.caps[0].label));
  const alts = await capitalAlts(single.map((c) => c.caps[0].id));
  return single.map((c) => {
    const cap = c.caps[0];
    const capAlts = alts.get(cap.id) || [];
    const word = cityDisplayName(cap.label, capAlts);
    if (isTrivialAnswer(c.name, word)) return null;
    return {
      key: `capital:${c.id}`,
      ids: [c.id, cap.id],
      genre: "수도",
      question: `「${c.name}」의 수도는?`,
      word,
      aliases: [...new Set([...hangulNames([cap.label, ...capAlts]), ...wordAliases(word)])].filter((name) => name !== word),
      source: "위키데이터",
    };
  }).filter(Boolean);
}

async function currencyQuestions(list) {
  const byId = new Map(list.map((c) => [c.id, c]));
  const rows = await sparql(`SELECT ?c (GROUP_CONCAT(DISTINCT CONCAT(STR(?cur), "~", ?curL); separator="|") AS ?curs)
    (GROUP_CONCAT(DISTINCT ?curA; separator="|") AS ?curAs) WHERE {
    VALUES ?c { ${list.map((c) => `wd:${c.id}`).join(" ")} }
    ?c wdt:P38 ?cur. ?cur rdfs:label ?curL. FILTER(LANG(?curL) = "ko")
    OPTIONAL { ?cur skos:altLabel ?curA. FILTER(LANG(?curA) = "ko") }
  } GROUP BY ?c`);
  const out = [];
  let euro = 0;
  for (const row of rows.sort((a, b) => (byId.get(qid(b.c))?.links || 0) - (byId.get(qid(a.c))?.links || 0))) {
    const c = byId.get(qid(row.c));
    const curs = split(row.curs);
    if (!c || curs.length !== 1) continue;
    const [curUri, label] = curs[0].split("~");
    if (!hasHangul(label)) continue;
    if (label === "유로" && (euro += 1) > EURO_LIMIT) continue;
    const word = currencyDisplayName(label, c.names);
    if (/[A-Za-z]/.test(word)) continue;
    out.push({
      key: `currency:${c.id}`,
      ids: [c.id, qid(curUri)],
      genre: "화폐",
      question: `「${c.name}」의 화폐 단위는?`,
      word,
      // 「렌민비 위안」 같은 다른 이름의 낱말(「위안」)도 받는다.
      aliases: [...new Set([...hangulNames([label, ...split(row.curAs)]), ...[label, ...split(row.curAs)].flatMap(wordAliases)])].filter(
        (name) => name !== word,
      ),
      source: "위키데이터",
    });
  }
  return out;
}

async function elementQuestions() {
  const rows = await sparql(`SELECT ?e ?eL (GROUP_CONCAT(DISTINCT ?eA; separator="|") AS ?eAs) ?sym ?num WHERE {
    ?e wdt:P31 wd:Q11344; wdt:P246 ?sym; wdt:P1086 ?num.
    ?e rdfs:label ?eL. FILTER(LANG(?eL) = "ko")
    OPTIONAL { ?e skos:altLabel ?eA. FILTER(LANG(?eA) = "ko") }
  } GROUP BY ?e ?eL ?sym ?num`);
  const seen = new Set();
  const out = [];
  for (const row of rows.sort((a, b) => Number(a.num) - Number(b.num))) {
    const num = Math.round(Number(row.num));
    if (!(num <= TRIVIA_ELEMENT_MAX || TRIVIA_ELEMENT_EXTRA.includes(num)) || seen.has(num) || !hasHangul(row.eL)) continue;
    if (!/^[A-Z][a-z]?$/.test(row.sym)) continue;
    seen.add(num);
    out.push({
      key: `element:${num}`,
      ids: [qid(row.e)],
      genre: "원소",
      question: `원소 기호 「${row.sym}」는 무슨 원소일까요?`,
      word: row.eL,
      aliases: hangulNames(split(row.eAs)).filter((name) => name !== row.eL),
      source: "위키데이터",
    });
  }
  return out;
}

async function paintingQuestions() {
  const rows = await sparql(`SELECT ?p ?pL ?a ?aL (GROUP_CONCAT(DISTINCT ?aA; separator="|") AS ?aAs) (SAMPLE(?img) AS ?image) ?n WHERE {
    ?p wdt:P31 wd:Q3305213; wdt:P170 ?a; wikibase:sitelinks ?n. FILTER(?n >= ${PAINTING_MIN_LINKS})
    ?a wdt:P31 wd:Q5.
    ?p rdfs:label ?pL. FILTER(LANG(?pL) = "ko")
    ?a rdfs:label ?aL. FILTER(LANG(?aL) = "ko")
    OPTIONAL { ?a skos:altLabel ?aA. FILTER(LANG(?aA) = "ko") }
    OPTIONAL { ?p wdt:P18 ?img }
  } GROUP BY ?p ?pL ?a ?aL ?n ORDER BY DESC(?n)`);
  return workQuestions(rows, { kind: "painting", genre: "명화", ask: (title) => `「${title}」${objectParticle(title)} 그린 화가는?`, image: true });
}

/** 종교 경전·정치 선언문은 빼고, 저자가 한 사람인 작품만. 한국 소설은 위키 문서 수가 적어서 따로 받는다. */
async function bookQuestions() {
  const religious = "FILTER NOT EXISTS { ?w wdt:P31/wdt:P279* wd:Q179461 } FILTER NOT EXISTS { ?w wdt:P136 wd:Q179461 }";
  const world = await sparql(`SELECT ?w ?wL ?a ?aL (GROUP_CONCAT(DISTINCT ?aA; separator="|") AS ?aAs) ?n WHERE {
    ?w wdt:P31 wd:Q7725634; wdt:P50 ?a; wikibase:sitelinks ?n. FILTER(?n >= ${BOOK_MIN_LINKS})
    ?a wdt:P31 wd:Q5.
    ${religious}
    ?w rdfs:label ?wL. FILTER(LANG(?wL) = "ko")
    ?a rdfs:label ?aL. FILTER(LANG(?aL) = "ko")
    OPTIONAL { ?a skos:altLabel ?aA. FILTER(LANG(?aA) = "ko") }
  } GROUP BY ?w ?wL ?a ?aL ?n ORDER BY DESC(?n)`);
  const korean = await sparql(`SELECT ?w ?wL ?a ?aL (GROUP_CONCAT(DISTINCT ?aA; separator="|") AS ?aAs) ?n WHERE {
    VALUES ?t { wd:Q7725634 wd:Q8261 wd:Q47461344 }
    ?w wdt:P31 ?t; wdt:P50 ?a; wikibase:sitelinks ?n. FILTER(?n >= ${KOREAN_BOOK_MIN_LINKS})
    ?a wdt:P27 wd:Q884; wdt:P31 wd:Q5.
    ${religious}
    ?w rdfs:label ?wL. FILTER(LANG(?wL) = "ko")
    ?a rdfs:label ?aL. FILTER(LANG(?aL) = "ko")
    OPTIONAL { ?a skos:altLabel ?aA. FILTER(LANG(?aA) = "ko") }
  } GROUP BY ?w ?wL ?a ?aL ?n ORDER BY DESC(?n)`);
  return workQuestions([...world, ...korean].map((row) => ({ ...row, p: row.w, pL: row.wL })), {
    kind: "book",
    genre: "문학",
    ask: (title) => `「${title}」${objectParticle(title)} 쓴 작가는?`,
  });
}

/**
 * 작품 → 만든 사람. 만든 사람이 둘 이상인 작품(공저)과, 제목이 같은데 만든 사람이 다른 작품(비너스의 탄생)은 답이 하나가 아니라 뺀다.
 * 종교 경전 분류가 없는 경전(복음서·서간)은 제목으로 뺀다.
 */
const SCRIPTURE_TITLE = /(복음서|서간|팔복|사도행전|창세기|토라|코란|꾸란|베다)/;

function workQuestions(rows, { kind, genre, ask, image = false }) {
  const makers = new Map();
  const titleMakers = new Map();
  for (const row of rows) {
    const id = qid(row.p);
    if (!makers.has(id)) makers.set(id, new Set());
    makers.get(id).add(qid(row.a));
    if (!titleMakers.has(row.pL)) titleMakers.set(row.pL, new Set());
    titleMakers.get(row.pL).add(qid(row.a));
  }
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const id = qid(row.p);
    if (seen.has(id) || makers.get(id).size !== 1 || titleMakers.get(row.pL).size !== 1 || !hasHangul(row.pL) || !hasHangul(row.aL)) continue;
    if (SCRIPTURE_TITLE.test(row.pL) || /\d{4}년 \d+월 \d+일\./.test(row.pL)) continue;
    seen.add(id);
    out.push({
      key: `${kind}:${id}`,
      ids: [id, qid(row.a)],
      genre,
      subject: row.pL,
      question: ask(row.pL),
      word: row.aL,
      aliases: personAliases(row.aL, split(row.aAs)),
      ...(image && row.image ? { image: commonsUrl(row.image) } : {}),
      source: "위키데이터",
    });
  }
  return out;
}

/** 위키데이터 항목 → 한국어 위키백과 문서 제목. */
async function koTitles(ids) {
  const titles = new Map();
  const list = [...new Set(ids)];
  for (let i = 0; i < list.length; i += 200) {
    const rows = await sparql(`SELECT ?x ?t WHERE {
      VALUES ?x { ${list.slice(i, i + 200).map((id) => `wd:${id}`).join(" ")} }
      ?art schema:about ?x; schema:isPartOf <https://ko.wikipedia.org/>; schema:name ?t.
    }`);
    for (const row of rows) titles.set(qid(row.x), row.t);
  }
  return titles;
}

/** 한국어 위키백과 최근 60일 조회수(50개씩, 이어받기까지). */
async function koViews(titles) {
  const views = new Map();
  const list = [...new Set(titles)];
  for (let i = 0; i < list.length; i += 50) {
    let next = {};
    for (let guard = 0; guard < 20; guard += 1) {
      const url = new URL(KOWIKI);
      url.search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", prop: "pageviews", pvipdays: "60", titles: list.slice(i, i + 50).join("|"), ...next }).toString();
      const res = await fetch(url, { headers: { "user-agent": UA } });
      if (res.status === 429 || res.status === 503) {
        await pause(10000);
        continue;
      }
      const data = await res.json();
      for (const page of data.query?.pages || []) {
        const sum = Object.values(page.pageviews || {}).reduce((total, n) => total + (Number(n) || 0), 0);
        views.set(page.title, (views.get(page.title) || 0) + sum);
      }
      await pause(300);
      if (!data.continue) break;
      next = data.continue;
    }
  }
  return views;
}

/** 문제 점수: 문제 속 항목들(나라·수도, 그림·화가) 중 한국에서 덜 찾아보는 쪽의 조회수. 한국어 문서가 없으면 0. */
async function scoreQuestions(items) {
  const titles = await koTitles(items.flatMap((row) => row.ids || []));
  const views = await koViews([...titles.values()]);
  return items.map((row) => {
    const counts = (row.ids || []).map((id) => views.get(titles.get(id)) || 0);
    const { ids, ...rest } = row;
    return { ...rest, score: counts.length ? Math.min(...counts) : 0 };
  });
}

async function main() {
  const previous = await readJson(outPath, {});
  const exclude = await readJson(excludePath, {});
  const skip = new Set(Array.isArray(exclude.keys) ? exclude.keys : []);
  const skipWords = new Set(Array.isArray(exclude.questions) ? exclude.questions : []);
  const skipTitles = new Set(Array.isArray(exclude.titles) ? exclude.titles : []);
  const list = await countries();
  const groups = [
    await capitalQuestions(list),
    await currencyQuestions(list),
    await elementQuestions(),
    await paintingQuestions(),
    await bookQuestions(),
  ];
  const picked = groups.flat().filter((row) => !skip.has(row.key) && !skipWords.has(row.question) && !skipTitles.has(row.subject));
  // 한국에서 덜 찾아보는 아래쪽은 빼고, 남은 것을 쉬움·어려움으로 나눈다.
  const items = assignTriviaLevels(await scoreQuestions(picked));
  if (items.length < MIN_ITEMS) throw new Error(`문제 ${items.length}개뿐이라 기존 파일을 유지합니다 (지난번 ${previous.items?.length || 0})`);
  const out = {
    version: 1,
    fetchedAt: Date.now(),
    title: "상식 퀴즈 (위키데이터 수도·화폐·원소 기호·명화·문학, 난이도는 한국어 위키백과 조회수)",
    note: "문제는 위키데이터(CC0)에서 틀로 만든다. 명화 그림은 위키미디어 공용 주소만 둔다. 빼고 싶은 문제는 trivia-exclude.json 의 titles(명화·문학 제목)·questions(문제 문장)·keys 에 적고 다시 갱신한다.",
    genres: TRIVIA_GENRES,
    items,
  };
  await writeFile(outPath, `${JSON.stringify(out, null, 1)}\n`);
  const byGenre = TRIVIA_GENRES.map((genre) => {
    const rows = items.filter((row) => row.genre === genre);
    return `${genre} ${rows.length}(쉬움 ${rows.filter((row) => row.level === "쉬움").length})`;
  }).join(" · ");
  console.log(`상식 ${items.length}개 (${byGenre}) → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
