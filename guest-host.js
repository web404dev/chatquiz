/**
 * 시청자 출제(게스트 호스트) — 스트리머 쪽 로직
 * 배포는 하지 않음. Worker API는 코드만 추가.
 */

const JOIN_KEYWORD = "!참여";
const GUEST_PREF_KEY = "guestHostPrefs:v1";
const TTL_MAX_SEC = 10 * 60;
const TTL_DEFAULT_SEC = 10 * 60;
const TTL_EXTEND_SEC = 3 * 60;

export function createGuestHostController({
  workerBase,
  getSession,
  isDev,
  onStatus,
  applyRemotePaint,
  applyGuestAnswer,
  excludeGuestFromJudge,
}) {
  const state = {
    enabled: false,
    recruiting: false,
    guestCanScore: false,
    consecutiveLimit: true,
    consecutiveGapSec: 10 * 60,
    ttlSec: TTL_DEFAULT_SEC,
    candidates: new Map(), // userId -> { userId, nickname, at }
    selected: null, // { userId, nickname }
    invite: "",
    inviteExpiresAt: 0,
    roomId: "",
    guestConn: "none", // none | waiting | connected | drawing | gone
    lastGuestIds: [], // { userId, at }
    pollTimer: 0,
    relayAfter: 0,
  };

  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(GUEST_PREF_KEY) || "{}");
      if (typeof p.enabled === "boolean") state.enabled = p.enabled;
      if (typeof p.guestCanScore === "boolean") state.guestCanScore = p.guestCanScore;
      if (typeof p.consecutiveLimit === "boolean") state.consecutiveLimit = p.consecutiveLimit;
    } catch {
      /* ignore */
    }
    state.ttlSec = TTL_DEFAULT_SEC;
  }

  function savePrefs() {
    localStorage.setItem(
      GUEST_PREF_KEY,
      JSON.stringify({
        enabled: state.enabled,
        guestCanScore: state.guestCanScore,
        consecutiveLimit: state.consecutiveLimit,
      }),
    );
  }

  function clampTtl(sec) {
    const n = Math.max(60, Math.min(TTL_MAX_SEC, Number(sec) || TTL_DEFAULT_SEC));
    return n;
  }

  function remainSec() {
    if (!state.invite || !state.inviteExpiresAt) return 0;
    return Math.max(0, Math.ceil((state.inviteExpiresAt - Date.now()) / 1000));
  }

  function isGuestPlaying() {
    return state.guestConn === "connected" || state.guestConn === "drawing";
  }

  function isInviteExpired() {
    if (isGuestPlaying()) return false;
    return !!(state.invite && state.inviteExpiresAt && Date.now() >= state.inviteExpiresAt);
  }

  function randomInvite() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function ensureRoomId() {
    const s = getSession?.() || {};
    state.roomId = s.channelId || state.roomId || `local-${randomInvite().slice(0, 8)}`;
    return state.roomId;
  }

  function isJoinCommand(text) {
    const t = String(text || "")
      .trim()
      .replace(/\s+/g, "");
    return t === JOIN_KEYWORD || t.toLowerCase() === "!join";
  }

  function noteCandidate(chat) {
    if (!state.enabled || !state.recruiting) return false;
    if (!isJoinCommand(chat?.text)) return false;
    const userId = String(chat.userId || "").trim();
    const nickname = String(chat.nickname || "익명").trim() || "익명";
    if (!userId) return false;
    state.candidates.set(userId, { userId, nickname, at: Date.now() });
    return true;
  }

  function listCandidates() {
    return [...state.candidates.values()].sort((a, b) => a.at - b.at);
  }

  function inCooldown(userId) {
    if (!state.consecutiveLimit) return false;
    const hit = state.lastGuestIds.find((x) => x.userId === userId);
    if (!hit) return false;
    return Date.now() - hit.at < state.consecutiveGapSec * 1000;
  }

  function guestLink() {
    if (!state.invite) return "";
    const u = new URL("guest.html", location.href);
    u.searchParams.set("room", ensureRoomId());
    u.searchParams.set("invite", state.invite);
    if (isDev) u.searchParams.set("dev", "1");
    return u.toString();
  }

  async function api(path, init) {
    const base = String(workerBase?.() || workerBase || "").replace(/\/$/, "");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(`${base}${path}`, {
        ...init,
        signal: ctrl.signal,
        headers: {
          "content-type": "application/json",
          ...(init?.headers || {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function createInviteFor(user) {
    if (!user?.userId) throw new Error("출제자를 선택해 주세요");
    if (inCooldown(user.userId)) {
      throw new Error("같은 계정 연속 출제 제한 중입니다");
    }
    const roomId = ensureRoomId();
    const invite = randomInvite();
    const ttlSec = TTL_DEFAULT_SEC;
    const expiresAt = Date.now() + ttlSec * 1000;
    // Worker 응답 전에 로컬 초대 확정 (미배포/지연에도 링크 복사 가능)
    state.selected = { userId: user.userId, nickname: user.nickname };
    state.invite = invite;
    state.inviteExpiresAt = expiresAt;
    state.guestConn = "waiting";
    try {
      await api("/invite/create", {
        method: "POST",
        body: JSON.stringify({
          roomId,
          invite,
          userId: user.userId,
          nickname: user.nickname,
          ttlSec,
        }),
      });
    } catch (err) {
      console.warn("[guest-host] invite create", err);
      onStatus?.(
        "초대는 만들었지만 Worker 저장 실패(미배포일 수 있음). 링크 복사는 가능합니다",
      );
    }
    startPoll();
    return guestLink();
  }

  async function revokeInvite(reason = "cancel") {
    const roomId = state.roomId;
    const invite = state.invite;
    stopPoll();
    if (roomId && invite) {
      try {
        await api("/invite/revoke", {
          method: "POST",
          body: JSON.stringify({ roomId, invite, reason }),
        });
      } catch (err) {
        console.warn("[guest-host] invite revoke", err);
      }
    }
    if (state.selected?.userId) {
      state.lastGuestIds = [
        { userId: state.selected.userId, at: Date.now() },
        ...state.lastGuestIds.filter((x) => x.userId !== state.selected.userId),
      ].slice(0, 20);
    }
    state.invite = "";
    state.inviteExpiresAt = 0;
    state.selected = null;
    state.guestConn = "none";
  }

  function pickRandom() {
    const list = listCandidates().filter((c) => !inCooldown(c.userId));
    if (!list.length) throw new Error("추첨할 후보가 없습니다");
    return list[Math.floor(Math.random() * list.length)];
  }

  function stopPoll() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = 0;
    }
  }

  function startPoll() {
    stopPoll();
    state.relayAfter = 0;
    state.pollTimer = setInterval(() => {
      void pollRelay();
    }, 400);
  }

  async function pollRelay() {
    if (!state.roomId || !state.invite) return;
    try {
      const data = await api(
        `/relay/poll?room=${encodeURIComponent(state.roomId)}&after=${state.relayAfter}&role=host`,
        { method: "GET" },
      );
      const msgs = data.messages || [];
      for (const m of msgs) {
        state.relayAfter = Math.max(state.relayAfter, m.id || 0);
        handleRelay(m);
      }
    } catch {
      /* Worker 미배포 시 무시 */
    }
  }

  function handleRelay(m) {
    const msg = m.msg || m;
    if (msg.type === "guest.hello") {
      state.guestConn = "connected";
    } else if (msg.type === "guest.drawing") {
      state.guestConn = "drawing";
    } else if (msg.type === "guest.bye") {
      state.guestConn = "gone";
    } else if (msg.type === "paint.pointer" || msg.type === "paint.stroke") {
      state.guestConn = "drawing";
      applyRemotePaint?.(msg);
    } else if (msg.type === "paint.action") {
      state.guestConn = "drawing";
      applyRemotePaint?.(msg);
    } else if (msg.type === "answer.submit") {
      applyGuestAnswer?.(msg);
    }
  }

  async function copyInviteLink() {
    const link = guestLink();
    if (!link) throw new Error("먼저 출제자를 선정해 주세요");
    await navigator.clipboard.writeText(link);
    return link;
  }

  async function extendInvite(addSec = TTL_EXTEND_SEC) {
    if (!state.invite || !state.inviteExpiresAt) {
      throw new Error("연장할 초대가 없습니다");
    }
    if (isInviteExpired()) {
      throw new Error("이미 만료된 링크입니다");
    }
    const add = Math.max(0, Number(addSec) || TTL_EXTEND_SEC);
    const now = Date.now();
    const maxExp = now + TTL_MAX_SEC * 1000;
    const next = Math.min(state.inviteExpiresAt + add * 1000, maxExp);
    if (next <= state.inviteExpiresAt) {
      throw new Error("이미 최대 10분입니다");
    }
    state.inviteExpiresAt = next;
    try {
      await api("/invite/extend", {
        method: "POST",
        body: JSON.stringify({
          roomId: ensureRoomId(),
          invite: state.invite,
          addSec: add,
          maxSec: TTL_MAX_SEC,
        }),
      });
    } catch (err) {
      console.warn("[guest-host] invite extend", err);
      onStatus?.(
        "시간은 늘렸지만 Worker 동기화 실패(미배포일 수 있음). 로컬 카운트는 유지됩니다",
      );
    }
    return remainSec();
  }

  async function relaySend(msg) {
    if (!state.roomId || !state.invite) return;
    try {
      await api("/relay/send", {
        method: "POST",
        body: JSON.stringify({
          roomId: state.roomId,
          invite: state.invite,
          from: "host",
          msg,
        }),
      });
    } catch (err) {
      console.warn("[guest-host] relay send", err);
    }
  }

  async function pushHostMode(mode) {
    if (!state.selected || !state.invite) return;
    const m = mode === "draw" ? "draw" : mode === "chosung" ? "chosung" : "idle";
    await relaySend({ type: "host.mode", mode: m });
  }

  function shouldExcludeFromJudge(userId) {
    if (state.guestCanScore) return false;
    return excludeGuestFromJudge !== false && state.selected?.userId === userId;
  }

  function snapshot() {
    const remain = remainSec();
    return {
      enabled: state.enabled,
      recruiting: state.recruiting,
      guestCanScore: state.guestCanScore,
      consecutiveLimit: state.consecutiveLimit,
      ttlSec: TTL_DEFAULT_SEC,
      ttlMaxSec: TTL_MAX_SEC,
      ttlExtendSec: TTL_EXTEND_SEC,
      candidates: listCandidates(),
      selected: state.selected,
      invite: state.invite,
      inviteExpiresAt: state.inviteExpiresAt,
      remainSec: remain,
      canExtend: !!state.invite && remain > 0 && remain < TTL_MAX_SEC && !isGuestPlaying(),
      guestPlaying: isGuestPlaying(),
      guestConn: state.guestConn,
      link: guestLink(),
      joinKeyword: JOIN_KEYWORD,
    };
  }

  loadPrefs();

  return {
    state,
    JOIN_KEYWORD,
    TTL_DEFAULT_SEC,
    TTL_MAX_SEC,
    TTL_EXTEND_SEC,
    loadPrefs,
    savePrefs,
    setEnabled(v) {
      state.enabled = !!v;
      if (!state.enabled) {
        state.recruiting = false;
        void revokeInvite("disabled");
      }
      savePrefs();
    },
    setRecruiting(v) {
      state.recruiting = !!v && state.enabled;
    },
    setGuestCanScore(v) {
      state.guestCanScore = !!v;
      savePrefs();
    },
    setConsecutiveLimit(v) {
      state.consecutiveLimit = !!v;
      savePrefs();
    },
    noteCandidate,
    listCandidates,
    inCooldown,
    pickRandom,
    createInviteFor,
    revokeInvite,
    copyInviteLink,
    extendInvite,
    remainSec,
    isInviteExpired,
    guestLink,
    relaySend,
    pushHostMode,
    shouldExcludeFromJudge,
    snapshot,
    stopPoll,
  };
}
