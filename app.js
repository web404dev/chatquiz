import {
  createJudge,
  parseChannelId,
  toChosung,
  timeHintTargetCount,
  rememberNearMiss,
  missChipStyle,
  rotatedAabb,
  pickMissBox,
  normalizeAnswer,
} from "./quiz.js?v=143";
import { createChzzkChat } from "./chzzk-chat.js?v=107";
import { createOfficialChzzkChat } from "./chzzk-session.js?v=109";
import {
  getWordBankStats,
  initWordBank,
  pickWordFromBank,
  pickWordEntryFromBank,
  pickWordEntriesFromBank,
} from "./word-bank.js?v=150";
import {
  pickClueEntries,
  filterClueItems,
  getClueBankStats,
  isClueSilhouetteKind,
  clueEntryKey,
  clueImageKey,
  clueImageCandidates,
} from "./genshin-bank.js?v=155";
import { CLUE_PACKS, MANGA_GENRES, MOVIE_GENRES, gamePacks, getCluePack, allGamePack } from "./clue-registry.js?v=180";
import { createDeskBridge, normFromEvent } from "./desk-bridge.js?v=107";
import { createGuestHostController } from "./guest-host.js?v=114";
import { createAuthKeep } from "./auth-keep.js?v=137";
import {
  syncQuizBgm,
  playQuizSting,
  playQuizSfx,
  isQuizBgmMuted,
  setQuizBgmMuted,
} from "./audio.js?v=192";

const params = new URLSearchParams(location.search);
const isDev = params.get("dev") === "1";
const isDeskMode = params.get("desk") === "1";
const WORKER_BASE = "https://chzzk-chat-quiz.web404dev.workers.dev";

const els = {
  prompt: document.getElementById("prompt"),
  chosungMissLayer: document.getElementById("chosungMissLayer"),
  hitFlyLayer: document.getElementById("hitFlyLayer"),
  hitFlyChip: document.getElementById("hitFlyChip"),
  hitFireworks: document.getElementById("hitFireworks"),
  guestAuthorTag: document.getElementById("guestAuthorTag"),
  autoPickCountLabel: document.getElementById("autoPickCountLabel"),
  autoPickMinus: document.getElementById("autoPickMinus"),
  autoPickPlus: document.getElementById("autoPickPlus"),
  autoPickPanel: document.getElementById("autoPickPanel"),
  autoPickList: document.getElementById("autoPickList"),
  timerSec: document.getElementById("timerSec"),
  timerBar: document.getElementById("timerBar"),
  winner: document.getElementById("winner"),
  board: document.getElementById("board"),
  status: document.getElementById("status"),
  roundLabel: document.getElementById("roundLabel"),
  canvas: document.getElementById("draw"),
  paintWrap: document.getElementById("paintWrap"),
  broadcastHud: document.getElementById("broadcastHud"),
  broadcastCropGuide: document.getElementById("broadcastCropGuide"),
  countdown: document.getElementById("countdown"),
  loginBtn: document.getElementById("loginBtn"),
  seconds: document.getElementById("seconds"),
  secondsLabel: document.getElementById("secondsLabel"),
  secondsMinus: document.getElementById("secondsMinus"),
  secondsPlus: document.getElementById("secondsPlus"),
  questionCount: document.getElementById("questionCount"),
  questionsLabel: document.getElementById("questionsLabel"),
  questionsMinus: document.getElementById("questionsMinus"),
  questionsPlus: document.getElementById("questionsPlus"),
  chatDelayOpt: document.getElementById("chatDelayOpt"),
  chatDelay: document.getElementById("chatDelay"),
  chatDelayLabel: document.getElementById("chatDelayLabel"),
  chatDelayMinus: document.getElementById("chatDelayMinus"),
  chatDelayPlus: document.getElementById("chatDelayPlus"),
  chatDelayProbeBtn: document.getElementById("chatDelayProbeBtn"),
  chatDelayInfo: document.getElementById("chatDelayInfo"),
  chatDelayInfoPop: document.getElementById("chatDelayInfoPop"),
  formatSeg: document.getElementById("formatSeg"),
  topicAxis: document.getElementById("topicAxis"),
  timeHintOpt: document.getElementById("timeHintOpt"),
  clueFields: document.getElementById("clueFields"),
  clueFieldSeg: document.getElementById("clueFieldSeg"),
  cluePackRow: document.getElementById("cluePackRow"),
  cluePackSeg: document.getElementById("cluePackSeg"),
  cluePackToggle: document.getElementById("cluePackToggle"),
  cluePackSummary: document.getElementById("cluePackSummary"),
  cluePackMenu: document.getElementById("cluePackMenu"),
  clueKindToggle: document.getElementById("clueKindToggle"),
  clueKindSummary: document.getElementById("clueKindSummary"),
  clueKindMenu: document.getElementById("clueKindMenu"),
  mangaFilters: document.getElementById("mangaFilters"),
  mediaGenreLabel: document.getElementById("mediaGenreLabel"),
  mangaGenreList: document.getElementById("mangaGenreList"),
  mangaYearList: document.getElementById("mangaYearList"),
  clueKindList: document.getElementById("clueKindList"),
  clueFilterRow: document.getElementById("clueFilterRow"),
  clueFilterSummary: document.getElementById("clueFilterSummary"),
  clueFilterMenu: document.getElementById("clueFilterMenu"),
  clueSheet: document.getElementById("clueSheet"),
  clueSheetTitle: document.getElementById("clueSheetTitle"),
  clueSheetClose: document.getElementById("clueSheetClose"),
  clueSheetApply: document.getElementById("clueSheetApply"),
  clueChosungOpt: document.getElementById("clueChosungOpt"),
  quizTts: document.getElementById("quizTts"),
  clueChosungHint: document.getElementById("clueChosungHint"),
  clueImageHint: document.getElementById("clueImageHint"),
  clueChosungInfo: document.getElementById("clueChosungInfo"),
  clueChosungInfoPop: document.getElementById("clueChosungInfoPop"),
  clueChosungLine: document.getElementById("clueChosungLine"),
  clueArt: document.getElementById("clueArt"),
  clueArtFrame: document.getElementById("clueArtFrame"),
  clueKindBadge: document.getElementById("clueKindBadge"),
  clueMeta: document.getElementById("clueMeta"),
  clueSetupStatus: document.getElementById("clueSetupStatus"),
  clueFilterToggle: document.getElementById("clueFilterToggle"),
  promptText: document.getElementById("promptText"),
  topicSeg: document.getElementById("topicSeg"),
  answer: document.getElementById("answer"),
  answerPanel: document.getElementById("answerPanel"),
  answerEditor: document.getElementById("answerEditor"),
  answerPlayingText: document.getElementById("answerPlayingText"),
  answerActionBtn: document.getElementById("answerActionBtn"),
  deskTopBar: document.getElementById("deskTopBar"),
  manualAnswerHint: document.getElementById("manualAnswerHint"),
  autoWordFields: document.getElementById("autoWordFields"),
  streamerJoinOpt: document.getElementById("streamerJoinOpt"),
  streamerJoin: document.getElementById("streamerJoin"),
  streamerJoinInfo: document.getElementById("streamerJoinInfo"),
  streamerJoinInfoPop: document.getElementById("streamerJoinInfoPop"),
  deskChatDelayOpt: document.getElementById("deskChatDelayOpt"),
  deskChatDelayLabel: document.getElementById("deskChatDelayLabel"),
  deskChatDelayMinus: document.getElementById("deskChatDelayMinus"),
  deskChatDelayPlus: document.getElementById("deskChatDelayPlus"),
  deskChatDelayProbeBtn: document.getElementById("deskChatDelayProbeBtn"),
  deskChatDelayInfo: document.getElementById("deskChatDelayInfo"),
  streamerGuessPanel: document.getElementById("streamerGuessPanel"),
  streamerGuess: document.getElementById("streamerGuess"),
  streamerGuessBtn: document.getElementById("streamerGuessBtn"),
  wordMinLabel: document.getElementById("wordMinLabel"),
  wordMaxLabel: document.getElementById("wordMaxLabel"),
  wordLenSummary: document.getElementById("wordLenSummary"),
  wordLenSlider: document.getElementById("wordLenSlider"),
  wordLenFill: document.getElementById("wordLenFill"),
  wordMinThumb: document.getElementById("wordMinThumb"),
  wordMaxThumb: document.getElementById("wordMaxThumb"),
  wordGenreMenu: document.getElementById("wordGenreMenu"),
  wordGenreToggle: document.getElementById("wordGenreToggle"),
  wordGenreSummary: document.getElementById("wordGenreSummary"),
  wordGenrePanel: document.getElementById("wordGenrePanel"),
  genreModal: document.getElementById("genreModal"),
  genreModalClose: document.getElementById("genreModalClose"),
  genreModalApply: document.getElementById("genreModalApply"),
  broadcastLobby: document.getElementById("broadcastLobby"),
  lobbyAuthBlock: document.getElementById("lobbyAuthBlock"),
  roundSettingsBlock: document.getElementById("roundSettingsBlock"),
  questionSettingsBlock: document.getElementById("questionSettingsBlock"),
  setupStartRow: document.getElementById("setupStartRow"),
  drawPanel: document.getElementById("drawPanel"),
  startBtn: document.getElementById("startBtn"),
  hostTutorial: document.getElementById("hostTutorial"),
  hostTutorialArt: document.getElementById("hostTutorialArt"),
  hostTutorialKicker: document.getElementById("hostTutorialKicker"),
  hostTutorialTitle: document.getElementById("hostTutorialTitle"),
  hostTutorialText: document.getElementById("hostTutorialText"),
  hostTutorialDots: document.getElementById("hostTutorialDots"),
  hostTutorialNext: document.getElementById("hostTutorialNext"),
  hostTutorialPrev: document.getElementById("hostTutorialPrev"),
  hostTutorialSkip: document.getElementById("hostTutorialSkip"),
  deskHelpBtn: document.getElementById("deskHelpBtn"),
  deskBgmBtn: document.getElementById("deskBgmBtn"),
  hintEnabled: document.getElementById("hintEnabled"),
  hintGenreEnabled: document.getElementById("hintGenreEnabled"),
  genreHintLine: document.getElementById("genreHintLine"),
  hintInfo: document.getElementById("hintInfo"),
  hintInfoPop: document.getElementById("hintInfoPop"),
  genreInfo: document.getElementById("genreInfo"),
  genreInfoPop: document.getElementById("genreInfoPop"),
  hintLine: document.getElementById("hintLine"),
  drawHintBar: document.getElementById("drawHintBar"),
  drawHintSlots: document.getElementById("drawHintSlots"),
  skipBtn: document.getElementById("skipBtn"),
  continueOverlay: document.getElementById("continueOverlay"),
  nextSetupOverlay: document.getElementById("nextSetupOverlay"),
  revealActions: document.getElementById("revealActions"),
  podium: document.getElementById("podium"),
  podiumConfetti: document.getElementById("podiumConfetti"),
  podiumConfirm: document.getElementById("podiumConfirm"),
  quitRoundBtn: document.getElementById("quitRoundBtn"),
  endConfirmModal: document.getElementById("endConfirmModal"),
  endConfirmCancel: document.getElementById("endConfirmCancel"),
  endConfirmOk: document.getElementById("endConfirmOk"),
  sessionTakeoverModal: document.getElementById("sessionTakeoverModal"),
  sessionTakeoverCancel: document.getElementById("sessionTakeoverCancel"),
  sessionTakeoverOk: document.getElementById("sessionTakeoverOk"),
  devBox: document.getElementById("devBox"),
  channelInput: document.getElementById("channelInput"),
  connectBtn: document.getElementById("connectBtn"),
  fakeNick: document.getElementById("fakeNick"),
  fakeText: document.getElementById("fakeText"),
  fakeSend: document.getElementById("fakeSend"),
  chatList: document.getElementById("chatList"),
  chatConnStatus: document.getElementById("chatConnStatus"),
  sideCam: document.getElementById("sideCam"),
  color: document.getElementById("color"),
  customColor: document.getElementById("customColor"),
  brushPreview: document.getElementById("brushPreview"),
  sizeRange: document.getElementById("sizeRange"),
  sizeValue: document.getElementById("sizeValue"),
  opacityRange: document.getElementById("opacityRange"),
  opacityValue: document.getElementById("opacityValue"),
  penBtn: document.getElementById("penBtn"),
  eraser: document.getElementById("eraser"),
  fillBtn: document.getElementById("fillBtn"),
  lineBtn: document.getElementById("lineBtn"),
  rectBtn: document.getElementById("rectBtn"),
  ellipseBtn: document.getElementById("ellipseBtn"),
  undo: document.getElementById("undo"),
  clear: document.getElementById("clear"),
  saveBtn: document.getElementById("saveBtn"),
  detachDeskBtn: document.getElementById("detachDeskBtn"),
  focusDeskBtn: document.getElementById("focusDeskBtn"),
  deskLinkStatus: document.getElementById("deskLinkStatus"),
  deskHud: document.getElementById("deskHud"),
  deskRoundLabel: document.getElementById("deskRoundLabel"),
  deskTimerSec: document.getElementById("deskTimerSec"),
  deskTimerBar: document.getElementById("deskTimerBar"),
  deskPaint: document.getElementById("deskPaint"),
  deskPaintWrap: document.getElementById("deskPaintWrap"),
  joinBanner: document.getElementById("joinBanner"),
  guestHostPanel: document.getElementById("guestHostPanel"),
  guestHostEnabled: document.getElementById("guestHostEnabled"),
  guestHostBody: document.getElementById("guestHostBody"),
  guestRecruiting: document.getElementById("guestRecruiting"),
  guestCanScore: document.getElementById("guestCanScore"),
  guestConsecutiveLimit: document.getElementById("guestConsecutiveLimit"),
  guestInviteRemain: document.getElementById("guestInviteRemain"),
  guestRemainText: document.getElementById("guestRemainText"),
  guestExtendBtn: document.getElementById("guestExtendBtn"),
  guestTtlHint: document.getElementById("guestTtlHint"),
  guestConnLabel: document.getElementById("guestConnLabel"),
  guestConnLabelDesk: document.getElementById("guestConnLabelDesk"),
  guestCandidateList: document.getElementById("guestCandidateList"),
  guestCandidateCount: document.getElementById("guestCandidateCount"),
  guestCandidateEmpty: document.getElementById("guestCandidateEmpty"),
  guestDesignateBtn: document.getElementById("guestDesignateBtn"),
  guestRouletteBtn: document.getElementById("guestRouletteBtn"),
  guestRouletteStage: document.getElementById("guestRouletteStage"),
  guestRouletteName: document.getElementById("guestRouletteName"),
  guestCopyLinkBtn: document.getElementById("guestCopyLinkBtn"),
  guestCancelInviteBtn: document.getElementById("guestCancelInviteBtn"),
  guestSelectedLabel: document.getElementById("guestSelectedLabel"),
  guestSelectedLabelDesk: document.getElementById("guestSelectedLabelDesk"),
  guestModal: document.getElementById("guestModal"),
  guestModalOpenBtn: document.getElementById("guestModalOpenBtn"),
  guestModalClose: document.getElementById("guestModalClose"),
  guestChildren: document.getElementById("guestChildren"),
  guestPowerHint: document.getElementById("guestPowerHint"),
  guestOpenBadge: document.getElementById("guestOpenBadge"),
  guestConnDot: document.getElementById("guestConnDot"),
  guestConnDotDesk: document.getElementById("guestConnDotDesk"),
  guestToast: document.getElementById("guestToast"),
};

const COLORS = [
  "#1a1208",
  "#e23b2f",
  "#2f6fed",
  "#1f8a4c",
  "#f4c21f",
  "#f27d1d",
  "#7b4adf",
];
const COLOR_NAMES = {
  "#1a1208": "검정",
  "#e23b2f": "빨강",
  "#2f6fed": "파랑",
  "#1f8a4c": "초록",
  "#f4c21f": "노랑",
  "#f27d1d": "주황",
  "#7b4adf": "보라",
};

let wordBank = { words: [], fetchedAt: 0 };
let clueBanks = {};
let clueBankLoading = {};
let clueField = "game";
let cluePack = "genshin";
let mangaGenres = ["all"];
let mangaYear = "all";
let movieGenres = ["all"];
let movieYear = "all";
let selectedClueKinds = ["all"];
const CLUE_PREF_KEY = "cluePrefs:v3";
const TTS_PREF_KEY = "quizTts:v1";
let chatHandle = null;
let judge = null;
let timerId = null;
let endsAt = 0;
let phase = "lobby";
let remaining = 10;
let roundTotal = 10;
let roundNow = 0;
let timerDuration = 30;
let roundActive = false;
let scores = new Map();
let session = { channelId: "", userId: "" };
let current = {
  mode: "chosung",
  format: "chosung",
  topic: "auto",
  answer: "",
  genre: "",
  hint: "",
  image: "",
  imageReveal: "",
  year: 0,
  mediaGenres: [],
  series: "",
};
let quizFormat = "chosung";
let quizTopic = "auto";
let nearMissSeen = new Set();
let manualAnswerLocked = "";
const QUIZ_MODE_PREF_KEY = "quizModePrefs:v1";
let hintCount = 0;
let hintRevealOrder = [];
let strokes = [];
let drawing = false;
let draftShape = null;
let drawTool = "pen";
const shapeFillByTool = { rect: false, ellipse: false };
let penColor = COLORS[0];
let penSize = 14;
let penOpacity = 1;
let deskBridge = null;
let deskPopup = null;
let deskPollId = 0;
let deskConnected = false;
let remoteDrawing = false;
let paintPointerDown = () => {};
let paintPointerMove = () => {};
let paintPointerUp = () => {};

let guestHost = null;
let guestUiPollId = 0;
let guestRouletteBusy = false;
let guestPickUserId = "";

function publishObs() {}
function publishObsPaint() {}

const GUEST_CONN_LABEL = {
  none: "없음",
  waiting: "대기(링크 발급)",
  connected: "연결됨",
  drawing: "그리는 중",
  gone: "끊김",
};

function setOnoffBtn(btn, on) {
  if (!btn) return;
  const pressed = !!on;
  btn.setAttribute("aria-pressed", pressed ? "true" : "false");
  const state = btn.querySelector(".onoff-state, .guest-power-state");
  if (state) state.textContent = pressed ? "ON" : "OFF";
}

function setHidden(el, hide) {
  if (!el) return;
  const hidden = !!hide;
  el.hidden = hidden;
  el.toggleAttribute("hidden", hidden);
  if ("inert" in el) el.inert = hidden;
}

function visibleFocusables(root) {
  if (!root) return [];
  const sel = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
  return [...root.querySelectorAll(sel)].filter((node) => {
    if (node.disabled || node.tabIndex < 0) return false;
    if (node.getAttribute("aria-hidden") === "true") return false;
    let cur = node;
    while (cur && cur !== root) {
      if (cur.hidden || cur.inert) return false;
      cur = cur.parentElement;
    }
    return true;
  });
}

function openModalRoot() {
  return [els.sessionTakeoverModal, els.endConfirmModal, els.genreModal, els.clueSheet, els.guestModal].find(
    (el) => el && !el.hidden,
  );
}

function trapModalFocus(event) {
  if (event.key !== "Tab") return;
  const layer = openModalRoot();
  if (!layer) return;
  const box = layer.querySelector("[role='dialog']") || layer;
  const list = visibleFocusables(box);
  if (!list.length) return;
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement;
  if (event.shiftKey) {
    if (active === first || !box.contains(active)) {
      event.preventDefault();
      last.focus();
    }
    return;
  }
  if (active === last || !box.contains(active)) {
    event.preventDefault();
    first.focus();
  }
}

let modalFocusReturn = null;

function setModalLayer(el, open, { focusSelector, returnFocus } = {}) {
  if (!el) return;
  setHidden(el, !open);
  if (open) {
    modalFocusReturn = returnFocus || document.activeElement;
    requestAnimationFrame(() => {
      const focusEl =
        (focusSelector && el.querySelector(focusSelector)) ||
        visibleFocusables(el.querySelector("[role='dialog']") || el)[0];
      focusEl?.focus?.();
    });
  } else if (modalFocusReturn?.focus) {
    modalFocusReturn.focus();
    modalFocusReturn = null;
  }
}

function setGuestModalOpen(open) {
  if (!els.guestModal) return;
  setModalLayer(els.guestModal, open, {
    focusSelector: "#guestModalClose",
    returnFocus: open ? els.guestModalOpenBtn : undefined,
  });
  if (open) renderGuestHostUi();
}

let guestToastTimer = 0;
function showGuestToast(text, ms = 2200) {
  const el = els.guestToast;
  if (!el) {
    setStatus(text);
    return;
  }
  el.textContent = text;
  setHidden(el, false);
  el.classList.add("is-show");
  if (guestToastTimer) clearTimeout(guestToastTimer);
  guestToastTimer = setTimeout(() => {
    el.classList.remove("is-show");
    setHidden(el, true);
  }, ms);
}

function applyGuestRemotePaint(msg) {
  if (!msg) return;
  if (msg.type === "paint.action") {
    if (msg.action === "undo") undoStroke();
    if (msg.action === "clear") clearStrokes();
    publishPaintPreview();
    return;
  }
  if (msg.type === "paint.pointer" || msg.type === "paint.stroke") {
    if (msg.color) selectPenColor(msg.color, true);
    if (Number.isFinite(Number(msg.size))) {
      penSize = Math.max(2, Math.min(64, Number(msg.size)));
      if (els.sizeRange) els.sizeRange.value = String(penSize);
      if (els.sizeValue) els.sizeValue.textContent = String(penSize);
      updateDrawCursor();
    }
    handleRemotePaintPointer(msg);
  }
}

function applyGuestAnswer(msg) {
  const answer = String(msg?.answer || "").trim();
  if (!answer) return;
  if (els.answer) els.answer.value = answer;
  pendingGuestAuthor = {
    answer,
    nickname: guestHost?.state.selected?.nickname || "참가자",
  };
  setStatus(`출제자 정답 수신 · [${answer}] (제출/시작은 스트리머)`);
  publishDeskState();
}

function syncJoinBanner() {
  if (!els.joinBanner || isDeskMode) return;
  const on = !!(guestHost?.state.enabled && guestHost.state.recruiting);
  setHidden(els.joinBanner, !on);
  els.joinBanner.setAttribute("aria-hidden", "true");
}

