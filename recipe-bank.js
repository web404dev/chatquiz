export const RECIPE_URL = "./recipes.json";

/**
 * 레시피 퀴즈: 위키백과 한국어판 요리 문서 첫 문단에서 재료와 만드는 법 문장을 뽑아, 재료부터 보여 주고 음식 이름을 맞힌다
 * (사용자 2026-10-25: "한국어로된 레시피 대중적인 요리 레시피만 보고 어떤 음식인지 맞추기", "api로 가져오면 좋을 것 같은데").
 * 본문은 고치지 않고 정답 이름만 가린다.
 */
export const RECIPE_GENRES = ["한식", "중식", "일식", "양식", "세계"];

/** 문서를 모을 분류와 기본 장르. 실제 장르는 첫 문장·문서 분류의 나라 이름으로 정하고(recipeGenreOf), 나라 이름이 없을 때만 이 장르를 쓴다. */
export const RECIPE_ROOTS = [
  // 나라마다 널리 먹는 음식(비빔밥·팟타이 등)은 나라 분류 밖에 있어서 따로 모은다. 장르는 나라 이름으로 정한다.
  ["국민 음식", "세계"],
  ["길거리 음식", "세계"],
  ["패스트 푸드", "양식"],
  ["한국식 중국 요리", "중식"],
  ["한국식 일본 요리", "일식"],
  ["한국 요리", "한식"],
  ["중국 요리", "중식"],
  ["일본 요리", "일식"],
  ["이탈리아 요리", "양식"],
  ["프랑스 요리", "양식"],
  ["미국 요리", "양식"],
  ["영국 요리", "양식"],
  ["독일 요리", "양식"],
  ["스페인 요리", "양식"],
  ["베트남 요리", "세계"],
  ["태국 요리", "세계"],
  ["인도 요리", "세계"],
  ["멕시코 요리", "세계"],
  ["튀르키예 요리", "세계"],
  ["라면", "일식"],
  ["볶음밥", "세계"],
  ["돈부리", "일식"],
  ["쌀국수 요리", "세계"],
  ["닭튀김", "양식"],
];

/** 이 분류에 든 음식은 나라마다 널리 먹는 음식이라 많이 본 순서를 정할 때 조회수를 3배로 친다. */
export const RECIPE_POPULAR_CATEGORY = "분류:국민 음식";

/** 시간이 지나면 문장 → 초성 순으로 연다. [지난 시간 비율, 연 문장 수, 초성]. 처음엔 재료만. */
export const RECIPE_STEPS = [
  [0, 0, false],
  [0.3, 1, false],
  [0.55, 2, false],
  [0.8, 2, true],
];

/** 재료는 3개 이상. 2개뿐이면 설명 문장이 2줄 이상일 때만 낸다(카레라이스·우동처럼 첫 문단이 짧은 대중 요리). */
export const RECIPE_MIN_INGREDIENTS = 2;
const RICH_INGREDIENTS = 3;
export const RECIPE_SHOW_INGREDIENTS = 8;
export const RECIPE_MAX_LINES = 3;
const LINE_MAX_CHARS = 150;
export const RECIPE_MASK = "○○";

