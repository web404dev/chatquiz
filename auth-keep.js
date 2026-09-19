const REFRESH_EVERY_MS = 40 * 60 * 1000;
export const HOST_SESSION_KEY = "chzzkSession";
export const GUEST_SESSION_KEY = "chatquiz-guest-session";

export function readAuthSession(key) {
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

export function writeAuthSession(key, data) {
  const raw = JSON.stringify(data || {});
  try {
    localStorage.setItem(key, raw);
  } catch {
    try {
      sessionStorage.setItem(key, raw);
    } catch {
      // quota / private mode
    }
  }
}

export function createAuthKeep({ workerBase, getSession, setSession } = {}) {
  let timer = 0;
  let busy = false;

  async function refresh() {
    const session = getSession?.() || {};
    if (!session.refreshToken || busy) return session;
    busy = true;
    try {
      const res = await fetch(`${workerBase}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.accessToken) {
        throw new Error(data.error || "토큰 갱신 실패");
      }
      const next = {
        ...session,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || session.refreshToken,
        expiresIn: Number(data.expiresIn) || session.expiresIn || 0,
        refreshedAt: Date.now(),
      };
      setSession?.(next);
      return next;
    } finally {
      busy = false;
    }
  }

  function start() {
    stop();
    const session = getSession?.() || {};
    if (!session.refreshToken) return;
    timer = setInterval(() => {
      void refresh().catch(() => {});
    }, REFRESH_EVERY_MS);
    const age = Date.now() - Number(session.refreshedAt || 0);
    if (!session.refreshedAt || age > REFRESH_EVERY_MS) {
      void refresh().catch(() => {});
    }
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = 0;
  }

  return { refresh, start, stop };
}
