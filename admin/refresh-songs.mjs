import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { composeSong } from "../song-source.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = join(root, "songs.seed.json");
const outPath = join(root, "songs.json");

function sleep(ms) {
  return new Promise((ok) => setTimeout(ok, ms));
}

async function main() {
  const seed = JSON.parse(await readFile(seedPath, "utf8"));
  const items = [];
  for (const row of seed.items || []) {
    process.stdout.write(`song ${row.id} … `);
    try {
      const song = await composeSong(row);
      if (!song?.previewUrl) {
        console.log("skip");
        continue;
      }
      if (song.itunesTrackId) row.itunesTrackId = song.itunesTrackId;
      items.push(song);
      console.log(`${song.artistKo} ${song.titleKo} #${song.itunesTrackId}`);
    } catch (err) {
      console.log(String(err.message || err));
    }
    await sleep(550);
  }
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(seedPath, `${JSON.stringify(seed, null, 2)}\n`);
  await writeFile(
    outPath,
    `${JSON.stringify({ version: 1, fetchedAt: Date.now(), updatedAt: new Date().toISOString(), items }, null, 2)}\n`,
  );
  console.log(`songs ${items.length}/${(seed.items || []).length} → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
