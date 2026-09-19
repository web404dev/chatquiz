const BEDS = {
  lobby: { src: "./audio/bgm-lobby.mp3", volume: 0.14 },
  start: { src: "./audio/bgm-start.mp3", volume: 0.18 },
  play: { src: "./audio/bgm-play.mp3", volume: 0.07 },
  podium: { src: "./audio/bgm-podium.mp3", volume: 0.16 },
};

const STINGS = {
  hit: { src: "./audio/bgm-hit.mp3", volume: 0.22, maxSec: 7 },
  miss: { src: "./audio/bgm-miss.mp3?v=2", volume: 0.2, maxSec: 6 },
};

const SFX = {
  hit: { src: "./audio/sfx-hit.mp3", volume: 0.42 },
  miss: { src: "./audio/sfx-miss.mp3", volume: 0.38 },
  count: { src: "./audio/sfx-count.mp3", volume: 0.68 },
  hint: { src: "./audio/sfx-hint.mp3", volume: 0.36 },
};

const MUTE_KEY = "quizBgmMuted:v1";

let muted = false;
try {
  muted = localStorage.getItem(MUTE_KEY) === "1";
} catch {
  muted = false;
}

let deskSilent = false;
let bedKey = "";
let stingTimer = 0;
let gestureArmed = false;
const bed = new Audio();
bed.loop = true;
bed.preload = "auto";
bed.autoplay = true;
const sting = new Audio();
sting.preload = "auto";
const sfx = new Audio();
sfx.preload = "auto";

function audioOff() {
  return muted || deskSilent;
}

function stopSfx() {
  sfx.pause();
  sfx.currentTime = 0;
}

function stopSting() {
  clearTimeout(stingTimer);
  sting.pause();
  sting.currentTime = 0;
}

function bedAbs(src) {
  return new URL(src, location.href).href;
}

function armGestureRetry() {
  if (gestureArmed) return;
  gestureArmed = true;
  const retry = () => {
    gestureArmed = false;
    document.removeEventListener("pointerdown", retry, true);
    document.removeEventListener("keydown", retry, true);
    if (bedKey) playBed(bedKey, true);
  };
  document.addEventListener("pointerdown", retry, true);
  document.addEventListener("keydown", retry, true);
}

function startBed() {
  const run = () => bed.play();
  run().catch(() => {
    bed.muted = true;
    run()
      .then(() => {
        bed.muted = false;
      })
      .catch(() => {
        bed.muted = false;
        armGestureRetry();
      });
  });
}

export function isQuizBgmMuted() {
  return muted;
}

export function setQuizBgmMuted(on) {
  muted = Boolean(on);
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // ignore
  }
  if (muted) {
    bed.pause();
    stopSting();
    stopSfx();
    return;
  }
  if (bedKey) playBed(bedKey, true);
}

export function unlockQuizAudio() {
  if (bedKey) playBed(bedKey, true);
}

export function syncQuizBgm(phase, { desk = false } = {}) {
  deskSilent = desk;
  if (desk) {
    bed.pause();
    stopSting();
    stopSfx();
    return;
  }
  if (phase !== "reveal") stopSting();
  if (phase === "countdown") playBed("");
  else if (phase === "accepting" || phase === "holding") playBed("play");
  else if (phase === "result") playBed("podium");
  else if (phase === "reveal") playBed("");
  else playBed("lobby");
}

export function playQuizSfx(kind) {
  if (audioOff()) return;
  const spec = SFX[kind];
  if (!spec) return;
  sfx.pause();
  sfx.src = spec.src;
  sfx.volume = spec.volume;
  sfx.currentTime = 0;
  sfx.play().catch(() => {});
}

export function playQuizSting(kind) {
  if (audioOff()) return;
  const spec = STINGS[kind];
  if (!spec) return;
  clearTimeout(stingTimer);
  sting.pause();
  sting.src = spec.src;
  sting.volume = spec.volume;
  sting.currentTime = 0;
  sting.play().catch(() => {});
  if (spec.maxSec) {
    stingTimer = window.setTimeout(() => {
      sting.pause();
      sting.currentTime = 0;
    }, spec.maxSec * 1000);
  }
}

function playBed(key, force = false) {
  if (key === bedKey && !force) return;
  bedKey = key;
  if (muted || !key) {
    bed.pause();
    return;
  }
  const spec = BEDS[key];
  if (!spec) {
    bed.pause();
    return;
  }
  if (bed.src !== bedAbs(spec.src)) bed.src = spec.src;
  bed.loop = true;
  bed.autoplay = true;
  bed.volume = spec.volume;
  startBed();
}
