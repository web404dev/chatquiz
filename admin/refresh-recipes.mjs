import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDishIntro, makeRecipeEntry, RECIPE_GENRES, RECIPE_POPULAR_CATEGORY, RECIPE_ROOTS, recipeAnswerOfTitle } from "../recipe-bank.js";

// 레시피 퀴즈: 위키백과 한국어판 요리 분류에서 문서를 모아, 최근 60일 많이 본 순으로 대중 요리를 고른다.
// 장르는 첫 문장·문서 분류의 나라 이름으로 정한다(재료별 분류를 타고 들어온 외국 요리가 한식이 되지 않게).
// 첫 문단(재료·만드는 법)과 대표 사진 주소만 저장한다. 사진 파일은 받지 않는다. 글은 위키백과(CC BY-SA)이고 화면에 출처를 적는다.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "recipes.json");
const excludePath = join(root, "recipe-exclude.json");
const API = "https://ko.wikipedia.org/w/api.php";
const UA = "chatquiz-recipes/1.0 (https://web404dev.github.io/chatquiz/)";
const PAUSE_MS = 300;
const DEPTH = 2;
/** 많이 본 순으로 이만큼만 첫 문단을 받아 본다. */
const CANDIDATES = 2000;
/** 최근 60일 조회수가 이보다 적은 요리는 뺀다. 대중적인지는 recipe-exclude.json 으로 한 번 더 거른다. */
const MIN_VIEWS = 100;
const LIMIT = 600;
const MIN_ITEMS = 40;
/** 음식이 아닌 하위 분류(음식점·음료·조미료·사람·책·역사 등)는 내려가지 않는다. */
const SKIP_CATEGORY =
  /(음식점|식당|음료|술|주류|조미료|양념|소스|요리사|연구가|인물|책|상표|브랜드|기업|회사|박물관|축제|틀|토막글|목록|역사|문화|용어|포털|작품|채널|단체|법|정책|발효|젓갈|장아찌|치즈|와인|맥주|커피|교육|학교|프랜차이즈|고대|황실|에도|아이누|고구려|조선|민주주의)/;

const pause = (ms = PAUSE_MS) => new Promise((ok) => setTimeout(ok, ms));

async function api(params) {
  const url = new URL(API);
  url.search = new URLSearchParams({ format: "json", formatversion: "2", ...params }).toString();
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (res.status === 429 || res.status === 503) {
      await pause(10000 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`wikipedia ${res.status}`);
    return res.json();
  }
  throw new Error("wikipedia 429");
}

/** continue 가 있으면 끝까지 받아 pages 를 제목별로 합친다. */
async function queryPages(params) {
  const pages = new Map();
  let next = {};
  for (let guard = 0; guard < 20; guard += 1) {
    const data = await api({ action: "query", ...params, ...next });
    await pause();
    for (const page of data.query?.pages || []) {
      const prev = pages.get(page.title) || {};
      pages.set(page.title, {
        ...prev,
        ...page,
        redirects: [...(prev.redirects || []), ...(page.redirects || [])],
        categories: [...(prev.categories || []), ...(page.categories || [])],
        pageviews: { ...(prev.pageviews || {}), ...(page.pageviews || {}) },
      });
    }
    if (!data.continue) break;
    next = data.continue;
  }
  return pages;
}

async function categoryMembers(title) {
  const out = [];
  let next = {};
  for (let guard = 0; guard < 20; guard += 1) {
    const data = await api({ action: "query", list: "categorymembers", cmtitle: title, cmlimit: "500", cmtype: "page|subcat", ...next });
    await pause();
    out.push(...(data.query?.categorymembers || []));
    if (!data.continue) break;
    next = data.continue;
  }
  return out;
}

