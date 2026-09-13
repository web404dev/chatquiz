import {
  createJudge,
  parseChannelId,
  toChosung,
  timeHintTargetCount,
} from "./quiz.js?v=106";
import { createChzzkChat } from "./chzzk-chat.js?v=106";
import { createOfficialChzzkChat } from "./chzzk-session.js?v=106";
import {
  getWordBankStats,
  initWordBank,
  pickWordFromBank,
  pickWordEntryFromBank,
} from "./word-bank.js?v=106";
import { createDeskBridge, normFromEvent } from "./desk-bridge.js?v=106";

const params = new URLSearchParams(location.search);
const isDev = params.get("dev") === "1";
const isDeskMode = params.get("desk") === "1";
const WORKER_BASE = "https://chzzk-chat-quiz.web404dev.workers.dev";

const els = {
  prompt: document.getElementById("prompt"),
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
  formatSeg: document.getElementById("formatSeg"),
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
  podiumConfirm: document.getElementById("podiumConfirm"),
  quitRoundBtn: document.getElementById("quitRoundBtn"),
  endConfirmModal: document.getElementById("endConfirmModal"),
  endConfirmCancel: document.getElementById("endConfirmCancel"),
  endConfirmOk: document.getElementById("endConfirmOk"),
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

let wordBank = { words: [], fetchedAt: 0 };
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
let current = { mode: "chosung", format: "chosung", topic: "auto", answer: "", genre: "" };
let quizFormat = "chosung";
let quizTopic = "auto";
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

function publishObs() {}
function publishObsPaint() {}

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
    drawPanel: !els.drawPanel?.hidden,
    paintLive: isDrawFormat() && phase === "accepting",
    hidden: {
      skipBtn: !!els.skipBtn?.hidden,
      answerPanel: !showAnswerEditor,
      answerPlayingText: !showAnswerPlaying,
      deskTopBar: !(showSkip || showAnswerPlaying),
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
    ["drawPanel", els.drawPanel],
    ["devBox", els.devBox],
  ];
  for (const [key, el] of pairs) {
    if (!el || map[key] === undefined) continue;
    el.hidden = !!map[key];
    el.toggleAttribute("hidden", !!map[key]);
  }
}

function applyDeskState(s) {
  if (!s) return;
  if (typeof s.phase === "string") phase = s.phase;
  if (typeof s.statusText === "string") els.status.textContent = s.statusText;
  if (s.quizFormat === "chosung" || s.quizFormat === "draw") quizFormat = s.quizFormat;
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
    els.deskPaintWrap.hidden = !showPaint;
    els.deskPaintWrap.toggleAttribute("hidden", !showPaint);
    if (showPaint) requestAnimationFrame(updateDrawCursor);
  }
  if (els.deskLinkStatus) {
    els.deskLinkStatus.hidden = false;
    els.deskLinkStatus.textContent = "방송창과 연결됨";
  }
  if (typeof s.showAnswerEditor === "boolean" && els.answerPanel) {
    els.answerPanel.hidden = !s.showAnswerEditor;
    els.answerPanel.toggleAttribute("hidden", !s.showAnswerEditor);
  }
  if (typeof s.showAnswerPlaying === "boolean" && els.answerPlayingText) {
    els.answerPlayingText.hidden = !s.showAnswerPlaying;
    els.answerPlayingText.toggleAttribute("hidden", !s.showAnswerPlaying);
  }
  if (typeof s.showDeskTopBar === "boolean" && els.deskTopBar) {
    els.deskTopBar.hidden = !s.showDeskTopBar;
    els.deskTopBar.toggleAttribute("hidden", !s.showDeskTopBar);
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
    els.deskHud.hidden = !s.showHud;
    els.deskHud.toggleAttribute("hidden", !s.showHud);
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
    case "auth.start":
      login();
      break;
    case "ui.click":
      if (p.id) document.getElementById(p.id)?.click();
      break;
    case "ui.seg":
      if (p.axis === "format" && (p.value === "chosung" || p.value === "draw")) {
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
  if (!els.canvas || !isDrawFormat() || els.paintWrap?.hidden) return;
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
  }
  if (els.ellipseBtn) {
    const mode = isShapeFilled("ellipse") ? "채우기" : "테두리";
    els.ellipseBtn.title = `원 · ${mode} (다시 누르면 전환)`;
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
    node.classList.toggle("active", node.dataset.color === hex);
  });
  if (els.customColor && !fromCustom) {
    els.customColor.value = hex.length === 7 ? hex : "#1a1208";
  }
  if (fromCustom) {
    els.color?.querySelectorAll(".swatch").forEach((node) => node.classList.remove("active"));
  }
}

