import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDictPool, nounDefsFromWikitext, pickDef } from "../dict-bank.js";

// 낱말 퀴즈 뜻풀이: 위키낱말사전(키 없음, CC BY-SA 4.0) 한국어 명사 뜻풀이를 모은다. 문서 원문은 저장하지 않고 고른 뜻풀이 한 줄만 남긴다.
// 낱말 범위(사용자 2026-11-23 "둘 다"): 초성 단어 은행(words-easy.json·words.json) + 「부록:자주 쓰이는 한국어 낱말 5800」의 명사.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "dict.json");
const excludePath = join(root, "dict-exclude.json");
const KOWIKT_API = "https://ko.wiktionary.org/w/api.php";
const EASY_WORDS_PAGE = "부록:자주 쓰이는 한국어 낱말 5800";
const MIN_EASY_WORDS = 3000;
const UA = "chatquiz-dict/1.0 (https://web404dev.github.io/chatquiz/)";
const MIN_ITEMS = 300;
const GAP_MS = 1100;
const WORD_RE = /^[가-힣]{2,6}$/;

const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function fetchRetry(url) {
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } }).catch(() => null);
    if (res && res.ok) return res;
    await pause(4000 * (i + 1));
  }
  throw new Error(`요청 실패: ${url}`);
}

/** 위키낱말사전 쉬운 낱말 목록 → 낱말 배열(나온 순서). 너무 적게 받히면 멈춘다(예전 자료를 그대로 둔다). */
async function fetchEasyWords() {
  const params = new URLSearchParams({ action: "parse", page: EASY_WORDS_PAGE, prop: "links", format: "json", formatversion: "2" });
  const data = await (await fetchRetry(`${KOWIKT_API}?${params}`)).json();
  const words = [...new Set((data?.parse?.links || []).filter((link) => link.ns === 0).map((link) => String(link.title || "").trim()).filter(Boolean))];
  if (words.length < MIN_EASY_WORDS) throw new Error(`쉬운 낱말 목록이 ${words.length}개뿐이라 멈춥니다`);
  return words;
}

/** 초성 단어 은행 먼저(장르 있음), 그다음 쉬운 낱말. 같은 낱말은 먼저 나온 것만. */
function candidates(easyBank, wordList, easyWords, drop) {
  const rows = [];
  const seen = new Set();
  const add = (word, genre, from) => {
    const w = String(word || "").trim();
    if (!WORD_RE.test(w) || seen.has(w) || drop.has(w)) return;
    seen.add(w);
    rows.push({ word: w, genre, from });
  };
  for (const row of Array.isArray(easyBank?.words) ? easyBank.words : []) add(row?.word, String(row?.genre || ""), "bank");
  for (const word of Array.isArray(wordList) ? wordList : []) add(word, "", "bank");
  for (const word of easyWords) add(word, "", "easy");
  return rows;
}

/** 낱말 50개씩 문서 원문을 받아 명사 뜻풀이를 고른다. 넘겨주기 문서는 넘어간 제목을 다른 정답으로 둔다. */
async function fetchDefs(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const params = new URLSearchParams({
      action: "query",
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
      redirects: "1",
      titles: batch.map((row) => row.word).join("|"),
      format: "json",
      formatversion: "2",
    });
    const data = await (await fetchRetry(`${KOWIKT_API}?${params}`)).json();
    const moved = new Map();
    for (const r of [...(data?.query?.normalized || []), ...(data?.query?.redirects || [])]) moved.set(r.from, r.to);
    const pages = new Map((data?.query?.pages || []).map((p) => [p.title, p]));
    for (const row of batch) {
      let title = row.word;
      for (let hop = 0; hop < 3 && moved.has(title); hop += 1) title = moved.get(title);
      const page = pages.get(title);
      const text = page?.revisions?.[0]?.slots?.main?.content || "";
      if (!text) continue;
      const aliases = title !== row.word && /^[가-힣]{2,8}$/.test(title) ? [title] : [];
      const def = pickDef(nounDefsFromWikitext(text), row.word, aliases);
      if (def) out.push({ ...row, aliases, def });
    }
    if ((i / 50) % 20 === 19) console.log(`  ${Math.min(i + 50, rows.length)}/${rows.length}`);
    await pause(GAP_MS);
  }
  return out;
}

async function main() {
  const exclude = await readJson(excludePath, {});
  const drop = new Set(exclude.words || []);
  const rows = candidates(
    await readJson(join(root, "words-easy.json"), {}),
    await readJson(join(root, "words.json"), []),
    await fetchEasyWords(),
    drop,
  );
  console.log(`낱말 후보 ${rows.length}개 (은행 ${rows.filter((r) => r.from === "bank").length} · 쉬운 낱말 ${rows.filter((r) => r.from === "easy").length})`);
  const fetched = await fetchDefs(rows);
  const pool = buildDictPool({ items: fetched });
  const keep = new Set(pool.items.map((row) => row.word));
  const items = fetched.filter((row) => keep.has(row.word)).map(({ word, genre, from, aliases, def }) => ({ word, genre, from, aliases, def }));
  console.log(`명사 뜻풀이를 찾은 낱말 ${fetched.length} · 문제로 쓰는 것 ${items.length} (은행 ${items.filter((r) => r.from === "bank").length} · 쉬운 낱말 ${items.filter((r) => r.from === "easy").length})`);
  if (items.length < MIN_ITEMS) throw new Error(`낱말 문제가 ${items.length}개뿐이라 저장하지 않습니다`);
  await writeFile(outPath, `${JSON.stringify({ fetchedAt: Date.now(), source: `ko.wiktionary.org (CC BY-SA 4.0) · 낱말: 초성 단어 은행 + ${EASY_WORDS_PAGE}`, items }, null, 1)}\n`);
  console.log(`dict.json 저장: ${items.length}개`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