function renderGuestHostUi() {
  if (!guestHost || isDeskMode) return;
  const snap = guestHost.snapshot();
  setOnoffBtn(els.guestHostEnabled, snap.enabled);
  setOnoffBtn(els.guestRecruiting, snap.recruiting);
  setOnoffBtn(els.guestCanScore, snap.guestCanScore);
  setOnoffBtn(els.guestConsecutiveLimit, snap.consecutiveLimit);
  if (els.guestChildren) setHidden(els.guestChildren, !snap.enabled);
  if (els.guestPowerHint) setHidden(els.guestPowerHint, snap.enabled);
  if (els.guestInviteRemain) setHidden(els.guestInviteRemain, !snap.invite);
  if (els.guestTtlHint) setHidden(els.guestTtlHint, !!snap.invite);
  if (els.guestRemainText) {
    if (!snap.invite) {
      els.guestRemainText.textContent = "—";
    } else if (snap.guestPlaying) {
      els.guestRemainText.textContent = "출제 중";
    } else if (snap.remainSec <= 0) {
      els.guestRemainText.textContent = "만료됨";
    } else {
      els.guestRemainText.textContent = formatGuestRemain(snap.remainSec);
    }
  }
  if (els.guestExtendBtn) {
    els.guestExtendBtn.disabled = !snap.canExtend || guestRouletteBusy;
  }
  const connText = GUEST_CONN_LABEL[snap.guestConn] || snap.guestConn;
  if (els.guestConnLabel) els.guestConnLabel.textContent = connText;
  if (els.guestConnLabelDesk) els.guestConnLabelDesk.textContent = connText;
  if (els.guestConnDot) els.guestConnDot.setAttribute("data-conn", snap.guestConn || "none");
  if (els.guestConnDotDesk) els.guestConnDotDesk.setAttribute("data-conn", snap.guestConn || "none");
  syncGuestAuthorTag();
  if (els.guestOpenBadge) {
    let badge = "";
    if (snap.enabled && snap.recruiting) badge = "모집중";
    else if (snap.enabled && snap.selected) badge = "선정됨";
    else if (snap.enabled) badge = "ON";
    els.guestOpenBadge.textContent = badge;
    setHidden(els.guestOpenBadge, !badge);
  }
  if (els.guestCopyLinkBtn) els.guestCopyLinkBtn.disabled = !snap.invite || guestRouletteBusy;
  if (els.guestCancelInviteBtn) els.guestCancelInviteBtn.disabled = !snap.invite;
  if (els.guestRouletteBtn) els.guestRouletteBtn.disabled = guestRouletteBusy || !snap.enabled;
  const selectedText = snap.selected ? `선정: ${snap.selected.nickname}` : "";
  if (els.guestSelectedLabel) els.guestSelectedLabel.textContent = selectedText;
  if (els.guestSelectedLabelDesk) els.guestSelectedLabelDesk.textContent = selectedText;
  if (els.guestRouletteName && !guestRouletteBusy) {
    els.guestRouletteName.classList.remove("is-tick", "is-win");
    els.guestRouletteName.textContent = snap.selected?.nickname || "—";
    if (snap.selected) els.guestRouletteName.classList.add("is-win");
  }
  const pickStillThere = snap.candidates.some((c) => c.userId === guestPickUserId);
  if (!pickStillThere) guestPickUserId = "";
  const picked = snap.candidates.find((c) => c.userId === guestPickUserId);
  const pickCool = picked ? guestHost.inCooldown(picked.userId) : true;
  if (els.guestDesignateBtn) {
    els.guestDesignateBtn.disabled =
      guestRouletteBusy || !snap.enabled || !picked || pickCool;
  }
  if (els.guestCandidateCount) {
    els.guestCandidateCount.textContent = String(snap.candidates.length);
  }
  if (els.guestCandidateEmpty) {
    const empty = snap.candidates.length === 0;
    setHidden(els.guestCandidateEmpty, !empty);
  }
  if (els.guestCandidateList) {
    els.guestCandidateList.innerHTML = "";
    for (const c of snap.candidates) {
      const cool = guestHost.inCooldown(c.userId);
      const isPicked = c.userId === guestPickUserId;
      const isHost = snap.selected?.userId === c.userId;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "guest-chip";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", isPicked ? "true" : "false");
      btn.tabIndex = isPicked ? 0 : -1;
      btn.textContent = isHost ? `${c.nickname} · 출제자` : c.nickname;
      btn.disabled = cool || guestRouletteBusy;
      btn.classList.toggle("is-picked", isPicked);
      btn.classList.toggle("is-host", isHost);
      btn.classList.toggle("is-cool", cool);
      btn.title = cool ? `${c.nickname} · 연속 출제 제한` : c.nickname;
      btn.setAttribute("aria-label", cool ? `${c.nickname}, 연속 출제 제한` : btn.textContent);
      btn.addEventListener("click", () => {
        if (cool || guestRouletteBusy) return;
        guestPickUserId = c.userId;
        renderGuestHostUi();
      });
      els.guestCandidateList.appendChild(btn);
    }
    const radios = [...els.guestCandidateList.querySelectorAll('[role="radio"]')];
    if (radios.length && !radios.some((node) => node.tabIndex === 0)) {
      const first = radios.find((node) => !node.disabled) || radios[0];
      first.tabIndex = 0;
    }
  }
  syncJoinBanner();
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runGuestRoulette() {
  if (!guestHost || guestRouletteBusy) return;
  const pool = guestHost.listCandidates().filter((c) => !guestHost.inCooldown(c.userId));
  if (!pool.length) {
    setStatus("추첨할 후보가 없습니다");
    return;
  }
  const picked = pool[Math.floor(Math.random() * pool.length)];
  guestRouletteBusy = true;
  renderGuestHostUi();
  els.guestRouletteStage?.classList.add("is-spinning");
  els.guestRouletteName?.classList.remove("is-win");
  const ticks = 18 + Math.floor(Math.random() * 8);
  for (let i = 0; i < ticks; i += 1) {
    const show = pool[i % pool.length];
    if (els.guestRouletteName) {
      els.guestRouletteName.textContent = show.nickname;
      els.guestRouletteName.classList.remove("is-tick");
      // force reflow for tick pop
      void els.guestRouletteName.offsetWidth;
      els.guestRouletteName.classList.add("is-tick");
    }
    const t = 40 + i * 18;
    await sleepMs(t);
  }
  if (els.guestRouletteName) {
    els.guestRouletteName.textContent = picked.nickname;
    els.guestRouletteName.classList.remove("is-tick");
    els.guestRouletteName.classList.add("is-win");
  }
  els.guestRouletteStage?.classList.remove("is-spinning");
  try {
    await Promise.race([
      guestHost.createInviteFor(picked),
      sleepMs(4500).then(() => {
        throw new Error("초대 저장 응답 지연(Worker 미배포일 수 있음)");
      }),
    ]);
    guestPickUserId = picked.userId;
    setStatus(`룰렛: ${picked.nickname}. 링크 복사 후 채팅에 붙여넣으세요`);
  } catch (err) {
    // 로컬/미배포여도 링크는 createInviteFor 안에서 이미 잡힐 수 있음
    if (guestHost.state.invite) {
      guestPickUserId = picked.userId;
      setStatus(`룰렛: ${picked.nickname}. 링크 복사 후 채팅에 붙여넣으세요`);
    } else {
      setStatus(String(err.message || err));
    }
  } finally {
    guestRouletteBusy = false;
    renderGuestHostUi();
  }
}

function bindGuestHostUi() {
  if (isDeskMode) {
    if (els.guestHostPanel) setHidden(els.guestHostPanel, true);
    return;
  }
  guestHost = createGuestHostController({
    workerBase,
    getSession: () => session,
    isDev,
    onStatus: setStatus,
    applyRemotePaint: applyGuestRemotePaint,
    applyGuestAnswer,
  });
  setGuestModalOpen(false);
  renderGuestHostUi();

  els.guestModalOpenBtn?.addEventListener("click", () => setGuestModalOpen(true));
  els.guestModalClose?.addEventListener("click", () => setGuestModalOpen(false));
  els.guestModal?.addEventListener("click", (event) => {
    if (event.target?.dataset?.guestClose) setGuestModalOpen(false);
  });
  els.guestCandidateList?.addEventListener("keydown", (event) => {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const radios = [...els.guestCandidateList.querySelectorAll('[role="radio"]:not([disabled])')];
    if (!radios.length) return;
    event.preventDefault();
    const i = radios.indexOf(document.activeElement);
    let next = 0;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = radios.length - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (Math.max(i, 0) + 1) % radios.length;
    } else {
      next = ((i < 0 ? 0 : i) - 1 + radios.length) % radios.length;
    }
    radios[next].focus();
    radios[next].click();
  });

  const bindOnoff = (btn, apply) => {
    btn?.addEventListener("click", () => {
      if (btn.disabled) return;
      const next = btn.getAttribute("aria-pressed") !== "true";
      apply(next);
      renderGuestHostUi();
    });
  };
  bindOnoff(els.guestHostEnabled, (on) => {
    guestHost.setEnabled(on);
    if (!on) guestHost.setRecruiting(false);
  });
  bindOnoff(els.guestRecruiting, (on) => guestHost.setRecruiting(on));
  bindOnoff(els.guestCanScore, (on) => guestHost.setGuestCanScore(on));
  bindOnoff(els.guestConsecutiveLimit, (on) => guestHost.setConsecutiveLimit(on));

  els.guestExtendBtn?.addEventListener("click", async () => {
    try {
      await guestHost.extendInvite(180);
      renderGuestHostUi();
      showGuestToast("링크 참여 시간 +3분");
      setStatus("링크 참여 시간을 3분 늘렸습니다 (최대 10분)");
    } catch (err) {
      setStatus(String(err.message || err));
    }
  });
  els.guestDesignateBtn?.addEventListener("click", async () => {
    const user = guestHost.listCandidates().find((c) => c.userId === guestPickUserId);
    if (!user) {
      setStatus("참여자를 먼저 골라 주세요");
      return;
    }
    try {
      await guestHost.createInviteFor(user);
      await guestHost.copyInviteLink();
      renderGuestHostUi();
      showGuestToast("링크 복사 완료 채팅창에 남겨주세요");
      setStatus(`${user.nickname} 지정 · 링크 복사됨`);
    } catch (err) {
      setStatus(String(err.message || err));
    }
  });
  els.guestRouletteBtn?.addEventListener("click", () => {
    void runGuestRoulette();
  });
  els.guestCopyLinkBtn?.addEventListener("click", async () => {
    try {
      await guestHost.copyInviteLink();
      setStatus("출제 링크를 복사했습니다. 채팅에 붙여넣으세요");
    } catch (err) {
      setStatus(String(err.message || err));
    }
  });
  els.guestCancelInviteBtn?.addEventListener("click", async () => {
    try {
      await guestHost.revokeInvite("cancel");
      setStatus("초대를 취소했습니다");
      renderGuestHostUi();
    } catch (err) {
      setStatus(String(err.message || err));
    }
  });

  if (guestUiPollId) clearInterval(guestUiPollId);
  guestUiPollId = setInterval(() => {
    if (!guestHost) return;
    if (guestHost.isInviteExpired?.()) {
      void guestHost.revokeInvite("expired").then(() => {
        setStatus("링크 참여 시간이 끝났습니다");
        renderGuestHostUi();
      });
      return;
    }
    if (guestHost.state.invite || guestHost.state.recruiting) renderGuestHostUi();
  }, 500);
}

function deskUrl() {
  const u = new URL(location.href);
  u.searchParams.set("desk", "1");
  if (isDev) u.searchParams.set("dev", "1");
  else u.searchParams.delete("dev");
  return u.toString();
}

function setDeskDetachedUi(on) {
  document.body.classList.toggle("desk-detached", on);
  if (els.detachDeskBtn) els.detachDeskBtn.hidden = on;
  if (els.focusDeskBtn) {
    els.focusDeskBtn.hidden = !on;
    els.focusDeskBtn.toggleAttribute("hidden", !on);
  }
}

function clearDeskPoll() {
  if (deskPollId) {
    clearInterval(deskPollId);
    deskPollId = 0;
  }
}

function onDeskPopupClosed() {
  clearDeskPoll();
  deskPopup = null;
  deskConnected = false;
  setDeskDetachedUi(false);
  if (els.deskLinkStatus) {
    els.deskLinkStatus.hidden = true;
    els.deskLinkStatus.textContent = "";
  }
  setStatus("조작창이 닫혀 아래 조작칸을 다시 켰습니다");
}

function openDeskPopup() {
  if (deskPopup && !deskPopup.closed) {
    try {
      deskPopup.focus();
    } catch (_) {}
    return;
  }
  deskPopup = window.open(deskUrl(), "chatquiz-desk", "width=960,height=820");
  if (!deskPopup) {
    setStatus("팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요");
    return;
  }
  setDeskDetachedUi(true);
  clearDeskPoll();
  deskPollId = setInterval(() => {
    if (!deskPopup || deskPopup.closed) onDeskPopupClosed();
  }, 500);
  setStatus("조작창으로 분리했습니다");
  publishDeskState();
}

function buildDeskState() {
  const manual = !isAutoTopic();
  const playing = isAnswerPlayPhase();
  const showAnswerEditor = manual && !playing;
  const showAnswerPlaying = playing && Boolean(current.answer) && !shouldBlindDeskAnswer();
  const showSkip = phase === "accepting";
  const showHud =
    phase === "accepting" ||
    phase === "holding" ||
    phase === "countdown" ||
    phase === "reveal" ||
    (roundActive && phase === "ready");
  const timerSec = Number(els.timerSec?.textContent) || 0;
  const timerPct = Number.parseFloat(String(els.timerBar?.style.width || "0")) || 0;
  return {
    phase,
    statusText: els.status?.textContent || "",
    authed: isAuthed(),
    quizFormat,
    quizTopic,
    answer: els.answer?.value || "",
    answerBlind: shouldBlindDeskAnswer() || !!(els.answerEditor?.classList.contains("is-locked")),
    answerPlayingText: els.answerPlayingText?.textContent || "이번 정답 :",
    answerBtnText: els.answerActionBtn?.textContent || "제출",
    answerReadOnly: !!els.answer?.readOnly,
    showAnswerEditor,
    showAnswerPlaying,
    showDeskTopBar: showSkip || showAnswerPlaying,
    showHud,
    roundLabel: `${roundNow}/${roundTotal}`,
    timerSec,
    timerPct,
    startBtnText: els.startBtn?.textContent || "게임 시작",
    bgmMuted: isQuizBgmMuted(),
    drawPanel: !els.drawPanel?.hidden,
    paintLive: isDrawFormat() && phase === "accepting",
    pickChoices: autoPickChoices.map((e) => ({
      word: e.word,
      genre: e.genre,
      hint: e.hint,
      image: e.image,
      imageReveal: e.imageReveal,
    })),
    showAutoPick: phase === "picking" && autoPickChoices.length > 1,
    clueChosungHint: isClueChosungHintOn(),
    clueImageHint: isClueImageHintOn(),
    quizTts: isQuizTtsOn(),
    showClueChosungOpt: quizTtsAvailable() || isClueFormat(),
    showClueHintToggles: isClueFormat(),
    showDeskChatDelay: streamerDeskToolsOn(),
    showStreamerGuess: streamerGuessOpen(),
    chatDelaySec: getChatDelaySec(),
    chatDelayProbe: Boolean(delayProbe),
    hidden: {
      skipBtn: !!els.skipBtn?.hidden,
      answerPanel: !showAnswerEditor,
      answerPlayingText: !showAnswerPlaying,
      deskTopBar: !(showSkip || showAnswerPlaying),
      clueChosungOpt: !(quizTtsAvailable() || isClueFormat()),
      deskChatDelayOpt: !streamerDeskToolsOn(),
      streamerGuessPanel: !streamerGuessOpen(),
      drawPanel: !!els.drawPanel?.hidden,
      devBox: !!els.devBox?.hidden,
    },
  };
}

function publishDeskState() {
  if (isDeskMode || !deskBridge) return;
  deskBridge.post("state", buildDeskState());
}

function publishPaintPreview() {
  if (isDeskMode || !deskBridge || !els.canvas) return;
  try {
    // jpeg가 png보다 훨씬 가벼움 (미리보기용)
    deskBridge.post("paint.preview", {
      dataUrl: els.canvas.toDataURL("image/jpeg", 0.82),
    });
  } catch (_) {}
}

let deskStrokeActive = false;
let deskPendingPreview = "";
let remoteMovePoint = null;
let remoteMoveRaf = 0;

