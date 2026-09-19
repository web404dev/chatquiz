import { isPlayableName, scrubHint } from "./genshin-bank.js";
import { fetchJson, makeCachedBank, pushClue } from "./clue-bank.js";
import { MANGA_CURATED } from "./manga-curated.js?v=164";

export const MANGA_KINDS = ["만화이름", "캐릭터", "아이템", "기술", "장소", "조직"];
export const MANGA_GENRES = [
  "액션",
  "모험",
  "코미디",
  "드라마",
  "판타지",
  "호러",
  "미스터리",
  "로맨스",
  "SF",
  "일상",
  "스포츠",
  "오컬트",
  "스릴러",
  "심리",
];

const GENRE_KO = {
  Action: "액션",
  Adventure: "모험",
  Comedy: "코미디",
  Drama: "드라마",
  Fantasy: "판타지",
  Horror: "호러",
  Mystery: "미스터리",
  Romance: "로맨스",
  "Sci-Fi": "SF",
  "Slice of Life": "일상",
  Sports: "스포츠",
  Supernatural: "오컬트",
  Thriller: "스릴러",
  Psychological: "심리",
  Mecha: "메카",
  Music: "음악",
  "Mahou Shoujo": "마법소녀",
};

const TITLE_KO = {
  "One Piece": "원피스",
  Naruto: "나루토",
  Boruto: "보루토",
  Bleach: "블리치",
  "Dragon Ball": "드래곤볼",
  "Attack on Titan": "진격의 거인",
  "Shingeki no Kyojin": "진격의 거인",
  "Demon Slayer": "귀멸의 칼날",
  "Kimetsu no Yaiba": "귀멸의 칼날",
  "Jujutsu Kaisen": "주술회전",
  "My Hero Academia": "나의 히어로 아카데미아",
  "Boku no Hero Academia": "나의 히어로 아카데미아",
  "Death Note": "데스노트",
  "Fullmetal Alchemist": "강철의 연금술사",
  "Hunter x Hunter": "헌터×헌터",
  "Hunter × Hunter": "헌터×헌터",
  "Tokyo Ghoul": "도쿄 구울",
  "One Punch Man": "원펀맨",
  "Mob Psycho 100": "모브사이코 100",
  "Spy x Family": "스파이 패밀리",
  "Chainsaw Man": "체인소 맨",
  "Haikyuu!!": "하이큐!!",
  "Slam Dunk": "슬램덩크",
  "Kuroko's Basketball": "쿠로코의 농구",
  "The Prince of Tennis": "테니스의 왕자",
  "Captain Tsubasa": "캡틴 츠바사",
  "Initial D": "이니셜 D",
  "Detective Conan": "명탐정 코난",
  "Meitantei Conan": "명탐정 코난",
  "JoJo's Bizarre Adventure": "죠죠의 기묘한 모험",
  Berserk: "베르세르크",
  "Vinland Saga": "빈란드 사가",
  Vagabond: "배가본드",
  Kingdom: "킹덤",
  "Rurouni Kenshin": "바람의 검심",
  "Yu Yu Hakusho": "유유백서",
  Inuyasha: "이누야샤",
  "Solo Leveling": "나 혼자만 레벨업",
  "Omniscient Reader": "전지적 독자 시점",
  "Omniscient Reader's Viewpoint": "전지적 독자 시점",
  "Tower of God": "신의 탑",
  Lookism: "외모지상주의",
  "How to Fight": "싸움독학",
  "Viral Hit": "싸움독학",
  "Weak Hero": "약한영웅",
  "Return of the Mount Hua Sect": "화산귀환",
  "True Beauty": "여신강림",
  "Yumi's Cells": "유미의 세포들",
  "Love Revolution": "연애혁명",
  "Sweet Home": "스위트홈",
  "The God of High School": "갓 오브 하이스쿨",
  Noblesse: "노블레스",
  Kubera: "쿠베라",
  "Gosu": "고수",
  "Blue Lock": "블루 록",
  Dandadan: "단디단",
  "Sakamoto Days": "사카모토 데이즈",
  "Oshi no Ko": "최애의 아이",
  Frieren: "장송의 프리렌",
  "Frieren: Beyond Journey's End": "장송의 프리렌",
  "Kaiju No. 8": "카이주 8호",
  "Kaiju 8-gou": "카이주 8호",
  "Hell's Paradise": "지옥락",
  Jigokuraku: "지옥락",
  Mashle: "마슐",
  "The Apothecary Diaries": "약사의 혼잣말",
  "Kusuriya no Hitorigoto": "약사의 혼잣말",
  "Delicious in Dungeon": "던전밥",
  "Dungeon Meshi": "던전밥",
  Gintama: "은혼",
  Doraemon: "도라에몽",
  "Crayon Shin-chan": "짱구는 못말려",
  "Sailor Moon": "세일러문",
  "Cardcaptor Sakura": "카드캡터 사쿠라",
  "Yu-Gi-Oh!": "유희왕",
  "Assassination Classroom": "암살교실",
  "Food Wars": "식극의 소마",
  "Shokugeki no Soma": "식극의 소마",
  "The Quintessential Quintuplets": "5등분의 신부",
  "The Promised Neverland": "약속의 네버랜드",
  "Tokyo Revengers": "도쿄 리벤저스",
  Horimiya: "호리미야",
  "Kaguya-sama: Love is War": "카구야 님은 고백받고 싶어",
  "Komi Can't Communicate": "코미 양은 커뮤증입니다",
  "Bocchi the Rock!": "봇치 더 록",
  "My Dress-Up Darling": "그 비스크 돌은 사랑을 한다",
  "Dr. STONE": "닥터 스톤",
  "Dr. Stone": "닥터 스톤",
  "Black Clover": "블랙 클로버",
  "Fairy Tail": "페어리 테일",
  "The Seven Deadly Sins": "일곱 개의 대죄",
  "Sword Art Online": "소드 아트 온라인",
  "Re:Zero": "리제로",
  "That Time I Got Reincarnated as a Slime": "전생했더니 슬라임이었던 건에 대하여",
  Overlord: "오버로드",
  Parasyte: "기생수",
  Monster: "몬스터",
  "20th Century Boys": "20세기 소년",
  Pluto: "플루토",
  Akira: "아키라",
  "Goodnight Punpun": "오야스미 펀펀",
  "Oyasumi Punpun": "오야스미 펀펀",
  "The Summer Hikaru Died": "히카루가 죽은 여름",
  "A Silent Voice": "목소리의 형태",
  "Koe no Katachi": "목소리의 형태",
  "Your Lie in April": "4월은 너의 거짓말",
  "Fruits Basket": "후르츠 바스켓",
  Nana: "나나",
  "Boys Over Flowers": "꽃보다 남자",
};