/** 재료 낱말. 소금·설탕·물·기름처럼 어디에나 들어가는 것은 넣지 않는다. 한 글자는 뒤에 붙는 말을 좁게 봐서 다른 뜻을 덜 잡는다. */
export const RECIPE_INGREDIENTS = [
  // 곡물·면·떡·빵
  "쌀", "밥", "쌀밥", "찹쌀", "현미", "보리", "밀가루", "쌀가루", "찹쌀가루", "메밀", "메밀가루", "옥수수", "전분", "녹말", "당면",
  "국수", "소면", "쫄면", "라면", "우동", "파스타", "스파게티", "마카로니", "빵", "식빵", "빵가루", "떡", "가래떡", "밀떡", "쌀떡",
  "만두", "누룽지", "또띠아", "토르티야", "쌀국수", "오트밀",
  // 콩·두부
  "콩", "대두", "팥", "녹두", "강낭콩", "완두콩", "두부", "순두부", "연두부", "유부", "콩나물", "숙주", "숙주나물", "비지",
  // 고기
  "고기", "닭", "돼지", "오리", "돼지고기", "쇠고기", "소고기", "닭고기", "오리고기", "양고기", "염소고기", "삼겹살", "목살", "갈비", "등심", "안심",
  "사태", "양지", "닭가슴살", "닭다리", "닭발", "곱창", "막창", "대창", "내장", "선지", "사골", "소뼈", "돼지뼈", "우족",
  "햄", "소시지", "베이컨", "스팸", "런천미트",
  // 해산물·해조류
  "생선", "고등어", "꽁치", "갈치", "삼치", "조기", "굴비", "명태", "동태", "생태", "북어", "황태", "코다리", "대구", "아귀",
  "연어", "참치", "다랑어", "광어", "우럭", "도미", "장어", "붕장어", "뱀장어", "멸치", "오징어", "낙지", "문어", "주꾸미",
  "쭈꾸미", "꼴뚜기", "새우", "대하", "게", "꽃게", "대게", "랍스터", "조개", "바지락", "홍합", "굴", "전복", "소라", "꼬막",
  "가리비", "재첩", "다슬기", "해삼", "멍게", "어묵", "맛살", "게맛살", "날치알", "명란", "명란젓", "해산물", "어패류",
  "김", "미역", "다시마", "파래", "매생이", "톳",
  // 채소·버섯
  "채소", "야채", "배추", "양배추", "무", "무청", "시래기", "우거지", "열무", "김치", "배추김치", "깍두기", "묵은지", "단무지",
  "시금치", "고사리", "도라지", "더덕", "취나물", "나물", "버섯", "표고버섯", "느타리버섯", "팽이버섯", "새송이버섯", "양송이버섯",
  "목이버섯", "송이버섯", "인삼", "고수", "허브", "양파", "대파", "파", "쪽파", "부추", "마늘", "생강", "고추", "풋고추", "청양고추", "꽈리고추", "홍고추",
  // 가지(채소)는 "여러 가지"와 구별이 안 돼 넣지 않는다.
  "피망", "파프리카", "당근", "감자", "고구마", "호박", "애호박", "단호박", "오이", "상추", "깻잎", "미나리", "쑥갓",
  "쑥", "냉이", "달래", "우엉", "연근", "토란", "토마토", "브로콜리", "셀러리", "아스파라거스", "양상추", "올리브", "아보카도",
  // 과일·견과
  "사과", "딸기", "바나나", "파인애플", "레몬", "라임", "귤", "오렌지", "유자", "포도", "복숭아", "키위", "망고", "블루베리",
  "체리", "건포도", "곶감", "매실", "대추", "잣", "호두", "땅콩", "아몬드", "깨", "참깨", "들깨", "코코넛",
  // 달걀·유제품
  "달걀", "계란", "메추리알", "우유", "치즈", "모차렐라", "마스카르포네", "크림치즈", "리코타", "파르메산", "버터", "생크림", "크림",
  "요구르트", "연유", "머랭",
  // 양념
  "고추장", "된장", "간장", "춘장", "쌈장", "청국장", "고춧가루", "참기름", "들기름", "식초", "꿀", "물엿", "조청", "후추",
  "케첩", "케찹", "마요네즈", "머스터드", "겨자", "고추냉이", "카레", "굴소스", "두반장", "액젓", "젓갈", "새우젓", "멸치젓",
  "육수", "미림", "맛술", "청주", "와인", "칠리소스", "토마토소스", "올리브유", "바질", "계피", "바닐라", "초콜릿", "코코아", "커피",
  "녹차", "말차", "시럽", "젤라틴", "한천", "팥소", "앙금", "단팥",
];

