export function stillQuery(topic, title) {
  return `${String(topic || "").trim()} ${String(title || "").trim()} 명장면`.replace(/\s+/g, " ").trim();
}

export function stillQueries(topic, title) {
  const kind = String(topic || "").trim();
  const name = String(title || "").trim();
  return [
    `${kind} ${name} 명장면`,
    `${kind} ${name} 말풍선`,
    `${kind} ${name} 명대사`,
  ].map((query) => query.replace(/\s+/g, " ").trim()).filter(Boolean);
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
  if (/daum_og\.png|favicon|og_v3\.png|sstatic\/search|opensearch-description|polyfill|remoteEntry|logins\.daum|\.(?:xml|css|js)(\?|$)/i.test(url)) return false;
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
  const rows = candidates.filter((row) => row?.url && Number(row.bytes) > 0);
  if (!rows.length) return "";
  rows.sort((a, b) => a.bytes - b.bytes);
  return rows[0].url;
}

export async function probeOpenStill(url, byteSize, rejectUrl) {
  const sizeOf = typeof byteSize === "function" ? byteSize : async () => 0;
  const reject = typeof rejectUrl === "function" ? rejectUrl : () => false;
  const seen = new Set();
  for (const candidate of [decodeStillUrl(url), stillDisplayUrl(url)]) {
    if (!candidate || seen.has(candidate) || reject(candidate)) continue;
    seen.add(candidate);
    const bytes = Number(await sizeOf(candidate)) || 0;
    if (bytes > 0) return { url: candidate, bytes };
  }
  return { url: "", bytes: 0 };
}

async function pageUrls(getText, url, headers, extract) {
  const html = await getText(url, headers);
  const found = extract(html, 12);
  return found.length ? found : extractHtmlImages(html, 12);
}

export async function searchStill(topic, title, io = {}) {
  const getText = io.getText;
  if (typeof getText !== "function") throw new Error("searchStill needs getText");
  const byteSize = typeof io.byteSize === "function" ? io.byteSize : async () => 0;
  const sleep = typeof io.sleep === "function" ? io.sleep : (ms) => new Promise((ok) => setTimeout(ok, ms));
  const tries = Number(io.tries) > 0 ? Number(io.tries) : 3;
  const ua = io.ua || "Mozilla/5.0";
  const headers = { accept: "text/html", "user-agent": ua };
  const rejectUrl = typeof io.rejectUrl === "function" ? io.rejectUrl : () => false;
  let opened = [];
  for (let i = 0; i < tries && !opened.length; i += 1) {
    if (i) await sleep(800 * i);
    for (const query of stillQueries(topic, title)) {
      const q = encodeURIComponent(query);
      const sources = [
        [`https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${q}`, { ...headers, referer: "https://search.naver.com/" }, extractNaverOriginals],
        [`https://search.daum.net/search?w=img&nil_search=btn&DA=NTB&enc=utf8&q=${q}`, { ...headers, referer: "https://search.daum.net/" }, extractDaumImages],
      ];
      for (const [page, pageHeaders, extract] of sources) {
        let urls = [];
        try {
          urls = await pageUrls(getText, page, pageHeaders, extract);
        } catch {
          urls = [];
        }
        const probed = await Promise.all(urls.map((url) => probeOpenStill(url, byteSize, rejectUrl)));
        opened = probed.filter((row) => row.url && row.bytes > 0 && !rejectUrl(row.url));
        if (opened.length) break;
      }
      if (opened.length) break;
    }
  }
  const picked = pickSmallestStill(opened);
  return picked ? stillDisplayUrl(picked) : "";
}
