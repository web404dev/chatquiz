const CHO = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

export function normalizeAnswer(text) {
  return String(text ?? "")
    .normalize("NFC")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function toChosung(text) {
  let out = "";
  for (const ch of String(text ?? "").normalize("NFC")) {
    const code = ch.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      out += CHO[Math.floor((code - 0xac00) / 588)];
    } else {
      out += ch;
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