const SAME_INGREDIENT = { 계란: "달걀", 소고기: "쇠고기", 케찹: "케첩", 쭈꾸미: "주꾸미", 야채: "채소", 토르티야: "또띠아" };
const LOOSE_TAILS = ["", "와", "과", "을", "를", "등", "등을", "등의", "등이", "등과", "이나", "나", "도", "만", "으로", "로"];
const WIDE_TAILS = [
  ...LOOSE_TAILS,
  "은", "는", "이", "가", "에", "의", "에서", "에는", "으로는", "로는", "과의", "와의", "까지", "만으로", "이며", "이고", "이다",
  "처럼", "보다", "에다", "을만", "를만", "으로만", "로만",
];
const VOCAB = [...RECIPE_INGREDIENTS].sort((a, b) => b.length - a.length);

function hangulOnly(text) {
  return String(text ?? "").normalize("NFC").replace(/[^가-힣]/g, "");
}

/**
 * 문서 제목에서 정답 이름: "볶음밥 (한국 음식)" → "볶음밥". 한글·띄어쓰기만 남고 두 글자 이상이면 쓴다.
 * 한 글자(떡·빵)는 설명에서 가리기 어렵고, "일본 요리"·"한국의 국수" 같은 묶음 문서는 음식 하나가 아니라 뺀다.
 */
export function recipeAnswerOfTitle(title) {
  const name = String(title ?? "").normalize("NFC").replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (!/^[가-힣]+( [가-힣]+)*$/.test(name) || hangulOnly(name).length < 2) return "";
  if (/ (요리|음식)$/.test(name) || /의 /.test(name)) return "";
  return name;
}

