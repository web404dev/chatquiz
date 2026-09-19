export function stillQuery(topic, title) {
  return `${String(topic || "").trim()} ${String(title || "").trim()} 명장면`.replace(/\s+/g, " ").trim();
}

export function decodeStillUrl(raw) {
  return String(raw || "")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u002[fF]/g, "/")
    .replace(/\\\//g, "/")
    .replace(/^http:\/\//i, "https://")
    .trim();
}

export function stillDisplayUrl(original) {
  const src = decodeStillUrl(original);
  if (!src) return "";
  if (/pstatic\.net|daumcdn\.net|kakaocdn\.net/i.test(src)) return src;
  return `https://search.pstatic.net/common/?src=${encodeURIComponent(src)}&type=sc960_832`;
}

function keepStillUrl(url, seen) {
  if (!/^https?:\/\//i.test(url) || seen.has(url)) return false;
  if (/daum_og\.png|favicon|og_v3\.png|sstatic\/search\/common|polyfill|remoteEntry|logins\.daum/i.test(url)) return false;
  const image =
    /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url) ||
    /pstatic\.net|daumcdn\.net|kakaocdn\.net|blogfiles\.naver|imgnews\.naver|postfiles\.pstatic/i.test(url);
  if (!image) return false;
  seen.add(url);
  return true;
}

function collect(html, re, limit) {
  const out = [];
  const seen = new Set();
  let match;
  while ((match = re.exec(String(html || ""))) && out.length < limit) {
    const url = decodeStillUrl(match[1] || match[0]);
    if (!keepStillUrl(url, seen)) continue;
    out.push(url);
  }
  return out;
}

export function extractNaverOriginals(html, limit = 5) {
  return collect(html, /"originalUrl":"([^"]+)"/g, limit);
}

export function extractDaumImages(html, limit = 5) {
  return collect(html, /"imgurl":"([^"]+)"/g, limit);
}

export function extractHtmlImages(html, limit = 5) {
  return collect(html, /https?:\\?\/\\?\/[^\s"'<>\\]+/g, limit);
}

export function pickSmallestStill(candidates = []) {
  const rows = candidates.filter((row) => row?.url);
  if (!rows.length) return "";
  const known = rows.filter((row) => Number(row.bytes) > 0);
  if (known.length) {
    known.sort((a, b) => a.bytes - b.bytes);
    return known[0].url;
  }
  return rows[0].url;
}

export async function searchStill(topic, title, io = {}) {
  const getText = io.getText;
  if (typeof getText !== "function") throw new Error("searchStill needs getText");
  const byteSize = typeof io.byteSize === "function" ? io.byteSize : async () => 0;
  const sleep = typeof io.sleep === "function" ? io.sleep : (ms) => new Promise((ok) => setTimeout(ok, ms));
  const tries = Number(io.tries) > 0 ? Number(io.tries) : 3;
  const ua = io.ua || "Mozilla/5.0";
  const headers = { accept: "text/html", "user-agent": ua };
  const q = encodeURIComponent(stillQuery(topic, title));
  let urls = [];
  for (let i = 0; i < tries && !urls.length; i += 1) {
    if (i) await sleep(800 * i);
    try {
      const html = await getText(`https://search.naver.com/search.naver?where=image&query=${q}`, {
        ...headers,
        referer: "https://search.naver.com/",
      });
      urls = extractNaverOriginals(html);
      if (!urls.length) urls = extractHtmlImages(html);
    } catch {
      urls = [];
    }
    if (urls.length) break;
    try {
      const html = await getText(`https://search.daum.net/search?w=img&q=${q}`, {
        ...headers,
        referer: "https://search.daum.net/",
      });
      urls = extractDaumImages(html);
      if (!urls.length) urls = extractHtmlImages(html);
    } catch {
      urls = [];
    }
  }
  if (!urls.length) return "";
  const sized = await Promise.all(urls.map(async (url) => ({ url, bytes: await byteSize(url) })));
  return stillDisplayUrl(pickSmallestStill(sized));
}
