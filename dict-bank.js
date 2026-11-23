import { triviaLengthHint, triviaStage } from "./trivia-bank.js?v=3";

export const DICT_URL = "./dict.json";

/**
 * 낱말 퀴즈(사용자 2026-11-23: "치지직 퀴즈에 낱말 맞추기 게임 넣자", 모드 뜻풀이·꼬들·빈칸·십자말풀이를 한 모드씩).
 * 뜻풀이 모드: 위키낱말사전(키 없음, CC BY-SA 4.0) 명사 뜻풀이를 보여 주고 낱말을 채팅으로 맞힌다.
 * 낱말 범위는 초성 단어 은행(words-easy.json·words.json) + 「부록:자주 쓰이는 한국어 낱말 5800」의 명사("둘 다").
 * 자료는 `admin/refresh-dict.mjs` → `dict.json`(20일 자동 갱신에 넣음, 사용자 "넣기").
 */

/** 뜻풀이 글자 수(정답 가림 뒤, 띄어쓰기 포함) 범위. 너무 짧으면 힌트가 안 되고 길면 방송 카드에 안 들어간다. */
export const DICT_DEF_MIN = 8;
export const DICT_DEF_MAX = 90;
/** 정답은 한글 2~6글자(띄어쓰기 없음). */
const ANSWER_RE = /^[가-힣]{2,6}$/;
const MASK = "○";

/** 다른 낱말로 넘기는 뜻풀이(준말·옛말·방언·다른 철자 등)는 문제로 못 쓴다. */
const POINTER_RE = /(준말|본말|옛말|방언|북한어|비표준어|잘못|높임말|낮춤말|의 다른 (철자|표기|이름|말)|(을|를) 보라|참조|참고|의 줄임말|의 약자)[.。]?$/;

