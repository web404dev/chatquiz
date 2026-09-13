function parseProfile(raw) {
  if (!raw) return { nickname: "익명", userId: "" };
  if (typeof raw === "object") {
    return {
      nickname: raw.nickname || "익명",
      userId: raw.userIdHash || raw.userId || "",
    };
  }
  try {
    return parseProfile(JSON.parse(raw));
  } catch {
    return { nickname: "익명", userId: "" };
  }
}

function normalizeChatItem(item, type) {
  const profile = parseProfile(item.profile);
  return {
    type,
    hidden: Boolean(item.hidden || item.blinded),
    nickname: profile.nickname,
    userId: profile.userId,
    text: item.msg || item.message || item.content || "",
  };
}

function pickChatItems(payload) {
  const body = payload?.bdy;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.messageList)) return body.messageList;
  if (body && typeof body === "object") return [body];
  return [];
}

export function parseSocketMessage(raw) {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  const cmd = data?.cmd;
  if (cmd === 0) return { kind: "ping" };
  if (cmd === 93101 || cmd === 15101) {
    return {
      kind: "chats",
      chats: pickChatItems(data)
        .map((item) => normalizeChatItem(item, "chat"))
        .filter((chat) => chat.text),
    };
  }
  if (cmd === 93102) {
    return {
      kind: "chats",
      chats: pickChatItems(data).map((item) => normalizeChatItem(item, "donation")),
    };
  }
  return { kind: "other", cmd };
}

export function connectPacket(chatChannelId, accessToken) {
  return {
    ver: "2",
    cmd: 100,
    svcid: "game",
    cid: chatChannelId,
    bdy: {
      accTkn: accessToken,
      auth: "READ",
      devType: 2001,
    },
    tid: 1,
  };
}

export function createChzzkChat({
  chatChannelId,
  accessToken,
  onChat,
  onStatus,
} = {}) {
  let socket = null;
  let closed = false;
  let pingTimer = null;

  function status(text) {
    onStatus?.(text);
  }

  function handleMessage(event) {
    let parsed;
    try {
      parsed = parseSocketMessage(event.data);
    } catch {
      return;
    }
    if (parsed.kind === "ping") {
      socket?.send(JSON.stringify({ ver: "2", cmd: 10000 }));
      return;
    }
    if (parsed.kind === "chats") {
      for (const chat of parsed.chats) onChat?.(chat);
    }
  }

  function connect() {
    if (closed) return;
    socket = new WebSocket("wss://kr-ss1.chat.naver.com/chat");
    socket.addEventListener("open", () => {
      status("채팅 연결됨");
      socket.send(JSON.stringify(connectPacket(chatChannelId, accessToken)));
      clearInterval(pingTimer);
      pingTimer = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ ver: "2", cmd: 0 }));
        }
      }, 20000);
    });
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", () => {
      status("채팅 끊김. 다시 붙는 중");
      clearInterval(pingTimer);
      if (!closed) setTimeout(connect, 1500);
    });
    socket.addEventListener("error", () => {
      status("채팅 소켓 오류");
    });
  }

  connect();
  return {
    close() {
      closed = true;
      clearInterval(pingTimer);
      socket?.close();
    },
  };
}
