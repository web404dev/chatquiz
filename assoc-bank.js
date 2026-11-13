export const ASSOC_URL = "./assoc.json";

/**
 * 연상 퀴즈: 힌트 단어가 하나씩 열리고, 떠오르는 단어를 채팅으로 맞힌다(사용자 2026-11-14: "연상되는 단어들을 줘서 맞추는거",
 * "api이용해서 할 수 있는방향으로", "응, 위키백과로").
 * 정답은 확대 사진 단어(동물·음식·물건·탈것·자연, 위키데이터에서 고른 것)와 단어 은행, 힌트는 그 단어의 한국어 위키백과 문서 앞부분에
 * 나오는 링크 단어다(키 없음, `admin/refresh-assoc.mjs` → `assoc.json`).
 */
export const ASSOC_MIN_HINTS = 4;
export const ASSOC_MAX_HINTS = 5;
/** 이만큼 많은 정답에 같이 나오는 힌트(물·한국 같은 것)는 너무 흔해서 뺀다. */
export const ASSOC_COMMON_LIMIT = 8;

/** 힌트로 쓸모없는 링크: 언어 이름·분류 표시·보전 등급 같은 것. */
const STOP = new Set([
  "영어", "일본어", "중국어", "한자", "라틴어", "프랑스어", "독일어", "이탈리아어", "스페인어", "그리스어", "고대 그리스어",
  "러시아어", "포르투갈어", "아랍어", "산스크리트어", "네덜란드어", "한국어", "몽골어", "튀르키예어", "터키어",
  "학명", "문화어", "표준어", "대한민국 표준어", "방언", "외래어", "고유어", "한자어", "동음이의", "구어", "순화어", "향명",
  "정체자", "국어사전", "중고 한어", "한국어 한자",
  "최소관심종", "관심대상종", "준위협종", "취약종", "위기종", "위급종", "멸종위기종", "절멸종", "야생절멸종", "정보부족종",
  "대한민국 환경부", "종", "속", "족", "과", "목", "아종", "생물종", "계통분류학", "단계통군", "재배품종",
  "사람", "세계", "국가", "문화", "이름", "정보",
]);

/** 「미국 영어」·「영국식 영어」 같은 말 갈래 이름. */
const LANGUAGE_VARIANT = /(영어|한어)$/;

/** 두 글자 분류 이름(개과·닭목·귤속)과 헷갈리는 보통 낱말. */
const NOT_TAXON = new Set([
  "사과", "효과", "결과", "학과", "외과", "내과", "치과", "안과", "백과", "교과", "약과", "제목", "덕목", "수목", "고목", "묘목",
  "품목", "항목", "종목", "과목", "금속", "풍속", "가속", "지속", "소속", "습속", "귀속", "연속",
]);

