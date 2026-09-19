import { clueEntryKey, isPlayableName } from "./genshin-bank.js";

export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function fetchJson(url, init = {}, timeoutMs = 16000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: "no-cache", ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function pushClue(items, seen, item, allowed, options = {}) {
  const word = String(item?.word || "").trim();
  const kind = String(item?.genre || "").trim();
  const hint = String(item?.hint || "").trim();
  if (!isPlayableName(word, options) || !hint) return;
  if (Array.isArray(allowed) && !allowed.includes(kind)) return;
  const key = clueEntryKey({ word, genre: kind });
  if (seen.has(key)) return;
  seen.add(key);
  const row = { word, genre: kind, hint };
  for (const field of ["image", "imageReveal", "year", "mediaGenres", "series"]) {
    if (item[field] != null && item[field] !== "") row[field] = item[field];
  }
  if (Array.isArray(item.aliases)) {
    const aliases = item.aliases.map((name) => String(name || "").trim()).filter(Boolean);
    if (aliases.length) row.aliases = aliases;
  }
  items.push(row);
}

export function packSnapshot(id) {
  return new URL(`./snapshots/${id}.json`, import.meta.url);
}

export function makeCachedBank({ cacheKey, title, kinds, fetchRaw, build, snapshot }) {
  function readCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(cacheKey) || "");
      if (!parsed?.items?.length) return null;
      return {
        version: 1,
        title: parsed.title || title,
        fetchedAt: parsed.fetchedAt || 0,
        kinds: kinds.slice(),
        items: parsed.items.filter((item) => item?.word && item?.genre && item?.hint),
      };
    } catch {
      return null;
    }
  }

  function writeCache(bank) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(bank));
    } catch {
      // quota / private mode
    }
  }

  async function loadSnapshot() {
    if (!snapshot) return null;
    try {
      const snap = await fetchJson(snapshot, {}, 8000);
      if (!snap?.items?.length) return null;
      return {
        version: 1,
        title: snap.title || title,
        fetchedAt: snap.fetchedAt || 0,
        kinds: kinds.slice(),
        items: snap.items.filter((item) => item?.word && item?.genre && item?.hint),
      };
    } catch {
      return null;
    }
  }

  async function refresh(current) {
    const snap = await loadSnapshot();
    if (snap && snap.fetchedAt >= (current?.fetchedAt || 0)) {
      writeCache(snap);
      return snap;
    }
    const age = Date.now() - (current?.fetchedAt || 0);
    if (current?.items?.length && age < MAX_AGE_MS) return current;
    const bank = build(await fetchRaw(), Date.now());
    bank.title = title;
    bank.kinds = kinds.slice();
    if (!bank.items.length) throw new Error(`${title}를 비웠습니다`);
    writeCache(bank);
    return bank;
  }

  async function init() {
    const cached = readCache();
    if (cached?.items?.length) {
      refresh(cached).catch(() => {});
      return cached;
    }
    return refresh({ items: [], fetchedAt: 0 });
  }

  return { init, build, kinds, title };
}