function setDrawTool(tool) {
  drawTool = tool;
  els.penBtn?.classList.toggle("active", tool === "pen");
  els.eraser?.classList.toggle("active", tool === "eraser");
  els.fillBtn?.classList.toggle("active", tool === "fill");
  els.lineBtn?.classList.toggle("active", tool === "line");
  els.rectBtn?.classList.toggle("tool-active", tool === "rect");
  els.rectBtn?.classList.toggle("active", tool === "rect");
  els.ellipseBtn?.classList.toggle("tool-active", tool === "ellipse");
  els.ellipseBtn?.classList.toggle("active", tool === "ellipse");
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
  return Boolean(els.hintEnabled?.checked);
}

function genreHintsAllowed() {
  return Boolean(els.hintGenreEnabled?.checked);
}

function syncGenreHintUi() {
  const line = els.genreHintLine;
  if (!line) return;
  const genre = String(current.genre || "").trim();
  const show =
    phase === "accepting" &&
    genreHintsAllowed() &&
    genre &&
    genre !== "전체";
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

function bindInfoTip(info, pop) {
  if (!info || !pop) return;

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
  };

  const show = () => {
    place();
  };
  const hide = () => {
    pop.hidden = true;
  };
  const stillInside = (related) =>
    related instanceof Node && (info.contains(related) || pop.contains(related));

  info.addEventListener("mouseenter", show);
  info.addEventListener("focus", show);
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
}

function bindRoundSteppers() {
  els.secondsMinus?.addEventListener("click", () => bumpSeconds(-10));
  els.secondsPlus?.addEventListener("click", () => bumpSeconds(10));
  els.questionsMinus?.addEventListener("click", () => bumpQuestions(-1));
  els.questionsPlus?.addEventListener("click", () => bumpQuestions(1));
  syncRoundSettingLabels();
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
  renderQuestionView();
  syncGenreHintUi();
  setStatus(`시간 힌트 ${hintCount}/${total}`);
}

function isAuthed() {
  return Boolean(session?.channelId);
}

function syncDeskFlow() {
  const inPlay = phase === "accepting" || phase === "countdown";
  const revealing = phase === "reveal";
  const onPodium = phase === "result";
  const coverLobby = inPlay || revealing || onPodium;
  const newGame = !roundActive || phase === "result" || phase === "lobby";
  const authed = isAuthed();
  const showLobbyChrome = !coverLobby;

  // 로그인 전·후 로비에서 OBS 가이드(점선)만 항상 보이게. 설정 창과 별개.
  if (els.broadcastCropGuide) {
    const showGuide = showLobbyChrome && (newGame || !authed);
    els.broadcastCropGuide.hidden = !showGuide;
    els.broadcastCropGuide.toggleAttribute("hidden", !showGuide);
  }
  if (els.broadcastLobby) els.broadcastLobby.hidden = coverLobby;

  // 1) 미로그인: 로그인 창만
  if (els.lobbyAuthBlock) {
    const showAuth = showLobbyChrome && !authed;
    els.lobbyAuthBlock.hidden = !showAuth;
    els.lobbyAuthBlock.toggleAttribute("hidden", !showAuth);
  }
  // 2) 로그인 확인 후: 한 판 설정
  if (els.roundSettingsBlock) {
    const showRound = showLobbyChrome && authed && newGame;
    els.roundSettingsBlock.hidden = !showRound;
    els.roundSettingsBlock.toggleAttribute("hidden", !showRound);
  }
  if (els.questionSettingsBlock) {
    const showQuestion = showLobbyChrome && authed;
    els.questionSettingsBlock.hidden = !showQuestion;
    els.questionSettingsBlock.toggleAttribute("hidden", !showQuestion);
  }
  if (els.setupStartRow) {
    const showStart = showLobbyChrome && authed;
    els.setupStartRow.hidden = !showStart;
    els.setupStartRow.toggleAttribute("hidden", !showStart);
  }
  if (els.startBtn) {
    els.startBtn.hidden = !(showLobbyChrome && authed);
    els.startBtn.textContent = newGame ? "게임 시작" : "다음 문제";
  }
  if (els.broadcastLobby?.classList) {
    els.broadcastLobby.classList.toggle("mid-round", authed && !newGame && showLobbyChrome);
  }
  if (els.skipBtn) {
    els.skipBtn.hidden = phase !== "accepting";
  }
  const hasMoreQuestions = revealing && remaining > 0;
  if (els.revealActions) {
    els.revealActions.hidden = !revealing;
  }
  if (els.nextSetupOverlay) {
    els.nextSetupOverlay.hidden = !hasMoreQuestions;
  }
  if (els.continueOverlay && revealing) {
    els.continueOverlay.textContent = remaining <= 0 ? "시상 보기" : "계속";
  }
  syncManualAnswerUi();
  if (revealing && els.winner) {
    els.winner.textContent = "";
  }
  const showQuit =
    phase === "accepting" ||
    phase === "countdown" ||
    phase === "reveal" ||
    (roundActive && phase === "ready");
  if (els.quitRoundBtn) {
    els.quitRoundBtn.hidden = !showQuit;
  }
  if (els.chatConnStatus) {
    els.chatConnStatus.hidden = showQuit;
    els.chatConnStatus.toggleAttribute("hidden", showQuit);
  }
  els.sideCam?.classList.toggle("is-quiet", showQuit);
  if (!coverLobby && els.broadcastLobby && !els.broadcastLobby.hidden) {
    if (els.paintWrap) els.paintWrap.hidden = true;
    if (phase !== "result" && phase !== "reveal") {
      if (phase === "lobby" || phase === "ready") {
        els.prompt.hidden = true;
      }
    }
  }
  if (!inPlay && !revealing && !onPodium) requestAnimationFrame(() => syncLenUi());
  publishObs();
  publishDeskState();
}

