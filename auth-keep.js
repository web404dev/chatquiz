const REFRESH_EVERY_MS = 40 * 60 * 1000;

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
    if (session.refreshedAt && Date.now() - Number(session.refreshedAt) > REFRESH_EVERY_MS) {
      void refresh().catch(() => {});
    }
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = 0;
  }

  return { refresh, start, stop };
}