const CHAR_KO = {
  "Monkey D. Luffy": "몽키 D. 루피",
  Luffy: "루피",
  "Roronoa Zoro": "로로노아 조로",
  Zoro: "조로",
  Nami: "나미",
  Usopp: "우솝",
  Sanji: "상디",
  "Tony Tony Chopper": "토니토니 쵸파",
  Chopper: "쵸파",
  "Nico Robin": "니코 로빈",
  Franky: "프랑키",
  Brook: "브룩",
  Jinbe: "진베",
  "Portgas D. Ace": "포트거스 D. 에이스",
  "Trafalgar Law": "트라팔가 로",
  "Uzumaki Naruto": "우즈마키 나루토",
  Naruto: "나루토",
  "Uchiha Sasuke": "우치하 사스케",
  Sasuke: "사스케",
  "Haruno Sakura": "하루노 사쿠라",
  "Hatake Kakashi": "하타케 카카시",
  "Uchiha Itachi": "우치하 이타치",
  Gaara: "가아라",
  "Kurosaki Ichigo": "쿠로사키 이치고",
  "Kuchiki Rukia": "쿠치킨 루키아",
  "Aizen Sousuke": "아이젠 소스케",
  "Son Goku": "손오공",
  Goku: "손오공",
  Vegeta: "베지터",
  Piccolo: "피콜로",
  "Eren Yeager": "에렌 예거",
  "Mikasa Ackerman": "미카사 아커만",
  "Armin Arlert": "아르민 알레르토",
  "Levi Ackerman": "리바이 아커만",
  "Kamado Tanjirou": "카마도 탄지로",
  "Kamado Nezuko": "카마도 네즈코",
  "Agatsuma Zenitsu": "아가츠마 젠이츠",
  "Hashibira Inosuke": "하시비라 이노스케",
  "Rengoku Kyoujurou": "렌고쿠 쿄쥬로",
  "Gojo Satoru": "고죠 사토루",
  "Itadori Yuuji": "이타도리 유우지",
  "Fushiguro Megumi": "후시구로 메구미",
  "Kugisaki Nobara": "쿠기사키 노바라",
  "Ryomen Sukuna": "료멘 스쿠나",
  "Getou Suguru": "게토 스구루",
  "Midoriya Izuku": "미도리야 이즈쿠",
  "Bakugou Katsuki": "바쿠고 카츠키",
  "Todoroki Shouto": "토도로키 쇼토",
  "All Might": "올마이트",
  "Yagami Light": "야가미 라이토",
  Ryuk: "류크",
  L: "엘 로라이트",
  "Edward Elric": "에드워드 엘릭",
  "Alphonse Elric": "알폰스 엘릭",
  "Roy Mustang": "로이 머스탱",
  "Gon Freecss": "곤 프릭스",
  "Killua Zoldyck": "킬루아 조르딕",
  "Kurapika": "쿠라피카",
  Leorio: "레오리오",
  Hisoka: "히소카",
  "Kaneki Ken": "카네키 켄",
  Touka: "토우카",
  Saitama: "사이타마",
  Genos: "제노스",
  Tatsumaki: "타츠마키",
  "Kageyama Shigeo": "카게야마 시게오",
  "Reigen Arataka": "레이겐 아라타카",
  "Anya Forger": "아냐 포저",
  "Loid Forger": "로이드 포저",
  "Yor Forger": "요르 포저",
  Denji: "덴지",
  Power: "파워",
  Makima: "마키마",
  "Hayakawa Aki": "아키",
  "Hinata Shouyou": "히나타 쇼요",
  "Kageyama Tobio": "카게야마 토비오",
  "Sakuragi Hanamichi": "사쿠라기 하나미치",
  "Rukawa Kaede": "루카와 카에데",
  "Edogawa Conan": "에도가와 코난",
  "Kudo Shinichi": "에도가와 코난",
  "Mori Kogoro": "모리 코고로",
  "Mori Ran": "모리 란",
  "Kujo Jotaro": "쿠죠 죠타로",
  "Dio Brando": "디오 브란도",
  Guts: "가츠",
  Griffith: "그리피스",
  Thorfinn: "토르핀",
  "Sung Jinwoo": "성진우",
  "Cha Hae-In": "차해인",
  "Kim Dokja": "김독자",
  "Yoo Joonghyuk": "유중혁",
  "Twenty-Fifth Baam": "스물다섯번째 밤",
  Bam: "밤",
  "Isagi Yoichi": "이소기 요이치",
  Frieren: "프리렌",
  Himmel: "힘멜",
  "Hoshino Ai": "아이 호시노",
  Aqua: "아쿠아",
  Ruby: "루비",
  Sakamoto: "사카모토",
  "Ayase Momo": "아야세 모모",
  "Takakura Ken": "타카쿠라 켄",
  Maomao: "마오마오",
  Laios: "라이오스",
  "Sakata Gintoki": "사카타 긴토키",
  "Nohara Shinnosuke": "노하라 신노스케",
  "Tsukino Usagi": "월야애",
  "Kinomoto Sakura": "키노모토 사쿠라",
  "Mutou Yuugi": "무토 유우기",
  "Shiota Nagisa": "시오타 나기사",
  Korosensei: "코로센세",
  "Yukihira Souma": "유키히라 소마",
  Emma: "엠마",
  Norman: "노만",
  "Hanagaki Takemichi": "하나가키 타케미치",
  "Sano Manjiro": "사노 만지로",
  "Hori Kyouko": "호리 쿄코",
  "Miyamura Izumi": "미야무라 이즈미",
  "Shinomiya Kaguya": "신omiya 카구야",
  "Shirogane Miyuki": "시로가네 미유키",
  "Komi Shouko": "코미 쇼코",
  "Gotou Hitori": "고토 히토리",
  "Kitagawa Marin": "키타가와 마린",
  "Ishigami Senkuu": "이시가미 센쿠",
  Asta: "아스타",
  "Natsu Dragneel": "나츠 드래그닐",
  Meliodas: "멜리오다스",
  Kirito: "키리토",
  Asuna: "아스나",
  "Natsuki Subaru": "나츠키 스바루",
  Emilia: "에밀리아",
  "Rimuru Tempest": "림루 템페스트",
  "Ainz Ooal Gown": "아인즈 울 고운",
  "Izumi Shinichi": "이즈미 신이치",
  Migi: "미기",
  "Tenma Kenzo": "텐마 켄조",
  "Johan Liebert": "요한 리베르트",
  "Kaneda Shoutarou": "쇼타로 카네다",
};