/** 「파 (채소)」 → 「파」 */
export function cleanHintTitle(title) {
  return String(title || "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/_/g, " ")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

const squash = (text) => String(text || "").replace(/\s+/g, "");

/** 분류학 이름(국화과·벚나무속·파리목)은 시청자에게 힌트가 안 된다. */
function isTaxonName(hint) {
  const t = squash(hint);
  if (t.length === 2) return /[과목속]$/.test(t) && !NOT_TAXON.has(t);
  return t.length >= 3 && /(아속|아과|아목|속|과|목|족)$/.test(t) && !NOT_TAXON.has(t.slice(-2));
}

/** 한글(띄어쓰기 하나까지)·2~7글자, 정답 글자를 품거나 정답 안에 든 것은 안 된다. */
export function isUsableHint(hint, answers = []) {
  const h = String(hint || "").trim();
  if (!h || STOP.has(h) || LANGUAGE_VARIANT.test(h)) return false;
  if (!/^[가-힣]+( [가-힣]+)?$/.test(h)) return false;
  const n = squash(h).length;
  if (n < 1 || n > 7) return false;
  if (isTaxonName(h)) return false;
  const k = squash(h);
  return answers.map(squash).filter(Boolean).every((a) => !k.includes(a) && !a.includes(k));
}

/**
 * 위키백과 문서 HTML(Parsoid, REST page/html)에서 본문 단락의 링크 제목을 나온 순서대로.
 * 없는 문서 링크(빨간 링크)·다른 이름공간(파일:·분류:)은 뺀다. 첫 단락 묶음부터, 모자라면 다음 묶음까지.
 */
export function linkTitlesFromHtml(html, want = 12) {
  const sections = String(html || "").match(/<section[^>]*data-mw-section-id="\d+"[\s\S]*?<\/section>/g) || [];
  const out = [];
  for (const section of sections) {
    for (const p of section.match(/<p[ >][\s\S]*?<\/p>/g) || []) {
      for (const m of p.matchAll(/<a\b([^>]*)>/g)) {
        const attrs = m[1];
        if (!/rel="mw:WikiLink"/.test(attrs) || /class="[^"]*\bnew\b/.test(attrs)) continue;
        const title = (attrs.match(/title="([^"]+)"/) || [])[1];
        if (!title || title.includes(":")) continue;
        const clean = cleanHintTitle(title);
        if (clean && !out.includes(clean)) out.push(clean);
      }
    }
    if (out.length >= want) break;
  }
  return out;
}

/** 넘겨주기를 따라간 뒤의 진짜 문서 제목(거북이 → 거북). */
export function pageTitleFromHtml(html, fallback = "") {
  const link = String(html || "").match(/rel="dc:isVersionOf" href="[^"]*\/wiki\/([^"]+)"/);
  if (link) {
    try {
      return decodeURIComponent(link[1]).replace(/_/g, " ");
    } catch {
      // fall through
    }
  }
  const title = String(html || "").match(/<title>([^<]+)<\/title>/);
  return title ? cleanHintTitle(title[1]) || fallback : fallback;
}

export function isDisambiguationHtml(html) {
  return /mw:PageProp\/disambiguation/.test(String(html || ""));
}

/**
 * 정답마다 쓸 힌트 고르기: 쓸 수 있는 링크 중 너무 흔한 것(ASSOC_COMMON_LIMIT 넘게 여러 정답에 나옴)은 빼고,
 * 문서 앞쪽에 나온 것부터 ASSOC_MAX_HINTS 개. 보여 줄 때는 흔한(막연한) 것부터 → 드문(콕 집는) 것 순.
 * rows: [{ word, aliases, links }] → [{ ...row, hints }]
 */
export function chooseAssocHints(rows = [], { max = ASSOC_MAX_HINTS, commonLimit = ASSOC_COMMON_LIMIT } = {}) {
  const usable = rows.map((row) => (row.links || []).filter((link) => isUsableHint(link, [row.word, ...(row.aliases || [])])));
  const df = new Map();
  for (const list of usable) for (const hint of new Set(list)) df.set(hint, (df.get(hint) || 0) + 1);
  return rows.map((row, i) => {
    const kept = usable[i].filter((hint) => df.get(hint) <= commonLimit).slice(0, max);
    const hints = kept
      .map((hint, pos) => ({ hint, pos, df: df.get(hint) }))
      .sort((a, b) => b.df - a.df || b.pos - a.pos)
      .map((x) => x.hint);
    return { ...row, hints };
  });
}

/** 힌트가 ASSOC_MIN_HINTS 개 이상이고 정답이 한글(띄어쓰기 하나까지)인 것만. */
export function buildAssocPool(raw = {}) {
  const seen = new Set();
  const items = [];
  for (const row of Array.isArray(raw?.items) ? raw.items : []) {
    const word = String(row?.word || "").trim();
    const hints = Array.isArray(row?.hints) ? row.hints.map((h) => String(h || "").trim()).filter(Boolean) : [];
    if (!/^[가-힣]+( [가-힣]+)?$/.test(word) || hints.length < ASSOC_MIN_HINTS || seen.has(word)) continue;
    seen.add(word);
    const aliases = Array.isArray(row.aliases) ? row.aliases.map((a) => String(a || "").trim()).filter(Boolean) : [];
    const photos = {};
    for (const hint of hints) {
      const url = String(row?.photos?.[hint] || "").trim();
      if (/^https:\/\/[a-z0-9.-]*wikimedia\.org\//.test(url)) photos[hint] = url;
    }
    const photoHints = hints.filter((hint) => photos[hint]);
    items.push({ key: `assoc:${word}`, word, aliases, hints, photos, photoHints, genre: String(row.genre || ""), page: String(row.page || word) });
  }
  return { fetchedAt: Number(raw?.fetchedAt) || 0, items };
}

/**
 * 사진 힌트(사용자 2026-11-14 "연상에 사진 보고 연상되는거 맞추는것도 추가로", "api를 이용해야돼", 「연상 안에 단어/사진 고르기」·「사진만」).
 * 힌트 단어마다 한국어 위키백과 문서 대표 사진(API pageimages, 키 없음)을 쓰고, 사진이 ASSOC_MIN_HINTS 장 이상인 문제만 낸다.
 */
export const ASSOC_HINT_UNITS = ["word", "photo"];

export function normalizeAssocHintUnit(unit) {
  return unit === "photo" ? "photo" : "word";
}

export function isAssocPhotoReady(item) {
  return Array.isArray(item?.photoHints) && item.photoHints.length >= ASSOC_MIN_HINTS;
}

/** 이 힌트 방식으로 낼 수 있는 문제(사진이면 사진 힌트가 넉넉한 것만). */
export function assocPoolFor(pool, unit = "word") {
  const items = pool?.items || [];
  return normalizeAssocHintUnit(unit) === "photo" ? items.filter(isAssocPhotoReady) : items;
}

/** 파일 이름 「Cat_claw_closeup.jpg」 → ["cat", "claw", "closeup"] (확장자 빼고, 영문은 소문자). */
function fileWords(file) {
  return String(file || "")
    .replace(/^(file|파일):/i, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .split(/[^0-9a-z가-힣]+/)
    .filter(Boolean);
}

/**
 * 힌트 사진이 정답을 그대로 보여 줄 것 같으면 쓰지 않는다:
 * 정답 문서의 대표 사진과 같은 파일, 파일 이름에 정답 이름(한글·영어 문서 제목, 복수형 s 포함)이 든 것, 제외 목록(exclude)의 파일.
 * 제외 목록은 「파일」(모든 문제에서 뺌) 또는 「정답|파일」(그 정답 문제에서만 뺌. 동물 모음 사진처럼 어떤 문제에서만 정답이 보이는 것).
 */
export function isUsableHintPhoto(file, { answerFile = "", answerNames = [], exclude = [], word = "" } = {}) {
  const name = String(file || "").replace(/^(file|파일):/i, "").replace(/ /g, "_");
  if (!name) return false;
  const norm = (f) => String(f || "").replace(/^(file|파일):/i, "").replace(/ /g, "_");
  if (answerFile && norm(answerFile) === name) return false;
  const excluded = exclude.some((entry) => {
    const bar = String(entry || "").indexOf("|");
    if (bar < 0) return norm(entry) === name;
    return String(entry).slice(0, bar).trim() === String(word || "").trim() && norm(String(entry).slice(bar + 1)) === name;
  });
  if (excluded) return false;
  const words = fileWords(name);
  const joined = ` ${words.join(" ")} `;
  for (const raw of answerNames) {
    const target = fileWords(raw).join(" ");
    if (!target) continue;
    if (joined.includes(` ${target} `) || joined.includes(` ${target}s `) || joined.includes(` ${target}es `)) return false;
    // 한글 이름은 붙어 있는 경우(고양이발톱)도 본다.
    if (/[가-힣]/.test(target) && name.replace(/_/g, "").includes(target.replace(/ /g, ""))) return false;
  }
  return true;
}

/** 남은 시간 비율 → 지금 보일 힌트 수. 처음엔 하나, 남은 시간 25%가 되면 전부. */
export function assocVisibleCount(remainingRatio, total) {
  const n = Math.max(1, Math.floor(Number(total) || 0));
  const r = Number(remainingRatio);
  if (!Number.isFinite(r) || r >= 1) return 1;
  const passed = Math.min(1, Math.max(0, (1 - r) / 0.75));
  return Math.min(n, 1 + Math.floor(passed * (n - 1) + 1e-9));
}

export function pickAssocEntries(pool, { exclude, unit = "word" } = {}, count = 1) {
  const n = Math.max(1, Math.min(3, Math.floor(Number(count) || 1)));
  const all = assocPoolFor(pool, unit).slice();
  let left = exclude instanceof Set ? all.filter((row) => !exclude.has(row.key)) : all.slice();
  if (!left.length && all.length && exclude instanceof Set) {
    for (const row of all) exclude.delete(row.key);
    left = all.slice();
  }
  if (!left.length) throw new Error("낼 연상 문제가 없습니다");
  const out = [];
  while (out.length < n && left.length) out.push(left.splice(Math.floor(Math.random() * left.length), 1)[0]);
  return out;
}

/** 정답 공개 때 카드 위쪽에 붙일 출처(위키백과 글은 CC BY-SA 4.0). */
export function assocSourceLine(page) {
  return `출처 · 한국어 위키백과 「${page}」 문서 링크 (CC BY-SA 4.0)`;
}

/** 사진 힌트: 글은 위키백과, 사진은 각 힌트 문서의 위키미디어 공용 사진(사진마다 라이선스가 다르다). */
export function assocPhotoSourceLine(page) {
  return `출처 · 한국어 위키백과 「${page}」 문서 링크 (CC BY-SA 4.0) · 사진 위키미디어 공용`;
}

export async function loadAssocPool(fetchImpl = fetch) {
  try {
    const res = await fetchImpl(ASSOC_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`assoc ${res.status}`);
    return buildAssocPool(await res.json());
  } catch {
    return buildAssocPool({});
  }
}