/** 위키 문법 한 줄 → 글자만. [[a|b]] → b, [[a]] → a, {{…}}·<ref>·꾸밈 따옴표는 뺀다. */
export function cleanWikiDef(line) {
  let s = String(line ?? "").replace(/^#+\s*/, "");
  s = s.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "").replace(/<[^>]+>/g, "");
  for (let i = 0; i < 3 && /\{\{[^{}]*\}\}/.test(s); i += 1) s = s.replace(/\{\{[^{}]*\}\}/g, "");
  s = s.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1");
  s = s.replace(/'{2,}/g, "").replace(/&nbsp;/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  if (/^[(（][^)）]*[)）]\s*$/.test(s)) return "";
  return s;
}

/** 위키낱말사전 문서 원문 → 한국어 절의 명사 뜻풀이 줄(나온 순서). 동사·형용사 등 다른 품사 절은 건너뛴다. */
export function nounDefsFromWikitext(text) {
  const src = String(text ?? "");
  const start = src.search(/^==\s*한국어\s*==\s*$/m);
  if (start < 0) return [];
  const rest = src.slice(start).replace(/^==\s*한국어\s*==\s*$/m, "");
  const next = rest.search(/^==[^=].*==\s*$/m);
  const section = next < 0 ? rest : rest.slice(0, next);
  const defs = [];
  let inNoun = false;
  for (const line of section.split("\n")) {
    const head = line.match(/^(={3,6})\s*([^=]+?)\s*\1\s*$/);
    if (head) {
      const name = head[2].trim();
      if (/^명사/.test(name)) inNoun = true;
      else if (/^(동사|형용사|부사|관형사|감탄사|조사|대명사|수사|접사|접미사|접두사|어미|의존 명사|조동사|보조 동사|보조 형용사)/.test(name)) inNoun = false;
      continue;
    }
    if (inNoun && /^#\s*[^#:*]/.test(line)) defs.push(line);
  }
  return defs;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 뜻풀이 속 정답(다른 정답 포함)을 ○로 가린다. 고양이과 고양이속 → ○○○과 ○○○속. */
export function maskAnswer(def, word, aliases = []) {
  let s = String(def ?? "");
  const names = [word, ...aliases].map((n) => String(n || "").trim()).filter(Boolean).sort((a, b) => b.length - a.length);
  for (const name of names) s = s.replace(new RegExp(escapeRe(name), "g"), MASK.repeat([...name].length));
  return s;
}

/** 문제로 쓸 수 있는 뜻풀이인지(가린 뒤 길이·남은 한글·넘기는 말). */
export function isUsableDef(masked) {
  const s = String(masked ?? "").trim();
  const n = [...s].length;
  if (n < DICT_DEF_MIN || n > DICT_DEF_MAX) return false;
  if (POINTER_RE.test(s)) return false;
  const hangul = (s.match(/[가-힣]/g) || []).length;
  return hangul >= 6;
}

/** 첫 번째로 쓸 수 있는 뜻풀이(가린 것). 없으면 "". */
export function pickDef(rawDefs = [], word = "", aliases = []) {
  for (const raw of rawDefs) {
    const masked = maskAnswer(cleanWikiDef(raw), word, aliases);
    if (isUsableDef(masked)) return masked;
  }
  return "";
}

/** dict.json → 문제 목록. 정답 꼴·뜻풀이가 맞지 않거나 같은 낱말이면 뺀다. */
export function buildDictPool(raw = {}) {
  const seen = new Set();
  const items = [];
  for (const row of Array.isArray(raw?.items) ? raw.items : []) {
    const word = String(row?.word || "").trim();
    if (!ANSWER_RE.test(word) || seen.has(word)) continue;
    const aliases = (Array.isArray(row.aliases) ? row.aliases : []).map((a) => String(a || "").trim()).filter((a) => a !== word && /^[가-힣]{2,8}$/.test(a));
    // 영문이 든 괄호(학명: Canis lupus)는 방송 카드에서 읽기 어려워 뺀다.
    const plain = String(row?.def || "").replace(/\s*\([^()]*[A-Za-z][^()]*\)/g, "").replace(/\s+/g, " ").trim();
    const def = maskAnswer(plain, word, aliases);
    if (!isUsableDef(def)) continue;
    seen.add(word);
    const rank = Number(row.rank) || 0;
    items.push({ key: `dict:${word}`, word, aliases, def, genre: String(row.genre || ""), from: String(row.from || ""), rank, level: "" });
  }
  assignDictLevels(items);
  return { fetchedAt: Number(raw?.fetchedAt) || 0, items };
}

/**
 * 난이도(사용자 2026-11-23: 기준 "낱말 출처", "쉬움·보통·어려움", "5800을 자주 쓰는 순서로 나눔", 세 모드 모두).
 * 쉬움 = 초성 단어 은행(사물 낱말), 보통·어려움 = 「자주 쓰이는 한국어 낱말 5800」 명사를 목록 순서(자주 쓰는 순)로 앞 절반·뒤 절반.
 * 순서(rank)가 없는 5800 낱말(예전 자료)은 어려움 쪽 끝에 둔다.
 */
export const DICT_LEVELS = ["easy", "normal", "hard"];
export const DICT_LEVEL_LABELS = { easy: "쉬움", normal: "보통", hard: "어려움" };

export function assignDictLevels(items) {
  const list = items.filter((row) => row.from !== "bank").sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity));
  const half = Math.ceil(list.length / 2);
  list.forEach((row, i) => {
    row.level = i < half ? "normal" : "hard";
  });
  for (const row of items) if (row.from === "bank") row.level = "easy";
  return items;
}

export function normalizeDictLevel(level) {
  return DICT_LEVELS.includes(level) ? level : "normal";
}

/** 고른 난이도 문제만. */
export function dictLevelItems(pool, level) {
  const want = normalizeDictLevel(level);
  return (pool?.items || []).filter((row) => row.level === want);
}

/** 모드: 뜻풀이(define) · 꼬들(kordle) · 십자말풀이(cross). 빈칸 모드는 사용자 2026-11-23 "빈칸은 빼는게 맞아 보이고"로 뺐다. */
export const DICT_MODES = ["define", "kordle", "cross"];

/**
 * 십자말풀이(사용자 2026-11-23: 단서 "뜻풀이", 낱말 "8개", 칸 시간은 로비 「칸 시간」(처음엔 "제한시간을 퍼즐 전체에" → 칸 시간 따로 정하기로 바꿈),
 * 못 맞힌 칸 "비워두고 이동한다음 나중에 다시 되돌아 와서 맞추고 정 못 맞추는건 방장이 현재문제 넘기기 하면 정답 공개되고 넘어가",
 * 앞서 "시간이 지나면 칸이 이동함 … 시간안에 치는 사람이 점수를 하나씩 먹음"). 칸은 글자(음절) 하나.
 * 낱말끼리 같은 글자에서 가로·세로로 만나게 놓고, 만나는 곳 말고는 서로 붙지 않게 한다.
 */
export const CROSS_WORDS = 8;
export const CROSS_MAX_SIZE = 9;

function crossKey(r, c) {
  return `${r},${c}`;
}

/** 낱말 하나를 (r,c)부터 dir(across|down)으로 놓을 수 있는지. cells: Map(key → { ch, dirs:Set }) */
function canPlace(cells, word, r, c, dir) {
  const [dr, dc] = dir === "across" ? [0, 1] : [1, 0];
  const chars = [...word];
  const before = crossKey(r - dr, c - dc);
  const after = crossKey(r + dr * chars.length, c + dc * chars.length);
  if (cells.has(before) || cells.has(after)) return false;
  let crossings = 0;
  for (let k = 0; k < chars.length; k += 1) {
    const rr = r + dr * k;
    const cc = c + dc * k;
    const cell = cells.get(crossKey(rr, cc));
    if (cell) {
      if (cell.ch !== chars[k] || cell.dirs.has(dir)) return false;
      crossings += 1;
      continue;
    }
    // 새 칸은 옆(가로 낱말이면 위아래, 세로 낱말이면 좌우)에 다른 글자가 붙으면 안 된다.
    if (cells.has(crossKey(rr + dc, cc + dr)) || cells.has(crossKey(rr - dc, cc - dr))) return false;
  }
  return crossings > 0;
}

function placeWord(cells, word, r, c, dir) {
  const [dr, dc] = dir === "across" ? [0, 1] : [1, 0];
  [...word].forEach((ch, k) => {
    const key = crossKey(r + dr * k, c + dc * k);
    const cell = cells.get(key) || { ch, dirs: new Set() };
    cell.dirs.add(dir);
    cells.set(key, cell);
  });
}

function crossBounds(cells) {
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;
  for (const key of cells.keys()) {
    const [r, c] = key.split(",").map(Number);
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }
  return { minR, maxR, minC, maxC };
}

/**
 * 문제 목록(entries: { key, word, def })에서 낱말 count 개를 엮은 퍼즐.
 * 결과 { rows, cols, slots:[{ n, dir, r, c, word, def, key }] } (번호는 왼쪽 위부터). 못 만들면 null.
 */
export function buildCrossword(entries, { count = CROSS_WORDS, maxSize = CROSS_MAX_SIZE, rand = Math.random, tries = 60 } = {}) {
  const pool = (entries || []).filter((e) => /^[가-힣]{2,5}$/.test(String(e?.word || "")));
  const bySyllable = new Map();
  for (const e of pool) for (const ch of new Set(e.word)) (bySyllable.get(ch) || bySyllable.set(ch, []).get(ch)).push(e);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  for (let t = 0; t < tries; t += 1) {
    const seeds = pool.filter((e) => e.word.length >= 3 && e.word.length <= 4);
    if (!seeds.length) return null;
    const seed = pick(seeds);
    const cells = new Map();
    const placed = [{ entry: seed, r: 0, c: 0, dir: "across" }];
    placeWord(cells, seed.word, 0, 0, "across");
    const used = new Set([seed.word]);
    for (let guard = 0; placed.length < count && guard < 400; guard += 1) {
      const base = pick(placed);
      const k = Math.floor(rand() * base.entry.word.length);
      const ch = base.entry.word[k];
      const [br, bc] = base.dir === "across" ? [base.r, base.c + k] : [base.r + k, base.c];
      const dir = base.dir === "across" ? "down" : "across";
      const list = (bySyllable.get(ch) || []).filter((e) => !used.has(e.word));
      for (let n = 0; n < 12 && list.length; n += 1) {
        const cand = list.splice(Math.floor(rand() * list.length), 1)[0];
        const spots = [...cand.word].map((x, j) => (x === ch ? j : -1)).filter((j) => j >= 0);
        const j = pick(spots);
        const [r, c] = dir === "across" ? [br, bc - j] : [br - j, bc];
        if (!canPlace(cells, cand.word, r, c, dir)) continue;
        const trial = new Map([...cells].map(([key, v]) => [key, { ch: v.ch, dirs: new Set(v.dirs) }]));
        placeWord(trial, cand.word, r, c, dir);
        const b = crossBounds(trial);
        if (b.maxR - b.minR + 1 > maxSize || b.maxC - b.minC + 1 > maxSize) continue;
        placeWord(cells, cand.word, r, c, dir);
        placed.push({ entry: cand, r, c, dir });
        used.add(cand.word);
        break;
      }
    }
    if (placed.length < count) continue;
    const b = crossBounds(cells);
    const slots = placed
      .map((p) => ({ dir: p.dir, r: p.r - b.minR, c: p.c - b.minC, word: p.entry.word, def: p.entry.def, key: p.entry.key }))
      .sort((x, y) => x.r - y.r || x.c - y.c || (x.dir === "across" ? -1 : 1));
    // 같은 칸에서 시작하는 가로·세로는 같은 번호.
    const starts = new Map();
    for (const s of slots) {
      const key = crossKey(s.r, s.c);
      if (!starts.has(key)) starts.set(key, starts.size + 1);
      s.n = starts.get(key);
    }
    return { rows: b.maxR - b.minR + 1, cols: b.maxC - b.minC + 1, slots };
  }
  return null;
}

/** 퍼즐 칸 지도: Map("r,c" → 글자). 테스트와 화면이 같이 쓴다. */
export function crossCells(puzzle) {
  const out = new Map();
  for (const s of puzzle?.slots || []) {
    [...s.word].forEach((ch, k) => {
      const r = s.dir === "across" ? s.r : s.r + k;
      const c = s.dir === "across" ? s.c + k : s.c;
      out.set(crossKey(r, c), ch);
    });
  }
  return out;
}

/**
 * 낱말 시간(사용자 2026-11-23 "문제 시간도 정할 수 있게" → 「십자말 칸 하나 시간」, "낱말 퀴즈는 시간이 너무 빨라" → 둘 다 "지금의 2배").
 * 십자말 칸 시간: 5~60초, 5초 단위, 기본 30초. 뜻풀이·꼬들 문제 시간: 20~180초, 10초 단위, 기본 60초(로비 기본 30초의 2배).
 */
export const CROSS_SLOT_SEC = { min: 5, max: 60, step: 5, base: 30 };
export const DICT_QUESTION_SEC = { min: 20, max: 180, step: 10, base: 60 };

function normalizeSec(value, range) {
  const v = Number(value);
  if (value == null || !Number.isFinite(v)) return range.base;
  const n = Math.round(v / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, n));
}

