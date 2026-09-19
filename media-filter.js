export const MOVIE_GENRES = [
  "액션",
  "코미디",
  "드라마",
  "로맨스",
  "스릴러",
  "SF",
  "호러",
  "범죄",
  "판타지",
  "애니메이션",
  "전쟁",
  "음악",
  "미스터리",
  "모험",
  "히어로",
  "재난",
  "스포츠",
  "역사",
  "전기",
  "가족",
  "서부",
  "스파이",
  "무협",
  "청춘",
  "좀비",
];

export const MOVIE_COUNTRIES = ["한국", "미국", "일본", "중국", "홍콩", "대만", "영국", "프랑스"];

export const MOVIE_COUNTRY_Q = {
  Q884: "한국",
  Q30: "미국",
  Q17: "일본",
  Q148: "중국",
  Q8646: "홍콩",
  Q865: "대만",
  Q145: "영국",
  Q142: "프랑스",
};

const COUNTRY_ALIAS = {
  대한민국: "한국",
  남한: "한국",
  조선민주주의인민공화국: "기타",
  미합중국: "미국",
  "미국 미국": "미국",
  중화인민공화국: "중국",
  중화민국: "대만",
  영국: "영국",
  "그레이트브리튼 및 북아일랜드 연합왕국": "영국",
};

export const WEBTOON_PLATFORMS = ["네이버", "카카오"];
export const WEBTOON_GENRES = ["로맨스", "판타지", "액션", "드라마", "스릴러", "개그", "일상", "학원", "무협", "해외"];

const WEBTOON_ALIAS = {
  로맨스: "로맨스",
  로판: "로맨스",
  러브코미디: "로맨스",
  판타지: "판타지",
  액션판타지: "판타지",
  이세계: "판타지",
  이능력: "판타지",
  인외존재: "판타지",
  액션: "액션",
  배틀: "액션",
  헌터물: "액션",
  먼치킨: "액션",
  드라마: "드라마",
  성장물: "드라마",
  청춘: "드라마",
  가족: "드라마",
  구원서사: "드라마",
  스릴러: "스릴러",
  복수극: "스릴러",
  개그: "개그",
  가벼운: "개그",
  일상: "일상",
  힐링: "일상",
  학원: "학원",
  학원물: "학원",
  하이틴: "학원",
  소년물: "학원",
  무협: "무협",
  사극: "무협",
  "무협/사극": "무협",
  해외: "해외",
  해외작품: "해외",
};

export const ANIME_GENRES = [
  "판타지",
  "액션",
  "코미디",
  "모험",
  "미스터리",
  "SF",
  "로맨스",
  "스릴러",
  "스포츠",
  "드라마",
  "일상",
  "음악",
];

function chips(ids) {
  return ids.map((id) => ({ id, label: id }));
}

export function movieGenreTree() {
  return [
    { id: "country", label: "나라", kids: chips([...MOVIE_COUNTRIES, "기타"]) },
    { id: "genre", label: "장르", kids: chips(MOVIE_GENRES) },
  ];
}

export function webtoonGenreTree() {
  return [
    { id: "platform", label: "플랫폼", kids: chips(WEBTOON_PLATFORMS) },
    { id: "genre", label: "장르", kids: chips(WEBTOON_GENRES) },
  ];
}

export function animeGenreTree() {
  return [{ id: "genre", label: "장르", kids: chips(ANIME_GENRES) }];
}

export function flattenMediaTree(tree = []) {
  const out = [{ id: "all", label: "전체", group: true }];
  for (const group of tree) {
    out.push({ id: group.id, label: group.label, group: true });
    for (const kid of group.kids || []) {
      out.push({ id: kid.id, label: kid.label, parentId: group.id });
    }
  }
  return out;
}

export function kidsOfMedia(id, tree = []) {
  return (tree.find((group) => group.id === id)?.kids || []).map((kid) => kid.id);
}

export function axisOfMedia(id, tree = []) {
  for (const group of tree) {
    if (group.id === id) return group.id;
    if ((group.kids || []).some((kid) => kid.id === id)) return group.id;
  }
  return "";
}

export function expandMediaSelection(selected, tree = []) {
  if (!selected?.length || selected.includes("all")) return null;
  const byAxis = new Map();
  for (const id of selected) {
    const axis = axisOfMedia(id, tree);
    if (!axis) continue;
    const ids = byAxis.get(axis) || new Set();
    if (id === axis) {
      for (const kid of kidsOfMedia(id, tree)) ids.add(kid);
    } else {
      ids.add(id);
    }
    byAxis.set(axis, ids);
  }
  return byAxis;
}

export function matchMediaTags(tags, selected, tree = []) {
  const byAxis = expandMediaSelection(selected, tree);
  if (!byAxis) return true;
  const have = new Set(tags || []);
  for (const ids of byAxis.values()) {
    if (![...ids].some((id) => have.has(id))) return false;
  }
  return true;
}

export function bucketMovieCountry(name) {
  const raw = String(name || "").trim();
  if (!raw) return "";
  if (MOVIE_COUNTRIES.includes(raw)) return raw;
  if (COUNTRY_ALIAS[raw]) return COUNTRY_ALIAS[raw];
  return "기타";
}

export function mapMovieCountries(ids, byId = {}) {
  const out = [];
  for (const id of ids || []) {
    const label = MOVIE_COUNTRY_Q[id] || String(byId[id]?.labels?.ko?.value || "").trim();
    const bucket = bucketMovieCountry(label);
    if (bucket && !out.includes(bucket)) out.push(bucket);
  }
  return out.length ? out : ["기타"];
}

export function mapWebtoonMediaTags(row = {}) {
  const out = [];
  if (row.source === "naver") out.push("네이버");
  if (row.source === "kakao") out.push("카카오");
  for (const raw of row.genres || []) {
    const mapped = WEBTOON_ALIAS[String(raw || "").trim()] || WEBTOON_ALIAS[String(raw || "").replace(/\s+/g, "")];
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

export function mapAnimeMediaTags(genres = []) {
  const out = [];
  for (const raw of genres) {
    const name = String(raw || "").trim();
    if (name === "성인") continue;
    if (ANIME_GENRES.includes(name) && !out.includes(name)) out.push(name);
  }
  return out;
}
