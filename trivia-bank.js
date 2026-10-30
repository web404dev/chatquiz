export const TRIVIA_URL = "./trivia.json";

/**
 * 상식 퀴즈: 위키데이터에서 틀에 맞춰 문제를 만든다(사용자 2026-10-31: "상식 퀴즈 만들려고해" → 위키데이터 자동·주관식, "만들어봐").
 * 수도(「프랑스」의 수도는?)·화폐·원소 기호·명화(그린 화가)·문학(쓴 작가). 시간이 지나면 글자 수 → 초성 힌트.
 */
export const TRIVIA_GENRES = ["수도", "화폐", "원소", "명화", "문학"];

/**
 * 난이도(사용자 2026-10-31: "더 쉽게", "어렵고 쉬운거 섞어서"): 한국어 위키백과 최근 60일 조회수로 잰다.
 * 문제 속 두 항목(나라·수도, 그림·화가) 중 덜 찾아보는 쪽 조회수가 그 문제의 점수. 갈래마다 아래 25%는 빼고, 남은 것의 위쪽 절반은 쉬움.
 * 낼 때는 쉬움 2 : 어려움 1 로 섞는다.
 */
export const TRIVIA_LEVELS = ["쉬움", "어려움"];
export const TRIVIA_DROP_SHARE = 0.25;
export const TRIVIA_EASY_SHARE_OF_KEPT = 0.5;
export const TRIVIA_EASY_PICK = 2 / 3;

/** [지난 시간 비율, 글자 수, 초성]. 처음엔 문제만. */
export const TRIVIA_STEPS = [
  [0, false, false],
  [0.35, true, false],
  [0.65, true, true],
];

/** 잘 알려진 원소만 낸다: 원자 번호 36(크립톤)까지 + 은·주석·아이오딘·제논·바륨·텅스텐·백금·금·수은·납·라돈·라듐·우라늄·플루토늄. */
export const TRIVIA_ELEMENT_EXTRA = [47, 50, 53, 54, 56, 74, 78, 79, 80, 82, 86, 88, 92, 94];
export const TRIVIA_ELEMENT_MAX = 36;

function hangulOnly(text) {
  return String(text ?? "").normalize("NFC").replace(/[^가-힣]/g, "");
}

export function hasHangul(text) {
  return /[가-힣]/.test(String(text ?? ""));
}

/** 위키데이터 다른 이름 목록에서 한글이 든 두 글자 이상만(「6번 원자」처럼 숫자가 든 이름은 뺀다). */
export function hangulNames(list = []) {
  const out = [];
  for (const raw of list) {
    const name = String(raw ?? "").normalize("NFC").trim();
    if (name && hasHangul(name) && !/\d/.test(name) && hangulOnly(name).length >= 2 && !out.includes(name)) out.push(name);
  }
  return out;
}

/** 한글 낱말(두 글자 이상)도 정답으로 받는다: 「워싱턴 D.C.」 → 「워싱턴」, 「파운드 스털링」 → 「파운드」. */
export function wordAliases(name) {
  return String(name ?? "")
    .split(/\s+/)
    .map((word) => word.replace(/[^가-힣]/g, ""))
    .filter((word) => word.length >= 2 && word !== String(name ?? "").trim());
}

/** 답이 문제 속 이름과 거의 같으면(바티칸 시국 → 바티칸 시국, 멕시코 → 멕시코시티) 너무 쉬워서 뺀다. */
export function isTrivialAnswer(subject, answer) {
  const a = hangulOnly(subject);
  const b = hangulOnly(answer);
  return !!a && !!b && (b.startsWith(a) || a.startsWith(b));
}

/** 다른 이름 중 가장 짧은 것이 흔히 부르는 이름이 아닌 나라. */
const COUNTRY_NAME_FIX = { 중화인민공화국: "중국" };

/**
 * 나라 이름: 이름이 길면(「남아프리카 공화국」) 다른 이름 중 가장 짧은 한글 이름(「남아공」)을 쓴다.
 * 「콩고 민주 공화국」처럼 짧은 이름이 다른 나라(콩고 공화국)와 겹치는 나라는 그대로 둔다.
 */
export function countryDisplayName(label, alts = []) {
  const name = String(label ?? "").trim();
  if (COUNTRY_NAME_FIX[name]) return COUNTRY_NAME_FIX[name];
  if ((hangulOnly(name).length <= 6 && /^[가-힣 ]+$/.test(name)) || /민주/.test(name)) return name;
  const short = hangulNames(alts)
    .filter((alt) => /^[가-힣 ]+$/.test(alt))
    .sort((a, b) => hangulOnly(a).length - hangulOnly(b).length)[0];
  return short || name;
}

/** 도시 이름: 「서울특별시」·「도쿄도」·「베이징시」는 다른 이름에 짧은 이름이 있으면 그걸 보인다. */
export function cityDisplayName(label, alts = []) {
  const name = String(label ?? "").trim();
  const names = hangulNames(alts);
  const short = name.replace(/(특별시|광역시|직할시|도|시)$/, "");
  return short !== name && short.length >= 2 && names.includes(short) ? short : name;
}

/** 화폐 이름에서 앞의 나라 이름을 뗀다: 「일본 엔」 → 「엔」. */
export function currencyDisplayName(label, countryNames = []) {
  const name = String(label ?? "").trim();
  for (const country of [...countryNames].sort((a, b) => b.length - a.length)) {
    if (country && name.startsWith(`${country} `)) return name.slice(country.length + 1).trim();
  }
  return name;
}