function applyPaintPreview(dataUrl) {
  if (!dataUrl) return;
  if (deskStrokeActive) {
    deskPendingPreview = dataUrl;
    return;
  }
  const canvas = els.deskPaint;
  if (!canvas) return;
  const img = new Image();
  img.onload = () => {
    if (deskStrokeActive) {
      deskPendingPreview = dataUrl;
      return;
    }
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff8e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = dataUrl;
}

function applyHiddenMap(map) {
  if (!map) return;
  const pairs = [
    ["skipBtn", els.skipBtn],
    ["answerPanel", els.answerPanel],
    ["answerPlayingText", els.answerPlayingText],
    ["deskTopBar", els.deskTopBar],
    ["clueChosungOpt", els.clueChosungOpt],
    ["deskChatDelayOpt", els.deskChatDelayOpt],
    ["streamerGuessPanel", els.streamerGuessPanel],
    ["drawPanel", els.drawPanel],
    ["devBox", els.devBox],
  ];
  for (const [key, el] of pairs) {
    if (!el || map[key] === undefined) continue;
    setHidden(el, !!map[key]);
  }
}

function setDeskLocked(locked) {
  document.body.classList.toggle("is-desk-locked", locked);
}

function applyDeskState(s) {
  if (!s) return;
  if (s.authed !== true) {
    setDeskLocked(true);
    return;
  }
  setDeskLocked(false);
  if (typeof s.phase === "string") phase = s.phase;
  if (typeof s.statusText === "string") els.status.textContent = s.statusText;
  if (s.quizFormat === "chosung" || s.quizFormat === "draw" || s.quizFormat === "clue") {
    quizFormat = s.quizFormat;
  }
  if (s.quizTopic === "auto" || s.quizTopic === "manual") quizTopic = s.quizTopic;
  if (els.startBtn && s.startBtnText) els.startBtn.textContent = s.startBtnText;
  if (!s.answerBlind && els.answer && typeof s.answer === "string") {
    // 입력 중이면 덮지 않음
    if (document.activeElement !== els.answer) els.answer.value = s.answer;
  }
  if (els.answerEditor) els.answerEditor.classList.toggle("is-locked", !!s.answerBlind);
  if (els.answerPlayingText && typeof s.answerPlayingText === "string") {
    els.answerPlayingText.textContent = s.answerPlayingText;
  }
  applyHiddenMap(s.hidden);
  // desk는 syncModeUi/syncManualAnswerUi 호출 금지 — host 스냅샷만 적용
  if (els.deskPaintWrap) {
    const showPaint = !!s.paintLive || (!!s.drawPanel && quizFormat === "draw");
    setHidden(els.deskPaintWrap, !showPaint);
    if (showPaint) requestAnimationFrame(updateDrawCursor);
  }
  if (els.deskLinkStatus) {
    els.deskLinkStatus.hidden = false;
    els.deskLinkStatus.textContent = "방송창과 연결됨";
  }
  if (typeof s.bgmMuted === "boolean") syncBgmMuteBtn(s.bgmMuted);
  if (typeof s.showAnswerEditor === "boolean" && els.answerPanel) {
    setHidden(els.answerPanel, !s.showAnswerEditor);
  }
  if (typeof s.showAnswerPlaying === "boolean" && els.answerPlayingText) {
    setHidden(els.answerPlayingText, !s.showAnswerPlaying);
  }
  if (typeof s.showDeskTopBar === "boolean" && els.deskTopBar) {
    setHidden(els.deskTopBar, !s.showDeskTopBar);
  }
  if (els.clueChosungOpt && typeof s.showClueChosungOpt === "boolean") {
    setHidden(els.clueChosungOpt, !s.showClueChosungOpt);
  }
  if (typeof s.showClueHintToggles === "boolean") syncClueOnlyDeskOpts(s.showClueHintToggles);
  if (typeof s.clueChosungHint === "boolean" && els.clueChosungHint) {
    els.clueChosungHint.checked = s.clueChosungHint;
  }
  if (typeof s.clueImageHint === "boolean" && els.clueImageHint) {
    els.clueImageHint.checked = s.clueImageHint;
  }
  if (typeof s.quizTts === "boolean" && els.quizTts) {
    els.quizTts.checked = s.quizTts;
  }
  if (typeof s.showDeskChatDelay === "boolean") setHidden(els.deskChatDelayOpt, !s.showDeskChatDelay);
  if (typeof s.showStreamerGuess === "boolean") setHidden(els.streamerGuessPanel, !s.showStreamerGuess);
  if (Number.isFinite(Number(s.chatDelaySec))) {
    const sec = Math.max(0, Math.min(20, Math.floor(Number(s.chatDelaySec))));
    if (els.chatDelay) els.chatDelay.value = String(sec);
    const label = sec ? `${sec}초` : "끔";
    if (els.chatDelayLabel) els.chatDelayLabel.textContent = label;
    if (els.deskChatDelayLabel) els.deskChatDelayLabel.textContent = label;
  }
  if (typeof s.chatDelayProbe === "boolean") {
    const probeBtn = els.deskChatDelayProbeBtn;
    if (probeBtn) {
      probeBtn.textContent = s.chatDelayProbe ? "취소" : "재기";
      probeBtn.setAttribute("aria-pressed", s.chatDelayProbe ? "true" : "false");
    }
  }
  if (Array.isArray(s.pickChoices)) {
    autoPickChoices = s.pickChoices;
    if (s.showAutoPick) renderAutoPickUi(s.pickChoices);
    else if (els.autoPickPanel) setHidden(els.autoPickPanel, true);
  }
  if (els.answerActionBtn && s.answerBtnText) {
    els.answerActionBtn.textContent = s.answerBtnText;
  }
  if (els.answer && typeof s.answerReadOnly === "boolean") {
    els.answer.readOnly = s.answerReadOnly;
    if (s.answerReadOnly) els.answer.setAttribute("readonly", "readonly");
    else els.answer.removeAttribute("readonly");
  }
  if (els.deskRoundLabel && typeof s.roundLabel === "string") {
    els.deskRoundLabel.textContent = s.roundLabel;
  }
  if (els.deskTimerSec && s.timerSec != null) {
    els.deskTimerSec.textContent = String(Math.max(0, Number(s.timerSec) || 0));
  }
  if (els.deskTimerBar && s.timerPct != null) {
    els.deskTimerBar.style.width = `${Math.max(0, Math.min(100, Number(s.timerPct) || 0))}%`;
  }
  if (els.deskHud && typeof s.showHud === "boolean") {
    setHidden(els.deskHud, !s.showHud);
  }
}

function pointFromNorm(nx, ny) {
  return {
    x: Math.max(0, Math.min(els.canvas.width, nx * els.canvas.width)),
    y: Math.max(0, Math.min(els.canvas.height, ny * els.canvas.height)),
  };
}

function handleHostDeskMessage(msg) {
  const p = msg.payload || {};
  switch (msg.type) {
    case "desk.hello":
      deskConnected = true;
      if (els.deskLinkStatus) {
        els.deskLinkStatus.hidden = false;
        els.deskLinkStatus.textContent = "조작창 연결됨";
      }
      publishDeskState();
      publishPaintPreview();
      break;
    case "desk.bye":
      onDeskPopupClosed();
      break;
    case "ui.pick":
      chooseAutoPick(Number(p.index));
      break;
    case "auth.start":
      login();
      break;
    case "ui.click":
      if (p.id) document.getElementById(p.id)?.click();
      break;
    case "ui.delay":
      if (p.action === "bump") bumpChatDelay(Number(p.delta) || 0);
      if (p.action === "probe") startChatDelayProbe();
      publishDeskState();
      break;
    case "ui.guess":
      submitStreamerGuess(p.text);
      break;
    case "ui.tutorial":
      replayHostTutorial();
      break;
    case "ui.bgm":
      toggleQuizBgmMute();
      break;
    case "ui.seg":
      if (p.axis === "format" && (p.value === "chosung" || p.value === "draw" || p.value === "clue")) {
        quizFormat = p.value;
        saveQuizModePrefs();
        syncModeUi();
        syncDeskFlow();
      }
      if (p.axis === "topic" && (p.value === "auto" || p.value === "manual")) {
        quizTopic = p.value;
        saveQuizModePrefs();
        syncModeUi();
        syncDeskFlow();
      }
      break;
    case "ui.toggle": {
      const el = document.getElementById(p.id);
      if (el && el.type === "checkbox") {
        el.checked = !!p.checked;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      break;
    }
    case "ui.input": {
      const el = document.getElementById(p.id);
      if (!el) break;
      el.value = p.value ?? "";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      if (p.id === "sizeRange" || p.id === "opacityRange" || p.id === "customColor") {
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      break;
    }
    case "ui.wordPick":
      if (Number.isFinite(p.minLen) && Number.isFinite(p.maxLen)) {
        setWordLenRange(p.minLen, p.maxLen, "min");
      }
      if (Array.isArray(p.genres)) commitGenreSelection(p.genres);
      else {
        saveWordPickPrefs();
        reportWordPickStats();
      }
      publishDeskState();
      break;
    case "ui.genre":
      if (p.action === "toggle" && p.id) toggleDraftGenre(p.id);
      if (p.action === "apply") {
        commitGenreSelection(draftGenres);
        setGenreMenuOpen(false);
      }
      if (p.action === "close") setGenreMenuOpen(false);
      if (p.action === "open") setGenreMenuOpen(true);
      publishDeskState();
      break;
    case "paint.tool":
      if (p.tool === "rect" || p.tool === "ellipse") selectShapeTool(p.tool);
      else if (p.tool) setDrawTool(p.tool);
      break;
    case "paint.style":
      if (p.color) selectPenColor(p.color, true);
      if (Number.isFinite(p.size)) {
        penSize = p.size;
        if (els.sizeRange) els.sizeRange.value = String(p.size);
        if (els.sizeValue) els.sizeValue.textContent = String(p.size);
        updateDrawCursor();
      }
      if (Number.isFinite(p.opacity)) {
        penOpacity = Math.max(0.1, Math.min(1, p.opacity));
        if (els.opacityRange) els.opacityRange.value = String(Math.round(penOpacity * 100));
        if (els.opacityValue) els.opacityValue.textContent = `${Math.round(penOpacity * 100)}%`;
        updateDrawCursor();
      }
      break;
    case "paint.action":
      if (p.action === "undo") undoStroke();
      if (p.action === "clear") clearStrokes();
      if (p.action === "save") saveDrawingPng();
      publishPaintPreview();
      break;
    case "paint.pointer":
      handleRemotePaintPointer(p);
      break;
    default:
      break;
  }
}

function handleRemotePaintPointer(p) {
  if (!els.canvas || !isDrawFormat() || (phase !== "accepting" && phase !== "holding") || els.paintWrap?.hidden) return;
  const point = pointFromNorm(Number(p.x) || 0, Number(p.y) || 0);
  if (p.phase === "down") {
    if (remoteMoveRaf) {
      cancelAnimationFrame(remoteMoveRaf);
      remoteMoveRaf = 0;
    }
    remoteMovePoint = null;
    paintPointerDown(point);
    return;
  }
  if (p.phase === "move") {
    remoteMovePoint = point;
    if (!remoteMoveRaf) {
      remoteMoveRaf = requestAnimationFrame(() => {
        remoteMoveRaf = 0;
        if (remoteMovePoint) {
          paintPointerMove(remoteMovePoint);
          remoteMovePoint = null;
        }
      });
    }
    return;
  }
  if (remoteMoveRaf) {
    cancelAnimationFrame(remoteMoveRaf);
    remoteMoveRaf = 0;
  }
  if (remoteMovePoint) {
    paintPointerMove(remoteMovePoint);
    remoteMovePoint = null;
  }
  paintPointerUp();
  publishPaintPreview();
}

function handleDeskClientMessage(msg) {
  if (msg.type === "state") applyDeskState(msg.payload);
  if (msg.type === "paint.preview") applyPaintPreview(msg.payload?.dataUrl);
  if (msg.type === "host.welcome") {
    deskConnected = true;
    if (els.deskLinkStatus) {
      els.deskLinkStatus.hidden = false;
      els.deskLinkStatus.textContent = "방송창과 연결됨";
    }
  }
}

function bindDeskHost() {
  deskBridge = createDeskBridge("host");
  deskBridge.on(handleHostDeskMessage);
  els.detachDeskBtn?.addEventListener("click", openDeskPopup);
  els.focusDeskBtn?.addEventListener("click", () => {
    if (deskPopup && !deskPopup.closed) {
      try {
        deskPopup.focus();
      } catch (_) {}
    } else openDeskPopup();
  });
  window.addEventListener("beforeunload", () => {
    deskBridge?.post("host.bye");
  });
}

function bindDeskClient() {
  document.body.classList.add("mode-desk");
  deskBridge = createDeskBridge("desk");
  deskBridge.on(handleDeskClientMessage);
  deskBridge.post("desk.hello");
  if (els.deskLinkStatus) {
    els.deskLinkStatus.hidden = false;
    els.deskLinkStatus.textContent = "방송창 연결 중…";
  }
  setStatus("방송창과 연결되면 여기서 조작합니다");

  document.body.addEventListener(
    "click",
    (event) => {
      const t = event.target.closest("button, .swatch");
      if (!t) return;
      if (t.id === "detachDeskBtn" || t.id === "focusDeskBtn") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (t.classList.contains("swatch") && t.dataset.color) {
        deskBridge.post("paint.style", { color: t.dataset.color });
        selectPenColor(t.dataset.color);
        return;
      }
      if (t.id === "penBtn") {
        deskBridge.post("paint.tool", { tool: "pen" });
        setDrawTool("pen");
      } else if (t.id === "eraser") {
        deskBridge.post("paint.tool", { tool: "eraser" });
        setDrawTool("eraser");
      } else if (t.id === "fillBtn") {
        deskBridge.post("paint.tool", { tool: "fill" });
        setDrawTool("fill");
      } else if (t.id === "lineBtn") {
        deskBridge.post("paint.tool", { tool: "line" });
        setDrawTool("line");
      } else if (t.id === "rectBtn") {
        deskBridge.post("paint.tool", { tool: "rect" });
        selectShapeTool("rect");
      } else if (t.id === "ellipseBtn") {
        deskBridge.post("paint.tool", { tool: "ellipse" });
        selectShapeTool("ellipse");
      } else if (t.id === "undo") deskBridge.post("paint.action", { action: "undo" });
      else if (t.id === "clear") deskBridge.post("paint.action", { action: "clear" });
      else if (t.id === "saveBtn") deskBridge.post("paint.action", { action: "save" });
      else if (t.id === "answerActionBtn") {
        deskBridge.post("ui.input", { id: "answer", value: els.answer?.value || "" });
        deskBridge.post("ui.click", { id: "answerActionBtn" });
      } else if (t.id === "deskHelpBtn") {
        deskBridge.post("ui.tutorial");
      } else if (t.id === "deskBgmBtn") {
        deskBridge.post("ui.bgm");
      } else if (t.id === "loginBtn") {
        deskBridge.post("auth.start");
      } else if (t.id === "deskChatDelayMinus") {
        deskBridge.post("ui.delay", { action: "bump", delta: -1 });
      } else if (t.id === "deskChatDelayPlus") {
        deskBridge.post("ui.delay", { action: "bump", delta: 1 });
      } else if (t.id === "deskChatDelayProbeBtn") {
        deskBridge.post("ui.delay", { action: "probe" });
      } else if (t.id === "streamerGuessBtn") {
        const text = els.streamerGuess?.value || "";
        if (els.streamerGuess) els.streamerGuess.value = "";
        deskBridge.post("ui.guess", { text });
      } else if (
        t.id === "skipBtn" ||
        t.id === "connectBtn" ||
        t.id === "fakeSend"
      ) {
        deskBridge.post("ui.click", { id: t.id });
      }
    },
    true,
  );

  document.body.addEventListener(
    "change",
    (event) => {
      const t = event.target;
      if (!(t instanceof HTMLInputElement) || t.type !== "checkbox") return;
      if (t.id === "clueChosungHint" || t.id === "clueImageHint" || t.id === "quizTts") {
        deskBridge.post("ui.toggle", { id: t.id, checked: t.checked });
      }
    },
    true,
  );

  document.body.addEventListener(
    "input",
    (event) => {
      const t = event.target;
      if (!(t instanceof HTMLInputElement)) return;
      if (t.id === "sizeRange") {
        penSize = Number(t.value) || 14;
        deskBridge.post("paint.style", { size: penSize });
        if (els.sizeValue) els.sizeValue.textContent = String(t.value);
        updateDrawCursor();
        return;
      }
      if (t.id === "opacityRange") {
        penOpacity = Math.max(0.1, Math.min(1, (Number(t.value) || 100) / 100));
        deskBridge.post("paint.style", { opacity: penOpacity });
        if (els.opacityValue) els.opacityValue.textContent = `${t.value}%`;
        updateDrawCursor();
        return;
      }
      if (t.id === "customColor") {
        deskBridge.post("paint.style", { color: t.value });
        selectPenColor(t.value, true);
        return;
      }
      if (t.id === "answer" || t.id === "fakeText" || t.id === "fakeNick" || t.id === "channelInput") {
        deskBridge.post("ui.input", { id: t.id, value: t.value });
      }
    },
    true,
  );

  bindDeskPaintInput();

  window.addEventListener("pagehide", () => {
    deskBridge?.post("desk.bye");
  });
  setInterval(() => deskBridge?.post("desk.hello"), 4000);
}

function bindDeskPaintInput() {
  const canvas = els.deskPaint;
  if (!canvas) return;
  let down = false;
  let localLast = null;
  let pendingNorm = null;
  let sendRaf = 0;
  const hostW = 1280;

  const flushSend = (phase) => {
    if (!pendingNorm) return;
    const n = pendingNorm;
    if (phase !== "move") pendingNorm = null;
    deskBridge.post("paint.pointer", {
      phase,
      x: n.x,
      y: n.y,
    });
  };

  const scheduleMoveSend = () => {
    if (sendRaf) return;
    sendRaf = requestAnimationFrame(() => {
      sendRaf = 0;
      flushSend("move");
    });
  };

  const localPoint = (event) => {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;
    return {
      x: ((event.clientX - rect.left) / w) * canvas.width,
      y: ((event.clientY - rect.top) / h) * canvas.height,
    };
  };

  const paintLocalSegment = (from, to) => {
    if (drawTool === "fill" || SHAPE_TOOLS.has(drawTool)) return;
    const ctx = canvas.getContext("2d");
    const scale = canvas.width / hostW;
    const size = Math.max(1, penSize * scale);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size;
    if (drawTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = colorWithAlpha(penColor || COLORS[0], penOpacity);
      ctx.globalAlpha = 1;
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  };

  const paintLocalDot = (pt) => paintLocalSegment(pt, pt);

  const endStroke = (phase, event) => {
    if (!down) return;
    down = false;
    deskStrokeActive = false;
    if (sendRaf) {
      cancelAnimationFrame(sendRaf);
      sendRaf = 0;
    }
    pendingNorm = normFromEvent(canvas, event);
    flushSend(phase);
    localLast = null;
    if (deskPendingPreview) {
      const url = deskPendingPreview;
      deskPendingPreview = "";
      applyPaintPreview(url);
    }
  };

  canvas.addEventListener("pointerdown", (event) => {
    down = true;
    deskStrokeActive = true;
    deskPendingPreview = "";
    canvas.setPointerCapture?.(event.pointerId);
    const n = normFromEvent(canvas, event);
    pendingNorm = n;
    flushSend("down");
    localLast = localPoint(event);
    paintLocalDot(localLast);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!down) return;
    event.preventDefault();
    pendingNorm = normFromEvent(canvas, event);
    scheduleMoveSend();
    const pt = localPoint(event);
    if (localLast) paintLocalSegment(localLast, pt);
    localLast = pt;
  });
  canvas.addEventListener("pointerup", (event) => endStroke("up", event));
  canvas.addEventListener("pointercancel", (event) => endStroke("cancel", event));
}

function cleanReturnPath() {
  const q = new URLSearchParams();
  if (isDev) q.set("dev", "1");
  const qs = q.toString();
  return qs ? `${location.pathname}?${qs}` : location.pathname;
}

const SHAPE_TOOLS = new Set(["line", "rect", "ellipse"]);

function hexToRgb(hex) {
  const raw = String(hex || "").replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n) || full.length !== 6) return { r: 26, g: 18, b: 8 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function colorWithAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function updateBrushPreview() {
  const canvas = els.brushPreview;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const radius = Math.max(1, Math.min(penSize / 2, (Math.min(w, h) / 2) - 4));
  const paint = colorWithAlpha(penColor, penOpacity);
  if (drawTool === "eraser") {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2 - radius * 0.45, h / 2 - radius * 0.45);
    ctx.lineTo(w / 2 + radius * 0.45, h / 2 + radius * 0.45);
    ctx.moveTo(w / 2 + radius * 0.45, h / 2 - radius * 0.45);
    ctx.lineTo(w / 2 - radius * 0.45, h / 2 + radius * 0.45);
    ctx.strokeStyle = "#c0392b";
    ctx.stroke();
  } else if (drawTool === "fill") {
    ctx.fillStyle = paint;
    ctx.fillRect(w * 0.22, h * 0.28, w * 0.56, h * 0.48);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.22, h * 0.28, w * 0.56, h * 0.48);
  } else if (drawTool === "line") {
    ctx.strokeStyle = paint;
    ctx.lineWidth = Math.max(2, Math.min(6, penSize / 4));
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(6, h - 8);
    ctx.lineTo(w - 6, 8);
    ctx.stroke();
  } else if (drawTool === "rect" || drawTool === "ellipse") {
    ctx.lineWidth = Math.max(2, Math.min(5, penSize / 5));
    if (isShapeFilled(drawTool)) {
      ctx.fillStyle = paint;
      if (drawTool === "rect") ctx.fillRect(8, 10, w - 16, h - 20);
      else {
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, (w - 16) / 2, (h - 20) / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = paint;
      if (drawTool === "rect") ctx.strokeRect(8, 10, w - 16, h - 20);
      else {
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, (w - 16) / 2, (h - 20) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = paint;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (els.sizeValue) els.sizeValue.textContent = String(penSize);
  if (els.opacityValue) els.opacityValue.textContent = `${Math.round(penOpacity * 100)}%`;
  els.sizeRange?.setAttribute("aria-valuetext", `${penSize}`);
  els.opacityRange?.setAttribute("aria-valuetext", `${Math.round(penOpacity * 100)}퍼센트`);
}

function isShapeFilled(tool) {
  return Boolean(shapeFillByTool[tool]);
}

function syncShapeFaces(root, filled) {
  if (!root) return;
  const stroke = root.querySelector(".is-stroke");
  const fill = root.querySelector(".is-fill");
  stroke?.classList.toggle("is-front", !filled);
  fill?.classList.toggle("is-front", filled);
}

function updateShapeStyleUi() {
  syncShapeFaces(els.rectBtn, isShapeFilled("rect"));
  syncShapeFaces(els.ellipseBtn, isShapeFilled("ellipse"));
  if (els.rectBtn) {
    const mode = isShapeFilled("rect") ? "채우기" : "테두리";
    els.rectBtn.title = `사각형 · ${mode} (다시 누르면 전환)`;
    els.rectBtn.setAttribute("aria-label", `사각형 ${mode}`);
  }
  if (els.ellipseBtn) {
    const mode = isShapeFilled("ellipse") ? "채우기" : "테두리";
    els.ellipseBtn.title = `원 · ${mode} (다시 누르면 전환)`;
    els.ellipseBtn.setAttribute("aria-label", `원 ${mode}`);
  }
}

function updateDrawCursor() {
  updateBrushPreview();
  updateShapeStyleUi();
  const hostW = els.canvas?.width || 1280;
  const hostH = els.canvas?.height || 720;
  const targets = [els.canvas, els.deskPaint].filter(Boolean);

  for (const target of targets) {
    if (drawTool === "fill") {
      target.style.cursor = "cell";
      continue;
    }
    if (SHAPE_TOOLS.has(drawTool)) {
      target.style.cursor = "crosshair";
      continue;
    }
    const rect = target.getBoundingClientRect();
    const scaleX = rect.width > 0 ? rect.width / hostW : 1;
    const scaleY = rect.height > 0 ? rect.height / hostH : 1;
    const scale = Math.min(scaleX, scaleY);
    let radius = Math.round((penSize * scale) / 2);
    radius = Math.max(2, Math.min(radius, 48));
    const pad = 2;
    const size = radius * 2 + pad * 2;
    const tip = document.createElement("canvas");
    tip.width = size;
    tip.height = size;
    const ctx = tip.getContext("2d");
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    if (drawTool === "eraser") {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.45, cy - radius * 0.45);
      ctx.lineTo(cx + radius * 0.45, cy + radius * 0.45);
      ctx.moveTo(cx + radius * 0.45, cy - radius * 0.45);
      ctx.lineTo(cx - radius * 0.45, cy + radius * 0.45);
      ctx.strokeStyle = "#c0392b";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = colorWithAlpha(penColor || COLORS[0], penOpacity);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    const hot = Math.floor(size / 2);
    target.style.cursor = `url(${tip.toDataURL("image/png")}) ${hot} ${hot}, crosshair`;
  }
}

function selectPenColor(hex, fromCustom = false) {
  penColor = hex;
  if (drawTool === "eraser") setDrawTool("pen");
  else updateDrawCursor();
  els.color?.querySelectorAll(".swatch").forEach((node) => {
    const on = !fromCustom && node.dataset.color === hex;
    node.classList.toggle("active", on);
    node.setAttribute("aria-checked", on ? "true" : "false");
    node.tabIndex = on ? 0 : -1;
  });
  if (els.customColor && !fromCustom) {
    els.customColor.value = hex.length === 7 ? hex : "#1a1208";
  }
  if (fromCustom) {
    els.color?.querySelectorAll(".swatch").forEach((node) => {
      node.classList.remove("active");
      node.setAttribute("aria-checked", "false");
      node.tabIndex = -1;
    });
  }
}

function setDrawTool(tool) {
  drawTool = tool;
  const flags = [
    [els.penBtn, "pen"],
    [els.eraser, "eraser"],
    [els.fillBtn, "fill"],
    [els.lineBtn, "line"],
    [els.rectBtn, "rect"],
    [els.ellipseBtn, "ellipse"],
  ];
  for (const [btn, id] of flags) {
    const on = tool === id;
    btn?.classList.toggle("active", on);
    btn?.classList.toggle("tool-active", on && (id === "rect" || id === "ellipse"));
    btn?.setAttribute("aria-pressed", on ? "true" : "false");
  }
  updateDrawCursor();
}

function selectShapeTool(tool) {
  if (drawTool === tool) toggleShapeFilled(tool);
  else setDrawTool(tool);
}

function toggleShapeFilled(tool) {
  if (!Object.prototype.hasOwnProperty.call(shapeFillByTool, tool)) return;
  shapeFillByTool[tool] = !shapeFillByTool[tool];
  updateDrawCursor();
}

function nudgePenSize(delta) {
  penSize = Math.max(1, Math.min(64, penSize + delta));
  if (els.sizeRange) els.sizeRange.value = String(penSize);
  updateDrawCursor();
}

function isTypingTarget(node) {
  if (!node || !(node instanceof Element)) return false;
  const tag = node.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(node.closest?.("[contenteditable='true']"));
}

function paintShape(ctx, shape) {
  const filled = shape.shape !== "line" && shape.filled;
  ctx.globalAlpha = shape.alpha ?? 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;
  ctx.lineWidth = shape.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const x = Math.min(shape.x1, shape.x2);
  const y = Math.min(shape.y1, shape.y2);
  const w = Math.abs(shape.x2 - shape.x1);
  const h = Math.abs(shape.y2 - shape.y1);
  ctx.beginPath();
  if (shape.shape === "line") {
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
    ctx.stroke();
  } else if (shape.shape === "rect") {
    if (filled) ctx.fillRect(x, y, w, h);
    else ctx.strokeRect(x, y, w, h);
  } else if (shape.shape === "ellipse") {
    ctx.ellipse(x + w / 2, y + h / 2, Math.max(w / 2, 0.5), Math.max(h / 2, 0.5), 0, 0, Math.PI * 2);
    if (filled) ctx.fill();
    else ctx.stroke();
  }
}

function shuffleIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function resetHintRevealOrder(answer) {
  const len = [...String(answer || "")].length;
  hintRevealOrder = shuffleIndices(len);
}

function revealedIndexSet(revealedCount) {
  const n = Math.max(0, Math.min(Number(revealedCount) || 0, hintRevealOrder.length));
  return new Set(hintRevealOrder.slice(0, n));
}

function maskAnswer(answer, revealed) {
  const chars = [...String(answer || "")];
  if (!chars.length) return "";
  if (!hintRevealOrder.length || hintRevealOrder.length !== chars.length) {
    resetHintRevealOrder(answer);
  }
  const open = revealedIndexSet(revealed);
  return chars.map((ch, i) => (open.has(i) ? ch : "○")).join("");
}

function hintsAllowed() {
  if (isClueFormat() || current.mode === "clue") return false;
  return Boolean(els.hintEnabled?.checked);
}

function genreHintsAllowed() {
  return Boolean(els.hintGenreEnabled?.checked);
}

function syncGenreHintUi() {
  const line = els.genreHintLine;
  if (!line) return;
  const genre = String(current.genre || "").trim();
  const clue = isClueFormat(current.format) || current.mode === "clue";
  const show =
    phase === "accepting" &&
    genre &&
    genre !== "전체" &&
    !clue &&
    genreHintsAllowed();
  line.hidden = !show;
  line.toggleAttribute("hidden", !show);
  line.textContent = show ? `장르 · ${genre}` : "";
}

function formatSecondsLabel(sec) {
  const n = Math.max(0, Math.round(Number(sec) || 0));
  if (n < 60) return `${n}초`;
  const min = Math.floor(n / 60);
  const rem = n % 60;
  if (rem === 0) return `${min}분`;
  return `${min}분 ${rem}초`;
}

function formatGuestRemain(sec) {
  const n = Math.max(0, Math.floor(Number(sec) || 0));
  const min = Math.floor(n / 60);
  const rem = n % 60;
  return `${min}:${String(rem).padStart(2, "0")}`;
}

function syncRoundSettingLabels() {
  const sec = Math.max(10, Number(els.seconds?.value) || 30);
  const count = Math.max(1, Number(els.questionCount?.value) || 10);
  if (els.seconds) els.seconds.value = String(sec);
  if (els.questionCount) els.questionCount.value = String(count);
  if (els.secondsLabel) els.secondsLabel.textContent = formatSecondsLabel(sec);
  if (els.questionsLabel) els.questionsLabel.textContent = `${count}문제`;
}

function bumpSeconds(delta) {
  const cur = Math.max(10, Number(els.seconds?.value) || 30);
  const next = Math.max(10, Math.min(600, cur + delta));
  if (els.seconds) els.seconds.value = String(next);
  syncRoundSettingLabels();
}

function bumpQuestions(delta) {
  const cur = Math.max(1, Number(els.questionCount?.value) || 10);
  const next = Math.max(1, Math.min(50, cur + delta));
  if (els.questionCount) els.questionCount.value = String(next);
  syncRoundSettingLabels();
}

const CHAT_DELAY_PREF = "chatDelaySec:v1";
let holdGen = 0;
let holdStartedAt = 0;
let delayProbe = null;
const sideChatQueue = [];

function getChatDelaySec() {
  return Math.max(0, Math.min(20, Math.floor(Number(els.chatDelay?.value) || 0)));
}

function syncChatDelayLabel() {
  const sec = getChatDelaySec();
  const label = sec ? `${sec}초` : "끔";
  if (els.chatDelayLabel) els.chatDelayLabel.textContent = label;
  if (els.deskChatDelayLabel) els.deskChatDelayLabel.textContent = label;
}

function setChatDelaySec(sec) {
  const next = Math.max(0, Math.min(20, Math.floor(Number(sec) || 0)));
  if (els.chatDelay) els.chatDelay.value = String(next);
  syncChatDelayLabel();
  try {
    localStorage.setItem(CHAT_DELAY_PREF, String(next));
  } catch {
    // ignore
  }
  publishDeskState();
}

function bumpChatDelay(delta) {
  setChatDelaySec(getChatDelaySec() + delta);
}

function restoreChatDelayPref() {
  const raw = Number(localStorage.getItem(CHAT_DELAY_PREF));
  if (Number.isFinite(raw) && raw >= 0) setChatDelaySec(raw);
  else syncChatDelayLabel();
}

function cancelHolds() {
  holdGen += 1;
  holdStartedAt = 0;
  flushSideChatQueue();
}

function startChatDelayProbe() {
  if (roundActive || phase === "accepting" || phase === "holding" || phase === "countdown" || phase === "picking") {
    setStatus("한 판 중에는 딜레이를 잴 수 없습니다");
    return;
  }
  if (delayProbe) {
    stopChatDelayProbe("재기를 취소했습니다");
    return;
  }
  const token = `딜${Math.floor(10 + Math.random() * 90)}`;
  delayProbe = {
    token,
    startedAt: Date.now(),
    timer: setTimeout(() => stopChatDelayProbe("시간 초과. 다시 재 주세요"), 25000),
  };
  els.countdown?.classList.add("is-probe");
  setCountdownVisible(token);
  for (const btn of [els.chatDelayProbeBtn, els.deskChatDelayProbeBtn]) {
    if (!btn) continue;
    btn.textContent = "취소";
    btn.setAttribute("aria-pressed", "true");
  }
  setStatus(`방송에 뜬 ${token} 을 채팅에 치세요. 미리보기가 아니라 송출 화면을 보고 쳐 주세요`);
  publishDeskState();
}

function stopChatDelayProbe(msg) {
  if (delayProbe?.timer) clearTimeout(delayProbe.timer);
  delayProbe = null;
  els.countdown?.classList.remove("is-probe");
  if (phase !== "countdown") setCountdownVisible(null);
  for (const btn of [els.chatDelayProbeBtn, els.deskChatDelayProbeBtn]) {
    if (!btn) continue;
    btn.textContent = "재기";
    btn.setAttribute("aria-pressed", "false");
  }
  if (msg) setStatus(msg);
  else publishDeskState();
}

function noteChatDelayProbe(chat) {
  if (!delayProbe) return false;
  const text = String(chat?.text || "").replace(/\s+/g, "");
  if (text !== delayProbe.token) return false;
  const sec = Math.max(0, Math.min(20, Math.round((Date.now() - delayProbe.startedAt) / 1000)));
  setChatDelaySec(sec);
  stopChatDelayProbe(sec ? `채팅 딜레이 ${sec}초로 맞춤` : "딜레이가 거의 없습니다. 끔으로 두었습니다");
  return true;
}

async function runChatDelayHold(seconds, token) {
  for (let n = seconds; n > 0; n -= 1) {
    if (holdGen !== token || phase !== "holding" || !roundActive) return false;
    setStatus(`채팅 딜레이 대기 ${n}초`);
    await sleep(1000);
  }
  return holdGen === token && phase === "holding";
}

function bindInfoTip(info, pop) {
  if (!info || !pop) return;
  info.setAttribute("aria-expanded", "false");

  const place = () => {
    const r = info.getBoundingClientRect();
    const pad = 12;
    const width = Math.min(280, window.innerWidth - pad * 2);
    let left = r.left + r.width / 2 - width / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
    pop.style.width = `${width}px`;
    pop.hidden = false;
    const h = pop.offsetHeight || 120;
    let top = r.bottom + 8;
    if (top + h > window.innerHeight - pad) {
      top = Math.max(pad, r.top - h - 8);
    }
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    info.setAttribute("aria-expanded", "true");
  };

  const show = () => {
    place();
  };
  const hide = () => {
    pop.hidden = true;
    info.setAttribute("aria-expanded", "false");
  };
  const stillInside = (related) =>
    related instanceof Node && (info.contains(related) || pop.contains(related));

  info.addEventListener("mouseenter", show);
  info.addEventListener("focus", show);
  info.addEventListener("click", (event) => {
    event.preventDefault();
    if (pop.hidden) show();
    else hide();
  });
  info.addEventListener("mouseleave", (event) => {
    if (stillInside(event.relatedTarget)) return;
    hide();
  });
  info.addEventListener("blur", () => {
    requestAnimationFrame(() => {
      if (document.activeElement === info || pop.contains(document.activeElement)) return;
      hide();
    });
  });
  pop.addEventListener("mouseenter", show);
  pop.addEventListener("mouseleave", (event) => {
    if (stillInside(event.relatedTarget)) return;
    hide();
  });
  window.addEventListener("resize", () => {
    if (!pop.hidden) place();
  });
}

function bindHintInfoTip() {
  bindInfoTip(els.hintInfo, els.hintInfoPop);
  bindInfoTip(els.genreInfo, els.genreInfoPop);
  bindInfoTip(els.streamerJoinInfo, els.streamerJoinInfoPop);
  bindInfoTip(els.clueChosungInfo, els.clueChosungInfoPop);
  bindInfoTip(els.chatDelayInfo, els.chatDelayInfoPop);
  bindInfoTip(els.deskChatDelayInfo, els.chatDelayInfoPop);
}

function bindRoundSteppers() {
  els.secondsMinus?.addEventListener("click", () => bumpSeconds(-10));
  els.secondsPlus?.addEventListener("click", () => bumpSeconds(10));
  els.questionsMinus?.addEventListener("click", () => bumpQuestions(-1));
  els.questionsPlus?.addEventListener("click", () => bumpQuestions(1));
  els.autoPickMinus?.addEventListener("click", () => bumpAutoPickCount(-1));
  els.autoPickPlus?.addEventListener("click", () => bumpAutoPickCount(1));
  els.chatDelayMinus?.addEventListener("click", () => bumpChatDelay(-1));
  els.chatDelayPlus?.addEventListener("click", () => bumpChatDelay(1));
  els.chatDelayProbeBtn?.addEventListener("click", startChatDelayProbe);
  els.deskChatDelayMinus?.addEventListener("click", () => {
    if (isDeskMode) return;
    bumpChatDelay(-1);
  });
  els.deskChatDelayPlus?.addEventListener("click", () => {
    if (isDeskMode) return;
    bumpChatDelay(1);
  });
  els.deskChatDelayProbeBtn?.addEventListener("click", () => {
    if (isDeskMode) return;
    startChatDelayProbe();
  });
  els.streamerGuessBtn?.addEventListener("click", () => {
    if (isDeskMode) return;
    submitStreamerGuess();
  });
  els.streamerGuess?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (isDeskMode) {
      const text = els.streamerGuess?.value || "";
      if (els.streamerGuess) els.streamerGuess.value = "";
      deskBridge?.post("ui.guess", { text });
      return;
    }
    submitStreamerGuess();
  });
  restoreChatDelayPref();
  syncRoundSettingLabels();
  syncAutoPickCountUi();
}

function updateHintUi() {
  syncDeskFlow();
}

function applyTimeHints(remainingRatio) {
  if (phase !== "accepting" || !hintsAllowed()) return;
  const total = [...(current.answer || "")].length;
  if (!total) return;
  const target = timeHintTargetCount(total, remainingRatio);
  if (target <= hintCount) return;
  hintCount = target;
  playQuizSfx("hint");
  renderQuestionView();
  syncGenreHintUi();
  setStatus(`시간 힌트 ${hintCount}/${total}`);
}

function isAuthed() {
  return Boolean(session?.channelId);
}

const HOST_TUTORIAL_STEPS = [
  {
    id: "crop",
    title: "OBS에는 점선 안만",
    text: "위쪽 퀴즈·점수·채팅만 캡처하세요. 아래 조작창은 방송에 넣지 않습니다.",
    art: `<svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="14" width="248" height="132" rx="12" fill="#0e1528" stroke="#3de7ff" stroke-width="3"/><rect x="28" y="24" width="228" height="112" rx="8" stroke="#ffe14a" stroke-width="2" stroke-dasharray="7 5"/><text x="142" y="78" text-anchor="middle" fill="#f4f7ff" font-size="22" font-weight="800">ㄱ ㅇ ㅇ</text><text x="142" y="102" text-anchor="middle" fill="#ffe14a" font-size="11" font-weight="800">방송에 나감</text><rect x="18" y="154" width="248" height="32" rx="8" fill="#1b2744" stroke="#6b82b0" stroke-width="2"/><text x="142" y="175" text-anchor="middle" fill="#8b9bc4" font-size="12" font-weight="800">조작창 · 캡처 안 함</text><path d="M278 80 H318" stroke="#ffe14a" stroke-width="3"/><path d="M308 70 L322 80 L308 90" fill="#ffe14a"/><text x="328" y="86" fill="#ffe14a" font-size="13" font-weight="800">OBS</text></svg>`,
  },
  {
    id: "format",
    title: "유형을 고르세요",
    text: "초성: 첫소리만 보여 줍니다. 그림: 직접 그립니다. 단서: 작품·캐릭터 힌트로 맞춥니다.",
    art: `<svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="46" width="100" height="108" rx="14" fill="#ffe14a"/><text x="66" y="92" text-anchor="middle" fill="#060912" font-size="20" font-weight="900">초성</text><text x="66" y="118" text-anchor="middle" fill="#060912" font-size="13">ㄱ ㅇ ㅇ</text><rect x="130" y="46" width="100" height="108" rx="14" fill="#1b2744" stroke="#6b82b0" stroke-width="2"/><text x="180" y="92" text-anchor="middle" fill="#f4f7ff" font-size="20" font-weight="900">그림</text><rect x="154" y="108" width="52" height="28" rx="6" fill="#3de7ff"/><rect x="244" y="46" width="100" height="108" rx="14" fill="#1b2744" stroke="#6b82b0" stroke-width="2"/><text x="294" y="92" text-anchor="middle" fill="#f4f7ff" font-size="20" font-weight="900">단서</text><text x="294" y="122" text-anchor="middle" fill="#9eb0d8" font-size="12">원신 · 영화</text></svg>`,
  },
  {
    id: "auto",
    title: "자동이면 조건만 고르면 됨",
    text: "글자 수·장르·고를 문제 개수를 정하면 단어가 자동으로 나옵니다. 수동은 조작창에 정답을 직접 넣습니다.",
    art: `<svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="36" width="150" height="128" rx="14" fill="#0e1528" stroke="#3de7ff" stroke-width="2"/><text x="95" y="64" text-anchor="middle" fill="#3de7ff" font-size="13" font-weight="800">자동</text><text x="95" y="92" text-anchor="middle" fill="#f4f7ff" font-size="14" font-weight="800">글자 2–4</text><text x="95" y="116" text-anchor="middle" fill="#f4f7ff" font-size="14" font-weight="800">장르 전체</text><text x="95" y="140" text-anchor="middle" fill="#9eb0d8" font-size="12">고를 문제 1개</text><rect x="190" y="36" width="150" height="128" rx="14" fill="#121a30" stroke="#6b82b0" stroke-width="2"/><text x="265" y="64" text-anchor="middle" fill="#8b9bc4" font-size="13" font-weight="800">수동</text><rect x="208" y="86" width="114" height="36" rx="8" fill="#1b2744" stroke="#ffe14a" stroke-width="2"/><text x="265" y="110" text-anchor="middle" fill="#ffe14a" font-size="13" font-weight="800">정답 입력</text></svg>`,
  },
  {
    id: "delay",
    title: "채팅이 늦으면 딜레이",
    text: "방송이 몇 초 늦으면 그 시간만큼 기다린 뒤 정답을 받습니다. 재기: 송출 화면에 뜬 글자를 채팅에 치세요.",
    art: `<svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="110" cy="100" r="54" stroke="#3de7ff" stroke-width="6"/><path d="M110 64 V100 L136 116" stroke="#ffe14a" stroke-width="6" stroke-linecap="round"/><text x="240" y="88" text-anchor="middle" fill="#f4f7ff" font-size="28" font-weight="900">3초</text><text x="240" y="120" text-anchor="middle" fill="#9eb0d8" font-size="13" font-weight="800">재기로 맞출 수 있음</text></svg>`,
  },
  {
    id: "streamer",
    title: "스트리머도 맞출 수 있음",
    text: "스트리머 참여를 켜면 채팅으로도, 조작창 「내 정답」으로도 맞출 수 있습니다. 조작칸에는 정답이 안 보입니다.",
    art: `<svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="22" y="40" width="150" height="120" rx="14" fill="#0e1528" stroke="#3de7ff" stroke-width="2"/><text x="97" y="78" text-anchor="middle" fill="#f4f7ff" font-size="16" font-weight="800">채팅</text><rect x="42" y="96" width="110" height="28" rx="8" fill="#ffe14a"/><text x="97" y="115" text-anchor="middle" fill="#060912" font-size="13" font-weight="800">고양이</text><rect x="188" y="40" width="150" height="120" rx="14" fill="#121a30" stroke="#6b82b0" stroke-width="2"/><text x="263" y="78" text-anchor="middle" fill="#f4f7ff" font-size="16" font-weight="800">조작창</text><rect x="208" y="96" width="110" height="28" rx="8" fill="#1b2744" stroke="#ffe14a" stroke-width="2"/><text x="263" y="115" text-anchor="middle" fill="#ffe14a" font-size="13" font-weight="800">맞추기</text></svg>`,
  },
  {
    id: "guest",
    title: "시청자가 문제를 낼 수도",
    text: "시청자 참여를 켜면 채팅에 !참여. 룰렛이나 지정으로 출제자를 고릅니다. 초대 링크로도 들어올 수 있습니다.",
    art: `<svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="180" cy="78" r="36" fill="#ffe14a"/><text x="180" y="86" text-anchor="middle" fill="#060912" font-size="18" font-weight="900">!</text><text x="180" y="132" text-anchor="middle" fill="#f4f7ff" font-size="20" font-weight="900">!참여</text><text x="180" y="158" text-anchor="middle" fill="#9eb0d8" font-size="13" font-weight="800">모집 → 룰렛/지정 → 출제</text></svg>`,
  },
  {
    id: "chat",
    title: "정답은 채팅",
    text: "초성·단서는 이름 전체를 채팅에 칩니다. 맞으면 점수가 올라가고, 시간 힌트를 켜면 글자가 조금씩 열립니다.",
    art: `<svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="24" y="18" width="200" height="120" rx="12" fill="#0e1528" stroke="#3de7ff" stroke-width="3"/><text x="124" y="78" text-anchor="middle" fill="#f4f7ff" font-size="28" font-weight="800">ㄱ ㅇ ㅇ</text><rect x="236" y="36" width="104" height="132" rx="12" fill="#121a30" stroke="#6b82b0" stroke-width="2"/><text x="288" y="58" text-anchor="middle" fill="#8b9bc4" font-size="11" font-weight="800">채팅</text><rect x="248" y="70" width="80" height="22" rx="6" fill="#1b2744"/><text x="288" y="85" text-anchor="middle" fill="#9eb0d8" font-size="10">사과</text><rect x="248" y="98" width="80" height="22" rx="6" fill="#ffe14a"/><text x="288" y="113" text-anchor="middle" fill="#060912" font-size="10" font-weight="800">고양이</text><rect x="248" y="126" width="80" height="22" rx="6" fill="#1b2744"/><text x="288" y="141" text-anchor="middle" fill="#9eb0d8" font-size="10">강아지</text><path d="M196 88 H236" stroke="#ffe14a" stroke-width="3"/><path d="M226 78 L240 88 L226 98" fill="#ffe14a"/></svg>`,
  },
  {
    id: "tools",
    title: "힌트 · 읽어주기 · 점수",
    text: "시간 힌트를 켜면 글자가 조금씩 열립니다. 자동일 때 읽어주기(TTS)로 초성을 들을 수 있고, 참가자 점수 채점으로 랭킹을 켭니다. 스킵은 다음 문제로 넘깁니다.",
    art: `<svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="50" width="104" height="100" rx="14" fill="#1b2744" stroke="#6b82b0" stroke-width="2"/><text x="68" y="96" text-anchor="middle" fill="#ffe14a" font-size="16" font-weight="900">힌트</text><text x="68" y="122" text-anchor="middle" fill="#9eb0d8" font-size="12">글자 공개</text><rect x="128" y="50" width="104" height="100" rx="14" fill="#1b2744" stroke="#6b82b0" stroke-width="2"/><text x="180" y="96" text-anchor="middle" fill="#3de7ff" font-size="16" font-weight="900">TTS</text><text x="180" y="122" text-anchor="middle" fill="#9eb0d8" font-size="12">읽어주기</text><rect x="240" y="50" width="104" height="100" rx="14" fill="#1b2744" stroke="#6b82b0" stroke-width="2"/><text x="292" y="96" text-anchor="middle" fill="#f4f7ff" font-size="16" font-weight="900">점수</text><text x="292" y="122" text-anchor="middle" fill="#9eb0d8" font-size="12">랭킹</text></svg>`,
  },
  {
    id: "start",
    title: "게임 시작을 누르세요",
    text: "준비가 되면 시작. 3·2·1 뒤에 문제가 나갑니다. 조작창 도움말로 이 설명을 다시 볼 수 있습니다.",
    art: `<svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="70" y="48" width="220" height="72" rx="16" fill="#ffe14a" stroke="#060912" stroke-width="3"/><text x="180" y="92" text-anchor="middle" fill="#060912" font-size="22" font-weight="900">게임 시작</text><path d="M180 128 V158" stroke="#3de7ff" stroke-width="3"/><path d="M170 148 L180 162 L190 148" fill="#3de7ff"/><text x="180" y="184" text-anchor="middle" fill="#9eb0d8" font-size="12" font-weight="800">3 · 2 · 1 다음 문제</text></svg>`,
  },
];

let hostTutorialStep = -1;
let hostTutorialDismissed = false;

function hideHostTutorialUi() {
  setHidden(els.hostTutorial, true);
}

function hostTutorialLobbyOk() {
  if (isDeskMode) return false;
  if (!isAuthed()) return false;
  if (els.broadcastLobby?.hidden) return false;
  if (phase === "accepting" || phase === "holding" || phase === "countdown" || phase === "picking") return false;
  if (phase === "reveal" || phase === "result") return false;
  return true;
}

function renderHostTutorial() {
  const step = HOST_TUTORIAL_STEPS[hostTutorialStep];
  if (!step || !els.hostTutorial) return;
  if (els.hostTutorialArt) els.hostTutorialArt.innerHTML = step.art;
  if (els.hostTutorialKicker) els.hostTutorialKicker.textContent = `${hostTutorialStep + 1} / ${HOST_TUTORIAL_STEPS.length}`;
  if (els.hostTutorialTitle) els.hostTutorialTitle.textContent = step.title;
  if (els.hostTutorialText) els.hostTutorialText.textContent = step.text;
  if (els.hostTutorialNext) {
    els.hostTutorialNext.textContent = hostTutorialStep >= HOST_TUTORIAL_STEPS.length - 1 ? "확인" : "다음";
  }
  setHidden(els.hostTutorialPrev, hostTutorialStep <= 0);
  if (els.hostTutorialDots) {
    els.hostTutorialDots.innerHTML = HOST_TUTORIAL_STEPS.map((_, i) =>
      `<button type="button" class="host-tutorial-dot${i === hostTutorialStep ? " is-on" : ""}" data-tutorial-dot="${i}" aria-label="${i + 1}번째 설명"></button>`,
    ).join("");
  }
}

function openHostTutorial(step = 0) {
  if (isDeskMode || !els.hostTutorial) return;
  if (!hostTutorialLobbyOk()) return;
  hostTutorialStep = Math.max(0, Math.min(step, HOST_TUTORIAL_STEPS.length - 1));
  setHidden(els.hostTutorial, false);
  renderHostTutorial();
}

function dismissHostTutorial() {
  hostTutorialDismissed = true;
  hostTutorialStep = -1;
  hideHostTutorialUi();
}

function replayHostTutorial() {
  if (isDeskMode) {
    deskBridge?.post("ui.tutorial");
    return;
  }
  if (!hostTutorialLobbyOk()) {
    setStatus("로비에서 도움말을 볼 수 있습니다");
    return;
  }
  hostTutorialDismissed = false;
  openHostTutorial(0);
}

function syncBgmMuteBtn(muted = isQuizBgmMuted()) {
  if (!els.deskBgmBtn) return;
  els.deskBgmBtn.setAttribute("aria-pressed", muted ? "true" : "false");
  els.deskBgmBtn.setAttribute("aria-label", muted ? "음소거 해제" : "음소거");
}

function toggleQuizBgmMute() {
  setQuizBgmMuted(!isQuizBgmMuted());
  syncBgmMuteBtn();
  syncQuizBgm(phase, { desk: isDeskMode });
  publishDeskState();
}

function bindQuizBgm() {
  syncBgmMuteBtn();
  els.deskBgmBtn?.addEventListener("click", () => {
    toggleQuizBgmMute();
  });
  syncQuizBgm(phase, { desk: isDeskMode });
}

function maybeStartHostTutorial() {
  if (isDeskMode) {
    hideHostTutorialUi();
    return;
  }
  if (hostTutorialStep >= 0) {
    if (!hostTutorialLobbyOk()) hideHostTutorialUi();
    return;
  }
  if (hostTutorialDismissed || !hostTutorialLobbyOk()) return;
  openHostTutorial(0);
}

function bindHostTutorial() {
  els.hostTutorialSkip?.addEventListener("click", dismissHostTutorial);
  els.hostTutorialPrev?.addEventListener("click", () => {
    if (hostTutorialStep > 0) openHostTutorial(hostTutorialStep - 1);
  });
  els.hostTutorialNext?.addEventListener("click", () => {
    if (hostTutorialStep < HOST_TUTORIAL_STEPS.length - 1) openHostTutorial(hostTutorialStep + 1);
    else dismissHostTutorial();
  });
  els.hostTutorialDots?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-tutorial-dot]");
    if (!btn) return;
    openHostTutorial(Number(btn.dataset.tutorialDot) || 0);
  });
  els.deskHelpBtn?.addEventListener("click", replayHostTutorial);
}