function chunks(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function collectPages() {
  const genreOf = new Map();
  const seenCats = new Set();
  for (const [name, genre] of RECIPE_ROOTS) {
    let level = [`분류:${name}`];
    for (let depth = 0; depth <= DEPTH && level.length; depth += 1) {
      const nextLevel = [];
      for (const cat of level) {
        if (seenCats.has(cat)) continue;
        seenCats.add(cat);
        for (const row of await categoryMembers(cat)) {
          if (row.ns === 0 && !genreOf.has(row.title)) genreOf.set(row.title, genre);
          if (row.ns === 14 && !SKIP_CATEGORY.test(row.title.replace(/^분류:/, ""))) nextLevel.push(row.title);
        }
      }
      level = nextLevel;
    }
    console.log(`${name} → 지금까지 문서 ${genreOf.size}`);
  }
  return genreOf;
}

/** 분류 모으기 → 조회수 → 많이 본 문서의 첫 문단·사진·넘겨주기·분류. */
async function fetchRaw() {
  // 1) 요리 분류 → 문서(모은 분류의 기본 장르)
  const genreOf = await collectPages();

  // 2) 최근 60일 조회수(50개씩)
  const views = new Map();
  for (const part of chunks([...genreOf.keys()], 50)) {
    const pages = await queryPages({ prop: "pageviews", pvipdays: "60", titles: part.join("|") });
    for (const page of pages.values()) {
      views.set(page.title, Object.values(page.pageviews || {}).reduce((sum, n) => sum + (Number(n) || 0), 0));
    }
  }
  const ranked = [...genreOf.keys()].sort((a, b) => (views.get(b) || 0) - (views.get(a) || 0)).slice(0, CANDIDATES);

  // 3) 첫 문단·대표 사진·다른 이름(넘겨주기)·분류·동음이의 여부(20개씩)
  const raw = [];
  for (const part of chunks(ranked, 20)) {
    const pages = await queryPages({
      prop: "extracts|pageimages|redirects|pageprops|categories",
      exintro: "1",
      explaintext: "1",
      exlimit: "20",
      piprop: "thumbnail",
      pithumbsize: "800",
      rdprop: "title",
      rdnamespace: "0",
      rdlimit: "max",
      ppprop: "disambiguation",
      clshow: "!hidden",
      cllimit: "max",
      titles: part.join("|"),
    });
    for (const page of pages.values()) {
      if (page.missing || page.pageprops?.disambiguation !== undefined) continue;
      raw.push({
        title: page.title,
        extract: page.extract || "",
        image: page.thumbnail?.source || "",
        genre: genreOf.get(page.title),
        categories: (page.categories || []).map((row) => row.title),
        redirects: (page.redirects || []).map((row) => row.title),
        views: views.get(page.title) || 0,
      });
    }
  }
  return raw;
}

/** 첫 문단에 재료가 모자란 음식 문서만 본문 전체를 받는다(본문은 한 번에 한 문서씩만 받을 수 있다). 받은 게 있으면 true. */
async function addBodies(raw) {
  let added = 0;
  for (const page of raw) {
    if (page.body !== undefined || makeRecipeEntry(page)) continue;
    if (!recipeAnswerOfTitle(page.title) || !isDishIntro(page.extract, page.categories)) continue;
    const data = await api({ action: "query", prop: "extracts", explaintext: "1", titles: page.title });
    await pause();
    page.body = String(data.query?.pages?.[0]?.extract || "").slice(0, 20000);
    added += 1;
  }
  if (added) console.log(`첫 문단 재료가 모자라 본문을 받은 문서 ${added}`);
  return added > 0;
}

async function main() {
  const previous = await readJson(outPath, {});
  const exclude = await readJson(excludePath, {});
  const skip = new Set(Array.isArray(exclude.words) ? exclude.words : []);
  const genreFix = exclude.genres && typeof exclude.genres === "object" ? exclude.genres : {};

  // 받은 문서를 RECIPES_RAW 파일에 남겨 두면, 다음엔 다시 받지 않고 거르는 규칙만 바꿔 볼 수 있다(관리 화면 갱신에는 쓰지 않음).
  const rawPath = process.env.RECIPES_RAW || "";
  let raw = rawPath ? await readJson(rawPath, null) : null;
  if (!raw) {
    raw = await fetchRaw();
    if (rawPath) await writeFile(rawPath, JSON.stringify(raw));
  }
  // 첫 문단에 재료가 3개 안 되면(불고기·타코 등) 본문의 만드는 법 문장에서 재료를 더 찾는다.
  if ((await addBodies(raw)) && rawPath) await writeFile(rawPath, JSON.stringify(raw));

  const byWord = new Map();
  const dropped = [];
  for (const page of raw) {
    const entry = makeRecipeEntry(page);
    if (!entry) {
      dropped.push(page.title);
      continue;
    }
    if (skip.has(entry.word) || entry.views < MIN_VIEWS) continue;
    if (genreFix[entry.word]) entry.genre = genreFix[entry.word];
    const before = byWord.get(entry.word);
    if (!before || before.views < entry.views) byWord.set(entry.word, entry);
  }
  // 국민 음식(나라마다 널리 먹는 음식)은 3배, 한식은 한국 시청자에게 익숙해서 2배로 쳐 대중적인 요리가 앞에 오게 한다.
  const popular = new Set(raw.filter((page) => (page.categories || []).includes(RECIPE_POPULAR_CATEGORY)).map((page) => page.title));
  const rank = (row) => row.views * (popular.has(row.page) ? 3 : 1) * (row.genre === "한식" ? 2 : 1);
  const items = [...byWord.values()].sort((a, b) => rank(b) - rank(a)).slice(0, LIMIT);
  console.log(`못 쓴 문서 ${dropped.length} (음식 설명이 아니거나 재료가 3개 미만·사진 없음)`);
  if (items.length < MIN_ITEMS) throw new Error(`요리 ${items.length}개뿐이라 기존 파일을 유지합니다 (지난번 ${previous.items?.length || 0})`);
  const out = {
    version: 1,
    fetchedAt: Date.now(),
    title: "레시피 퀴즈 (위키백과 한국어판 요리 문서 첫 문단)",
    note: "글은 위키백과 한국어판(CC BY-SA 4.0) 문서 첫 문단이며 정답 이름만 ○○ 로 가렸다. 사진은 주소만 둔다. 빼고 싶은 요리는 recipe-exclude.json words 에 적고 다시 갱신한다.",
    genres: RECIPE_GENRES,
    items,
  };
  await writeFile(outPath, `${JSON.stringify(out, null, 1)}\n`);
  const byGenre = RECIPE_GENRES.map((genre) => `${genre} ${items.filter((row) => row.genre === genre).length}`).join(" · ");
  console.log(`레시피 ${items.length}개 (${byGenre}) → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
