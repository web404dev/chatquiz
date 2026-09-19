import { createAuthKeep } from "./auth-keep.js?v=137";

const WORKER_BASE = "https://chzzk-chat-quiz.web404dev.workers.dev";
const params = new URLSearchParams(location.search);
const roomId = params.get("room") || "";
const invite = params.get("invite") || "";
const isDev = params.get("dev") === "1";

const els = {
  status: document.getElementById("guestStatus"),
  blocked: document.getElementById("guestBlocked"),
  blockedMsg: document.getElementById("guestBlockedMsg"),
  closeBtn: document.getElementById("guestCloseBtn"),
  login: document.getElementById("guestLogin"),
  loginBtn: document.getElementById("guestLoginBtn"),
  app: document.getElementById("guestApp"),
  hello: document.getElementById("guestHello"),
  modeLabel: document.getElementById("guestModeLabel"),
  answerBox: document.getElementById("guestAnswerBox"),
  answer: document.getElementById("guestAnswer"),
  answerSubmit: document.getElementById("guestAnswerSubmit"),
  paintBox: document.getElementById("guestPaintBox"),
  canvas: document.getElementById("guestCanvas"),
  color: document.getElementById("guestColor"),
  size: document.getElementById("guestSize"),
  undo: document.getElementById("guestUndo"),
  clear: document.getElementById("guestClear"),
};

let session = { channelId: "", userId: "", accessToken: "", refreshToken: "" };
let mode = "idle"; // idle | chosung | draw
let pollAfter = 0;
let pollTimer = 0;
let authKeep = null;
const GUEST_SESSION_KEY = `chatquiz-guest:${roomId}:${invite}`;
let strokes = [];
let drawing = false;

function setStatus(t) {
  els.status.textContent = t;
}

function show(el, on) {
  if (!el) return;
  el.hidden = !on;
  el.toggleAttribute("hidden", !on);
  if ("inert" in el) el.inert = !on;
}

function showBlocked(msg) {
  show(els.login, false);
  show(els.app, false);
  show(els.blocked, true);
  if (msg) els.blockedMsg.textContent = msg;
  setStatus("접근할 수 없습니다");
}