export function normalizeCrossSlotSec(value) {
  return normalizeSec(value, CROSS_SLOT_SEC);
}

export function normalizeDictQuestionSec(value) {
  return normalizeSec(value, DICT_QUESTION_SEC);
}

/** 다음에 풀 칸: from 다음부터 한 바퀴 돌며 아직 안 채운 칸(못 맞힌 칸은 다시 돌아온다). 없으면 -1. */
export function crossNextSlot(done, from) {
  const n = done.length;
  for (let k = 1; k <= n; k += 1) {
    const i = (from + k + n) % n;
    if (!done[i]) return i;
  }
  return -1;
}

/**
 * 꼬들(사용자 2026-11-23: 칸은 "자모 한 개", 정답 길이 "낱말마다 다름", 추측 "길이만 맞으면 모두", "힌트 없음", 판 "줄 제한 없음").
 * 겹모음(ㅘ)·겹받침(ㄳ)은 꼬들 원작처럼 두 칸으로 나누고, 된소리(ㄲ·ㅆ…)는 한 칸.
 */
const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅗㅏ", "ㅗㅐ", "ㅗㅣ", "ㅛ", "ㅜ", "ㅜㅓ", "ㅜㅔ", "ㅜㅣ", "ㅠ", "ㅡ", "ㅡㅣ", "ㅣ"];
const JONG = ["", "ㄱ", "ㄲ", "ㄱㅅ", "ㄴ", "ㄴㅈ", "ㄴㅎ", "ㄷ", "ㄹ", "ㄹㄱ", "ㄹㅁ", "ㄹㅂ", "ㄹㅅ", "ㄹㅌ", "ㄹㅍ", "ㄹㅎ", "ㅁ", "ㅂ", "ㅂㅅ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

/** 한글 음절 → 꼬들 칸(자모) 배열. 한글 음절이 아닌 글자가 있으면 null. 띄어쓰기는 뺀다. */
export function splitJamo(text) {
  const out = [];
  for (const ch of String(text ?? "").replace(/\s+/g, "")) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return null;
    out.push(CHO[Math.floor(code / 588)], ...JUNG[Math.floor((code % 588) / 28)], ...[...JONG[code % 28]]);
  }
  return out.length ? out : null;
}