function hideDrawHintBar() {
  if (els.drawHintBar) {
    els.drawHintBar.hidden = true;
    els.drawHintBar.toggleAttribute("hidden", true);
  }
  if (els.drawHintSlots) els.drawHintSlots.innerHTML = "";
  if (els.genreHintLine) {
    els.genreHintLine.hidden = true;
    els.genreHintLine.toggleAttribute("hidden", true);
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
  els.drawHintBar.hidden = false;
  els.drawHintBar.toggleAttribute("hidden", false);
}

function renderQuestionView() {
  const answer = current.answer || "";
  const mode = current.mode;
  const masked = hintCount > 0 ? maskAnswer(answer, hintCount) : "";

  if (mode === "draw") {
    if (els.paintWrap) els.paintWrap.hidden = false;
    els.prompt.hidden = true;
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
  els.prompt.hidden = false;
  const base = toChosung(answer);
  els.prompt.classList.remove("hit", "miss");
  els.prompt.textContent = masked ? `${base}\n${masked}` : base;
  syncGenreHintUi();
}

function workerBase() {
  return WORKER_BASE;
}


function isDrawFormat(format = quizFormat) {
  return format === "draw";
}

function isAutoTopic(topic = quizTopic) {
  return topic === "auto";
}

function getManualAnswer() {
  return String(manualAnswerLocked || "").trim();
}

function isAnswerPlayPhase() {
  return phase === "accepting" || phase === "countdown" || phase === "reveal";
}

function shouldBlindDeskAnswer() {
  // 초성 자동 + 스트리머 참여 ON 일 때만 조작칸 정답 숨김
  return quizFormat === "chosung" && isAutoTopic() && isStreamerJoinEnabled();
}

function syncManualAnswerUi() {
  const manual = !isAutoTopic();
  const playing = isAnswerPlayPhase();
  const showEditor = manual && !playing;
  const showPlaying = playing && Boolean(current.answer) && !shouldBlindDeskAnswer();
  const showSkip = phase === "accepting";

  if (els.answerPanel) {
    els.answerPanel.hidden = !showEditor;
    els.answerPanel.toggleAttribute("hidden", !showEditor);
  }
  if (showEditor) syncAnswerSubmitBtn();
  if (els.answerPlayingText) {
    els.answerPlayingText.hidden = !showPlaying;
    els.answerPlayingText.toggleAttribute("hidden", !showPlaying);
    els.answerPlayingText.textContent = showPlaying
      ? `이번 정답 : ${current.answer}`
      : "이번 정답 :";
  }
  if (els.deskTopBar) {
    const showBar = showSkip || showPlaying;
    els.deskTopBar.hidden = !showBar;
    els.deskTopBar.toggleAttribute("hidden", !showBar);
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
    event.preventDefault();
    if (getManualAnswer()) return;
    submitManualAnswer();
  });
}


function syncAxisButtons() {
  els.formatSeg?.querySelectorAll("[data-format]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.format === quizFormat);
  });
  els.topicSeg?.querySelectorAll("[data-topic]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.topic === quizTopic);
  });
}