function syncDeskFlow() {
  const inPlay = phase === "accepting" || phase === "holding" || phase === "countdown" || phase === "picking";
  const revealing = phase === "reveal";
  const onPodium = phase === "result";
  const coverLobby = inPlay || revealing || onPodium;
  const newGame = !roundActive || phase === "result" || phase === "lobby";
  const authed = isAuthed();
  const showLobbyChrome = !coverLobby;

  // 로그인 전·후 로비에서 OBS 가이드(점선)만 항상 보이게. 설정 창과 별개.
  if (els.broadcastCropGuide) {
    const showGuide = showLobbyChrome && (newGame || !authed);
    setHidden(els.broadcastCropGuide, !showGuide);
  }
  setHidden(els.broadcastLobby, coverLobby);

  // 1) 미로그인: 로그인 창만
  if (els.lobbyAuthBlock) {
    const showAuth = showLobbyChrome && !authed;
    setHidden(els.lobbyAuthBlock, !showAuth);
  }
  // 2) 로그인 확인 후: 한 판 설정
  if (els.roundSettingsBlock) {
    const showRound = showLobbyChrome && authed && newGame;
    setHidden(els.roundSettingsBlock, !showRound);
  }
  if (els.questionSettingsBlock) {
    const showQuestion = showLobbyChrome && authed;
    setHidden(els.questionSettingsBlock, !showQuestion);
  }
  if (els.setupStartRow) {
    const showStart = showLobbyChrome && authed;
    setHidden(els.setupStartRow, !showStart);
  }
  if (els.startBtn) {
    setHidden(els.startBtn, !(showLobbyChrome && authed));
    els.startBtn.textContent = newGame ? "게임 시작" : "다음 문제";
  }
  if (els.broadcastLobby?.classList) {
    els.broadcastLobby.classList.toggle("mid-round", authed && !newGame && showLobbyChrome);
  }
  if (showLobbyChrome && authed && newGame && !els.autoWordFields?.hidden) {
    requestAnimationFrame(() => {
      els.autoWordFields?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }
  if (els.skipBtn) setHidden(els.skipBtn, phase !== "accepting");
  const hasMoreQuestions = revealing && remaining > 0;
  if (els.revealActions) setHidden(els.revealActions, !revealing);
  if (els.nextSetupOverlay) setHidden(els.nextSetupOverlay, !hasMoreQuestions);
  if (els.continueOverlay && revealing) {
    els.continueOverlay.textContent = remaining <= 0 ? "결과보기" : "계속";
  }
  syncManualAnswerUi();
  if (revealing && els.winner) {
    els.winner.textContent = "";
  }
  const showQuit =
    phase === "accepting" ||
    phase === "holding" ||
    phase === "countdown" ||
    phase === "reveal" ||
    (roundActive && phase === "ready");
  if (els.quitRoundBtn) setHidden(els.quitRoundBtn, !showQuit);
  if (els.chatConnStatus) setHidden(els.chatConnStatus, showQuit);
  els.sideCam?.classList.toggle("is-quiet", showQuit);
  if (!coverLobby && els.broadcastLobby && !els.broadcastLobby.hidden) {
    if (els.paintWrap) setHidden(els.paintWrap, true);
    if (phase !== "result" && phase !== "reveal") {
      if (phase === "lobby" || phase === "ready") {
        setHidden(els.prompt, true);
      }
    }
  }
  if (!inPlay && !revealing && !onPodium) requestAnimationFrame(() => syncLenUi());
  setDeskLocked(!authed);
  syncDeskStreamerTools();
  publishObs();
  publishDeskState();
  maybeStartHostTutorial();
  syncQuizBgm(phase, { desk: isDeskMode });
}

function hideDrawHintBar() {
  if (els.drawHintBar) setHidden(els.drawHintBar, true);
  if (els.drawHintSlots) els.drawHintSlots.innerHTML = "";
  if (els.genreHintLine) {
    setHidden(els.genreHintLine, true);
    els.genreHintLine.textContent = "";
  }
}

function renderDrawHintSlots(answer, revealed) {
  const chars = [...String(answer || "")];
  if (!els.drawHintBar || !els.drawHintSlots || !chars.length) {
    hideDrawHintBar();
    return;
  }
  if (!hintRevealOrder.length || hintRevealOrder.length !== chars.length) {
    resetHintRevealOrder(answer);
  }
  const open = revealedIndexSet(revealed);
  els.drawHintSlots.innerHTML = chars
    .map((ch, i) => {
      const shown = open.has(i) ? ch : "○";
      return `<span class="draw-hint-slot">${shown}</span>`;
    })
    .join("");
  setHidden(els.drawHintBar, false);
}

function formatChosungDisplay(text) {
  return [...toChosung(String(text ?? "").replace(/\s+/g, ""))].join(" ");
}

function setPromptText(text) {
  if (els.promptText) els.promptText.textContent = text ?? "";
  else if (els.prompt) els.prompt.textContent = text ?? "";
}

function hideClueArt({ forget = false } = {}) {
  const img = els.clueArt;
  if (img) {
    img.hidden = true;
    if (forget) {
      img.removeAttribute("src");
      img.classList.remove("is-silhouette");
    }
  }
  if (els.clueArtFrame) els.clueArtFrame.hidden = true;
  els.prompt?.classList.remove("has-art");
}

function clueHintBody(hint) {
  const raw = String(hint || "").trim();
  const parts = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (parts.length > 1 && parts[0].length < 72 && /년|감독|·/.test(parts[0])) {
    return parts.slice(1).join("\n");
  }
  return raw;
}

function bindClueArtFallback() {
  const img = els.clueArt;
  if (!img || img.dataset.fallbackBound === "1") return;
  img.dataset.fallbackBound = "1";
  img.referrerPolicy = "no-referrer";
  img.addEventListener("error", () => {
    const playUrl = String((phase === "reveal" ? current.imageReveal || current.image : current.image) || "");
    const list = clueImageCandidates(playUrl);
    const cur = img.getAttribute("src") || "";
    const next = list[list.indexOf(cur) + 1];
    if (next && next !== cur) {
      img.src = next;
      return;
    }
    hideClueArt({ forget: true });
  });
}

function syncClueSheet() {
  const clue = current.mode === "clue" || isClueFormat(current.format);
  const badge = els.clueKindBadge;
  const meta = els.clueMeta;
  if (!clue) {
    if (badge) badge.hidden = true;
    if (meta) meta.hidden = true;
    return;
  }
  if (badge) {
    const kind = String(current.genre || "").trim();
    badge.textContent = kind;
    badge.hidden = !kind;
  }
  if (meta) {
    const bits = [];
    if (Number(current.year) > 0) bits.push(String(current.year));
    if (current.series && current.series !== current.answer) bits.push(current.series);
    const tags = (current.mediaGenres || []).filter(Boolean).slice(0, 3);
    if (tags.length) bits.push(tags.join(" · "));
    meta.textContent = bits.join("  ·  ");
    meta.hidden = !bits.length;
  }
}

function readyClueImage(url) {
  const ready = clueImageReady.get(clueImageKey(url));
  return ready?.complete && ready.naturalWidth ? ready : null;
}

function syncClueArt({ reveal = false } = {}) {
  const img = els.clueArt;
  if (!img) return;
  bindClueArtFallback();
  const url = String((reveal ? current.imageReveal || current.image : current.image) || "").trim();
  const clue = current.mode === "clue" || isClueFormat(current.format);
  const show = clue && url && (reveal || isClueImageHintOn());
  if (!show) {
    hideClueArt();
    return;
  }
  img.classList.toggle("is-silhouette", !reveal && isClueSilhouetteKind(current.genre, activeCluePack().silhouettes));
  img.alt = "";
  const ready = readyClueImage(url);
  const src = ready?.src || clueImageCandidates(url)[0] || "";
  if (!src) {
    hideClueArt();
    return;
  }
  if (img.getAttribute("src") !== src) img.src = src;
  img.hidden = false;
  if (els.clueArtFrame) {
    els.clueArtFrame.hidden = false;
    els.clueArtFrame.classList.toggle("is-wait", !ready);
  }
  els.prompt?.classList.add("has-art");
  if (!ready) prefetchClueImage(url, { urgent: true });
  scheduleCluePromptFit();
}

function clearCluePromptFit() {
  if (els.prompt) els.prompt.style.fontSize = "";
  if (els.promptText) els.promptText.style.fontSize = "";
}

function fitCluePrompt() {
  const box = els.prompt;
  const text = els.promptText || box;
  if (!box?.classList.contains("is-clue") || box.hidden) {
    clearCluePromptFit();
    return;
  }
  if (box.clientHeight < 8) return;
  let lo = 14;
  let hi = box.classList.contains("hit") || box.classList.contains("miss") ? 34 : 26;
  let best = lo;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    text.style.fontSize = `${mid}px`;
    const overflow = text.scrollHeight > text.clientHeight + 2 || box.scrollHeight > box.clientHeight + 2;
    if (!overflow) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  text.style.fontSize = `${best}px`;
}

function scheduleCluePromptFit() {
  requestAnimationFrame(() => fitCluePrompt());
}

function renderQuestionView() {
  const answer = current.answer || "";
  const mode = current.mode;
  const masked = hintCount > 0 ? maskAnswer(answer, hintCount) : "";

  if (mode === "draw") {
    if (els.paintWrap) els.paintWrap.hidden = false;
    els.prompt.hidden = true;
    els.prompt.classList.remove("is-clue", "is-chosung");
    hideClueArt({ forget: true });
    clearCluePromptFit();
    syncClueChosungLine("");
    if (hintCount > 0) {
      renderDrawHintSlots(answer, hintCount);
    } else {
      hideDrawHintBar();
    }
    syncGenreHintUi();
    return;
  }

  if (els.paintWrap) els.paintWrap.hidden = true;
  hideDrawHintBar();
  setHidden(els.prompt, false);
  els.prompt.classList.remove("hit", "miss");
  if (mode === "clue") {
    els.prompt.classList.remove("is-chosung");
    els.prompt.classList.add("is-clue");
    setPromptText(clueHintBody(current.hint) || current.hint || "");
    syncClueSheet();
    syncClueArt();
    syncClueChosungLine(answer);
    syncGenreHintUi();
    scheduleCluePromptFit();
    return;
  }
  els.prompt.classList.remove("is-clue", "has-art");
  els.prompt.classList.add("is-chosung");
  hideClueArt({ forget: true });
  syncClueSheet();
  clearCluePromptFit();
  syncClueChosungLine("");
  const base = formatChosungDisplay(answer);
  setPromptText(masked ? `${base}\n${masked}` : base);
  syncGenreHintUi();
}

function workerBase() {
  return WORKER_BASE;
}


function isDrawFormat(format = quizFormat) {
  return format === "draw";
}

function isClueFormat(format = quizFormat) {
  return format === "clue";
}

function isGamePackId(id) {
  return id === "all" || (CLUE_PACKS[id] && CLUE_PACKS[id].field === "game");
}

function activeCluePack() {
  if (clueField === "manga") return CLUE_PACKS.manga;
  if (clueField === "movie") return CLUE_PACKS.movie;
  if (cluePack === "all") return allGamePack();
  return getCluePack(cluePack);
}

function activeClueBank() {
  const id = activeCluePack().id;
  return clueBanks[id] || { items: [], fetchedAt: 0, kinds: activeCluePack().kinds };
}

function cluePickOptions() {
  const pack = activeCluePack();
  const options = {
    kinds: selectedClueKinds.slice(),
    exclude: usedClueKeys,
    allowedKinds: pack.kinds,
  };
  if (pack.id === "manga" || pack.id === "movie") {
    options.mediaGenres = (pack.id === "movie" ? movieGenres : mangaGenres).slice();
    options.yearBand = pack.id === "movie" ? movieYear : mangaYear;
  }
  return options;
}

function sanitizeClueKinds(kinds) {
  const allowed = activeCluePack().kinds;
  if (!Array.isArray(kinds) || kinds.includes("all")) return ["all"];
  const next = kinds.filter((k) => allowed.includes(k));
  return next.length ? next : ["all"];
}

const CLUE_PACK_GROUPS = [
  { label: "호요버스", ids: ["genshin", "hsr"] },
  { label: "라이엇", ids: ["lol", "tft"] },
  { label: "슈터", ids: ["valorant", "overwatch", "pubg"] },
  { label: "그 외", ids: ["pokemon", "bluearchive", "dota", "fortnite"] },
];

function clueOptionMarkup(attrs, label) {
  return `<button type="button" class="clue-sheet-chip" ${attrs} aria-pressed="false">${label}</button>`;
}

function renderCluePackButtons() {
  if (!els.cluePackSeg) return;
  const byId = Object.fromEntries(gamePacks().map((pack) => [pack.id, pack]));
  const allChip = `<div class="clue-sheet-group">${clueOptionMarkup(`data-clue-pack="all" role="option"`, "전체")}</div>`;
  els.cluePackSeg.innerHTML = allChip + CLUE_PACK_GROUPS.map((group) => {
    const packs = group.ids.map((id) => byId[id]).filter(Boolean);
    if (!packs.length) return "";
    return `<div class="clue-sheet-group"><p class="clue-sheet-group-label">${group.label}</p>${packs
      .map((pack) => clueOptionMarkup(`data-clue-pack="${pack.id}" role="option"`, pack.label))
      .join("")}</div>`;
  }).join("");
}

function renderClueKindButtons() {
  if (!els.clueKindList) return;
  const kinds = ["all", ...activeCluePack().kinds];
  els.clueKindList.innerHTML = kinds
    .map((kind) => clueOptionMarkup(`data-clue-kind="${kind}"`, kind === "all" ? "전체" : kind))
    .join("");
  syncClueKindButtons();
}

const YEAR_LABELS = {
  all: "연도 전체",
  "1990s": "1990년대",
  "2000s": "2000년대",
  "2010s": "2010년대",
  "2020s": "2020년대",
};

let clueSheetMode = "";

function renderMangaFilters() {
  const genres = clueField === "movie" ? MOVIE_GENRES : MANGA_GENRES;
  if (!els.mangaGenreList) return;
  els.mangaGenreList.innerHTML = ["all", ...genres]
    .map((g) => clueOptionMarkup(`data-manga-genre="${g}"`, g === "all" ? "전체" : g))
    .join("");
}

function mediaGenres() {
  return clueField === "movie" ? movieGenres : mangaGenres;
}

function mediaYear() {
  return clueField === "movie" ? movieYear : mangaYear;
}

function markClueOption(btn, on) {
  btn.classList.toggle("active", on);
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  const mark = btn.querySelector(".genre-check");
  if (mark) mark.textContent = on ? "✓" : "";
}

function syncMangaFilterButtons() {
  const selected = mediaGenres();
  const all = selected.includes("all");
  els.mangaGenreList?.querySelectorAll("[data-manga-genre]").forEach((btn) => {
    markClueOption(btn, all ? btn.dataset.mangaGenre === "all" : selected.includes(btn.dataset.mangaGenre));
  });
  els.mangaYearList?.querySelectorAll("[data-manga-year]").forEach((btn) => {
    const on = btn.dataset.mangaYear === mediaYear();
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  updateClueSummaries();
}

function clueKindSummaryText() {
  return selectedClueKinds.includes("all") ? "전체" : selectedClueKinds.join(" · ");
}

function clueFilterSummaryText() {
  const genres = mediaGenres();
  const year = mediaYear();
  const g = genres.includes("all") ? "장르 전체" : genres.length === 1 ? genres[0] : `장르 ${genres.length}개`;
  const y = year === "all" ? "연도 전체" : YEAR_LABELS[year] || year;
  return genres.includes("all") && year === "all" ? "전체" : `${g} · ${y}`;
}

function updateClueSummaries() {
  if (els.cluePackSummary) els.cluePackSummary.textContent = activeCluePack().label;
  if (els.clueKindSummary) els.clueKindSummary.textContent = clueKindSummaryText();
  if (els.clueFilterSummary) els.clueFilterSummary.textContent = clueFilterSummaryText();
}

function setClueSheet(mode) {
  const next = clueSheetMode === mode ? "" : mode;
  clueSheetMode = next;
  const open = Boolean(next);
  const titles = { pack: "작품 고르기", kind: "무엇을 맞출까요", filter: "장르·연도" };
  if (els.clueSheetTitle && next) els.clueSheetTitle.textContent = titles[next] || "고르기";
  setHidden(els.cluePackSeg, next !== "pack");
  setHidden(els.clueKindList, next !== "kind");
  setHidden(els.mangaFilters, next !== "filter");
  setHidden(els.clueSheetApply, next === "pack" || !open);
  const returnFocus =
    next === "pack" ? els.cluePackToggle : next === "kind" ? els.clueKindToggle : els.clueFilterToggle;
  setModalLayer(els.clueSheet, open, {
    focusSelector: "#clueSheetClose",
    returnFocus: open ? returnFocus : undefined,
  });
  els.cluePackToggle?.setAttribute("aria-expanded", next === "pack" ? "true" : "false");
  els.clueKindToggle?.setAttribute("aria-expanded", next === "kind" ? "true" : "false");
  els.clueFilterToggle?.setAttribute("aria-expanded", next === "filter" ? "true" : "false");
  els.cluePackMenu?.classList.toggle("open", next === "pack");
  els.clueKindMenu?.classList.toggle("open", next === "kind");
  els.clueFilterMenu?.classList.toggle("open", next === "filter");
}

function closeClueSheet() {
  if (clueSheetMode) setClueSheet(clueSheetMode);
}

function syncClueFieldUi() {
  els.clueFieldSeg?.querySelectorAll("[data-clue-field]").forEach((btn) => {
    const on = btn.dataset.clueField === clueField;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  els.cluePackSeg?.querySelectorAll("[data-clue-pack]").forEach((btn) => {
    markClueOption(btn, btn.dataset.cluePack === cluePack);
  });
  if (els.cluePackRow) setHidden(els.cluePackRow, clueField !== "game");
  const media = clueField === "manga" || clueField === "movie";
  if (els.clueFilterRow) setHidden(els.clueFilterRow, !media);
  if (!media && clueSheetMode === "filter") closeClueSheet();
  if (clueField !== "game" && clueSheetMode === "pack") closeClueSheet();
  selectedClueKinds = sanitizeClueKinds(selectedClueKinds);
  renderClueKindButtons();
  renderMangaFilters();
  syncMangaFilterButtons();
  updateClueSummaries();
}

function isClueChosungHintOn() {
  return Boolean(els.clueChosungHint?.checked);
}

function isClueImageHintOn() {
  return Boolean(els.clueImageHint?.checked);
}

function quizTtsAvailable() {
  return isClueFormat() || isAutoTopic();
}

function isQuizTtsOn() {
  return quizTtsAvailable() && Boolean(els.quizTts?.checked);
}

function syncClueOnlyDeskOpts(show = isClueFormat()) {
  els.clueChosungOpt?.querySelectorAll("[data-clue-only]").forEach((el) => {
    setHidden(el, !show);
  });
}

function saveTtsPref() {
  localStorage.setItem(TTS_PREF_KEY, JSON.stringify({ on: isQuizTtsOn() }));
}

function restoreTtsPref() {
  try {
    const prefs = JSON.parse(localStorage.getItem(TTS_PREF_KEY) || "{}");
    if (els.quizTts) els.quizTts.checked = prefs.on === true;
  } catch {
    // ignore
  }
}

function questionTtsText() {
  if (current.mode === "clue") {
    return String(current.hint || "")
      .replace(/○○/g, "빈칸")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (current.mode === "chosung") {
    return formatChosungDisplay(current.answer);
  }
  return "";
}

let ttsChunkTimer = 0;
let ttsToken = 0;

function stopQuestionTts() {
  ttsToken += 1;
  clearTimeout(ttsChunkTimer);
  ttsChunkTimer = 0;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // ignore
  }
}

function ttsChunks(text) {
  return String(text || "")
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?]|다\.|요\.|죠\.)\s+/))
    .map((part) => part.trim())
    .filter(Boolean);
}

function speakTtsChunk(parts, index, token) {
  if (token !== ttsToken || !isQuizTtsOn() || phase !== "accepting" || isDeskMode) return;
  const part = parts[index];
  if (!part || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(part);
  utter.lang = "ko-KR";
  const voice = (speechSynthesis.getVoices() || []).find((item) => String(item.lang || "").startsWith("ko"));
  if (voice) utter.voice = voice;
  utter.rate = 0.72;
  utter.pitch = 0.95;
  utter.onend = () => {
    if (token !== ttsToken || index + 1 >= parts.length) return;
    ttsChunkTimer = setTimeout(() => speakTtsChunk(parts, index + 1, token), 420);
  };
  speechSynthesis.speak(utter);
}

function speakQuestion() {
  if (isDeskMode || !isQuizTtsOn() || (phase !== "accepting" && phase !== "holding")) return;
  const text = questionTtsText();
  if (!text || !window.speechSynthesis) return;
  stopQuestionTts();
  const token = ttsToken;
  speakTtsChunk(ttsChunks(text), 0, token);
}

function syncClueKindButtons() {
  const all = selectedClueKinds.includes("all");
  els.clueKindList?.querySelectorAll("[data-clue-kind]").forEach((btn) => {
    markClueOption(btn, all ? btn.dataset.clueKind === "all" : selectedClueKinds.includes(btn.dataset.clueKind));
  });
  updateClueSummaries();
}

function saveCluePrefs() {
  localStorage.setItem(
    CLUE_PREF_KEY,
    JSON.stringify({
      field: clueField,
      pack: cluePack,
      kinds: selectedClueKinds.slice(),
      mangaGenres: mangaGenres.slice(),
      mangaYear,
      movieGenres: movieGenres.slice(),
      movieYear,
      chosungHint: isClueChosungHintOn(),
      imageHint: isClueImageHintOn(),
    }),
  );
}

function restoreCluePrefs() {
  try {
    const prefs = JSON.parse(localStorage.getItem(CLUE_PREF_KEY) || localStorage.getItem("cluePrefs:v1") || "{}");
    if (prefs.field === "manga" || prefs.field === "movie" || prefs.field === "game") clueField = prefs.field;
    if (prefs.pack && isGamePackId(prefs.pack)) cluePack = prefs.pack;
    if (Array.isArray(prefs.mangaGenres) && prefs.mangaGenres.length) mangaGenres = prefs.mangaGenres;
    if (prefs.mangaYear) mangaYear = prefs.mangaYear;
    if (Array.isArray(prefs.movieGenres) && prefs.movieGenres.length) movieGenres = prefs.movieGenres;
    if (prefs.movieYear) movieYear = prefs.movieYear;
    if (Array.isArray(prefs.kinds) && prefs.kinds.length) selectedClueKinds = prefs.kinds;
    if (els.clueChosungHint) els.clueChosungHint.checked = prefs.chosungHint === true;
    if (els.clueImageHint) els.clueImageHint.checked = prefs.imageHint !== false;
  } catch {
    // ignore
  }
  renderCluePackButtons();
  renderMangaFilters();
  syncClueFieldUi();
}

function reportClueStats() {
  if (!isClueFormat()) return;
  const pack = activeCluePack();
  const stats = getClueBankStats(activeClueBank(), cluePickOptions());
  const kinds = selectedClueKinds.includes("all") ? "전체" : selectedClueKinds.join(" · ");
  const line = clueBankLoading[pack.id] && !stats.matched
    ? `${pack.label} 불러오는 중`
    : stats.matched
      ? `${pack.label} · ${kinds} · ${stats.matched}문제`
      : `${pack.label} · 이 조건으로는 문제가 없습니다`;
  if (els.clueSetupStatus) els.clueSetupStatus.textContent = line;
  if (!stats.matched && clueBankLoading[pack.id]) {
    setStatus(`${pack.label} 단서를 불러오는 중…`);
    return;
  }
  setStatus(stats.matched ? `${pack.label} 단서 ${stats.matched}개` : "선택한 종류에 맞는 단서가 없습니다");
}

async function ensureActiveClueBank() {
  const pack = activeCluePack();
  if (clueBankLoading[pack.id]) return clueBankLoading[pack.id];
  clueBankLoading[pack.id] = (async () => {
    const bank = await pack.init();
    clueBanks[pack.id] = bank;
    if (activeCluePack().id === pack.id) {
      reportClueStats();
      idlePrefetchCluePool();
    }
    return bank;
  })()
    .catch((err) => {
      const stats = getClueBankStats(activeClueBank(), cluePickOptions());
      if (!stats.matched && activeCluePack().id === pack.id) {
        setStatus(String(err.message || err || `${pack.label} 단서를 불러오지 못했습니다`));
      }
      throw err;
    })
    .finally(() => {
      clueBankLoading[pack.id] = null;
    });
  return clueBankLoading[pack.id];
}

function setClueField(field) {
  if (field !== "manga" && field !== "movie" && field !== "game") return;
  clueField = field;
  selectedClueKinds = ["all"];
  warmedClueChoices = null;
  closeClueSheet();
  syncClueFieldUi();
  saveCluePrefs();
  reportClueStats();
  void ensureActiveClueBank();
}

function setCluePack(id) {
  if (!isGamePackId(id)) return;
  cluePack = id;
  closeClueSheet();
  selectedClueKinds = ["all"];
  warmedClueChoices = null;
  syncClueFieldUi();
  saveCluePrefs();
  reportClueStats();
  void ensureActiveClueBank();
}

function toggleClueKind(kind) {
  if (kind === "all") {
    selectedClueKinds = ["all"];
  } else if (selectedClueKinds.includes("all")) {
    selectedClueKinds = [kind];
  } else if (selectedClueKinds.includes(kind)) {
    selectedClueKinds = selectedClueKinds.filter((k) => k !== kind);
    if (!selectedClueKinds.length) selectedClueKinds = ["all"];
  } else {
    selectedClueKinds = [...selectedClueKinds, kind];
  }
  syncClueKindButtons();
  saveCluePrefs();
  reportClueStats();
  idlePrefetchCluePool();
}

function bindClueControls() {
  els.clueFieldSeg?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-clue-field]");
    if (!btn || btn.disabled) return;
    setClueField(btn.dataset.clueField);
  });
  els.cluePackSeg?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-clue-pack]");
    if (!btn || btn.disabled) return;
    setCluePack(btn.dataset.cluePack);
  });
  els.cluePackToggle?.addEventListener("click", () => setClueSheet("pack"));
  els.clueKindToggle?.addEventListener("click", () => setClueSheet("kind"));
  els.clueFilterToggle?.addEventListener("click", () => setClueSheet("filter"));
  els.clueSheetClose?.addEventListener("click", closeClueSheet);
  els.clueSheetApply?.addEventListener("click", closeClueSheet);
  els.clueSheet?.addEventListener("click", (event) => {
    if (event.target?.dataset?.clueSheetClose) closeClueSheet();
  });
  els.mangaGenreList?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-manga-genre]");
    if (!btn) return;
    const genre = btn.dataset.mangaGenre;
    const movie = clueField === "movie";
    let next = movie ? movieGenres.slice() : mangaGenres.slice();
    if (genre === "all") next = ["all"];
    else if (next.includes("all")) next = [genre];
    else if (next.includes(genre)) {
      next = next.filter((g) => g !== genre);
      if (!next.length) next = ["all"];
    } else next = [...next, genre];
    if (movie) movieGenres = next;
    else mangaGenres = next;
    syncMangaFilterButtons();
    saveCluePrefs();
    reportClueStats();
    idlePrefetchCluePool();
  });
  els.mangaYearList?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-manga-year]");
    if (!btn) return;
    if (clueField === "movie") movieYear = btn.dataset.mangaYear || "all";
    else mangaYear = btn.dataset.mangaYear || "all";
    syncMangaFilterButtons();
    saveCluePrefs();
    reportClueStats();
    idlePrefetchCluePool();
  });
  els.clueKindList?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-clue-kind]");
    if (!btn || btn.disabled) return;
    toggleClueKind(btn.dataset.clueKind);
  });
  els.clueChosungHint?.addEventListener("change", () => {
    saveCluePrefs();
    if (phase === "accepting" && isClueFormat()) renderQuestionView();
  });
  els.clueImageHint?.addEventListener("change", () => {
    saveCluePrefs();
    idlePrefetchCluePool();
    if (phase === "accepting" && isClueFormat()) renderQuestionView();
  });
  els.quizTts?.addEventListener("change", () => {
    saveTtsPref();
    if (isQuizTtsOn() && phase === "accepting") speakQuestion();
    else stopQuestionTts();
    publishDeskState();
  });
}

