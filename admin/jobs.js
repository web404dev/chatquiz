import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function summarizeWebtoon(raw = {}) {
  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    rows: items.length,
    stills: items.filter((row) => row?.image).length,
    fetchedAt: Number(raw.fetchedAt) || 0,
  };
}

export function summarizeMovie(raw = {}) {
  const stills = raw.stills && typeof raw.stills === "object" ? Object.keys(raw.stills) : [];
  return { rows: stills.length, stills: stills.length, fetchedAt: Number(raw.fetchedAt) || 0 };
}

export function summarizeAnime(raw = {}) {
  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    rows: items.length,
    stills: items.filter((row) => (row.images || []).length).length,
    fetchedAt: Number(raw.fetchedAt) || 0,
  };
}

export function summarizeSongs(raw = {}) {
  const items = Array.isArray(raw.items) ? raw.items : [];
  const playable = items.filter((row) => row?.previewUrl);
  return {
    rows: playable.length,
    stills: playable.length,
    fetchedAt: Date.parse(raw.updatedAt) || Number(raw.fetchedAt) || 0,
  };
}

export function summarizeBank(raw = {}) {
  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    rows: items.length,
    stills: items.filter((row) => row?.image).length,
    fetchedAt: Number(raw.fetchedAt) || 0,
  };
}

function media(id, label, script, hint, file, summarize) {
  return { id, label, script, args: [], hint, group: "media", file, summarize };
}

function live(id, label, hint) {
  return {
    id,
    label,
    script: "admin/refresh-live.mjs",
    args: [id],
    hint,
    group: "game",
    file: `snapshots/${id}.json`,
    summarize: summarizeBank,
  };
}

export const ALL_ORDER = ["movie", "anime", "all-games", "webtoon", "songs"];
export const SCHEDULE_ORDER = ["movie", "anime", "webtoon", "songs"];
export const SCHEDULE_DAYS = 20;

export function isStale(fetchedAt, days = SCHEDULE_DAYS, now = Date.now()) {
  const at = Number(fetchedAt) || 0;
  if (!at) return true;
  return now - at >= days * 86400000;
}

export const PACKS = {
  all: {
    id: "all",
    label: "전체 갱신",
    script: "admin/refresh-all.mjs",
    args: [],
    hint: "영화 → 애니 → 게임 → 웹툰 → 노래. 웹툰이 제일 김.",
    group: "all",
    file: "",
    summarize: summarizeBank,
  },
  webtoon: media("webtoon", "웹툰", "refresh-webtoon-snapshot.mjs", "네이버·카카오 목록 + 명장면. 가장 오래 걸림.", "webtoon-snapshot.json", summarizeWebtoon),
  movie: media("movie", "영화", "refresh-movie-stills.mjs", "영화 제목 명장면.", "movie-stills.json", summarizeMovie),
  anime: media("anime", "애니", "refresh-laftel-snapshot.mjs", "라프텔 목록 + 홈 배너.", "laftel-snapshot.json", summarizeAnime),
  songs: {
    id: "songs",
    label: "노래",
    script: "admin/refresh-songs.mjs",
    args: [],
    hint: "iTunes 미리듣기 URL만. 파일은 안 받음.",
    group: "media",
    file: "songs.json",
    summarize: summarizeSongs,
  },
  "all-games": {
    id: "all-games",
    label: "게임 전부",
    script: "admin/refresh-live.mjs",
    args: ["all-games"],
    hint: "API 있는 게임을 순서대로.",
    group: "game",
    file: "",
    summarize: summarizeBank,
  },
  genshin: live("genshin", "원신", "야타/겐신 DB."),
  hsr: live("hsr", "붕괴: 스타레일", "스타레일 인덱스."),
  lol: live("lol", "리그 오브 레전드", "데이터 드래곤."),
  valorant: live("valorant", "발로란트", "발로란트 API."),
  pokemon: live("pokemon", "포켓몬스터", "포켓몬 도감."),
  bluearchive: live("bluearchive", "블루 아카이브", "샬레 DB."),
  pubg: live("pubg", "배틀그라운드", "무기·맵·탈것."),
  overwatch: live("overwatch", "오버워치 2", "오버패스트."),
  tft: live("tft", "전략적 팀 전투", "TFT 세트."),
  fortnite: live("fortnite", "포트나이트", "맵·상점."),
  fgo: live("fgo", "페이트/그랜드 오더", "서번트."),
  yugioh: live("yugioh", "유희왕", "카드."),
  hearthstone: live("hearthstone", "하스스톤", "카드."),
  dota: live("dota", "도타 2", "영웅·아이템."),
};

export function packOf(id) {
  return PACKS[String(id || "")] || null;
}

export function isLoopback(addr) {
  const ip = String(addr || "").replace(/^::ffff:/, "");
  return ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
}

export async function readPackStatus(id, root = WEB_ROOT) {
  const pack = packOf(id);
  if (!pack) return null;
  if (!pack.file) {
    return { id, label: pack.label, hint: pack.hint, group: pack.group, rows: 0, stills: 0, fetchedAt: 0, file: "", missing: false };
  }
  try {
    const raw = JSON.parse(await readFile(join(root, pack.file), "utf8"));
    return { id, label: pack.label, hint: pack.hint, group: pack.group, file: pack.file, ...pack.summarize(raw) };
  } catch {
    return { id, label: pack.label, hint: pack.hint, group: pack.group, rows: 0, stills: 0, fetchedAt: 0, file: pack.file, missing: true };
  }
}

export async function readAllStatus(root = WEB_ROOT) {
  const packs = await Promise.all(Object.keys(PACKS).map((id) => readPackStatus(id, root)));
  return { packs };
}

export function runPack(id, hooks = {}, root = WEB_ROOT) {
  const pack = packOf(id);
  if (!pack) throw new Error("unknown pack");
  const child = spawn(process.execPath, [pack.script, ...(pack.args || [])], {
    cwd: root,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const onLine = typeof hooks.onLine === "function" ? hooks.onLine : () => {};
  const pipe = (stream) => {
    let buf = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      buf += chunk;
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || "";
      for (const line of lines) if (line.trim()) onLine(line);
    });
    stream.on("end", () => {
      if (buf.trim()) onLine(buf);
    });
  };
  pipe(child.stdout);
  pipe(child.stderr);
  return child;
}
