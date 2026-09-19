import { writeFile } from "node:fs/promises";

const HEADERS = {
  accept: "application/json",
  laftel: "TeJava",
  "user-agent": "Mozilla/5.0",
};

function slim(row = {}) {
  return {
    id: row.id,
    name: row.name,
    content: row.content || "",
    genres: row.genres || [],
    air_year_quarter: row.air_year_quarter || row.animation_info?.air_year_quarter || "",
    is_adult: Boolean(row.is_adult),
    rating: Number(row.rating) || 0,
    images: (row.images || [])
      .map((image) => ({ img_url: String(image?.img_url || "").trim() }))
      .filter((image) => /\/home\//i.test(image.img_url)),
  };
}

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

const lists = await Promise.all(
  [0, 20, 40, 60].map((offset) =>
    getJson(`https://api.laftel.net/api/search/v1/discover/?limit=20&offset=${offset}`),
  ),
);
const listed = lists.flatMap((page) => page.results || []);
const items = await Promise.all(
  listed.map(async (row) => {
    try {
      const detail = await getJson(`https://api.laftel.net/api/items/v1/${row.id}/`);
      return slim({ ...row, ...detail });
    } catch {
      return slim(row);
    }
  }),
);

const out = new URL("./laftel-snapshot.json", import.meta.url);
await writeFile(out, `${JSON.stringify({ fetchedAt: Date.now(), items }, null, 0)}\n`);
const homes = items.filter((item) => item.images.length).length;
console.log(`wrote ${items.length} rows, ${homes} with home banner → ${out.pathname}`);