function syncClueChosungLine(answer, { force = false } = {}) {
  const line = els.clueChosungLine;
  if (!line) return;
  const show =
    force ||
    (phase === "accepting" && isClueFormat(current.format) && isClueChosungHintOn() && answer);
  line.textContent = show ? formatChosungDisplay(answer) : "";
  setHidden(line, !show);
}

function isAutoTopic(topic = quizTopic) {
  return topic === "auto";
}

function getManualAnswer() {
  return String(manualAnswerLocked || "").trim();
}

function isAnswerPlayPhase() {
  return phase === "accepting" || phase === "holding" || phase === "countdown" || phase === "reveal";
}

function shouldBlindDeskAnswer() {
  // 초성/단서 자동 + 스트리머 참여 ON 일 때만 조작칸 정답 숨김
  return (quizFormat === "chosung" || isClueFormat()) && isAutoTopic() && isStreamerJoinEnabled();
}

function syncManualAnswerUi() {
  const manual = !isAutoTopic();
  const playing = isAnswerPlayPhase();
  const showEditor = manual && !playing;
  const showPlaying = playing && Boolean(current.answer) && !shouldBlindDeskAnswer();
  const showSkip = phase === "accepting";

  if (els.answerPanel) setHidden(els.answerPanel, !showEditor);
  if (showEditor) syncAnswerSubmitBtn();
  if (els.answerPlayingText) {
    setHidden(els.answerPlayingText, !showPlaying);
    els.answerPlayingText.textContent = showPlaying
      ? `이번 정답 : ${current.answer}`
      : "이번 정답 :";
  }
  if (els.deskTopBar) {
    const showBar = showSkip || showPlaying;
    setHidden(els.deskTopBar, !showBar);
  }
  publishDeskState();
}

function answerEls() {
  return {
    input: document.getElementById("answer") || els.answer,
    btn: document.getElementById("answerActionBtn") || els.answerActionBtn,
    editor: document.getElementById("answerEditor") || els.answerEditor,
  };
}

function syncAnswerSubmitBtn() {
  const locked = Boolean(getManualAnswer());
  const { input, btn, editor } = answerEls();
  if (input) {
    input.readOnly = locked;
    if (locked) input.setAttribute("readonly", "readonly");
    else input.removeAttribute("readonly");
  }
  if (btn) {
    btn.textContent = locked ? "수정" : "제출";
    btn.setAttribute("data-mode", locked ? "edit" : "submit");
  }
  if (editor) editor.classList.toggle("is-locked", locked);
}

function clearManualAnswerLock() {
  manualAnswerLocked = "";
  const { input } = answerEls();
  if (input) {
    input.value = "";
    input.readOnly = false;
    input.removeAttribute("readonly");
  }
  syncAnswerSubmitBtn();
  syncManualAnswerUi();
}

function editManualAnswer() {
  if (isAnswerPlayPhase()) return;
  const prev = getManualAnswer();
  manualAnswerLocked = "";
  syncAnswerSubmitBtn();
  const { input } = answerEls();
  if (input) {
    input.value = prev;
    input.readOnly = false;
    input.removeAttribute("readonly");
    input.focus();
    input.select();
  }
  setStatus("정답 수정");
}


function shakeAnswerField() {
  const panel = document.getElementById("answerPanel") || els.answerPanel;
  if (!panel) return;
  panel.classList.remove("shake");
  void panel.offsetWidth;
  panel.classList.add("shake");
  window.clearTimeout(shakeAnswerField._timer);
  shakeAnswerField._timer = window.setTimeout(() => {
    panel.classList.remove("shake");
  }, 450);
}

function submitManualAnswer() {
  if (isAnswerPlayPhase()) return;
  if (getManualAnswer()) {
    editManualAnswer();
    return;
  }
  const { input } = answerEls();
  const value = String(input?.value || "").trim();
  if (!value) {
    setStatus("정답을 입력해 주세요");
    shakeAnswerField();
    input?.focus();
    return;
  }
  // 수동이 아니면 맞춰 둠 (입력창이 열린 상태)
  if (isAutoTopic()) {
    quizTopic = "manual";
    syncAxisButtons();
  }
  manualAnswerLocked = value;
  if (input) {
    input.value = value;
    input.readOnly = true;
    input.setAttribute("readonly", "readonly");
  }
  syncAnswerSubmitBtn();
  setStatus(`정답 제출됨 · ${value}`);
}

function onAnswerActionClick(event) {
  const btn = event.target?.closest?.("#answerActionBtn");
  if (!btn) return;
  event.preventDefault();
  event.stopPropagation();
  const mode = btn.getAttribute("data-mode") || (getManualAnswer() ? "edit" : "submit");
  if (mode === "edit") editManualAnswer();
  else submitManualAnswer();
}

function bindAnswerActions() {
  document.addEventListener("click", onAnswerActionClick);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (event.target?.id !== "answer") return;
    if (event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (getManualAnswer()) return;
    submitManualAnswer();
  });
}