/** 괄호(한자·외국어 표기, 괄호 안 괄호까지)와 [*] 표시를 지운다. */
export function stripRecipeAsides(text) {
  let out = String(text ?? "").normalize("NFC");
  for (let i = 0; i < 5; i += 1) {
    const next = out.replace(/\s*[(（][^()（）]*[)）]/g, "");
    if (next === out) break;
    out = next;
  }
  return out
    .replace(/\[\*\]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function splitRecipeSentences(text) {
  return String(text ?? "")
    .split(/\n+|(?<=[다요]\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** 만드는 법을 말하는 문장(넣다·볶다·끓이다…). 재료는 첫 문장과 이런 문장에서만 뽑아, 역사·비슷한 음식 이야기 속 낱말을 덜 잡는다. */
const COOKING_LINE =
  /(넣|볶|끓|굽|구워|구운|튀기|튀긴|튀겨|찌고|찐|쪄|삶|버무|만들|만든|만드|재료|섞|얹|말아|비벼|비빈|곁들|썰|양념|반죽|빚|부어|붓|절여|절인|재워|재운|무쳐|무친|싸서|싸 먹|찍어|담가|담근|조린|조려|익혀|익힌|들어간|들어가|사용|주재료|부재료)/;

function ingredientWords(text, skip) {
  const seen = new Set();
  const out = [];
  const tokens = text.split(/[\s,·、/()[\]「」『』“”"'.!?;:]+/).filter(Boolean);
  tokens.forEach((token, i) => {
    for (const word of VOCAB) {
      if (!token.startsWith(word)) continue;
      const tail = token.slice(word.length);
      if (!(word.length === 1 ? LOOSE_TAILS : WIDE_TAILS).includes(tail)) continue;
      // "조개 모양"처럼 모양을 빗댄 말은 재료가 아니다.
      if (/^모양/.test(tokens[i + 1] || "")) break;
      const key = SAME_INGREDIENT[word] || word;
      if (!seen.has(key) && !skip.has(hangulOnly(word))) {
        seen.add(key);
        out.push(word);
      }
      break;
    }
  });
  return out;
}

/**
 * 첫 문단에서 재료 낱말을 나온 순서대로 뽑는다. 정답 이름과 같은 낱말은 뺀다. 만드는 법 문장에서 3개가 안 되면 첫 문단 전체에서 찾는다.
 * strict 는 문서 본문용: 역사·문화 이야기가 길어서 만드는 법 문장에서만 찾는다.
 */
export function recipeIngredients(text, { names = [], strict = false } = {}) {
  const skip = new Set(names.map(hangulOnly).filter(Boolean));
  const sentences = splitRecipeSentences(stripRecipeAsides(text));
  const cooking = sentences.filter((line, i) => i === 0 || COOKING_LINE.test(line)).join(" ");
  const picked = ingredientWords(cooking, skip);
  return strict || picked.length >= RICH_INGREDIENTS ? picked : ingredientWords(sentences.join(" "), skip);
}

/** 이름을 다르게 부르는 말·어원·역사(연도) 문장은 정답이 드러나거나 레시피와 멀어서 뺀다. */
const LEAKY_LINE = /(라고도|이라고도|로도 불|으로도 불|라고 부|라고 불|이라 불|라 불|불린다|불리며|불리는|부른다|부르며|부르는|사투리|표준어|이라고 한다|어원|유래|명칭|이름은|이름이|이름을|한자|영어|일본어|중국어|\d{3,4}년|세기)/;

function escapeRe(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 첫 문단 문장에서 정답 이름(띄어쓰기 달라도)을 ○○ 로 가리고, 드러나는 문장·긴 문장은 뺀다. */
export function recipeLines(text, names = [], { max = RECIPE_MAX_LINES } = {}) {
  const words = [...new Set(names.map((name) => String(name || "").normalize("NFC").trim()).filter((name) => hangulOnly(name).length >= 2))].sort(
    (a, b) => hangulOnly(b).length - hangulOnly(a).length,
  );
  const patterns = words.map((name) => new RegExp([...hangulOnly(name)].map(escapeRe).join("\\s?"), "g"));
  const out = [];
  for (const raw of splitRecipeSentences(stripRecipeAsides(text))) {
    if (LEAKY_LINE.test(raw)) continue;
    let line = raw;
    for (const re of patterns) line = line.replace(re, RECIPE_MASK);
    if (line.length > LINE_MAX_CHARS || !/[가-힣]{2}/.test(line.replaceAll(RECIPE_MASK, ""))) continue;
    out.push(line);
    if (out.length >= max) break;
  }
  return out;
}

const DISH_WORD =
  /(음식|요리|찌개|국물|전골|국수|우동|밥|떡|과자|당과|빵|브레드|페이스트리|반찬|볶음|구이|찜|조림|무침|만두|후식|디저트|샌드위치|수프|스튜|케이크|쿠키|파이|타르트|도넛|와플|팬케이크|머핀|아이스크림|젤리|튀김|김치|나물|부침|파스타|피자|버거|라면|덮밥|샐러드|간식|안주|분식|먹는|탕이다|국이다|죽이다|전이다|회이다|묵이다)/;
const NOT_DISH =
  /(식재료|재료이다|재료로 쓰|채소이다|과일이다|열매|식물|조미료|양념이다|소스이다|음료|술이다|주류|상표|브랜드|생산하|판매하|출시|제조|음식점|식당|회사|기업|프랜차이즈|요리사|방송|프로그램|영화|드라마|노래|축제|용어|조리 기구|조리법이다|조리 방법이다|요리법이다|그릇이다|식기|품종|가공품이다|가공식품이다)/;
/** 문서 분류가 이런 것이면 음식(요리)이 아니라 조미료·장·음료·상품이다. */
const NOT_DISH_CATEGORY = /(조미료|의 장$|장류|양념|음료|주류|상표|제품|브랜드|식재료|향신료)/;

/** 요리 분류(…요리·…음식)에 들고 첫 문장이 만드는 법을 말하면 음식으로 본다("새우를 넣어 만든 똠 얌이다"). */
const DISH_CATEGORY = /(요리|음식|국수|후식|과자|빵)$/;

/** 첫 문장이 음식(요리)을 설명하는지. 재료·조미료·음식점·조리법·상품 문서는 뺀다. */
export function isDishIntro(text, categories = []) {
  const first = splitRecipeSentences(stripRecipeAsides(text))[0] || "";
  const cats = categories.map((cat) => String(cat).replace(/^분류:/, ""));
  if (cats.some((cat) => NOT_DISH_CATEGORY.test(cat)) || NOT_DISH.test(first)) return false;
  return DISH_WORD.test(first) || (cats.some((cat) => DISH_CATEGORY.test(cat)) && COOKING_LINE.test(first));
}

/** 나라·지역 이름 → 장르. 타이완은 중식, 타이(태국)는 세계. */
const GENRE_WORDS = [
  ["중식", /(중국|중화|쓰촨|사천|광둥|광동|베이징|북경|상하이|산둥|후난|푸젠|윈난|둥베이|홍콩|마카오|타이완|대만|위구르|하카)/],
  ["일식", /(일본|오키나와|홋카이도|오사카|교토|도쿄|에도|규슈|나가사키)/],
  ["한식", /(한국|대한민국|조선|제주|강원도|경기도|경상도|전라도|충청도|함경도|황해도|평안도|부산|서울|평양|개성|전주|안동|궁중)/],
  ["양식", /(이탈리아|프랑스|미국|영국|독일|스페인|포르투갈|그리스|러시아|유럽|서양|오스트리아|벨기에|네덜란드|스위스|헝가리|폴란드|아일랜드|스코틀랜드|캐나다|나폴리|시칠리아|텍스멕스)/],
  ["세계", /(베트남|태국|타이(?!완)|인도|말레이|싱가포르|필리핀|캄보디아|라오스|미얀마|동남아|남아시아|중동|아랍|튀르키예|터키|이란|레바논|이스라엘|이집트|모로코|마그레브|아프리카|멕시코|페루|브라질|아르헨티나|라틴|카리브|하와이)/],
];

function genresIn(text) {
  // "한국식 중국 요리"·"미국식 중국 요리"는 중국 요리로 본다(앞의 나라는 세지 않음).
  const plain = String(text || "").replace(/[가-힣]+식\s?(?=(중국|중화|일본|이탈리아|서양))/g, "");
  return GENRE_WORDS.filter(([, re]) => re.test(plain)).map(([genre]) => genre);
}

/** 장르: 첫 문장에 나온 나라는 2점, 문서 분류마다 1점. 가장 높은 장르, 같거나 없으면 모은 분류의 기본 장르. */
export function recipeGenreOf({ extract = "", categories = [], fallback = "" } = {}) {
  const score = new Map();
  const add = (genre, n) => score.set(genre, (score.get(genre) || 0) + n);
  const first = splitRecipeSentences(stripRecipeAsides(extract))[0] || "";
  for (const genre of genresIn(first)) add(genre, 2);
  for (const cat of categories) for (const genre of genresIn(String(cat).replace(/^분류:/, ""))) add(genre, 1);
  if (!score.size) return fallback;
  const best = Math.max(...score.values());
  const tied = [...score.entries()].filter(([, n]) => n === best).map(([genre]) => genre);
  return tied.length > 1 && tied.includes(fallback) ? fallback : tied[0];
}

/**
 * 위키백과 문서 하나를 문제 한 줄로. 쓸 수 없으면 null.
 * 첫 문단에 재료가 3개 안 되면 문서 본문(body)의 만드는 법 문장에서 더 찾는다. 대표 사진이 없으면 정답 공개 때 출처만 보여 준다.
 */
export function makeRecipeEntry({ title, extract, body = "", image = "", genre: rootGenre, categories = [], redirects = [], views = 0 }) {
  const word = recipeAnswerOfTitle(title);
  if (!word || !isDishIntro(extract, categories)) return null;
  const genre = recipeGenreOf({ extract, categories, fallback: rootGenre });
  const aliases = [...new Set(redirects.map(recipeAnswerOfTitle).filter((name) => name && name !== word && hangulOnly(name).length <= 15))].slice(0, 8);
  const names = [word, title, ...aliases];
  let ingredients = recipeIngredients(extract, { names });
  if (ingredients.length < RICH_INGREDIENTS && body) {
    const more = recipeIngredients(body, { names, strict: true }).filter((name) => !ingredients.includes(name));
    ingredients = [...ingredients, ...more];
  }
  const lines = recipeLines(extract, names);
  if (!lines.length || ingredients.length < RECIPE_MIN_INGREDIENTS) return null;
  if (ingredients.length < RICH_INGREDIENTS && lines.length < 2) return null;
  return {
    word,
    genre,
    aliases,
    ingredients: ingredients.slice(0, RECIPE_SHOW_INGREDIENTS),
    lines,
    image: /^https:\/\//.test(image) ? image : "",
    page: String(title),
    views: Number(views) || 0,
  };
}

/** 남은 시간 비율(1 → 0)에 따라 연 문장 수와 초성. */
export function recipeStage(remainingRatio, steps = RECIPE_STEPS) {
  const r = Math.max(0, Math.min(1, Number(remainingRatio)));
  const elapsed = 1 - (Number.isFinite(r) ? r : 1);
  let stage = steps[0];
  for (const step of steps) if (elapsed >= step[0]) stage = step;
  return { lines: stage[1], chosung: stage[2] };
}

export function recipePageUrl(page) {
  return `https://ko.wikipedia.org/wiki/${encodeURIComponent(String(page || "").replace(/ /g, "_"))}`;
}

export function buildRecipePool(raw = {}) {
  const seen = new Set();
  const items = [];
  for (const row of Array.isArray(raw?.items) ? raw.items : []) {
    const word = String(row?.word || "").trim();
    const image = String(row?.image || "").trim();
    const ingredients = Array.isArray(row?.ingredients) ? row.ingredients.map((x) => String(x || "").trim()).filter(Boolean) : [];
    const lines = Array.isArray(row?.lines) ? row.lines.map((x) => String(x || "").trim()).filter(Boolean) : [];
    if (!word || (image && !/^https:\/\//.test(image)) || seen.has(word) || ingredients.length < RECIPE_MIN_INGREDIENTS || !lines.length) continue;
    seen.add(word);
    const aliases = Array.isArray(row.aliases) ? row.aliases.map((name) => String(name || "").trim()).filter(Boolean) : [];
    items.push({ word, genre: String(row.genre || "").trim(), image, aliases, ingredients, lines, page: String(row.page || word) });
  }
  return { fetchedAt: Number(raw?.fetchedAt) || 0, items };
}

/** genres 가 비었거나 없으면 전체. */
export function filterRecipeEntries(pool, genres = null) {
  const pick = Array.isArray(genres) && genres.length ? new Set(genres) : null;
  return (pool?.items || []).filter((row) => !pick || pick.has(row.genre));
}

export function pickRecipeEntries(pool, { exclude, genres } = {}, count = 1) {
  const n = Math.max(1, Math.min(3, Math.floor(Number(count) || 1)));
  const all = filterRecipeEntries(pool, genres);
  let left = exclude instanceof Set ? all.filter((row) => !exclude.has(row.word)) : all.slice();
  if (!left.length && all.length && exclude instanceof Set) {
    for (const row of all) exclude.delete(row.word);
    left = all.slice();
  }
  if (!left.length) throw new Error("낼 요리가 없습니다");
  const out = [];
  while (out.length < n && left.length) {
    out.push(left.splice(Math.floor(Math.random() * left.length), 1)[0]);
  }
  return out;
}

export async function loadRecipePool(fetchImpl = fetch) {
  try {
    const res = await fetchImpl(RECIPE_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`recipes ${res.status}`);
    return buildRecipePool(await res.json());
  } catch {
    return buildRecipePool({});
  }
}
