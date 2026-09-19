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

export function isCorrect(guess, answer) {
  const a = normalizeAnswer(answer);
  return a.length > 0 && normalizeAnswer(guess) === a;
}

export function parseChannelId(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  const path = raw.replace(/^https?:\/\//, "").split(/[?#]/, 1)[0];
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

export function createJudge({ answer, excludeUserId = "" } = {}) {
  let winner = null;
  return function judge(chat) {
    if (winner) return { hit: false, winner };
    if (!chat || chat.hidden || chat.type !== "chat") {
      return { hit: false, winner };
    }
    if (excludeUserId && chat.userId === excludeUserId) {
      return { hit: false, winner };
    }
    if (!isCorrect(chat.text, answer)) return { hit: false, winner };
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