/** 칸마다 hit(자리까지 맞음) · near(다른 자리에 있음) · miss. 같은 자모가 여럿이면 정답에 든 개수만큼만 near. */
export function kordleMarks(guess, answer) {
  const marks = guess.map(() => "miss");
  const left = new Map();
  guess.forEach((g, i) => {
    if (g === answer[i]) marks[i] = "hit";
    else left.set(answer[i], (left.get(answer[i]) || 0) + 1);
  });
  guess.forEach((g, i) => {
    if (marks[i] === "hit") return;
    const n = left.get(g) || 0;
    if (n > 0) {
      marks[i] = "near";
      left.set(g, n - 1);
    }
  });
  return marks;
}

/** 채팅 한 줄 → 판에 올릴 줄({ word, cells, marks }). 한글만이고 칸 수가 정답과 같을 때만. */
export function kordleRow(text, answerCells) {
  const word = String(text ?? "").replace(/\s+/g, "");
  const cells = splitJamo(word);
  if (!cells || !Array.isArray(answerCells) || cells.length !== answerCells.length) return null;
  return { word, cells, marks: kordleMarks(cells, answerCells) };
}

/** 판에는 최근 이만큼만 보인다(줄 수 제한은 없다). */
export const KORDLE_VISIBLE_ROWS = 6;