function syncAxisButtons() {
  els.formatSeg?.querySelectorAll("[data-format]").forEach((btn) => {
    const on = btn.dataset.format === quizFormat;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  els.topicSeg?.querySelectorAll("[data-topic]").forEach((btn) => {
    const on = btn.dataset.topic === quizTopic;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function isStreamerJoinEnabled() {
  return Boolean(els.streamerJoin?.checked);
}

function streamerDeskToolsOn() {
  return (quizFormat === "chosung" || isClueFormat()) && isAutoTopic() && isStreamerJoinEnabled();
}

function streamerGuessOpen() {
  return streamerDeskToolsOn() && (phase === "accepting" || phase === "holding");
}

function syncDeskStreamerTools() {
  const on = streamerDeskToolsOn();
  setHidden(els.chatDelayOpt, true);
  setHidden(els.deskChatDelayOpt, !on);
  setHidden(els.streamerGuessPanel, !streamerGuessOpen());
}

function submitStreamerGuess(raw) {
  const text = String(raw ?? els.streamerGuess?.value ?? "").trim();
  if (els.streamerGuess) els.streamerGuess.value = "";
  if (!text) {
    setStatus("정답을 입력해 주세요");
    els.streamerGuess?.focus();
    return;
  }
  if (!streamerGuessOpen()) {
    setStatus("지금은 정답을 받을 때가 아닙니다");
    return;
  }
  const chat = {
    type: "chat",
    text,
    nickname: streamerNickname(),
    userId: session?.userId || session?.channelId || "streamer-desk",
    host: true,
    hidden: false,
  };
  if (phase === "holding") {
    const deskJudge = judge || createJudge({ answer: current.answer });
    enqueueSideChat(chat);
    const result = deskJudge(chat);
    if (result.hit) {
      cancelHolds();
      judge = deskJudge;
      phase = "accepting";
      finishQuestion(result.winner);
    } else {
      noteChosungMiss(chat);
    }
    return;
  }
  onChat(chat);
}

function saveQuizModePrefs() {
  localStorage.setItem(
    QUIZ_MODE_PREF_KEY,
    JSON.stringify({
      format: quizFormat,
      topic: quizTopic,
      streamerJoin: isStreamerJoinEnabled(),
    }),
  );
}

function restoreQuizModePrefs() {
  quizFormat = "chosung";
  try {
    const prefs = JSON.parse(localStorage.getItem(QUIZ_MODE_PREF_KEY) || "{}");
    if (prefs.topic === "auto" || prefs.topic === "manual") quizTopic = prefs.topic;
    if (els.streamerJoin) els.streamerJoin.checked = prefs.streamerJoin === true;
  } catch {
    // ignore
  }
  syncAxisButtons();
}

function syncDrawPanel() {
  if (els.drawPanel) setHidden(els.drawPanel, !isDrawFormat());
}


const WORD_PREF_KEY = "quizWordPickPrefs:v2";
const WORD_LEN_MIN = 1;
const WORD_LEN_MAX = 8;
const GENRE_CHIPS = [
  { id: "all", label: "전체", icon: "🎲" },
  { id: "동물", label: "동물", icon: "🐾" },
  { id: "음식", label: "음식", icon: "🍜" },
  { id: "장소", label: "장소", icon: "📍" },
  { id: "자연", label: "자연", icon: "🌿" },
  { id: "물건", label: "물건", icon: "📦" },
  { id: "직업", label: "직업", icon: "💼" },
  { id: "학교", label: "학교", icon: "📚" },
  { id: "스포츠", label: "스포츠", icon: "⚽" },
  { id: "교통", label: "교통", icon: "🚗" },
  { id: "생활", label: "생활", icon: "🏠" },
  { id: "캐릭터", label: "캐릭터", icon: "⭐" },
  { id: "영화", label: "영화", icon: "🎬" },
  { id: "만화", label: "만화", icon: "🗯️" },
];

let selectedGenres = ["all"];
let draftGenres = ["all"];
let wordMinLen = 2;
let wordMaxLen = 4;
let autoPickCount = 1;
let autoPickChoices = [];
let pendingAutoEntry = null;
let warmedClueChoices = null;
const usedClueKeys = new Set();
const usedWordKeys = new Set();
const clueImageReady = new Map();
const clueImageIdle = [];
let clueImageIdleActive = 0;
const CLUE_IMAGE_IDLE_MAX = 3;

function startClueImageRace(key, candidates, onDone) {
  const have = clueImageReady.get(key);
  if (have?.complete && have.naturalWidth) {
    onDone?.();
    return;
  }
  if (have?.dataset?.racing === "1") {
    onDone?.();
    return;
  }
  const gate = new Image();
  gate.referrerPolicy = "no-referrer";
  gate.dataset.racing = "1";
  clueImageReady.set(key, gate);
  let settled = false;
  let pending = candidates.length;
  const finish = () => {
    if (settled) return;
    settled = true;
    onDone?.();
  };
  for (const src of candidates) {
    const probe = new Image();
    probe.referrerPolicy = "no-referrer";
    probe.onload = () => {
      pending -= 1;
      if (probe.naturalWidth && clueImageReady.get(key)?.dataset?.racing === "1") {
        clueImageReady.set(key, probe);
        if (
          clueImageKey(current.image) === key ||
          clueImageKey(current.imageReveal) === key
        ) {
          syncClueArt({ reveal: phase === "reveal" });
        }
        finish();
        return;
      }
      if (pending <= 0) finish();
    };
    probe.onerror = () => {
      pending -= 1;
      if (pending <= 0) finish();
    };
    probe.src = src;
  }
  if (!candidates.length) finish();
}

function pumpClueImageIdle() {
  while (clueImageIdleActive < CLUE_IMAGE_IDLE_MAX && clueImageIdle.length) {
    const next = clueImageIdle.shift();
    const have = clueImageReady.get(next.key);
    if (have?.complete && have.naturalWidth) continue;
    if (have?.dataset?.racing === "1") continue;
    clueImageIdleActive += 1;
    startClueImageRace(next.key, next.candidates, () => {
      clueImageIdleActive -= 1;
      pumpClueImageIdle();
    });
  }
}

function prefetchClueImage(url, { urgent = false } = {}) {
  const key = clueImageKey(url);
  const candidates = clueImageCandidates(url);
  if (!key || !candidates.length) return;
  const have = clueImageReady.get(key);
  if (have?.complete && have.naturalWidth) return;
  if (have?.dataset?.racing === "1") return;
  if (urgent) {
    startClueImageRace(key, candidates);
    return;
  }
  if (!clueImageIdle.some((item) => item.key === key)) {
    clueImageIdle.push({ key, candidates });
  }
  pumpClueImageIdle();
}

function prefetchClueEntries(entries, options) {
  for (const entry of entries || []) {
    prefetchClueImage(entry?.image, options);
    prefetchClueImage(entry?.imageReveal, options);
  }
}

function idlePrefetchCluePool() {
  if (!isClueFormat() || !isClueImageHintOn()) return;
  const pool = filterClueItems(activeClueBank(), cluePickOptions()).slice();
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  prefetchClueEntries(pool.slice(0, 40));
}

function warmUpcomingClueImages() {
  if (!isClueFormat() || warmedClueChoices?.length) return;
  try {
    warmedClueChoices = pickClueEntries(activeClueBank(), cluePickOptions(), autoPickCount);
    prefetchClueEntries(warmedClueChoices, { urgent: true });
  } catch {
    warmedClueChoices = null;
  }
}
let pendingGuestAuthor = null;
let authKeep = null;

function readWordPickPrefs() {
  try {
    return JSON.parse(localStorage.getItem(WORD_PREF_KEY) || "{}");
  } catch {
    return {};
  }
}

function clampLen(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(WORD_LEN_MIN, Math.min(WORD_LEN_MAX, Math.round(v)));
}

function lenToPercent(value) {
  return ((value - WORD_LEN_MIN) / (WORD_LEN_MAX - WORD_LEN_MIN)) * 100;
}

const THUMB_MIN_GAP_PX = 18;

function syncLenUi() {
  if (els.wordMinLabel) els.wordMinLabel.textContent = String(wordMinLen);
  if (els.wordMaxLabel) els.wordMaxLabel.textContent = String(wordMaxLen);
  if (els.wordLenSummary) els.wordLenSummary.textContent = `${wordMinLen}–${wordMaxLen}`;

  const width = els.wordLenSlider?.clientWidth || 0;
  let minX = width ? (lenToPercent(wordMinLen) / 100) * width : 0;
  let maxX = width ? (lenToPercent(wordMaxLen) / 100) * width : 0;

  // Always keep two thumbs visually separate (even when values match).
  if (width > 0 && maxX - minX < THUMB_MIN_GAP_PX) {
    const mid = (minX + maxX) / 2;
    minX = mid - THUMB_MIN_GAP_PX / 2;
    maxX = mid + THUMB_MIN_GAP_PX / 2;
    if (minX < 0) {
      minX = 0;
      maxX = THUMB_MIN_GAP_PX;
    } else if (maxX > width) {
      maxX = width;
      minX = width - THUMB_MIN_GAP_PX;
    }
  }

  if (els.wordMinThumb) {
    els.wordMinThumb.style.left = width ? `${minX}px` : `${lenToPercent(wordMinLen)}%`;
    els.wordMinThumb.setAttribute("aria-valuenow", String(wordMinLen));
    els.wordMinThumb.setAttribute("aria-valuetext", `${wordMinLen}글자`);
  }
  if (els.wordMaxThumb) {
    els.wordMaxThumb.style.left = width ? `${maxX}px` : `${lenToPercent(wordMaxLen)}%`;
    els.wordMaxThumb.setAttribute("aria-valuenow", String(wordMaxLen));
    els.wordMaxThumb.setAttribute("aria-valuetext", `${wordMaxLen}글자`);
  }
  if (els.wordLenFill) {
    const fillLeft = width ? minX : lenToPercent(wordMinLen);
    const fillRight = width ? maxX : lenToPercent(wordMaxLen);
    els.wordLenFill.style.left = width ? `${fillLeft}px` : `${fillLeft}%`;
    els.wordLenFill.style.width = width
      ? `${Math.max(THUMB_MIN_GAP_PX, fillRight - fillLeft)}px`
      : `${Math.max(0, fillRight - fillLeft)}%`;
  }
}

function setWordLenRange(nextMin, nextMax, changed = "min") {
  let minLen = clampLen(nextMin, wordMinLen);
  let maxLen = clampLen(nextMax, wordMaxLen);
  if (changed === "min" && minLen > maxLen) maxLen = minLen;
  if (changed === "max" && maxLen < minLen) minLen = maxLen;
  if (minLen > maxLen) {
    const tmp = minLen;
    minLen = maxLen;
    maxLen = tmp;
  }
  wordMinLen = minLen;
  wordMaxLen = maxLen;
  syncLenUi();
}

function saveWordPickPrefs() {
  const prefs = {
    minLen: wordMinLen,
    maxLen: wordMaxLen,
    genres: selectedGenres.slice(),
    pickCount: autoPickCount,
  };
  localStorage.setItem(WORD_PREF_KEY, JSON.stringify(prefs));
}

function genreLabel(id) {
  return GENRE_CHIPS.find((g) => g.id === id)?.label || id;
}

function genreIcon(id) {
  return GENRE_CHIPS.find((g) => g.id === id)?.icon || "";
}

function normalizeGenreList(next) {
  const unique = [...new Set((next || []).filter(Boolean))];
  if (!unique.length || unique.includes("all")) return ["all"];
  return unique;
}

function updateGenreSummary() {
  if (!els.wordGenreSummary) return;
  if (selectedGenres.includes("all") || !selectedGenres.length) {
    els.wordGenreSummary.textContent = `${genreIcon("all")} 전체`;
    return;
  }
  const labels = selectedGenres.map((id) => `${genreIcon(id)} ${genreLabel(id)}`);
  if (labels.length <= 2) {
    els.wordGenreSummary.textContent = labels.join(" · ");
    return;
  }
  els.wordGenreSummary.textContent = `${labels.slice(0, 2).join(" · ")} 외 ${labels.length - 2}`;
}

function syncGenreOptionUi(activeList) {
  const active = normalizeGenreList(activeList);
  els.wordGenrePanel?.querySelectorAll(".genre-option").forEach((btn) => {
    const id = btn.dataset.genre;
    const on = active.includes(id);
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
    const mark = btn.querySelector(".genre-check");
    if (mark) mark.textContent = on ? "✓" : "";
  });
}

function setGenreMenuOpen(open) {
  if (!els.genreModal || !els.wordGenreToggle) return;
  if (open) {
    draftGenres = selectedGenres.slice();
    syncGenreOptionUi(draftGenres);
  }
  setModalLayer(els.genreModal, open, {
    focusSelector: "#genreModalClose",
    returnFocus: open ? els.wordGenreToggle : undefined,
  });
  els.wordGenreToggle.setAttribute("aria-expanded", open ? "true" : "false");
  els.wordGenreMenu?.classList.toggle("open", open);
}

function commitGenreSelection(next) {
  selectedGenres = normalizeGenreList(next);
  draftGenres = selectedGenres.slice();
  syncGenreOptionUi(selectedGenres);
  updateGenreSummary();
  saveWordPickPrefs();
  reportWordPickStats();
}

function toggleDraftGenre(id) {
  let next;
  if (id === "all") {
    next = ["all"];
  } else if (draftGenres.includes("all")) {
    next = [id];
  } else if (draftGenres.includes(id)) {
    const rest = draftGenres.filter((g) => g !== id);
    next = rest.length ? rest : ["all"];
  } else {
    next = [...draftGenres, id];
  }
  draftGenres = normalizeGenreList(next);
  syncGenreOptionUi(draftGenres);
}

function renderGenreMenu() {
  if (!els.wordGenrePanel) return;
  els.wordGenrePanel.innerHTML = "";
  for (const chip of GENRE_CHIPS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "genre-option";
    btn.dataset.genre = chip.id;
    btn.setAttribute("role", "option");
    btn.tabIndex = -1;
    btn.innerHTML = `<span class="genre-check" aria-hidden="true"></span><span class="genre-ico" aria-hidden="true">${chip.icon}</span><span>${chip.label}</span>`;
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleDraftGenre(chip.id);
    });
    els.wordGenrePanel.appendChild(btn);
  }
  const options = [...els.wordGenrePanel.querySelectorAll('[role="option"]')];
  if (options[0]) options[0].tabIndex = 0;
  if (!els.wordGenrePanel.dataset.keysBound) {
    els.wordGenrePanel.dataset.keysBound = "1";
    els.wordGenrePanel.addEventListener("keydown", (event) => {
      const opts = [...els.wordGenrePanel.querySelectorAll('[role="option"]')];
      if (!opts.length) return;
      const i = opts.indexOf(document.activeElement);
      if (event.key === " " || event.key === "Enter") {
        if (i >= 0) {
          event.preventDefault();
          opts[i].click();
        }
        return;
      }
      const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let next = 0;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = opts.length - 1;
      else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        next = (Math.max(i, 0) + 1) % opts.length;
      } else {
        next = ((i < 0 ? 0 : i) - 1 + opts.length) % opts.length;
      }
      opts.forEach((node, idx) => {
        node.tabIndex = idx === next ? 0 : -1;
      });
      opts[next].focus();
    });
  }
  syncGenreOptionUi(selectedGenres);
  updateGenreSummary();
}

function restoreWordPickPrefs() {
  const prefs = readWordPickPrefs();
  setWordLenRange(prefs.minLen ?? 2, prefs.maxLen ?? 4, "min");
  if (Array.isArray(prefs.genres) && prefs.genres.length) {
    selectedGenres = normalizeGenreList(prefs.genres);
  } else if (prefs.genre) {
    selectedGenres = prefs.genre === "all" ? ["all"] : normalizeGenreList([prefs.genre]);
  }
  draftGenres = selectedGenres.slice();
  autoPickCount = Math.max(1, Math.min(3, Number(prefs.pickCount) || 1));
  syncAutoPickCountUi();
  renderGenreMenu();
}

function wordPickOptions() {
  return {
    minLen: wordMinLen,
    maxLen: wordMaxLen,
    genres: selectedGenres.slice(),
    exclude: usedWordKeys,
  };
}

function syncAutoPickCountUi() {
  if (els.autoPickCountLabel) els.autoPickCountLabel.textContent = `${autoPickCount}개`;
}

function bumpAutoPickCount(delta) {
  autoPickCount = Math.max(1, Math.min(3, autoPickCount + delta));
  syncAutoPickCountUi();
  saveWordPickPrefs();
}

let pickNudgeTimer = 0;

function stopPickNudge() {
  clearInterval(pickNudgeTimer);
  pickNudgeTimer = 0;
  els.autoPickPanel?.classList.remove("is-waiting", "is-nudge");
}

function startPickNudge() {
  stopPickNudge();
  const panel = els.autoPickPanel;
  if (!panel || panel.hidden || phase !== "picking") return;
  panel.classList.add("is-waiting");
  pickNudgeTimer = setInterval(() => {
    if (phase !== "picking") {
      stopPickNudge();
      return;
    }
    panel.classList.remove("is-nudge");
    void panel.offsetWidth;
    panel.classList.add("is-nudge");
    setStatus("지금 문제를 골라 주세요");
  }, 2800);
}

function clearAutoPickUi() {
  stopPickNudge();
  autoPickChoices = [];
  if (els.autoPickList) els.autoPickList.replaceChildren();
  if (els.autoPickPanel) setHidden(els.autoPickPanel, true);
}

function renderAutoPickUi(choices = autoPickChoices) {
  const list = els.autoPickList;
  if (!list || !els.autoPickPanel) return;
  list.replaceChildren();
  choices.forEach((entry, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = `autoPickBtn${i}`;
    btn.className = isClueFormat() ? "clue-pick-card" : "auto-pick-btn";
    const genre = document.createElement("strong");
    genre.textContent = entry.genre && entry.genre !== "전체" ? entry.genre : "주제";
    const word = document.createElement("span");
    word.textContent = shouldBlindDeskAnswer() ? formatChosungDisplay(entry.word) : entry.word;
    btn.append(genre, word);
    if (isClueFormat()) {
      const tease = document.createElement("em");
      const body = clueHintBody(entry.hint || "");
      tease.textContent = body.length > 42 ? `${body.slice(0, 40)}…` : body;
      btn.append(tease);
    }
    btn.addEventListener("click", () => chooseAutoPick(i));
    list.appendChild(btn);
  });
  setHidden(els.autoPickPanel, choices.length < 2);
  if (choices.length > 1) startPickNudge();
  else stopPickNudge();
}

function chooseAutoPick(index) {
  if (isDeskMode) {
    deskBridge?.post("ui.pick", { index });
    return;
  }
  const entry = autoPickChoices[index];
  if (!entry) return;
  pendingAutoEntry = entry;
  clearAutoPickUi();
  beginQuestion();
}

function syncGuestAuthorTag() {
  const el = els.guestAuthorTag;
  if (!el) return;
  const play = phase === "accepting" || phase === "reveal";
  const selected = guestHost?.state.selected;
  const drawing =
    selected &&
    (current.mode === "draw" || current.format === "draw") &&
    (guestHost.state.guestConn === "drawing" || guestHost.state.guestConn === "connected");
  let text = "";
  if (play && drawing) text = selected.nickname || "참가자";
  else if (play && current.mode !== "draw" && current.byGuest) text = "참가자 출제";
  el.textContent = text;
  setHidden(el, !text);
}

function startAuthKeep() {
  if (isDeskMode) return;
  authKeep?.stop();
  authKeep = createAuthKeep({
    workerBase: workerBase(),
    getSession: () => session,
    setSession: (next) => saveSession(next),
  });
  authKeep.start();
}

function reportWordPickStats() {
  if (isClueFormat() || !isAutoTopic() || !wordBank) return;
  const stats = getWordBankStats(wordBank, wordPickOptions());
  setStatus(stats.matched ? `자동 초성 후보 ${stats.matched}개` : "선택한 글자 수/장르에 맞는 단어가 없습니다");
}

function valueFromPointer(clientX) {
  const rect = els.wordLenSlider.getBoundingClientRect();
  if (!rect.width) return wordMinLen;
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return clampLen(WORD_LEN_MIN + ratio * (WORD_LEN_MAX - WORD_LEN_MIN), wordMinLen);
}

function bindLenThumb(thumb, which) {
  if (!thumb || !els.wordLenSlider) return;

  const applyFromClientX = (clientX) => {
    const value = valueFromPointer(clientX);
    if (which === "min") setWordLenRange(value, wordMaxLen, "min");
    else setWordLenRange(wordMinLen, value, "max");
    saveWordPickPrefs();
    reportWordPickStats();
  };

  thumb.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    thumb.setPointerCapture(event.pointerId);
    thumb.classList.add("dragging");
    applyFromClientX(event.clientX);
  });
  thumb.addEventListener("pointermove", (event) => {
    if (!thumb.hasPointerCapture(event.pointerId)) return;
    applyFromClientX(event.clientX);
  });
  const endDrag = (event) => {
    if (thumb.hasPointerCapture(event.pointerId)) {
      thumb.releasePointerCapture(event.pointerId);
    }
    thumb.classList.remove("dragging");
  };
  thumb.addEventListener("pointerup", endDrag);
  thumb.addEventListener("pointercancel", endDrag);

  thumb.addEventListener("keydown", (event) => {
    let delta = 0;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") delta = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") delta = 1;
    if (event.key === "Home") {
      event.preventDefault();
      if (which === "min") setWordLenRange(WORD_LEN_MIN, wordMaxLen, "min");
      else setWordLenRange(wordMinLen, wordMinLen, "max");
      saveWordPickPrefs();
      reportWordPickStats();
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      if (which === "min") setWordLenRange(wordMaxLen, wordMaxLen, "min");
      else setWordLenRange(wordMinLen, WORD_LEN_MAX, "max");
      saveWordPickPrefs();
      reportWordPickStats();
      return;
    }
    if (!delta) return;
    event.preventDefault();
    if (which === "min") setWordLenRange(wordMinLen + delta, wordMaxLen, "min");
    else setWordLenRange(wordMinLen, wordMaxLen + delta, "max");
    saveWordPickPrefs();
    reportWordPickStats();
  });
}

function bindWordPickControls() {
  bindLenThumb(els.wordMinThumb, "min");
  bindLenThumb(els.wordMaxThumb, "max");
  if (els.wordLenSlider && typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => syncLenUi());
    ro.observe(els.wordLenSlider);
  }
  els.wordLenSlider?.addEventListener("pointerdown", (event) => {
    if (event.target === els.wordMinThumb || event.target === els.wordMaxThumb) return;
    const value = valueFromPointer(event.clientX);
    const distMin = Math.abs(value - wordMinLen);
    const distMax = Math.abs(value - wordMaxLen);
    const which = distMin <= distMax ? "min" : "max";
    if (which === "min") setWordLenRange(value, wordMaxLen, "min");
    else setWordLenRange(wordMinLen, value, "max");
    saveWordPickPrefs();
    reportWordPickStats();
    const thumb = which === "min" ? els.wordMinThumb : els.wordMaxThumb;
    thumb?.focus();
    if (thumb && event.pointerId != null) {
      try {
        thumb.setPointerCapture(event.pointerId);
        thumb.classList.add("dragging");
      } catch {
        // ignore capture failures
      }
    }
  });

  els.wordGenreToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    setGenreMenuOpen(!!els.genreModal?.hidden);
  });
  els.genreModalClose?.addEventListener("click", (event) => {
    event.stopPropagation();
    setGenreMenuOpen(false);
  });
  els.genreModalApply?.addEventListener("click", (event) => {
    event.stopPropagation();
    commitGenreSelection(draftGenres);
    setGenreMenuOpen(false);
  });
  els.genreModal?.addEventListener("click", (event) => {
    if (event.target?.dataset?.genreClose) setGenreMenuOpen(false);
  });
}

function syncModeUi() {
  const isDraw = isDrawFormat();
  const isClue = isClueFormat();
  const isAuto = isClue ? true : isAutoTopic();
  const needsAnswer = !isAuto;
  if (isClue && quizTopic !== "auto") {
    quizTopic = "auto";
  }
  syncAxisButtons();
  if (els.topicAxis) setHidden(els.topicAxis, isClue);
  if (els.timeHintOpt) setHidden(els.timeHintOpt, isClue);
  if (els.clueFields) setHidden(els.clueFields, !isClue);
  if (els.clueChosungOpt) setHidden(els.clueChosungOpt, !(isClue || isAuto));
  syncClueOnlyDeskOpts(isClue);
  syncDeskStreamerTools();
  if (els.manualAnswerHint) setHidden(els.manualAnswerHint, !needsAnswer);
  if (els.autoWordFields) {
    setHidden(els.autoWordFields, !isAuto);
    els.autoWordFields.classList.toggle("is-clue", isClue);
  }
  if (els.streamerJoinOpt) {
    const showStreamerJoin = !isDraw && isAuto;
    setHidden(els.streamerJoinOpt, !showStreamerJoin);
  }
  if (!needsAnswer) {
    clearManualAnswerLock();
  } else {
    syncManualAnswerUi();
  }
  syncDrawPanel();
  if (isAuto && !isClue) {
    requestAnimationFrame(() => syncLenUi());
    reportWordPickStats();
  }
  if (isClue) {
    syncClueKindButtons();
    syncClueFieldUi();
    if (!activeClueBank().items.length) void ensureActiveClueBank();
    else reportClueStats();
  }

  if (phase === "accepting" || phase === "holding") {
    if (isDraw) {
      if (els.paintWrap) els.paintWrap.hidden = false;
      els.prompt.hidden = true;
      if (hintCount === 0) hideDrawHintBar();
      redraw();
      requestAnimationFrame(updateDrawCursor);
    } else {
      if (els.paintWrap) els.paintWrap.hidden = true;
    }
    return;
  }

  if (els.paintWrap) els.paintWrap.hidden = true;
  if (phase !== "reveal" && phase !== "result") {
    hideDrawHintBar();
    els.prompt.classList.remove("hit", "miss");
    setPromptText("");
    hideClueArt();
    els.prompt.hidden = true;
  }
}

function setStatus(text) {
  els.status.textContent = text;
  publishDeskState();
}

function renderBoard() {
  // scores Map keeps everyone; UI shows fixed top 5 slots
  const top = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const items = els.board?.querySelectorAll("li[data-rank]") || [];
  items.forEach((li, i) => {
    const row = top[i];
    const nameEl = li.querySelector(".rank-name");
    const scoreEl = li.querySelector(".rank-score");
    const empty = !row;
    li.classList.toggle("is-empty", empty);
    if (nameEl) nameEl.textContent = empty ? "—" : row[0];
    if (scoreEl) scoreEl.textContent = empty ? "" : String(row[1]);
  });
  publishObs();
}

function showPrompt(mode, publicText) {
  const isDraw = mode === "draw";
  const text = String(publicText || "");
  if (els.paintWrap) els.paintWrap.hidden = !isDraw;
  els.prompt.classList.remove("hit", "miss");
  setPromptText(text);
  if (isDraw || !text) hideClueArt();
  els.prompt.hidden = isDraw || !text;
  publishObs();
}

function pickWordEntry() {
  return pickWordEntryFromBank(wordBank, wordPickOptions());
}

function addScore(nickname) {
  scores.set(nickname, (scores.get(nickname) || 0) + 1);
  renderBoard();
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function updateTimerHud(leftSec, pct) {
  const sec = Math.max(0, leftSec);
  if (els.timerSec) els.timerSec.textContent = String(sec);
  if (els.timerBar) els.timerBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  els.timerSec?.closest(".hud-timer")?.setAttribute("aria-label", `남은 시간 ${sec}초`);
  els.deskTimerSec?.closest(".desk-hud-timer")?.setAttribute("aria-label", `남은 시간 ${sec}초`);
  publishObs();
  publishDeskState();
}

function updateRoundHud() {
  if (els.roundLabel) els.roundLabel.textContent = `${roundNow}/${roundTotal}`;
  els.roundLabel?.closest(".hud-round")?.setAttribute("aria-label", `라운드 ${roundNow} / ${roundTotal}`);
  publishObs();
  publishDeskState();
}

function tick() {
  const leftMs = Math.max(0, endsAt - Date.now());
  const left = Math.ceil(leftMs / 1000);
  const pct = timerDuration > 0 ? (leftMs / (timerDuration * 1000)) * 100 : 0;
  updateTimerHud(left, pct);
  const remainingRatio = timerDuration > 0 ? leftMs / (timerDuration * 1000) : 0;
  applyTimeHints(remainingRatio);
  if (left <= 0) finishQuestion(null);
}

function startTimer(seconds) {
  stopTimer();
  timerDuration = Math.max(1, seconds);
  endsAt = Date.now() + timerDuration * 1000;
  updateTimerHud(timerDuration, 100);
  timerId = setInterval(tick, 200);
}

function showFinalResult(lastAnswer = "") {
  cancelHolds();
  stopChatDelayProbe();
  stopQuestionTts();
  stopTimer();
  usedClueKeys.clear();
  usedWordKeys.clear();
  warmedClueChoices = null;
  roundActive = false;
  phase = "result";
  roundNow = 0;
  updateRoundHud();
  updateTimerHud(0, 0);
  hideDrawHintBar();
  clearChosungMisses();
  clearHitFly();
  clearHitFireworks();
  clearAutoPickUi();
  syncGuestAuthorTag();
  clearRevealPaintThumb();
  if (els.paintWrap) els.paintWrap.hidden = true;
  if (els.broadcastHud) els.broadcastHud.hidden = true;
  els.prompt.hidden = true;
  els.prompt.classList.remove("hit", "miss", "is-clue", "is-chosung");
  hideClueArt({ forget: true });
  clearCluePromptFit();
  setPromptText("");
  syncClueChosungLine("");
  if (els.winner) els.winner.textContent = "";
  renderPodiumFromScores();
  renderBoard();
  setStatus(
    lastAnswer
      ? `한 판이 끝났습니다 · 정답 ${lastAnswer}. 확인 또는 새 판 시작을 눌러 주세요`
      : "한 판이 끝났습니다. 확인 또는 새 판 시작을 눌러 주세요",
  );
  closeEndConfirm();
  syncDeskFlow();
}

function getTopScores(limit = 5) {
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "ko"))
    .slice(0, limit)
    .map(([name, score], i) => ({ rank: i + 1, name, score }));
}

function renderPodiumFromScores() {
  const podium = els.podium;
  if (!podium) return;
  const tops = getTopScores(5);
  const byRank = new Map(tops.map((row) => [row.rank, row]));
  podium.querySelectorAll(".podium-slot").forEach((slot) => {
    const place = Number(slot.getAttribute("data-place"));
    const row = byRank.get(place);
    const nameEl = slot.querySelector(".podium-name");
    const scoreEl = slot.querySelector(".podium-score");
    if (nameEl) nameEl.textContent = row ? row.name : "—";
    if (scoreEl) scoreEl.textContent = row ? `${row.score}점` : "";
    slot.classList.toggle("is-empty", !row);
  });
  setHidden(podium, false);
  startPodiumConfetti();
}

const PODIUM_PETAL_COLORS = ["#ffe14a", "#ff7ae6", "#3de7ff", "#ff6b7a", "#5dffb0", "#fff4c8"];