function isStreamerJoinEnabled() {
  return Boolean(els.streamerJoin?.checked);
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
  try {
    const prefs = JSON.parse(localStorage.getItem(QUIZ_MODE_PREF_KEY) || "{}");
    if (prefs.format === "chosung" || prefs.format === "draw") quizFormat = prefs.format;
    if (prefs.topic === "auto" || prefs.topic === "manual") quizTopic = prefs.topic;
    if (els.streamerJoin) {
      // 기본 OFF. 예전 prefs에 없으면 false
      els.streamerJoin.checked = prefs.streamerJoin === true;
    }
  } catch {
    // ignore
  }
  // migrate legacy single mode if present
  try {
    const legacy = localStorage.getItem("quizLegacyMode");
    if (legacy === "chosung-manual") {
      quizFormat = "chosung";
      quizTopic = "manual";
    } else if (legacy === "draw") {
      quizFormat = "draw";
      quizTopic = "manual";
    } else if (legacy === "chosung-auto") {
      quizFormat = "chosung";
      quizTopic = "auto";
    }
  } catch {
    // ignore
  }
  syncAxisButtons();
}

function syncDrawPanel() {
  if (els.drawPanel) els.drawPanel.hidden = !isDrawFormat();
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
  els.genreModal.hidden = !open;
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
    btn.innerHTML = `<span class="genre-check" aria-hidden="true"></span><span class="genre-ico" aria-hidden="true">${chip.icon}</span><span>${chip.label}</span>`;
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleDraftGenre(chip.id);
    });
    els.wordGenrePanel.appendChild(btn);
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
  renderGenreMenu();
}

function wordPickOptions() {
  return {
    minLen: wordMinLen,
    maxLen: wordMaxLen,
    genres: selectedGenres.slice(),
  };
}

