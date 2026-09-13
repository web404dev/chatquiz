/** BroadcastChannel bridge: host(방송) ↔ desk(조작 새창) */
export const DESK_CHANNEL = "chatquiz-desk";

export function createDeskBridge(role) {
  const ch = new BroadcastChannel(DESK_CHANNEL);
  const listeners = new Set();
  ch.onmessage = (ev) => {
    const msg = ev.data;
    if (!msg || msg.v !== 1) return;
    if (msg.role === role) return;
    listeners.forEach((fn) => {
      try {
        fn(msg);
      } catch (err) {
        console.error(err);
      }
    });
  };
  return {
    role,
    post(type, payload) {
      ch.postMessage({ v: 1, role, type, payload: payload ?? null, t: Date.now() });
    },
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    close() {
      try {
        ch.close();
      } catch (_) {}
    },
  };
}

/** canvas 위 포인터 → 0~1 정규화 */
export function normFromEvent(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const src = event.touches ? event.touches[0] : event;
  const w = rect.width || 1;
  const h = rect.height || 1;
  return {
    x: Math.max(0, Math.min(1, (src.clientX - rect.left) / w)),
    y: Math.max(0, Math.min(1, (src.clientY - rect.top) / h)),
  };
}