async function api(path, init) {
  const res = await fetch(`${WORKER_BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

function login() {
  const ret = new URL(location.href);
  ret.searchParams.delete("code");
  ret.searchParams.delete("state");
  ret.searchParams.delete("ticket");
  ret.searchParams.delete("channelId");
  ret.searchParams.delete("userId");
  location.replace(`${WORKER_BASE}/auth/login?return=${encodeURIComponent(ret.toString())}`);
}

async function claimAuthTicket(ticket) {
  return api("/auth/claim", {
    method: "POST",
    body: JSON.stringify({ ticket }),
  });
}

async function handleAuthReturn() {
  const ticket = params.get("ticket") || "";
  const channelId = params.get("channelId") || "";
  const userId = params.get("userId") || channelId;
  if (!ticket) return false;
  const claimed = await claimAuthTicket(ticket);
  session = {
    channelId: claimed.channelId || channelId,
    userId: claimed.userId || userId,
    accessToken: claimed.accessToken || "",
    refreshToken: claimed.refreshToken || "",
  };
  saveGuestSession();
  startGuestAuthKeep();
  history.replaceState({}, "", cleanUrl());
  return true;
}

function saveGuestSession() {
  try {
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

function restoreGuestSession() {
  try {
    const raw = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (!raw) return;
    const next = JSON.parse(raw);
    if (next?.userId) session = { ...session, ...next };
  } catch {
    // ignore
  }
}

function startGuestAuthKeep() {
  authKeep?.stop();
  if (!session.refreshToken) return;
  authKeep = createAuthKeep({
    workerBase: WORKER_BASE,
    getSession: () => session,
    setSession: (next) => {
      session = next;
      saveGuestSession();
    },
  });
  authKeep.start();
}

function cleanUrl() {
  const u = new URL(location.href);
  ["ticket", "channelId", "userId", "code", "state"].forEach((k) => u.searchParams.delete(k));
  return u.pathname + u.search;
}

async function checkInvite() {
  if (!roomId || !invite) {
    showBlocked("이 초대 링크는 만료되었습니다.");
    return null;
  }
  try {
    const data = await api(
      `/invite/check?room=${encodeURIComponent(roomId)}&invite=${encodeURIComponent(invite)}`,
    );
    if (!data.ok || data.expired) {
      showBlocked("이 초대 링크는 만료되었습니다.");
      return null;
    }
    return data;
  } catch (err) {
    if (err.data?.expired) {
      showBlocked("이 초대 링크는 만료되었습니다.");
      return null;
    }
    setStatus(String(err.message || err));
    showBlocked("초대 확인에 실패했습니다. (Worker 미배포일 수 있습니다)");
    return null;
  }
}

async function claimAsGuest(meta) {
  const data = await api("/invite/claim", {
    method: "POST",
    body: JSON.stringify({
      invite,
      userId: session.userId,
    }),
  });
  show(els.login, false);
  show(els.blocked, false);
  show(els.app, true);
  els.hello.textContent = `${data.nickname || meta.nickname || ""} 님, 출제할 수 있습니다`;
  setStatus("연결됨 · 스트리머 설정을 기다리는 중");
  startPoll();
  bindPaint();
}

async function relaySend(msg) {
  await api("/relay/send", {
    method: "POST",
    body: JSON.stringify({ roomId, invite, from: "guest", msg }),
  });
}

function startPoll() {
  if (pollTimer) return;
  let expiredHits = 0;
  pollTimer = setInterval(async () => {
    try {
      const data = await api(
        `/relay/poll?room=${encodeURIComponent(roomId)}&after=${pollAfter}&role=guest`,
      );
      expiredHits = 0;
      for (const m of data.messages || []) {
        pollAfter = Math.max(pollAfter, m.id || 0);
        onHostMsg(m.msg || m);
      }
    } catch (err) {
      if (err.data?.expired) {
        expiredHits += 1;
        if (expiredHits >= 4) showBlocked("스트리머가 출제를 종료했습니다.");
      }
    }
  }, 400);
}

function onHostMsg(msg) {
  if (msg.type === "host.kick") {
    showBlocked("스트리머가 출제를 종료했습니다.");
    setStatus("이 링크에서 기다려도 다시 참여되지 않습니다");
    return;
  }
  if (msg.type === "host.mode") {
    mode = msg.mode === "draw" ? "draw" : msg.mode === "chosung" ? "chosung" : "idle";
    els.modeLabel.textContent =
      mode === "draw" ? "그림" : mode === "chosung" ? "초성" : "대기";
    show(els.paintBox, mode === "draw");
    show(els.answerBox, mode === "chosung" || mode === "draw");
  }
}

function bindPaint() {
  const canvas = els.canvas;
  if (!canvas || canvas.dataset.bound) return;
  canvas.dataset.bound = "1";
  els.size?.addEventListener("input", () => {
    els.size.setAttribute("aria-valuetext", String(els.size.value || "14"));
  });
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff8e8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    const src = event.touches ? event.touches[0] : event;
    return {
      x: ((src.clientX - rect.left) / rect.width) * canvas.width,
      y: ((src.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const redraw = () => {
    ctx.fillStyle = "#fff8e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const s of strokes) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      s.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
  };

  const sendNorm = (phase, pt) => {
    void relaySend({
      type: "paint.pointer",
      phase,
      x: pt.x / canvas.width,
      y: pt.y / canvas.height,
      color: els.color.value,
      size: Number(els.size.value) || 14,
    });
  };

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    drawing = true;
    const pt = point(event);
    strokes.push({
      color: els.color.value,
      size: Number(els.size.value) || 14,
      points: [pt],
    });
    redraw();
    sendNorm("down", pt);
    void relaySend({ type: "guest.drawing" });
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    event.preventDefault();
    const pt = point(event);
    strokes[strokes.length - 1].points.push(pt);
    redraw();
    sendNorm("move", pt);
  });
  const end = (event) => {
    if (!drawing) return;
    drawing = false;
    const pt = point(event);
    sendNorm("up", pt);
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  els.undo?.addEventListener("click", () => {
    strokes.pop();
    redraw();
    void relaySend({ type: "paint.action", action: "undo" });
  });
  els.clear?.addEventListener("click", () => {
    strokes = [];
    redraw();
    void relaySend({ type: "paint.action", action: "clear" });
  });
  els.answerSubmit?.addEventListener("click", () => {
    const value = String(els.answer.value || "").trim();
    if (!value) return;
    void relaySend({ type: "answer.submit", answer: value });
    setStatus("정답을 보냈습니다");
  });
}

els.closeBtn?.addEventListener("click", () => {
  window.close();
  setStatus("창이 안 닫히면 탭을 직접 닫아 주세요");
});
els.loginBtn?.addEventListener("click", login);

async function main() {
  if (!roomId || !invite) {
    showBlocked("이 초대 링크는 만료되었습니다.");
    return;
  }
  restoreGuestSession();
  if (session.refreshToken) startGuestAuthKeep();
  try {
    await handleAuthReturn();
  } catch (err) {
    setStatus(String(err.message || err));
  }
  const meta = await checkInvite();
  if (!meta) return;
  if (!session.userId) {
    show(els.blocked, false);
    show(els.login, true);
    setStatus("로그인 후 참여할 수 있습니다");
    return;
  }
  if (session.userId !== meta.userId) {
    showBlocked("선정된 계정이 아닙니다.");
    return;
  }
  try {
    await claimAsGuest(meta);
  } catch (err) {
    showBlocked(err.data?.error || err.message || "이 초대 링크는 만료되었습니다.");
  }
}

main();
