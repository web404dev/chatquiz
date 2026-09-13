function parseMaybeJson(raw) {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

/** Socket.IO 인자가 문자열로 한 겹 더 감싸인 경우까지 벗김 */
function unwrapPayload(raw) {
  let data = parseMaybeJson(raw);
  if (typeof data === "string") data = parseMaybeJson(data);
  return data && typeof data === "object" ? data : null;
}

function parseProfile(raw) {
  const profile = typeof raw === "string" ? parseMaybeJson(raw) : raw;
  if (!profile || typeof profile !== "object") {
    return { nickname: "익명", userId: "" };
  }
  return {
    nickname: profile.nickname || profile.userNickname || "익명",
    userId: profile.userIdHash || profile.userId || "",
  };
}

export function normalizeOfficialChat(raw) {
  const data = unwrapPayload(raw);
  if (!data) return null;
  const profile = parseProfile(data.profile);
  const text = String(data.content || data.message || data.msg || "").trim();
  if (!text) return null;
  return {
    type: "chat",
    hidden: false,
    nickname: profile.nickname || data.nickname || "익명",
    userId: data.senderChannelId || profile.userId || "",
    text,
  };
}

export function createOfficialChzzkChat({
  workerBase,
  accessToken,
  onChat,
  onStatus,
} = {}) {
  let socket = null;
  let closed = false;
  let subscribed = false;

  function status(text) {
    onStatus?.(text);
  }

  function getIo() {
    const io = globalThis.io;
    if (typeof io !== "function") {
      throw new Error("socket.io 로드 실패");
    }
    return io;
  }

  async function openSessionUrl() {
    const res = await fetch(`${workerBase}/session/open`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "세션 생성 실패");
    if (!data.url) throw new Error("세션 URL 없음");
    return data.url;
  }

  async function subscribe(sessionKey) {
    const res = await fetch(`${workerBase}/session/subscribe/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessToken, sessionKey }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "채팅 구독 실패");
    return data;
  }

  function handleSystem(raw) {
    const data = unwrapPayload(raw);
    if (!data) return;
    if (data.type === "connected") {
      const sessionKey = data.data?.sessionKey || data.sessionKey;
      if (!sessionKey || subscribed) return;
      subscribed = true;
      subscribe(sessionKey)
        .then(() => status("채팅 연결됨"))
        .catch((err) => status(String(err.message || err || "채팅 구독 실패")));
      return;
    }
    if (data.type === "subscribed") {
      status("채팅 연결됨");
    }
  }

  function handleChat(raw) {
    const chat = normalizeOfficialChat(raw);
    if (chat) onChat?.(chat);
  }

  async function connect() {
    if (closed) return;
    status("채팅 연결 중…");
    try {
      const sessionUrl = await openSessionUrl();
      if (closed) return;
      const io = getIo();
      // 치지직 공식 가이드: Socket.IO 2.0.3 + 이 옵션
      socket = io.connect(sessionUrl, {
        reconnection: false,
        "force new connection": true,
        "connect timeout": 3000,
        transports: ["websocket"],
      });
      socket.on("connect", () => status("채팅 소켓 연결됨"));
      socket.on("SYSTEM", handleSystem);
      socket.on("CHAT", handleChat);
      socket.on("disconnect", () => {
        status("채팅 끊김. 다시 붙는 중");
        subscribed = false;
        if (!closed) {
          setTimeout(() => {
            void connect();
          }, 1500);
        }
      });
      socket.on("connect_error", () => {
        status("채팅 소켓 오류");
      });
      socket.on("error", (err) => {
        status(String(err || "채팅 소켓 오류"));
      });
    } catch (err) {
      status(String(err.message || err || "채팅 연결 실패"));
      if (!closed) {
        setTimeout(() => {
          void connect();
        }, 2000);
      }
    }
  }

  void connect();
  return {
    close() {
      closed = true;
      try {
        socket?.disconnect?.();
        socket?.close?.();
      } catch {
        // ignore
      }
      socket = null;
    },
  };
}