function startPodiumConfetti() {
  const layer = els.podiumConfetti;
  if (!layer) return;
  layer.replaceChildren();
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    setHidden(layer, true);
    return;
  }
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 28; i += 1) {
    const petal = document.createElement("i");
    petal.className = "podium-petal";
    petal.style.setProperty("--x", `${Math.round(Math.random() * 100)}%`);
    petal.style.setProperty("--delay", `${(-Math.random() * 5).toFixed(2)}s`);
    petal.style.setProperty("--dur", `${(5 + Math.random() * 4).toFixed(2)}s`);
    petal.style.setProperty("--rot", `${Math.round(Math.random() * 360)}deg`);
    petal.style.setProperty("--sway", `${Math.round(-22 + Math.random() * 44)}px`);
    petal.style.setProperty("--size", `${Math.round(8 + Math.random() * 11)}px`);
    petal.style.background = PODIUM_PETAL_COLORS[i % PODIUM_PETAL_COLORS.length];
    frag.appendChild(petal);
  }
  layer.appendChild(frag);
  setHidden(layer, false);
}

function stopPodiumConfetti() {
  const layer = els.podiumConfetti;
  if (!layer) return;
  layer.replaceChildren();
  setHidden(layer, true);
}

function dismissPodium() {
  stopPodiumConfetti();
  if (els.podium) {
    setHidden(els.podium, true);
  }
  if (els.winner) els.winner.textContent = "";
  scores = new Map();
  renderBoard();
}

function openNextQuestionSetup() {
  if (phase !== "reveal") return;
  if (remaining <= 0) {
    showFinalResult(current.answer || "");
    return;
  }
  clearRevealPaintThumb();
  phase = "ready";
  setStatus("다음 문제 설정");
  syncDeskFlow();
}

async function continueAfterReveal() {
  if (phase !== "reveal") return;
  if (remaining <= 0) {
    showFinalResult(current.answer || "");
    return;
  }
  if (!canStartQuestion()) {
    openNextQuestionSetup();
    return;
  }
  try {
    clearRevealPaintThumb();
    await runStartCountdown();
    if (!roundActive || remaining <= 0) return;
    beginQuestion();
  } catch (err) {
    phase = "ready";
    syncDeskFlow();
    setStatus(String(err.message || err || "시작에 실패했습니다"));
  }
}

function clearRevealPaintThumb() {
  if (!els.paintWrap) return;
  els.paintWrap.classList.remove("is-reveal-thumb");
}

function showRevealPaintThumb() {
  if (!els.paintWrap) return;
  els.paintWrap.classList.add("is-reveal-thumb");
  els.paintWrap.hidden = false;
  els.paintWrap.toggleAttribute("hidden", false);
  redraw();
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

const HIT_FW_COLORS = ["#ffe14a", "#ff7ae6", "#3de7ff", "#ff6b7a", "#5dffb0", "#fff4c8"];
let hitFwTimer = 0;
let hitFwLoop = false;

function clearHitFireworks() {
  hitFwLoop = false;
  clearTimeout(hitFwTimer);
  const layer = els.hitFireworks;
  if (!layer) return;
  layer.replaceChildren();
  setHidden(layer, true);
}

function spawnHitFireworkBurst() {
  const layer = els.hitFireworks;
  if (!layer) return;
  for (const side of ["seven", "five"]) {
    const burst = document.createElement("div");
    burst.className = `hit-fw-burst is-${side}`;
    const flash = document.createElement("i");
    flash.className = "hit-fw-flash";
    burst.appendChild(flash);
    for (let i = 0; i < 18; i += 1) {
      const spark = document.createElement("i");
      spark.className = "hit-fw-spark";
      const angle = (i / 18) * 360 + (Math.random() * 14 - 7);
      const dist = 72 + Math.random() * 96;
      const rad = (angle * Math.PI) / 180;
      spark.style.setProperty("--dx", `${Math.round(Math.cos(rad) * dist)}px`);
      spark.style.setProperty("--dy", `${Math.round(Math.sin(rad) * dist)}px`);
      spark.style.setProperty("--delay", `${(Math.random() * 0.07).toFixed(2)}s`);
      spark.style.setProperty("--dur", `${(0.72 + Math.random() * 0.4).toFixed(2)}s`);
      spark.style.background = HIT_FW_COLORS[i % HIT_FW_COLORS.length];
      burst.appendChild(spark);
    }
    layer.appendChild(burst);
    window.setTimeout(() => burst.remove(), 1400);
  }
}

function playHitFireworks() {
  const layer = els.hitFireworks;
  if (!layer || prefersReducedMotion()) return;
  hitFwLoop = true;
  setHidden(layer, false);
  const tick = () => {
    if (!hitFwLoop || phase !== "reveal") return;
    spawnHitFireworkBurst();
    hitFwTimer = window.setTimeout(tick, 820);
  };
  tick();
}

function clearHitFly() {
  const layer = els.hitFlyLayer;
  const chip = els.hitFlyChip;
  if (chip) {
    chip.classList.remove("is-fly");
    chip.replaceChildren();
  }
  if (layer) setHidden(layer, true);
}

function playHitFly({ nickname, answer }, done) {
  const layer = els.hitFlyLayer;
  const chip = els.hitFlyChip;
  if (!layer || !chip || prefersReducedMotion()) {
    done?.();
    return;
  }
  chip.replaceChildren();
  const nick = document.createElement("strong");
  nick.textContent = nickname || "익명";
  const word = document.createElement("span");
  word.textContent = answer || "";
  chip.append(nick, word);
  setHidden(layer, false);
  chip.classList.remove("is-fly");
  void chip.offsetWidth;
  chip.classList.add("is-fly");
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    chip.removeEventListener("animationend", finish);
    clearTimeout(guard);
    clearHitFly();
    done?.();
  };
  const guard = setTimeout(finish, 1300);
  chip.addEventListener("animationend", finish);
}

function finishQuestion(winner) {
  if (phase !== "accepting") return;
  stopQuestionTts();
  phase = "reveal";
  stopTimer();
  judge = null;
  clearChosungMisses();
  clearHitFly();
  clearHitFireworks();
  const answerText = current.answer || "";
  const wasDraw = current.mode === "draw" || isDrawFormat(current.format);
  const wasClue = current.mode === "clue" || isClueFormat(current.format);
  els.prompt.hidden = false;
  hideDrawHintBar();
  syncClueChosungLine("");
  els.prompt.classList.remove("hit", "miss");
  els.prompt.classList.toggle("is-clue", wasClue);
  els.prompt.classList.toggle("is-chosung", !wasDraw && !wasClue);
  if (wasClue) {
    syncClueSheet();
    syncClueArt({ reveal: true });
  } else hideClueArt();
  if (els.broadcastHud) els.broadcastHud.hidden = false;
  if (wasDraw) {
    showRevealPaintThumb();
  } else {
    clearRevealPaintThumb();
    if (els.paintWrap) els.paintWrap.hidden = true;
  }
  const showHitPrompt = () => {
    els.prompt.classList.add("hit");
    setPromptText(`${winner.nickname} 정답!\n${answerText}`);
    if (wasClue) scheduleCluePromptFit();
  };
  if (winner) {
    addScore(winner.nickname);
    els.winner.textContent = "";
    setStatus(`${winner.nickname} 님이 맞히셨습니다 · 정답 ${answerText}`);
    if (!wasDraw && !wasClue) setPromptText(formatChosungDisplay(answerText));
    playHitFireworks();
    playHitFly({ nickname: winner.nickname, answer: answerText }, showHitPrompt);
  } else {
    els.winner.textContent = "";
    els.prompt.classList.add("miss");
    setPromptText(`정답 ${answerText}`);
    if (wasClue) scheduleCluePromptFit();
    setStatus(`정답 ${answerText}`);
  }
  remaining -= 1;
  updateRoundHud();
  playQuizSfx(winner ? "hit" : "miss");
  playQuizSting(winner ? "hit" : "miss");
  // 마지막 문제도 정답 공개(reveal)를 먼저 보여 주고, 「결과보기」로 시상 진입
  syncGuestAuthorTag();
  syncDeskFlow();
}

const CHAT_LIST_MAX = 80;

function setChatConnStatus(text, kind = "") {
  const el = els.chatConnStatus;
  if (!el) return;
  el.textContent = text || "연결되지 않았습니다";
  el.classList.toggle("is-live", kind === "live");
  el.classList.toggle("is-bad", kind === "bad");
}

function chatRevealDelayMs() {
  const sec = getChatDelaySec();
  if (sec <= 0 || !holdStartedAt) return 0;
  return Math.max(0, sec * 1000 - (Date.now() - holdStartedAt));
}

function flushSideChatQueue() {
  const items = sideChatQueue.splice(0);
  for (const item of items) {
    clearTimeout(item.timer);
    appendSideChat(item.chat, item.opts);
  }
}

function enqueueSideChat(chat, opts = {}) {
  const wait = chatRevealDelayMs();
  const item = { chat: { ...chat }, opts, timer: 0 };
  const show = () => {
    const i = sideChatQueue.indexOf(item);
    if (i >= 0) sideChatQueue.splice(i, 1);
    appendSideChat(item.chat, item.opts);
  };
  if (wait <= 0) {
    show();
    return;
  }
  item.timer = window.setTimeout(show, wait);
  sideChatQueue.push(item);
}

function appendSideChat(chat, { fake = false } = {}) {
  const list = els.chatList;
  if (!list) return;
  const text = String(chat?.text || "").trim();
  if (!text) return;
  const li = document.createElement("li");
  if (chat?.type === "donation") li.classList.add("is-donation");
  if (fake) li.classList.add("is-fake");
  if (chat?.hidden) li.classList.add("is-hidden");
  const hostChat = isStreamerChat(chat);
  if (hostChat) li.classList.add("is-streamer");

  const nick = document.createElement("span");
  nick.className = "chat-nick";
  const hostNick = streamerNickname();
  nick.textContent = hostChat && hostNick !== "스트리머" ? hostNick : chat?.nickname || "익명";

  const body = document.createElement("span");
  body.className = "chat-text";
  body.textContent = text;

  li.append(nick, body);
  list.appendChild(li);
  while (list.children.length > CHAT_LIST_MAX) {
    list.firstElementChild?.remove();
  }
  list.scrollTop = list.scrollHeight;
  publishObs();
}

function onChatStatus(text) {
  const msg = String(text || "");
  setStatus(msg);
  if (/연결됨/.test(msg)) setChatConnStatus(msg, "live");
  else if (/끊김|오류|실패|취소|이미 다른/.test(msg)) setChatConnStatus(msg, "bad");
  else setChatConnStatus(msg || "연결되지 않았습니다");
  publishObs();
}

function clearChosungMisses() {
  nearMissSeen = new Set();
  const layer = els.chosungMissLayer;
  if (!layer) return;
  layer.replaceChildren();
  setHidden(layer, true);
}

function missAvoidBoxes(layerBox) {
  const ids = ["prompt", "broadcastHud", "joinBanner", "genreHintLine", "clueChosungLine"];
  const boxes = [];
  for (const id of ids) {
    const el = els[id] || document.getElementById(id);
    if (!el || el.hidden) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    boxes.push({
      x: r.left - layerBox.left,
      y: r.top - layerBox.top,
      w: r.width,
      h: r.height,
    });
  }
  return boxes;
}

function placeChosungMissChip(word) {
  const layer = els.chosungMissLayer;
  if (!layer || !word) return false;
  setHidden(layer, false);
  const style = missChipStyle();
  const chip = document.createElement("span");
  chip.className = "chosung-miss-word";
  chip.textContent = word;
  chip.style.fontSize = `${style.fontPx}px`;
  chip.style.visibility = "hidden";
  layer.appendChild(chip);
  const aabb = rotatedAabb(chip.offsetWidth, chip.offsetHeight, style.rotateDeg);
  const layerBox = layer.getBoundingClientRect();
  const pos = pickMissBox({
    areaW: layerBox.width,
    areaH: layerBox.height,
    chipW: aabb.w,
    chipH: aabb.h,
    avoids: missAvoidBoxes(layerBox),
    pad: 18,
  });
  if (!pos) {
    chip.remove();
    return false;
  }
  chip.style.left = `${pos.x + aabb.w / 2}px`;
  chip.style.top = `${pos.y + aabb.h / 2}px`;
  chip.style.transform = `translate(-50%, -50%) rotate(${style.rotateDeg}deg)`;
  chip.style.visibility = "visible";
  return true;
}

function noteChosungMiss(chat) {
  if (phase !== "accepting") return;
  if (current.mode === "draw" || current.format === "draw") return;
  if (current.mode === "clue" || current.format === "clue") return;
  const word = rememberNearMiss(nearMissSeen, chat?.text, current.answer);
  if (!word) return;
  if (!placeChosungMissChip(word)) {
    nearMissSeen.delete(word);
  }
}

function streamerNickname() {
  const nick = String(session?.nickname || "").trim();
  return nick || "스트리머";
}

function isStreamerChat(chat) {
  if (chat?.host) return true;
  const uid = String(chat?.userId || "");
  if (!uid) return false;
  if (uid === "streamer-desk") return true;
  if (session?.userId && uid === session.userId) return true;
  if (session?.channelId && uid === session.channelId) return true;
  return false;
}

function applyStreamerNickname(name) {
  const nick = String(name || "").trim();
  if (!nick || nick === "(알 수 없음)" || nick === "스트리머") return false;
  const prev = String(session?.nickname || "").trim();
  if (prev === nick) return true;
  saveSession({ ...session, nickname: nick });
  if (scores.has("스트리머")) {
    scores.set(nick, (scores.get(nick) || 0) + scores.get("스트리머"));
    scores.delete("스트리머");
    renderBoard();
  }
  if (prev && prev !== nick && scores.has(prev)) {
    scores.set(nick, (scores.get(nick) || 0) + scores.get(prev));
    scores.delete(prev);
    renderBoard();
  }
  return true;
}

function rememberStreamerNick(chat) {
  if (!isStreamerChat(chat)) return;
  const nick = String(chat?.nickname || "").trim();
  if (!nick || nick === "익명" || nick === "스트리머") return;
  applyStreamerNickname(nick);
}