export function normalizeDictMode(mode) {
  return DICT_MODES.includes(mode) ? mode : DICT_MODES[0];
}

export function pickDictEntries(pool, { exclude, level } = {}, count = 1) {
  const n = Math.max(1, Math.min(3, Math.floor(Number(count) || 1)));
  const all = level ? dictLevelItems(pool, level) : (pool?.items || []).slice();
  let left = exclude instanceof Set ? all.filter((row) => !exclude.has(row.key)) : all.slice();
  if (!left.length && all.length && exclude instanceof Set) {
    for (const row of all) exclude.delete(row.key);
    left = all.slice();
  }
  if (!left.length) throw new Error("낼 낱말 문제가 없습니다");
  const out = [];
  while (out.length < n && left.length) out.push(left.splice(Math.floor(Math.random() * left.length), 1)[0]);
  return out;
}

/** 시간이 지나면 글자 수 → 초성(상식·넌센스와 같은 단계). */
export const dictStage = triviaStage;
export const dictLengthHint = triviaLengthHint;

/** 정답 공개 때 카드에 붙일 출처(위키낱말사전 글은 CC BY-SA 4.0). */
export function dictSourceLine(word) {
  return `출처 · 위키낱말사전 「${word}」 (CC BY-SA 4.0)`;
}

export async function loadDictPool(fetchImpl = fetch) {
  try {
    const res = await fetchImpl(DICT_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`dict ${res.status}`);
    return buildDictPool(await res.json());
  } catch {
    return buildDictPool({});
  }
}
