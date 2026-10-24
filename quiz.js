const CHO = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

export function normalizeAnswer(text) {
  return String(text ?? "")
    .normalize("NFC")
    .replace(/[^0-9A-Za-z\uAC00-\uD7A3]/g, "")
    .toLowerCase();
}

export function toChosung(text) {
  let out = "";
  for (const ch of String(text ?? "").normalize("NFC")) {
    const code = ch.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      out += CHO[Math.floor((code - 0xac00) / 588)];
    }
  }
  return out;
}

const TITLE_SPLIT = /[:：\-–—·]/;

function addAnswerKey(keys, value, minLen = 2) {
  const n = normalizeAnswer(value);
  if (n.length >= minLen) keys.add(n);
  const noSequel = n.replace(/[2-9]$/, "");
  if (noSequel.length >= 2) keys.add(noSequel);
}

function collectAnswerKeys(texts, splitTitle) {
  const keys = new Set();
  for (const text of texts) {
    const raw = String(text ?? "").trim();
    if (!raw) continue;
    addAnswerKey(keys, raw, 1);
    if (!splitTitle) continue;
    for (const part of raw.split(TITLE_SPLIT)) {
      const piece = part.trim();
      if (piece) addAnswerKey(keys, piece);
    }
  }
  return keys;
}

export function answerKeys(answer, aliases) {
  const texts = Array.isArray(answer) ? answer : [answer];
  const keys = collectAnswerKeys(texts, true);
  for (const key of collectAnswerKeys(aliases || [], false)) keys.add(key);
  return keys;
}

export function isCorrect(guess, answer, aliases) {
  const g = normalizeAnswer(guess);
  if (!g) return false;
  const answers = answerKeys(answer, aliases);
  if (answers.has(g)) return true;
  for (const key of answerKeys(guess)) {
    if (answers.has(key)) return true;
  }
  return false;
}