async function ensureStreamerNickname() {
  if (streamerNickname() !== "스트리머") return;
  const channelId = String(session?.channelId || "").trim();
  const token = String(session?.accessToken || "").trim();
  if (token) {
    try {
      const res = await fetch(`${workerBase()}/auth/me`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && applyStreamerNickname(data.nickname)) return;
    } catch {
      // ignore
    }
  }
  if (!channelId) return;
  try {
    const res = await fetch(`${workerBase()}/channel/profile?channelId=${encodeURIComponent(channelId)}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && applyStreamerNickname(data.nickname)) return;
  } catch {
    // ignore
  }
}

function onChat(chat, opts = {}) {
  rememberStreamerNick(chat);
  enqueueSideChat(chat, opts);
  if (noteChatDelayProbe(chat)) return;
  if (guestHost?.noteCandidate(chat)) {
    renderGuestHostUi();
  }
  if (phase !== "accepting" || !judge) return;
  if (chat?.type && chat.type !== "chat") return;
  if (chat?.hidden) return;
  if (guestHost?.shouldExcludeFromJudge(chat?.userId)) return;
  const result = judge(chat);
  if (result.hit) finishQuestion(result.winner);
  else noteChosungMiss(chat);
}

function openEndConfirm() {
  setModalLayer(els.endConfirmModal, true, {
    focusSelector: "#endConfirmCancel",
    returnFocus: els.quitRoundBtn,
  });
}

function closeEndConfirm() {
  setModalLayer(els.endConfirmModal, false);
}

function endRoundConfirmed() {
  cancelHolds();
  stopTimer();
  judge = null;
  remaining = 0;
  closeEndConfirm();
  const answerText =
    phase === "accepting" || phase === "holding" || phase === "countdown" || phase === "reveal"
      ? current.answer || ""
      : "";
  showFinalResult(answerText);
}


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setCountdownVisible(text) {
  if (!els.countdown) return;
  if (text == null) {
    els.countdown.hidden = true;
    els.countdown.textContent = "";
    return;
  }
  els.countdown.hidden = false;
  els.countdown.textContent = String(text);
}

async function runStartCountdown() {
  stopChatDelayProbe();
  stopQuestionTts();
  warmUpcomingClueImages();
  phase = "countdown";
  syncDeskFlow();
  stopTimer();
  clearRevealPaintThumb();
  clearStrokes();
  els.prompt.hidden = true;
  setPromptText("");
  hideClueArt({ forget: true });
  els.prompt.classList.remove("hit", "miss", "is-clue", "is-chosung");
  clearCluePromptFit();
  syncClueChosungLine("");
  if (els.paintWrap) els.paintWrap.hidden = true;
  hideDrawHintBar();
  clearChosungMisses();
  clearHitFly();
  clearHitFireworks();
  if (els.broadcastHud) els.broadcastHud.hidden = true;
  els.winner.textContent = "";
  if (els.roundLabel) els.roundLabel.textContent = "";
  updateTimerHud(0, 0);
  setStatus("시작 준비…");
  for (const n of [3, 2, 1]) {
    setCountdownVisible(n);
    playQuizSfx("count");
    await sleep(1000);
  }
  setCountdownVisible(null);
}

function canStartQuestion() {
  if (isClueFormat()) {
    const stats = getClueBankStats(activeClueBank(), cluePickOptions());
    if (!stats.matched) {
      const pack = activeCluePack();
      setStatus(clueBankLoading[pack.id] ? `${pack.label} 단서를 불러오는 중…` : "선택한 종류에 맞는 단서가 없습니다");
      return false;
    }
    return true;
  }
  if (isAutoTopic()) {
    const stats = getWordBankStats(wordBank, wordPickOptions());
    if (!stats.matched) {
      setStatus("선택한 글자 수/장르에 맞는 단어가 없습니다");
      return false;
    }
    return true;
  }
  if (!getManualAnswer()) {
    setStatus("조작창에서 정답을 제출해 주세요");
    shakeAnswerField();
    return false;
  }
  return true;
}

function beginQuestion() {
  const format = quizFormat;
  const topic = quizTopic;
  const seconds = Number(els.seconds.value) || 30;
  let answer = "";
  let excludeUserId = "";

  let genre = "";
  let hint = "";
  let image = "";
  let imageReveal = "";
  let year = 0;
  let mediaGenres = [];
  let series = "";
  const clue = format === "clue";
  const topicKey = clue ? "auto" : topic;
  const streamerJoin = (format === "chosung" || clue) && topicKey === "auto" && isStreamerJoinEnabled();
  if (topicKey === "auto") {
    try {
      let entry = pendingAutoEntry;
      pendingAutoEntry = null;
      if (!entry) {
        const warmed = clue
          ? (warmedClueChoices || []).filter((item) => !usedClueKeys.has(clueEntryKey(item)))
          : null;
        warmedClueChoices = null;
        const choices = clue
          ? warmed?.length
            ? warmed
            : pickClueEntries(activeClueBank(), cluePickOptions(), autoPickCount)
          : pickWordEntriesFromBank(wordBank, wordPickOptions(), autoPickCount);
        if (clue) prefetchClueEntries(choices, { urgent: true });
        if (choices.length > 1) {
          autoPickChoices = choices;
          phase = "picking";
          renderAutoPickUi(choices);
          setStatus("지금 문제를 골라 주세요");
          syncDeskFlow();
          return;
        }
        entry = choices[0] || (clue ? pickClueEntries(activeClueBank(), cluePickOptions(), 1)[0] : pickWordEntry());
      }
      answer = entry.word;
      genre = entry.genre || "";
      hint = entry.hint || "";
      image = entry.image || "";
      imageReveal = entry.imageReveal || "";
      year = Number(entry.year) || 0;
      mediaGenres = Array.isArray(entry.mediaGenres) ? entry.mediaGenres.slice() : [];
      series = String(entry.series || "").trim();
      if (clue) {
        usedClueKeys.add(clueEntryKey(entry));
        prefetchClueEntries([entry], { urgent: true });
      } else if (entry.word) {
        usedWordKeys.add(entry.word);
      }
    } catch (err) {
      setStatus(String(err.message || err || "단어 선택에 실패했습니다"));
      phase = "ready";
      syncDeskFlow();
      return;
    }
    if ((format === "chosung" || clue) && !streamerJoin) {
      excludeUserId = session.userId;
    }
  } else {
    answer = getManualAnswer();
    if (!answer) {
      setStatus("조작창에서 정답을 제출해 주세요");
      phase = "ready";
      syncDeskFlow();
      return;
    }
    excludeUserId = session.userId;
  }

  const byGuest =
    pendingGuestAuthor &&
    normalizeAnswer(pendingGuestAuthor.answer) === normalizeAnswer(answer)
      ? pendingGuestAuthor.nickname
      : "";
  current = {
    mode: format === "draw" ? "draw" : clue ? "clue" : "chosung",
    format,
    topic: topicKey,
    answer,
    genre,
    hint,
    image,
    imageReveal,
    year,
    mediaGenres,
    series,
    byGuest,
  };
  pendingGuestAuthor = null;
  clearChosungMisses();
  clearHitFly();
  clearHitFireworks();
  hintCount = 0;
  resetHintRevealOrder(answer);
  if (
    guestHost?.state.enabled &&
    guestHost.state.selected?.userId &&
    !guestHost.state.guestCanScore
  ) {
    excludeUserId = excludeUserId || guestHost.state.selected.userId;
  }
  roundNow = Math.min(roundTotal, roundNow + 1);
  if (els.broadcastHud) els.broadcastHud.hidden = false;
  updateRoundHud();
  els.winner.textContent = "";
  if (format === "draw") redraw();
  renderQuestionView();
  syncGuestAuthorTag();
  clearManualAnswerLock();
  void guestHost?.pushHostMode(format === "draw" ? "draw" : "chosung");
  stopChatDelayProbe();
  const delay = streamerDeskToolsOn() ? getChatDelaySec() : 0;
  if (delay > 0) {
    phase = "holding";
    holdStartedAt = Date.now();
    renderQuestionView();
    syncDeskFlow();
    speakQuestion();
    const token = ++holdGen;
    void (async () => {
      const ok = await runChatDelayHold(delay, token);
      if (!ok) return;
      startAcceptingAnswers({ seconds, answer, excludeUserId, clue, format, topicKey, streamerJoin, genre, replayVoice: false });
    })();
    return;
  }
  startAcceptingAnswers({ seconds, answer, excludeUserId, clue, format, topicKey, streamerJoin, genre });
}

function startAcceptingAnswers({ seconds, answer, excludeUserId, clue, format, topicKey, streamerJoin, genre, replayVoice = true }) {
  holdStartedAt = 0;
  judge = createJudge({ answer, excludeUserId });
  phase = "accepting";
  renderQuestionView();
  startTimer(seconds);
  if (replayVoice) speakQuestion();
  syncDeskFlow();
  updateHintUi();
  if (clue) {
    setStatus(isDev ? `단서 · ${genre} · 정답 [${answer}]` : `단서 · ${genre} · 채팅 정답 대기`);
  } else if (topicKey === "auto") {
    if (streamerJoin) {
      setStatus(
        hintsAllowed() ? "초성 자동 · 스트리머 참여 · 시간 힌트 ON" : "초성 자동 · 스트리머 채팅 참여 가능",
      );
    } else if (isDev || format === "draw") {
      setStatus(`${format === "draw" ? "그림" : "초성"} 자동 · 정답 [${answer}]`);
    } else {
      setStatus(hintsAllowed() ? "초성 퀴즈 · 시간 힌트 ON" : "초성 자동 · 채팅 정답 대기");
    }
  } else if (format === "draw") {
    setStatus(hintsAllowed() ? "그림 퀴즈 · 시간 힌트 ON" : "그림 퀴즈 · 채팅 정답 대기");
  } else {
    setStatus(hintsAllowed() ? "초성 퀴즈 · 시간 힌트 ON" : "초성 퀴즈 · 채팅 정답 대기");
  }
}

function startRound() {
  usedClueKeys.clear();
  usedWordKeys.clear();
  warmedClueChoices = null;
  scores = new Map();
  renderBoard();
  roundTotal = Math.max(1, Number(els.questionCount.value) || 10);
  remaining = roundTotal;
  roundNow = 0;
  updateRoundHud();
  roundActive = true;
  beginQuestion();
}

function getCanvasPoint(event) {
  const rect = els.canvas.getBoundingClientRect();
  const src = event.touches ? event.touches[0] : event;
  return {
    x: ((src.clientX - rect.left) / rect.width) * els.canvas.width,
    y: ((src.clientY - rect.top) / rect.height) * els.canvas.height,
  };
}

function floodFill(ctx, x, y, hex, alpha) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const sx = Math.floor(x);
  const sy = Math.floor(y);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  const i0 = (sy * w + sx) * 4;
  const tr = data[i0];
  const tg = data[i0 + 1];
  const tb = data[i0 + 2];
  const ta = data[i0 + 3];
  const { r: fr, g: fg, b: fb } = hexToRgb(hex);
  const fa = Math.max(0, Math.min(1, alpha));
  const sameAsFill =
    Math.abs(tr - fr) + Math.abs(tg - fg) + Math.abs(tb - fb) < 8 &&
    Math.abs(ta - Math.round(fa * 255)) < 8;
  if (sameAsFill) return;

  const match = (i) =>
    Math.abs(data[i] - tr) +
      Math.abs(data[i + 1] - tg) +
      Math.abs(data[i + 2] - tb) +
      Math.abs(data[i + 3] - ta) <
    48;

  const stack = [sx, sy];
  const seen = new Uint8Array(w * h);
  while (stack.length) {
    const cy = stack.pop();
    const cx = stack.pop();
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
    const idx = cy * w + cx;
    if (seen[idx]) continue;
    const i = idx * 4;
    if (!match(i)) continue;
    seen[idx] = 1;
    const sr = data[i];
    const sg = data[i + 1];
    const sb = data[i + 2];
    const sa = data[i + 3] / 255;
    data[i] = Math.round(fr * fa + sr * (1 - fa));
    data[i + 1] = Math.round(fg * fa + sg * (1 - fa));
    data[i + 2] = Math.round(fb * fa + sb * (1 - fa));
    data[i + 3] = Math.round((fa + sa * (1 - fa)) * 255);
    stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
  }
  ctx.putImageData(image, 0, 0);
}

function redraw() {
  const ctx = els.canvas.getContext("2d", { willReadFrequently: true });
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#fff8e8";
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
  for (const stroke of strokes) {
    if (stroke.type === "fill") {
      floodFill(ctx, stroke.x, stroke.y, stroke.color, stroke.alpha ?? 1);
      continue;
    }
    if (stroke.type === "shape") {
      paintShape(ctx, stroke);
      continue;
    }
    ctx.globalAlpha = stroke.erase ? 1 : stroke.alpha ?? 1;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    ctx.beginPath();
    stroke.points.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }
  if (draftShape) paintShape(ctx, draftShape);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  publishObsPaint();
}

function undoStroke() {
  strokes.pop();
  draftShape = null;
  redraw();
  publishPaintPreview();
}


function sanitizeFilename(text) {
  return String(text || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "-")
    .slice(0, 40) || "정답없음";
}

function saveDrawingPng() {
  if (!els.canvas) return;
  const answer = (current.answer || els.answer.value || "").trim();
  if (!answer) {
    setStatus("저장하려면 정답을 입력해 주세요");
    return;
  }
  const src = els.canvas;
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d");
  ctx.drawImage(src, 0, 0);
  const label = `정답 ${answer}`;
  ctx.font = '700 40px "Noto Sans KR", sans-serif';
  ctx.textBaseline = "bottom";
  const pad = 20;
  const metrics = ctx.measureText(label);
  const boxW = metrics.width + 28;
  const boxH = 56;
  const x = pad;
  const y = out.height - pad;
  ctx.fillStyle = "rgba(27, 18, 8, 0.72)";
  ctx.fillRect(x - 10, y - boxH + 8, boxW, boxH);
  ctx.fillStyle = "#ffd23a";
  ctx.fillText(label, x, y - 10);
  const stamp = new Date();
  const stampStr = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, "0")}${String(stamp.getDate()).padStart(2, "0")}-${String(stamp.getHours()).padStart(2, "0")}${String(stamp.getMinutes()).padStart(2, "0")}${String(stamp.getSeconds()).padStart(2, "0")}`;
  const link = document.createElement("a");
  link.download = `퀴즈-${sanitizeFilename(answer)}-${stampStr}.png`;
  link.href = out.toDataURL("image/png");
  link.click();
  setStatus(`저장했습니다 · ${link.download}`);
}

function clearStrokes() {
  strokes = [];
  draftShape = null;
  redraw();
  publishPaintPreview();
}

function bindDraw() {
  COLORS.forEach((hex, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch";
    btn.style.background = hex;
    btn.dataset.color = hex;
    btn.setAttribute("role", "radio");
    const name = COLOR_NAMES[hex] || hex;
    btn.title = name;
    btn.setAttribute("aria-label", name);
    btn.setAttribute("aria-checked", index === 0 ? "true" : "false");
    btn.tabIndex = index === 0 ? 0 : -1;
    btn.addEventListener("click", () => selectPenColor(hex));
    els.color.append(btn);
  });
  els.color.querySelector(".swatch")?.classList.add("active");
  els.color?.addEventListener("keydown", (event) => {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const radios = [...els.color.querySelectorAll('[role="radio"]')];
    if (!radios.length) return;
    event.preventDefault();
    const i = radios.indexOf(document.activeElement);
    let next = 0;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = radios.length - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (Math.max(i, 0) + 1) % radios.length;
    } else {
      next = ((i < 0 ? 0 : i) - 1 + radios.length) % radios.length;
    }
    radios[next].focus();
    radios[next].click();
  });
  if (els.customColor) {
    els.customColor.value = COLORS[0];
    els.customColor.addEventListener("input", () => {
      selectPenColor(els.customColor.value, true);
    });
  }

  const syncSize = () => {
    penSize = Number(els.sizeRange?.value) || 14;
    updateDrawCursor();
  };
  const syncOpacity = () => {
    penOpacity = Math.max(0.1, Math.min(1, (Number(els.opacityRange?.value) || 100) / 100));
    updateDrawCursor();
  };
  els.sizeRange?.addEventListener("input", syncSize);
  els.opacityRange?.addEventListener("input", syncOpacity);
  syncSize();
  syncOpacity();

  const canDraw = () => isDrawFormat() && (phase === "accepting" || phase === "holding") && !els.paintWrap?.hidden;

  paintPointerDown = (point) => {
    if (!canDraw()) return;
    if (drawTool === "fill") {
      strokes.push({
        type: "fill",
        x: point.x,
        y: point.y,
        color: penColor || COLORS[0],
        alpha: penOpacity,
      });
      redraw();
      publishPaintPreview();
      return;
    }
    drawing = true;
    remoteDrawing = true;
    if (SHAPE_TOOLS.has(drawTool)) {
      draftShape = {
        type: "shape",
        shape: drawTool,
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
        color: penColor || COLORS[0],
        size: penSize,
        alpha: penOpacity,
        filled: isShapeFilled(drawTool),
      };
      redraw();
      return;
    }
    strokes.push({
      color: penColor || COLORS[0],
      size: penSize,
      alpha: penOpacity,
      erase: drawTool === "eraser",
      points: [point],
    });
    redraw();
  };
  paintPointerMove = (point) => {
    if (!drawing) return;
    if (draftShape) {
      draftShape.x2 = point.x;
      draftShape.y2 = point.y;
      redraw();
      return;
    }
    strokes[strokes.length - 1].points.push(point);
    redraw();
  };
  paintPointerUp = () => {
    if (drawing && draftShape) {
      strokes.push({ ...draftShape });
      draftShape = null;
      redraw();
    }
    drawing = false;
    remoteDrawing = false;
  };

  const start = (event) => {
    if (!canDraw()) return;
    const point = getCanvasPoint(event);
    els.canvas.setPointerCapture?.(event.pointerId);
    paintPointerDown(point);
  };
  const move = (event) => {
    if (!drawing) return;
    event.preventDefault();
    paintPointerMove(getCanvasPoint(event));
  };
  const end = (event) => {
    if (drawing && event?.pointerId != null) {
      try {
        els.canvas.releasePointerCapture?.(event.pointerId);
      } catch (_) {}
    }
    if (drawing) {
      paintPointerUp();
      publishPaintPreview();
    }
  };
  els.canvas.addEventListener("pointerdown", start);
  els.canvas.addEventListener("pointermove", move);
  els.canvas.addEventListener("pointerup", end);
  els.canvas.addEventListener("pointercancel", end);
  window.addEventListener("pointerup", end);
  els.penBtn?.addEventListener("click", () => setDrawTool("pen"));
  els.eraser.addEventListener("click", () => setDrawTool("eraser"));
  els.fillBtn?.addEventListener("click", () => setDrawTool("fill"));
  els.lineBtn?.addEventListener("click", () => setDrawTool("line"));
  els.rectBtn?.addEventListener("click", () => selectShapeTool("rect"));
  els.ellipseBtn?.addEventListener("click", () => selectShapeTool("ellipse"));
  els.undo.addEventListener("click", undoStroke);
  els.clear.addEventListener("click", clearStrokes);
  els.saveBtn?.addEventListener("click", saveDrawingPng);
  window.addEventListener("keydown", (event) => {
    if (!isDrawFormat()) return;
    if (isTypingTarget(event.target)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    // event.code = physical key (works in Hangul/English IME)
    const map = {
      KeyB: "pen",
      KeyE: "eraser",
      KeyG: "fill",
      KeyL: "line",
    };
    if (map[event.code]) {
      event.preventDefault();
      setDrawTool(map[event.code]);
      return;
    }
    if (event.code === "KeyR") {
      event.preventDefault();
      selectShapeTool("rect");
      return;
    }
    if (event.code === "KeyO") {
      event.preventDefault();
      selectShapeTool("ellipse");
      return;
    }
    if (event.code === "KeyZ") {
      event.preventDefault();
      undoStroke();
      return;
    }
    if (event.code === "KeyS") {
      event.preventDefault();
      saveDrawingPng();
      return;
    }
    if (event.code === "BracketLeft") {
      event.preventDefault();
      nudgePenSize(-2);
      return;
    }
    if (event.code === "BracketRight") {
      event.preventDefault();
      nudgePenSize(2);
    }
  });
  setDrawTool("pen");
  redraw();
  window.addEventListener("resize", updateDrawCursor);
}

async function fetchChatToken(channelId) {
  const base = workerBase();
  const res = await fetch(`${base}/chat/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channelId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "채팅 토큰 실패");
  return data;
}

async function claimAuthTicket(ticket) {
  const res = await fetch(`${workerBase()}/auth/claim`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ticket }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "로그인 ticket 실패");
  return data;
}

function saveSession(next) {
  session = next;
  sessionStorage.setItem("chzzkSession", JSON.stringify(session));
  if (session.refreshToken) startAuthKeep();
}

const HOST_LOCK_KEY = "chatquiz-host-lock";
const tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let hostLockCh = null;
let hostLockTimer = 0;
let holdingHostLock = false;
let sessionTakeoverWaiters = [];

function initHostLockBus() {
  if (isDeskMode || hostLockCh || typeof BroadcastChannel === "undefined") return;
  hostLockCh = new BroadcastChannel("chatquiz-host");
  hostLockCh.addEventListener("message", (event) => {
    const msg = event.data || {};
    if (!msg || msg.tabId === tabId) return;
    if (msg.type === "ping" && holdingHostLock) {
      hostLockCh.postMessage({ type: "pong", tabId });
    }
    if (msg.type === "yield" && holdingHostLock) {
      releaseHostLock({ takenOver: true });
    }
  });
  window.addEventListener("beforeunload", () => {
    if (!holdingHostLock) return;
    holdingHostLock = false;
    if (hostLockTimer) clearInterval(hostLockTimer);
    try {
      const cur = JSON.parse(localStorage.getItem(HOST_LOCK_KEY) || "{}");
      if (cur.tabId === tabId) localStorage.removeItem(HOST_LOCK_KEY);
    } catch {
      // ignore
    }
  });
}

function writeHostLock() {
  try {
    localStorage.setItem(HOST_LOCK_KEY, JSON.stringify({ tabId, at: Date.now() }));
  } catch {
    // ignore
  }
}

function claimHostLock() {
  holdingHostLock = true;
  writeHostLock();
  if (hostLockTimer) clearInterval(hostLockTimer);
  hostLockTimer = setInterval(writeHostLock, 2000);
}

function releaseHostLock({ takenOver = false } = {}) {
  holdingHostLock = false;
  if (hostLockTimer) {
    clearInterval(hostLockTimer);
    hostLockTimer = 0;
  }
  chatHandle?.close();
  chatHandle = null;
  try {
    const cur = JSON.parse(localStorage.getItem(HOST_LOCK_KEY) || "{}");
    if (cur.tabId === tabId) localStorage.removeItem(HOST_LOCK_KEY);
  } catch {
    // ignore
  }
  if (takenOver) {
    setChatConnStatus("다른 창에서 연결을 이어받았습니다", "bad");
    setStatus("다른 창에서 연결을 이어받았습니다");
  }
}

function otherLockFresh() {
  try {
    const cur = JSON.parse(localStorage.getItem(HOST_LOCK_KEY) || "null");
    return !!(cur?.tabId && cur.tabId !== tabId && Date.now() - Number(cur.at) < 6000);
  } catch {
    return false;
  }
}

function probeOtherHost() {
  if (otherLockFresh()) return Promise.resolve(true);
  if (!hostLockCh) return Promise.resolve(false);
  return new Promise((resolve) => {
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      hostLockCh.removeEventListener("message", onPong);
      resolve(value);
    };
    const onPong = (event) => {
      const msg = event.data || {};
      if (msg.tabId !== tabId && msg.type === "pong") finish(true);
    };
    hostLockCh.addEventListener("message", onPong);
    hostLockCh.postMessage({ type: "ping", tabId });
    setTimeout(() => finish(false), 400);
  });
}

function requestOtherYield() {
  hostLockCh?.postMessage({ type: "yield", tabId });
  try {
    localStorage.removeItem(HOST_LOCK_KEY);
  } catch {
    // ignore
  }
  return new Promise((resolve) => setTimeout(resolve, 280));
}

function askSessionTakeover() {
  return new Promise((resolve) => {
    sessionTakeoverWaiters.push(resolve);
    if (els.sessionTakeoverModal && !els.sessionTakeoverModal.hidden) return;
    setModalLayer(els.sessionTakeoverModal, true, {
      focusSelector: "#sessionTakeoverOk",
    });
  });
}

function closeSessionTakeover(ok) {
  const waiters = sessionTakeoverWaiters.splice(0);
  setModalLayer(els.sessionTakeoverModal, false);
  waiters.forEach((fn) => fn(!!ok));
}

async function ensureHostSessionSlot() {
  if (isDeskMode) return true;
  initHostLockBus();
  if (!(await probeOtherHost())) return true;
  const ok = await askSessionTakeover();
  if (!ok) {
    setStatus("연결을 취소했습니다");
    return false;
  }
  await requestOtherYield();
  return true;
}

async function attachOfficialChat(accessToken, { skipSlotCheck = false } = {}) {
  if (!accessToken) throw new Error("로그인 토큰 없음");
  if (!skipSlotCheck && !(await ensureHostSessionSlot())) return;
  chatHandle?.close();
  setChatConnStatus("채팅 연결 중…");
  chatHandle = createOfficialChzzkChat({
    workerBase: workerBase(),
    accessToken,
    getAccessToken: () => session.accessToken,
    onAuthFail: async () => {
      try {
        const next = await authKeep?.refresh();
        return !!next?.accessToken;
      } catch {
        return false;
      }
    },
    onChat,
    onStatus: onChatStatus,
    onLimit: async () => {
      const ok = await askSessionTakeover();
      if (!ok) {
        setChatConnStatus("연결을 취소했습니다", "bad");
        return;
      }
      await requestOtherYield();
      void attachOfficialChat(session.accessToken, { skipSlotCheck: true });
    },
  });
  startAuthKeep();
  claimHostLock();
  if (phase === "lobby") phase = "ready";
  await ensureStreamerNickname();
  syncDeskFlow();
}

async function attachDevChannel(channelId, userId = "") {
  if (!isDev) throw new Error("개발 모드에서만 남 채널 연결 가능");
  saveSession({
    channelId,
    userId,
    mode: "dev",
  });
  chatHandle?.close();
  setChatConnStatus("채팅 연결 중…");
  const token = await fetchChatToken(channelId);
  chatHandle = createChzzkChat({
    chatChannelId: token.chatChannelId,
    accessToken: token.accessToken,
    onChat,
    onStatus: onChatStatus,
  });
  if (phase === "lobby") phase = "ready";
  syncDeskFlow();
}

async function connectDevChannel() {
  const channelId = parseChannelId(els.channelInput.value);
  if (!channelId) {
    setStatus("채널 URL이나 ID를 입력해 주세요");
    return;
  }
  try {
    await attachDevChannel(channelId);
    phase = "ready";
    setStatus(`테스트 채널 ${channelId}`);
  } catch (err) {
    setChatConnStatus(String(err.message || err), "bad");
    setStatus(String(err.message || err));
  }
}

let loginBusy = false;
async function login() {
  if (loginBusy) return;
  loginBusy = true;
  try {
    if (isDeskMode) {
      deskBridge?.post("auth.start");
      return;
    }
    const base = workerBase();
    if (!base) {
      setStatus("로그인 서버 주소가 없습니다");
      return;
    }
    if (!(await ensureHostSessionSlot())) return;
    const ret = new URL(location.origin + location.pathname);
    if (isDev) ret.searchParams.set("dev", "1");
    setStatus("치지직 로그인 창으로 이동 중…");
    // assign 이면 뒤로가기가 치지직 로그인창으로 돌아감
    window.location.replace(`${base}/auth/login?return=${encodeURIComponent(ret.toString())}`);
  } finally {
    loginBusy = false;
  }
}

// bind() 실패와 무관하게 로그인 클릭은 항상 연결
els.loginBtn?.addEventListener(
  "click",
  (ev) => {
    ev.preventDefault();
    login();
  },
  { capture: true },
);
els.sessionTakeoverCancel?.addEventListener("click", () => {
  closeSessionTakeover(false);
});
els.sessionTakeoverOk?.addEventListener("click", () => {
  closeSessionTakeover(true);
});
els.sessionTakeoverModal?.addEventListener("click", (event) => {
  if (event.target?.dataset?.sessionClose) closeSessionTakeover(false);
});

async function restoreSession() {
  const raw = sessionStorage.getItem("chzzkSession");
  if (!raw) return;
  try {
    session = JSON.parse(raw);
    if (!session.channelId) return;
    if (session.accessToken) {
      setStatus("로그인 채널에 다시 연결하는 중…");
      phase = "ready";
      await attachOfficialChat(session.accessToken);
      return;
    }
    if (isDev && session.mode === "dev") {
      setStatus("테스트 채널에 다시 연결하는 중…");
      phase = "ready";
      await attachDevChannel(session.channelId, session.userId || "");
      return;
    }
    sessionStorage.removeItem("chzzkSession");
    session = { channelId: "", userId: "" };
  } catch {
    sessionStorage.removeItem("chzzkSession");
  }
}

async function handleAuthRedirect() {
  const code = params.get("code");
  const state = params.get("state");
  const channelId = params.get("channelId");
  const userId = params.get("userId") || "";
  const ticket = params.get("ticket") || "";
  if (channelId && ticket) {
    try {
      const claimed = await claimAuthTicket(ticket);
      saveSession({
        channelId: claimed.channelId || channelId,
        userId: claimed.userId || userId || channelId,
        nickname: claimed.nickname || "",
        accessToken: claimed.accessToken,
        refreshToken: claimed.refreshToken || "",
        mode: "official",
      });
      history.replaceState({}, "", cleanReturnPath());
      await attachOfficialChat(session.accessToken);
      phase = "ready";
      setStatus("내 채널이 연결되었습니다");
      syncDeskFlow();
    } catch (err) {
      history.replaceState({}, "", cleanReturnPath());
      setStatus(`로그인 완료 처리 실패: ${err.message || err}`);
      setChatConnStatus(String(err.message || err), "bad");
      syncDeskFlow();
    }
    return;
  }
  if (channelId && !ticket) {
    // 예전 리다이렉트 호환: 토큰 없으면 다시 로그인 필요
    history.replaceState({}, "", cleanReturnPath());
    setStatus("다시 치지직에 로그인해 주세요");
    return;
  }
  if (code && workerBase()) {
    const next = new URL(`${workerBase()}/auth/callback`);
    next.searchParams.set("code", code);
    if (state) next.searchParams.set("state", state);
    window.location.replace(next.toString());
  }
}

function bind() {
  if (isDev) {
    els.devBox.hidden = false;
    setStatus("개발 모드입니다. 채널 연결 또는 가짜 채팅으로 테스트해 주세요");
  }
  localStorage.removeItem("workerUrl");
  els.hintEnabled.checked = localStorage.getItem("hintEnabled") === "1";
  if (els.hintGenreEnabled) {
    // 기본 미체크. 예전 키는 무시
    els.hintGenreEnabled.checked = localStorage.getItem("genreRevealEnabled:v1") === "1";
  }
  restoreWordPickPrefs();
  restoreCluePrefs();
  restoreTtsPref();
  bindWordPickControls();
  bindClueControls();
  window.addEventListener("resize", () => {
    if (els.prompt?.classList.contains("is-clue") && !els.prompt.hidden) fitCluePrompt();
  });
  bindHostTutorial();
  bindQuizBgm();
  bindRoundSteppers();
  bindHintInfoTip();
  restoreQuizModePrefs();
  syncModeUi();
  updateHintUi();
  els.formatSeg?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-format]");
    if (!btn) return;
    quizFormat = btn.dataset.format;
    saveQuizModePrefs();
    syncModeUi();
    syncDeskFlow();
  });
  els.topicSeg?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-topic]");
    if (!btn) return;
    quizTopic = btn.dataset.topic;
    saveQuizModePrefs();
    syncModeUi();
    syncDeskFlow();
  });
  els.streamerJoin?.addEventListener("change", () => {
    saveQuizModePrefs();
    syncManualAnswerUi();
    syncDeskStreamerTools();
    publishDeskState();
  });
  els.hintEnabled.addEventListener("change", () => {
    localStorage.setItem("hintEnabled", els.hintEnabled.checked ? "1" : "0");
    updateHintUi();
    if (!els.hintEnabled.checked && phase === "accepting") {
      hintCount = 0;
      resetHintRevealOrder(current.answer || "");
      renderQuestionView();
    }
    syncGenreHintUi();
  });
  els.hintGenreEnabled?.addEventListener("change", () => {
    localStorage.setItem("genreRevealEnabled:v1", els.hintGenreEnabled.checked ? "1" : "0");
    syncGenreHintUi();
  });
  els.startBtn.addEventListener("click", async () => {
    if (!isAuthed()) {
      setStatus("먼저 치지직에 로그인해 주세요");
      return;
    }
    dismissHostTutorial();
    if (phase === "result") {
      dismissPodium();
      phase = "ready";
    }
    if (phase === "lobby") phase = "ready";
    if (phase === "accepting" || phase === "holding" || phase === "countdown" || phase === "reveal") return;
    if (isClueFormat()) {
      try {
        await ensureActiveClueBank();
      } catch {
        if (!canStartQuestion()) return;
      }
    }
    if (!canStartQuestion()) return;
    const newRound = !roundActive;
    try {
      await runStartCountdown();
      if (newRound) startRound();
      else beginQuestion();
    } catch (err) {
      phase = "ready";
      syncDeskFlow();
      setStatus(String(err.message || err || "시작에 실패했습니다"));
    }
  });
  els.skipBtn.addEventListener("click", () => {
    if (phase !== "accepting") return;
    finishQuestion(null);
  });
  const onContinue = () => {
    void continueAfterReveal();
  };
  const onNextSetup = () => openNextQuestionSetup();
  els.continueOverlay?.addEventListener("click", onContinue);
  els.nextSetupOverlay?.addEventListener("click", onNextSetup);
  els.podiumConfirm?.addEventListener("click", () => {
    if (phase !== "result") return;
    dismissPodium();
    phase = "lobby";
    setStatus("새 판은 게임 시작을 눌러 주세요");
    syncDeskFlow();
  });
  els.quitRoundBtn?.addEventListener("click", () => {
    openEndConfirm();
  });
  els.endConfirmCancel?.addEventListener("click", () => {
    closeEndConfirm();
  });
  els.endConfirmOk?.addEventListener("click", () => {
    endRoundConfirmed();
  });
  els.endConfirmModal?.addEventListener("click", (event) => {
    if (event.target?.dataset?.endClose) closeEndConfirm();
  });
  els.sessionTakeoverCancel?.addEventListener("click", () => {
    closeSessionTakeover(false);
  });
  els.sessionTakeoverOk?.addEventListener("click", () => {
    closeSessionTakeover(true);
  });
  els.sessionTakeoverModal?.addEventListener("click", (event) => {
    if (event.target?.dataset?.sessionClose) closeSessionTakeover(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      trapModalFocus(event);
      return;
    }
    if (event.key !== "Escape") return;
    if (hostTutorialStep >= 0 && els.hostTutorial && !els.hostTutorial.hidden) {
      event.preventDefault();
      dismissHostTutorial();
      return;
    }
    if (delayProbe) {
      event.preventDefault();
      stopChatDelayProbe("재기를 취소했습니다");
      return;
    }
    const openTip = [els.hintInfoPop, els.genreInfoPop, els.streamerJoinInfoPop, els.chatDelayInfoPop].find(
      (pop) => pop && !pop.hidden,
    );
    if (openTip) {
      event.preventDefault();
      openTip.hidden = true;
      [els.hintInfo, els.genreInfo, els.streamerJoinInfo, els.chatDelayInfo, els.deskChatDelayInfo].forEach((btn) => {
        if (btn?.getAttribute("aria-describedby") === openTip.id) {
          btn.setAttribute("aria-expanded", "false");
        }
      });
      return;
    }
    if (els.sessionTakeoverModal && !els.sessionTakeoverModal.hidden) {
      event.preventDefault();
      closeSessionTakeover(false);
      return;
    }
    if (els.endConfirmModal && !els.endConfirmModal.hidden) {
      event.preventDefault();
      closeEndConfirm();
      return;
    }
    if (els.genreModal && !els.genreModal.hidden) {
      event.preventDefault();
      setGenreMenuOpen(false);
      return;
    }
    if (els.clueSheet && !els.clueSheet.hidden) {
      event.preventDefault();
      closeClueSheet();
      return;
    }
    if (els.guestModal && !els.guestModal.hidden) {
      event.preventDefault();
      setGuestModalOpen(false);
    }
  });
  els.connectBtn.addEventListener("click", connectDevChannel);
  const sendFakeChat = () => {
    const text = String(els.fakeText.value || "").trim();
    if (!text) return;
    onChat(
      {
        type: "chat",
        hidden: false,
        nickname: els.fakeNick.value || "테스트",
        userId: els.fakeNick.value || "test",
        text,
      },
      { fake: true },
    );
    els.fakeText.value = "";
  };
  els.fakeSend.addEventListener("click", sendFakeChat);
  els.fakeText.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    // 한글 IME 조합 중 Enter면 확정만 하고 전송하지 않음 (마지막 글자 중복 방지)
    if (event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    sendFakeChat();
  });
}

async function main() {
  if (isDeskMode) {
    if (els.guestHostPanel) setHidden(els.guestHostPanel, true);
    if (els.joinBanner) els.joinBanner.hidden = true;
    try {
      bindDraw();
    } catch (err) {
      console.error(err);
    }
    if (isDev && els.devBox) els.devBox.hidden = false;
    bindDeskClient();
    return;
  }

  initHostLockBus();
  bindAnswerActions();
  try {
    bindDraw();
  } catch (err) {
    console.error(err);
    setStatus("그림 도구 초기화에 실패했습니다(퀴즈는 가능합니다)");
  }
  try {
    bind();
  } catch (err) {
    console.error(err);
    setStatus(String(err.message || err || "조작 연결에 실패했습니다"));
  }
  bindGuestHostUi();
  bindDeskHost();
  try {
    wordBank = await initWordBank();
    const stats = getWordBankStats(wordBank, wordPickOptions());
    if (!stats.matched) {
      setStatus("선택한 글자 수/장르에 맞는 단어가 없습니다");
    }
  } catch {
    setStatus("단어 목록을 읽지 못했습니다. 자동 초성을 사용할 수 없습니다");
  }
  try {
    await handleAuthRedirect();
  } catch (err) {
    setStatus(String(err.message || err));
  }
  if (phase === "lobby") await restoreSession();
  renderBoard();
  showPrompt("chosung", "");
  els.prompt.hidden = true;
  syncModeUi();
  syncDeskFlow();
}

main();