/** 사람 이름의 뒤쪽도 정답으로 받는다: 「빈센트 반 고흐」 → 「고흐」·「반 고흐」, 「J. R. R. 톨킨」 → 「톨킨」. */
export function personAliases(label, alts = []) {
  const out = hangulNames([label, ...alts]);
  const words = String(label ?? "").trim().split(/\s+/).filter((word) => hasHangul(word));
  if (words.length >= 2) {
    const last = words[words.length - 1];
    if (hangulOnly(last).length >= 2) out.push(last);
    out.push(words.slice(-2).join(" "));
  } else if (words.length === 1 && !out.includes(words[0])) {
    out.push(words[0]);
  }
  return [...new Set(out)].filter((name) => name !== String(label ?? "").trim());
}

/** 목적격 조사: 마지막 글자에 받침이 있으면 「을」, 없으면 「를」. 한글로 끝나지 않으면(「1984」) 「을(를)」. */
export function objectParticle(word) {
  const last = String(word ?? "").trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (!(code >= 0 && code <= 11171)) return "을(를)";
  return code % 28 ? "을" : "를";
}

/** 남은 시간 비율(1 → 0)에 따라 글자 수·초성 힌트. */
export function triviaStage(remainingRatio, steps = TRIVIA_STEPS) {
  const r = Math.max(0, Math.min(1, Number(remainingRatio)));
  const elapsed = 1 - (Number.isFinite(r) ? r : 1);
  let stage = steps[0];
  for (const step of steps) if (elapsed >= step[0]) stage = step;
  return { length: stage[1], chosung: stage[2] };
}

/** 글자 수 힌트: 띄어쓰기는 빼고 센다(「빈센트 반 고흐」 → 6글자). */
export function triviaLengthHint(answer) {
  const n = [...String(answer ?? "").replace(/\s+/g, "")].length;
  return n ? `${n}글자` : "";
}

/** 갈래마다 점수(score) 순으로 아래쪽은 빼고 위쪽은 쉬움, 나머지는 어려움. 점수가 같으면 먼저 온 것이 위. */
export function assignTriviaLevels(items = [], { drop = TRIVIA_DROP_SHARE, easy = TRIVIA_EASY_SHARE_OF_KEPT } = {}) {
  const out = [];
  const genres = [...new Set(items.map((row) => row.genre))];
  for (const genre of genres) {
    const rows = items
      .map((row, i) => ({ row, i }))
      .filter(({ row }) => row.genre === genre)
      .sort((a, b) => (Number(b.row.score) || 0) - (Number(a.row.score) || 0) || a.i - b.i)
      .map(({ row }) => row);
    const keep = Math.max(1, Math.ceil(rows.length * (1 - drop)));
    const easyCount = Math.max(1, Math.ceil(keep * easy));
    rows.slice(0, keep).forEach((row, i) => out.push({ ...row, level: i < easyCount ? "쉬움" : "어려움" }));
  }
  return out;
}

export function buildTriviaPool(raw = {}) {
  const seen = new Set();
  const items = [];
  for (const row of Array.isArray(raw?.items) ? raw.items : []) {
    const word = String(row?.word || "").trim();
    const question = String(row?.question || "").trim();
    const key = String(row?.key || question).trim();
    const image = String(row?.image || "").trim();
    if (!word || !question || seen.has(key) || (image && !/^https:\/\//.test(image))) continue;
    seen.add(key);
    const aliases = Array.isArray(row.aliases) ? row.aliases.map((name) => String(name || "").trim()).filter(Boolean) : [];
    const level = TRIVIA_LEVELS.includes(row.level) ? row.level : "쉬움";
    items.push({ key, word, question, genre: String(row.genre || "").trim(), level, aliases, image, source: String(row.source || "") });
  }
  return { fetchedAt: Number(raw?.fetchedAt) || 0, items };
}

/** genres 가 비었거나 없으면 전체. */
export function filterTriviaEntries(pool, genres = null) {
  const pick = Array.isArray(genres) && genres.length ? new Set(genres) : null;
  return (pool?.items || []).filter((row) => !pick || pick.has(row.genre));
}

/**
 * 같은 답(유로·다 빈치)이 여러 문제에 나오니 낸 문제는 답이 아니라 문제(key)로 기억한다.
 * 한 문제마다 쉬움을 2/3 확률로 고르고(그 난이도가 다 떨어졌으면 다른 난이도), 그 안에서 무작위.
 */
export function pickTriviaEntries(pool, { exclude, genres } = {}, count = 1, rand = Math.random) {
  const n = Math.max(1, Math.min(3, Math.floor(Number(count) || 1)));
  const all = filterTriviaEntries(pool, genres);
  let left = exclude instanceof Set ? all.filter((row) => !exclude.has(row.key)) : all.slice();
  if (!left.length && all.length && exclude instanceof Set) {
    for (const row of all) exclude.delete(row.key);
    left = all.slice();
  }
  if (!left.length) throw new Error("낼 상식 문제가 없습니다");
  const out = [];
  while (out.length < n && left.length) {
    const want = rand() < TRIVIA_EASY_PICK ? "쉬움" : "어려움";
    const same = left.filter((row) => row.level === want);
    const from = same.length ? same : left;
    const row = from[Math.floor(rand() * from.length)];
    left.splice(left.indexOf(row), 1);
    out.push(row);
  }
  return out;
}

export async function loadTriviaPool(fetchImpl = fetch) {
  try {
    const res = await fetchImpl(TRIVIA_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`trivia ${res.status}`);
    return buildTriviaPool(await res.json());
  } catch {
    return buildTriviaPool({});
  }
}
