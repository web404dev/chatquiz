import { writeFile } from "node:fs/promises";
import { fetchMovieRawLive } from "./movie-bank.js";
import { searchStill } from "./still-search.js";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const out = new URL("./movie-stills.json", import.meta.url);

async function getText(url, headers, ms = 8000) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}

async function byteSize(url) {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "user-agent": UA }, signal: AbortSignal.timeout(4000) });
    return Number(res.headers.get("content-length") || 0) || 0;
  } catch {
    return 0;
  }
}

async function save(stills) {
  await writeFile(out, `${JSON.stringify({ fetchedAt: Date.now(), stills })}\n`);
}

const raw = await fetchMovieRawLive();
const snapOut = new URL("./movie-snapshot.json", import.meta.url);
await writeFile(snapOut, `${JSON.stringify({ fetchedAt: Date.now(), films: raw.films }, null, 0)}\n`);
console.log(`wrote ${raw.films.length} films → ${snapOut.pathname}`);
const titles = [
  ...new Set([
    ...(raw.films || []).map((film) => String(film.title || "").replace(/\s*\(영화\)\s*$/, "").trim()),
    ...(raw.curated || []).filter((row) => row.genre === "영화이름").map((row) => String(row.word || "").trim()),
  ]),
].filter(Boolean);

const stills = {};
for (let i = 0; i < titles.length; i += 2) {
  const chunk = titles.slice(i, i + 2);
  const found = await Promise.all(
    chunk.map((title) => searchStill("영화", title, { getText, byteSize, ua: UA, tries: 3 })),
  );
  chunk.forEach((title, index) => {
    if (found[index]) stills[title] = found[index];
  });
  await save(stills);
  console.log(`stills ${Math.min(i + chunk.length, titles.length)}/${titles.length} hit ${Object.keys(stills).length}`);
  await new Promise((ok) => setTimeout(ok, 400));
}
console.log(`wrote ${Object.keys(stills).length}/${titles.length} stills → ${out.pathname}`);