const WORKER = "https://chzzk-chat-quiz.web404dev.workers.dev";
const ANILIST = "https://graphql.anilist.co";
const ANILIST_QUERY = `query ($page: Int) {
  Page(page: $page, perPage: 25) {
    media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
      id
      title { native romaji english }
      synonyms
      genres
      startDate { year }
      description(asHtml: false)
      coverImage { large extraLarge }
      characters(page: 1, perPage: 25, sort: ROLE) {
        nodes {
          id
          name { native alternative full first }
          image { large }
          description(asHtml: false)
        }
      }
    }
  }
}`;

function koreanNames(...cands) {
  return [...new Set(cands.flat(2).map((raw) => String(raw || "").trim()).filter(isPlayableName))];
}

function pickKorean(...cands) {
  return koreanNames(...cands)[0] || "";
}

function pickKoreanShort(...cands) {
  return koreanNames(...cands).sort((a, b) => a.length - b.length)[0] || "";
}

function mapGenres(list) {
  return [...new Set((list || []).map((g) => GENRE_KO[g] || "").filter((g) => MANGA_GENRES.includes(g)))];
}

function stripAnilist(text) {
  return String(text || "")
    .replace(/~![\s\S]*!~/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mappedWord(map, ...cands) {
  for (const raw of cands.flat(2)) {
    const key = String(raw || "").trim();
    if (map[key]) return map[key];
  }
  return "";
}

function mappedTitle(...cands) {
  return mappedWord(TITLE_KO, ...cands);
}

function titleFromMedia(media) {
  const titles = media?.title || {};
  return (
    pickKorean(titles.native, media.synonyms, titles.english, titles.romaji) ||
    mappedTitle(titles.english, titles.romaji, titles.native, media.synonyms) ||
    ""
  );
}

function characterWord(node, title) {
  const name = node?.name || {};
  const word =
    pickKoreanShort(name.alternative, name.native, name.full, name.first) ||
    mappedWord(CHAR_KO, name.full, name.first, name.native);
  if (!word || word === title) return "";
  return word;
}

export function buildMangaBank(raw = {}, fetchedAt = Date.now()) {
  const items = [];
  const seen = new Set();
  for (const media of raw.media || []) {
    const title = titleFromMedia(media);
    const year = Number(media.startDate?.year || media.year || 0) || 0;
    const mediaGenres = mapGenres(media.genres);
    const cover = media.coverImage?.large || media.coverImage?.extraLarge || media.image || "";
    if (title) {
      pushClue(
        items,
        seen,
        {
          word: title,
          genre: "만화이름",
          hint: [mediaGenres.join(" · "), year ? `${year}년` : "", scrubHint(stripAnilist(media.description), title)]
            .filter(Boolean)
            .join("\n") || "만화 제목",
          image: cover,
          year,
          mediaGenres,
          series: title,
        },
        MANGA_KINDS,
      );
    }
    for (const node of media.characters?.nodes || media.characters || []) {
      const names = koreanNames(node.name?.alternative, node.name?.native, node.name?.full, node.name?.first);
      const word = characterWord(node, title);
      if (!word) continue;
      pushClue(
        items,
        seen,
        {
          word,
          genre: "캐릭터",
          hint: [title ? `「${title}」 캐릭터` : "", scrubHint(stripAnilist(node.description), ...names, title)]
            .filter(Boolean)
            .join("\n") || "만화 캐릭터",
          image: node.image?.large || "",
          year,
          mediaGenres,
          series: title,
        },
        MANGA_KINDS,
      );
    }
  }
  for (const extra of raw.curated || MANGA_CURATED) {
    pushClue(
      items,
      seen,
      {
        ...extra,
        hint: extra.hint || extra.series || extra.genre,
        year: extra.year || 0,
        mediaGenres: extra.mediaGenres || [],
      },
      MANGA_KINDS,
    );
  }
  return { version: 1, title: "만화 단서", fetchedAt, kinds: MANGA_KINDS, items };
}

function jikanToMedia(item) {
  const titles = (item.titles || []).map((t) => t.title);
  const title = {
    native: titles.find(Boolean) || item.title,
    english: item.title_english || "",
    romaji: item.title || "",
  };
  return {
    title,
    synonyms: titles,
    genres: (item.genres || []).map((g) => g.name),
    startDate: { year: item.year || Number(String(item.published?.from || "").slice(0, 4)) || 0 },
    description: item.synopsis || "",
    coverImage: { large: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || "" },
    characters: { nodes: [] },
  };
}

async function fetchAnilistPage(page) {
  try {
    return await fetchJson(`${WORKER}/manga?p=${page}`, {}, 12000);
  } catch {
    return fetchJson(
      ANILIST,
      {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ query: ANILIST_QUERY, variables: { page } }),
      },
      14000,
    );
  }
}

async function fetchMangaRaw() {
  let media = [];
  try {
    const pages = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map((page) => fetchAnilistPage(page).catch(() => null)));
    for (const json of pages) {
      media.push(...(json?.data?.Page?.media || []));
    }
  } catch {
    media = [];
  }
  if (!media.length) {
    try {
      const pages = [];
      for (const page of [1, 2, 3]) {
        const json = await fetchJson(
          `https://api.jikan.moe/v4/top/manga?filter=bypopularity&limit=25&page=${page}`,
          {},
          12000,
        );
        pages.push(...(json.data || []).map(jikanToMedia));
      }
      media = pages;
    } catch {
      media = [];
    }
  }
  return { media, curated: MANGA_CURATED };
}

const manga = makeCachedBank({
  cacheKey: "clueMangaBank:v3",
  title: "만화 단서",
  kinds: MANGA_KINDS,
  fetchRaw: fetchMangaRaw,
  build: buildMangaBank,
});

export const initMangaBank = manga.init;