export function parseChannelId(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  const path = raw.replace(/^https?:\/\//, "").split(/[?#]/, 1)[0];
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

export function createJudge({ answer, aliases = [], excludeUserId = "", match } = {}) {
  let winner = null;
  return function judge(chat) {
    if (winner) return { hit: false, winner };
    if (!chat || chat.hidden || chat.type !== "chat") {
      return { hit: false, winner };
    }
    if (excludeUserId && chat.userId === excludeUserId) {
      return { hit: false, winner };
    }
    const hit = typeof match === "function" ? match(chat.text) : isCorrect(chat.text, answer, aliases);
    if (!hit) return { hit: false, winner };
    winner = {
      nickname: chat.nickname || "익명",
      userId: chat.userId || "",
    };
    return { hit: true, winner };
  };
}

/** Remaining-time ratios that unlock the next letter hint (earliest → latest). */
export function timeHintThresholds(letterCount) {
  const n = Math.max(0, Math.floor(Number(letterCount) || 0));
  if (n <= 2) return [];
  if (n <= 4) return [0.3];
  if (n <= 6) return [0.5, 0.25];
  return [0.6, 0.35, 0.15];
}

export function timeHintTargetCount(letterCount, remainingRatio) {
  const thresholds = timeHintThresholds(letterCount);
  const ratio = Math.max(0, Math.min(1, Number(remainingRatio) || 0));
  let target = 0;
  for (const t of thresholds) {
    if (ratio <= t) target += 1;
  }
  return Math.min(target, Math.max(0, letterCount));
}

export const SCRAMBLE_MIN_UNITS = 3;
const SCRAMBLE_WORD_CHAR = /[0-9A-Za-z가-힣]/;

/** 뒤죽박죽 칸은 글자(음절). 문장도 띄어쓰기를 빼고 글자째 섞는다. */
export function scrambleUnits(text) {
  return [...String(text ?? "").normalize("NFC")].filter((ch) => SCRAMBLE_WORD_CHAR.test(ch));
}

export function scrambleProblem(text, kind = "word") {
  const units = scrambleUnits(text);
  if (kind === "sentence") {
    const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
    if (words.length < SCRAMBLE_MIN_UNITS) return "세 어절 이상으로 적어 주세요";
  } else if (units.length < SCRAMBLE_MIN_UNITS) {
    return "세 글자 이상으로 적어 주세요";
  }
  if (new Set(units).size < 2) return "서로 다른 글자가 있어야 섞을 수 있어요";
  return "";
}

function sameAsAnswer(units, order) {
  return order.every((src, slot) => units[src] === units[slot]);
}

function shuffledCopy(list, rand) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rotateSlots(order, slots) {
  const picked = slots.map((slot) => order[slot]);
  picked.push(picked.shift());
  slots.forEach((slot, i) => {
    order[slot] = picked[i];
  });
}

/** order[칸] = 원래 몇 번째 칸인지. 원래 순서와 같은 배치는 내지 않는다. */
export function makeScramble(units, rand = Math.random) {
  const slots = units.map((_, i) => i);
  let order = slots;
  if (new Set(units).size >= 2) {
    for (let i = 0; i < 64 && sameAsAnswer(units, order); i += 1) order = shuffledCopy(slots, rand);
    if (sameAsAnswer(units, order)) {
      order = slots.slice();
      rotateSlots(order, slots);
    }
  }
  const misplaced = slots.filter((slot) => units[order[slot]] !== units[slot]);
  const placed = slots.filter((slot) => units[order[slot]] === units[slot]);
  return { order, hintOrder: [...shuffledCopy(misplaced, rand), ...shuffledCopy(placed, rand)] };
}

/** 힌트로 고정해도 남은 칸에 서로 다른 것이 둘 이상 있어야 정답이 그대로 드러나지 않는다. */
export function scrambleHintLimit(units, hintOrder = []) {
  const fixed = new Set();
  let limit = 0;
  for (const slot of hintOrder) {
    fixed.add(slot);
    const loose = units.filter((_, i) => !fixed.has(i));
    if (new Set(loose).size < 2) break;
    limit += 1;
  }
  return limit;
}

export function scrambleArrangement(units, scramble, hintCount = 0) {
  const order = (scramble?.order || units.map((_, i) => i)).slice();
  const hintOrder = scramble?.hintOrder || [];
  const fixed = new Set();
  const count = Math.min(Math.max(0, Math.floor(Number(hintCount) || 0)), scrambleHintLimit(units, hintOrder));
  for (let h = 0; h < count; h += 1) {
    const slot = hintOrder[h];
    if (units[order[slot]] !== units[slot]) {
      const from = order.findIndex((src, pos) => !fixed.has(pos) && units[src] === units[slot]);
      [order[from], order[slot]] = [order[slot], order[from]];
    }
    fixed.add(slot);
    if (sameAsAnswer(units, order)) {
      rotateSlots(order, units.map((_, i) => i).filter((pos) => !fixed.has(pos)));
    }
  }
  return { order, fixed };
}

/** 뒤죽박죽 채점: 띄어쓰기·문장부호만 무시하고 전체가 같아야 한다. */
export function isExactAnswer(guess, answer) {
  const g = normalizeAnswer(guess);
  return !!g && g === normalizeAnswer(answer);
}

export const CHOSUNG_MISS_MAX = 8;
export const CHOSUNG_MISS_FONT_MIN = 16;
export const CHOSUNG_MISS_FONT_MAX = 34;
export const CHOSUNG_MISS_ROTATE_MAX = 50;

export function isChosungNearMiss(guess, answer) {
  const g = normalizeAnswer(guess);
  const a = normalizeAnswer(answer);
  if (!g || !a || g === a) return false;
  return toChosung(g) === toChosung(a);
}

export function rememberNearMiss(seen, guess, answer, { max = CHOSUNG_MISS_MAX } = {}) {
  const key = normalizeAnswer(guess);
  if (!isChosungNearMiss(guess, answer)) return null;
  if (!seen || typeof seen.has !== "function") return null;
  if (seen.has(key) || seen.size >= max) return null;
  seen.add(key);
  return key;
}

export function missChipStyle({
  fontMin = CHOSUNG_MISS_FONT_MIN,
  fontMax = CHOSUNG_MISS_FONT_MAX,
  rotateMax = CHOSUNG_MISS_ROTATE_MAX,
  rand = Math.random,
} = {}) {
  const lo = Math.min(fontMin, fontMax);
  const hi = Math.max(fontMin, fontMax);
  const fontPx = Math.round(lo + rand() * (hi - lo));
  const rotateDeg = (rand() * 2 - 1) * rotateMax;
  return { fontPx, rotateDeg };
}

export function rotatedAabb(w, h, deg) {
  const r = (Number(deg) || 0) * (Math.PI / 180);
  const cos = Math.abs(Math.cos(r));
  const sin = Math.abs(Math.sin(r));
  return {
    w: Math.abs(w) * cos + Math.abs(h) * sin,
    h: Math.abs(w) * sin + Math.abs(h) * cos,
  };
}

export function boxesOverlap(a, b) {
  if (!a || !b) return false;
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function inflateBox(box, pad) {
  const p = Number(pad) || 0;
  return {
    x: box.x - p,
    y: box.y - p,
    w: box.w + p * 2,
    h: box.h + p * 2,
  };
}

export function pickMissBox({
  areaW,
  areaH,
  chipW,
  chipH,
  avoids = [],
  tries = 48,
  pad = 16,
  rand = Math.random,
} = {}) {
  const width = Math.max(0, Number(areaW) || 0);
  const height = Math.max(0, Number(areaH) || 0);
  const cw = Math.max(1, Number(chipW) || 1);
  const ch = Math.max(1, Number(chipH) || 1);
  if (cw > width || ch > height) return null;
  const forbidden = (Array.isArray(avoids) ? avoids : []).map((box) => inflateBox(box, pad));
  const maxX = width - cw;
  const maxY = height - ch;
  for (let i = 0; i < tries; i += 1) {
    const box = { x: rand() * maxX, y: rand() * maxY, w: cw, h: ch };
    if (forbidden.every((av) => !boxesOverlap(box, av))) return box;
  }
  return null;
}

export function rankByScore(entries) {
  const sorted = [...(entries || [])].sort((a, b) => {
    const as = Number(a?.[1]) || 0;
    const bs = Number(b?.[1]) || 0;
    if (bs !== as) return bs - as;
    return String(a?.[0] || "").localeCompare(String(b?.[0] || ""), "ko");
  });
  let lastScore = null;
  let lastRank = 0;
  return sorted.map(([name, score]) => {
    const n = Number(score) || 0;
    const rank = lastScore === n ? lastRank : lastRank + 1;
    lastScore = n;
    lastRank = rank;
    return { name: String(name ?? ""), score: n, rank };
  });
}