function reportWordPickStats() {
  if (!isAutoTopic() || !wordBank) return;
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
  const isAuto = isAutoTopic();
  const needsAnswer = !isAuto;
  syncAxisButtons();
  if (els.manualAnswerHint) {
    els.manualAnswerHint.hidden = !needsAnswer;
    els.manualAnswerHint.toggleAttribute("hidden", !needsAnswer);
  }
  if (els.autoWordFields) {
    els.autoWordFields.hidden = !isAuto;
    els.autoWordFields.toggleAttribute("hidden", !isAuto);
  }
  if (els.streamerJoinOpt) {
    const showStreamerJoin = !isDraw && isAuto;
    els.streamerJoinOpt.hidden = !showStreamerJoin;
    els.streamerJoinOpt.toggleAttribute("hidden", !showStreamerJoin);
  }
  if (!needsAnswer) {
    clearManualAnswerLock();
  } else {
    syncManualAnswerUi();
  }
  syncDrawPanel();
  if (isAuto) {
    requestAnimationFrame(() => syncLenUi());
    reportWordPickStats();
  }

  if (phase === "accepting") {
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
    els.prompt.textContent = "";
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
  els.prompt.textContent = text;
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
  if (els.timerSec) els.timerSec.textContent = String(Math.max(0, leftSec));
  if (els.timerBar) els.timerBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  publishObs();
  publishDeskState();
}

function updateRoundHud() {
  if (els.roundLabel) els.roundLabel.textContent = `${roundNow}/${roundTotal}`;
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
  stopTimer();
  roundActive = false;
  phase = "result";
  roundNow = 0;
  updateRoundHud();
  updateTimerHud(0, 0);
  hideDrawHintBar();
  if (els.paintWrap) els.paintWrap.hidden = true;
  if (els.broadcastHud) els.broadcastHud.hidden = false;
  els.prompt.hidden = true;
  els.prompt.classList.remove("hit", "miss");
  els.prompt.textContent = "";
  els.winner.textContent = "한 판 종료";
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
  podium.hidden = false;
  podium.toggleAttribute("hidden", false);
}

function dismissPodium() {
  if (els.podium) {
    els.podium.hidden = true;
    els.podium.toggleAttribute("hidden", true);
  }
  if (els.winner) els.winner.textContent = "";
  scores = new Map();
  renderBoard();
}

function openNextQuestionSetup() {
  if (phase !== "reveal") return;
  if (remaining <= 0) {
    showFinalResult();
    return;
  }
  phase = "ready";
  setStatus("다음 문제 설정");
  syncDeskFlow();
}

async function continueAfterReveal() {
  if (phase !== "reveal") return;
  if (remaining <= 0) {
    showFinalResult();
    return;
  }
  if (!canStartQuestion()) {
    openNextQuestionSetup();
    return;
  }
  try {
    await runStartCountdown();
    if (!roundActive || remaining <= 0) return;
    beginQuestion();
  } catch (err) {
    phase = "ready";
    syncDeskFlow();
    setStatus(String(err.message || err || "시작에 실패했습니다"));
  }
}

function finishQuestion(winner) {
  if (phase !== "accepting") return;
  phase = "reveal";
  stopTimer();
  judge = null;
  const answerText = current.answer || "";
  els.prompt.hidden = false;
  if (els.paintWrap) els.paintWrap.hidden = true;
  hideDrawHintBar();
  els.prompt.classList.remove("hit", "miss");
  if (els.broadcastHud) els.broadcastHud.hidden = false;
  if (winner) {
    addScore(winner.nickname);
    els.winner.textContent = "";
    els.prompt.classList.add("hit");
    els.prompt.textContent = `${winner.nickname} 정답!\n${answerText}`;
    setStatus(`${winner.nickname} 님이 맞히셨습니다 · 정답 ${answerText}`);
  } else {
    els.winner.textContent = "";
    els.prompt.classList.add("miss");
    els.prompt.textContent = `정답 ${answerText}`;
    setStatus(`정답 ${answerText}`);
  }
  remaining -= 1;
  updateRoundHud();
  if (remaining <= 0) {
    showFinalResult(answerText);
    return;
  }
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

function appendSideChat(chat, { fake = false } = {}) {
  const list = els.chatList;
  if (!list) return;
  const text = String(chat?.text || "").trim();
  if (!text) return;
  const li = document.createElement("li");
  if (chat?.type === "donation") li.classList.add("is-donation");
  if (fake) li.classList.add("is-fake");
  if (chat?.hidden) li.classList.add("is-hidden");

  const nick = document.createElement("span");
  nick.className = "chat-nick";
  nick.textContent = chat?.nickname || "익명";

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
  else if (/끊김|오류|실패/.test(msg)) setChatConnStatus(msg, "bad");
  else setChatConnStatus(msg || "연결되지 않았습니다");
  publishObs();
}

function onChat(chat, opts = {}) {
  appendSideChat(chat, opts);
  if (phase !== "accepting" || !judge) return;
  if (chat?.type && chat.type !== "chat") return;
  if (chat?.hidden) return;
  const result = judge(chat);
  if (result.hit) finishQuestion(result.winner);
}

function openEndConfirm() {
  if (!els.endConfirmModal) return;
  els.endConfirmModal.hidden = false;
}

function closeEndConfirm() {
  if (!els.endConfirmModal) return;
  els.endConfirmModal.hidden = true;
}

function endRoundConfirmed() {
  stopTimer();
  judge = null;
  remaining = 0;
  closeEndConfirm();
  const answerText =
    phase === "accepting" || phase === "countdown" || phase === "reveal"
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
  phase = "countdown";
  syncDeskFlow();
  stopTimer();
  clearStrokes();
  els.prompt.hidden = true;
  els.prompt.textContent = "";
  els.prompt.classList.remove("hit", "miss");
  if (els.paintWrap) els.paintWrap.hidden = true;
  hideDrawHintBar();
  if (els.broadcastHud) els.broadcastHud.hidden = true;
  els.winner.textContent = "";
  if (els.roundLabel) els.roundLabel.textContent = "";
  updateTimerHud(0, 0);
  setStatus("시작 준비…");
  for (const n of [3, 2, 1]) {
    setCountdownVisible(n);
    await sleep(1000);
  }
  setCountdownVisible(null);
}

function canStartQuestion() {
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
  const streamerJoin = format === "chosung" && topic === "auto" && isStreamerJoinEnabled();
  if (topic === "auto") {
    try {
      const entry = pickWordEntry();
      answer = entry.word;
      genre = entry.genre || "";
    } catch (err) {
      setStatus(String(err.message || err || "단어 선택에 실패했습니다"));
      phase = "ready";
      syncDeskFlow();
      return;
    }
    // 초성 자동: 스트리머 참여 OFF(기본)면 본인 채팅 제외. ON이면 제외 없음
    if (format === "chosung" && !streamerJoin) {
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

  current = { mode: format === "draw" ? "draw" : "chosung", format, topic, answer, genre };
  hintCount = 0;
  resetHintRevealOrder(answer);
  judge = createJudge({ answer, excludeUserId });
  phase = "accepting";
  roundNow = Math.min(roundTotal, roundNow + 1);
  if (els.broadcastHud) els.broadcastHud.hidden = false;
  updateRoundHud();
  els.winner.textContent = "";
  if (format === "draw") redraw();
  renderQuestionView();
  clearManualAnswerLock();
  startTimer(seconds);
  updateHintUi();
  if (topic === "auto") {
    if (streamerJoin) {
      // 조작칸 블라인드: 정답 문자열 넣지 않음
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
  scores = new Map();
  renderBoard();
  roundTotal = Math.max(1, Number(els.questionCount.value) || 10);
  remaining = roundTotal;
  roundNow = 0;
  updateRoundHud();
  roundActive = true;
  phase = "ready";
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
  COLORS.forEach((hex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch";
    btn.style.background = hex;
    btn.dataset.color = hex;
    btn.title = hex;
    btn.addEventListener("click", () => selectPenColor(hex));
    els.color.append(btn);
  });
  els.color.querySelector(".swatch")?.classList.add("active");
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

  const canDraw = () => isDrawFormat() && !els.paintWrap?.hidden;

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
}

async function attachOfficialChat(accessToken) {
  if (!accessToken) throw new Error("로그인 토큰 없음");
  chatHandle?.close();
  setChatConnStatus("채팅 연결 중…");
  chatHandle = createOfficialChzzkChat({
    workerBase: workerBase(),
    accessToken,
    onChat,
    onStatus: onChatStatus,
  });
  if (phase === "lobby") phase = "ready";
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

function login() {
  const base = workerBase();
  const ret = new URL(location.href.split("?")[0]);
  if (isDev) ret.searchParams.set("dev", "1");
  location.href = `${base}/auth/login?return=${encodeURIComponent(ret.toString())}`;
}

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
    const claimed = await claimAuthTicket(ticket);
    saveSession({
      channelId: claimed.channelId || channelId,
      userId: claimed.userId || userId || channelId,
      accessToken: claimed.accessToken,
      refreshToken: claimed.refreshToken || "",
      mode: "official",
    });
    history.replaceState({}, "", cleanReturnPath());
    await attachOfficialChat(session.accessToken);
    phase = "ready";
    setStatus("내 채널이 연결되었습니다");
    return;
  }
  if (channelId && !ticket) {
    // 예전 리다이렉트 호환: 토큰 없으면 다시 로그인 필요
    history.replaceState({}, "", cleanReturnPath());
    setStatus("다시 치지직에 로그인해 주세요");
    return;
  }
  if (code && workerBase()) {
    const res = await fetch(
      `${workerBase()}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`,
    );
    if (!res.ok) throw new Error("로그인 실패");
    const data = await res.json();
    saveSession({
      channelId: data.channelId,
      userId: data.userId || data.channelId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || "",
      mode: "official",
    });
    history.replaceState({}, "", cleanReturnPath());
    await attachOfficialChat(session.accessToken);
    phase = "ready";
    setStatus("내 채널이 연결되었습니다");
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
  bindWordPickControls();
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
  });
  els.loginBtn.addEventListener("click", login);
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
    if (phase === "result") {
      dismissPodium();
      phase = "ready";
    }
    if (phase === "lobby") phase = "ready";
    if (phase === "accepting" || phase === "countdown" || phase === "reveal") return;
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
    try {
      bindDraw();
    } catch (err) {
      console.error(err);
    }
    if (isDev && els.devBox) els.devBox.hidden = false;
    bindDeskClient();
    return;
  }

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
