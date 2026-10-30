import { MOVIE_CURATED } from "./movie-curated.js";

export const SENTENCE_URL = "./sentences.json";
export const SENTENCE_MIN_WORDS = 3;
export const SENTENCE_MAX_LETTERS = 20;

/** 사용자 결정(2026-10-25): 명언은 말한 사람의 위키인용집 분류로 7종류로 나눈다. 분류가 여러 개면 위쪽 종류가 먼저 잡힌다. */
export const QUOTE_KINDS = [
  ["연예·음악", /연예인|가수|배우|방송인|희극|래퍼|음악가|기타리스트|작곡가/],
  ["스포츠", /선수|(야구|축구|농구|배구) 감독|스포츠|바둑/],
  ["과학", /수학자|물리학자|화학자|천문학자|과학자|의학자|생물학자|발명가|공학자|노벨 (물리학|화학|생리학)/],
  ["역사·정치", /군주|장군|독립운동가|군인|황제|정치인|대통령|총리|혁명가|조선 사람|외교관/],
  ["철학·종교", /철학자|종교|신학자|유학자|신비주의자|승려|목사|사상가|수녀|기독교인/],
  ["문학·예술", /작가|시인|소설가|수필가|예술가|화가|서예가|극작가|노벨 문학상/],
];
export const QUOTE_OTHER = "그 밖";
export const QUOTE_GENRES = [...QUOTE_KINDS.map(([kind]) => `${kind} 명언`), `${QUOTE_OTHER} 명언`];

export function quoteGenre(cats = []) {
  const joined = cats.join(" ");
  return `${QUOTE_KINDS.find(([, re]) => re.test(joined))?.[0] || QUOTE_OTHER} 명언`;
}

export const SENTENCE_SOURCES = ["속담", ...QUOTE_GENRES, "영화 명대사", "애니 명대사", "드라마 명대사"];
/** 사용자 결정(2026-10-24): 영화·드라마 명대사는 한국 작품만, 애니는 나라 상관없이. 코드에 적힌 명대사(movie-curated.js)는 아래 한국 영화만 쓴다. */
const KOREAN_CURATED_FILMS = new Set([
  "기생충",
  "타짜",
  "친구",
  "해바라기",
  "내부자들",
  "극한직업",
  "명량",
  "살인의 추억",
  "범죄도시",
  "달콤한 인생",
  "좋은 놈, 나쁜 놈, 이상한 놈",
  "신세계",
]);
export const PROVERB_CATEGORY = "분류:한국어 속담";
export const PROVERB_SOURCE = "https://ko.wiktionary.org/wiki/분류:한국어_속담";
export const PROVERB_LICENSE = "CC BY-SA 4.0 (위키낱말사전)";
export const QUOTE_SOURCE = "https://ko.wikiquote.org/";
export const QUOTE_LICENSE = "CC BY-SA 4.0 (위키인용집)";
const WIKT_API = "https://ko.wiktionary.org/w/api.php";
const WIKIQUOTE_API = "https://ko.wikiquote.org/w/api.php";
const WIKIPEDIA_API = "https://ko.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const PERSON_CATEGORY = /태어남|출생|죽음|사망|사람|births|deaths/i;
const NOT_PERSON_PAGES = new Set(["인간", "익명", "위인", "적성", "죽음", "한국인"]);
/** 사용자 결정(2026-10-24): 한국 정치인·나치·친일 인물, 성우·방송인은 명언에서 뺀다. 분류가 없는 사람은 sentence-exclude.json speakers 에 적는다. */
const SKIP_SPEAKER_CATEGORY = /대한민국의 (대통령|정치인)|나치 독일|친일인명사전/;
const MEDIA_PERSON_CATEGORY = /(성우|방송인|연예인)$/;
/** 사용자 결정(2026-10-25): '대한민국의 연예인'(예능인 등)은 방송인 분류가 함께 있어도 명언에 넣는다. */
const KOREAN_ENTERTAINER = "대한민국의 연예인";
const USER_AGENT = "chzzk-chat-quiz/1.0 (https://web404dev.github.io/chatquiz/)";

/** 방송에 내기 어려운 말. 놓친 문장은 sentence-exclude.json 에 적는다. */
export const SENTENCE_BLOCK = [
  /똥/, /오줌/, /방귀/, /불알/, /좆/, /씹(?![어듯])/, /젖(?!는)/, /지랄/,
  /(?<![일이삼사오육칠팔구십백천만몇초청소노중내작금풍흉말매]\s?)년/,
  /창녀/, /창부/, /매춘/, /계집/, /여편네/, /과부/, /홀아비/, /시앗/, /화냥/, /갈보/, /기생/, /서방질/, /오입/,
  /병신/, /등신/, /미친/, /장님/, /봉사/, /벙어리/, /귀머거리/, /절름발이/, /앉은뱅이/,
  /꼽추/, /곱사/, /문둥/, /곰보/, /언청이/, /애꾸/, /백정/,
  /되놈/, /상놈/, /쌍놈/, /종놈/, /대가리/, /주둥이/, /아가리/, /배때기/,
];

export function sentenceWords(text) {
  return String(text ?? "").normalize("NFC").trim().split(/\s+/).filter(Boolean);
}

export function isBroadcastSafe(text) {
  const raw = String(text ?? "");
  return !SENTENCE_BLOCK.some((re) => re.test(raw));
}

/** 3어절이 안 돼도 내는 대사(한글만 이어 붙인 글). 사용자 2026-10-25: 「봄날은 간다」는 "라면 먹고 갈래요?"가 아니라 "라면 먹을래요?"가 맞음 → 이 대사만 2어절 허용. */
const TWO_WORD_LINES = new Set(["라면먹을래요"]);

/** 3어절 이상, 섞이는 글자(띄어쓰기·문장부호 뺀 한글)는 20자까지(사용자 2026-10-25: "최소는 지켜", "66글자는 지나치게 많아 한계는 있어야하는데", "7자는 너무 짧았던거야" → 20글자 선택). */
export function isSentenceCandidate(text) {
  const raw = String(text ?? "").normalize("NFC").trim();
  if (!/^[가-힣 ,.?!]+$/.test(raw)) return false;
  const letters = raw.replace(/[^가-힣]/g, "");
  if (letters.length > SENTENCE_MAX_LETTERS) return false;
  const minWords = TWO_WORD_LINES.has(letters) ? 2 : SENTENCE_MIN_WORDS;
  return sentenceWords(raw).length >= minWords && isBroadcastSafe(raw);
}

function sentenceKey(text) {
  return sentenceWords(text).join(" ");
}

export function cleanProverbTitles(titles = [], exclude = []) {
  const skip = new Set(exclude.map(sentenceKey));
  const seen = new Set();
  const items = [];
  for (const title of titles) {
    const word = sentenceKey(title);
    if (!word || seen.has(word) || skip.has(word) || !isSentenceCandidate(word)) continue;
    seen.add(word);
    items.push({ word, genre: "속담" });
  }
  return items;
}

export function cleanWikiquoteLine(line) {
  return String(line ?? "")
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/<ref[\s\S]*?<\/ref>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:[^\s\]]+\s*([^\]]*)\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/[“”"「」『』]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.$/, "");
}

/** 위키인용집 인물 문서의 맨 윗단 목록(* …)만 명언으로 본다. 말한 사람은 문서 제목. */
export function wikiquoteQuotes(pages = [], { exclude = [], skipSpeakers = [] } = {}) {
  const skip = new Set(exclude.map(sentenceKey));
  const skipWho = new Set(skipSpeakers);
  const seen = new Set();
  const items = [];
  for (const page of pages) {
    const who = String(page?.title || "").trim();
    const cats = page?.cats || [];
    if (!who || NOT_PERSON_PAGES.has(who) || skipWho.has(who)) continue;
    if (!cats.some((cat) => PERSON_CATEGORY.test(cat)) || cats.some((cat) => SKIP_SPEAKER_CATEGORY.test(cat))) continue;
    if (!cats.includes(KOREAN_ENTERTAINER) && cats.some((cat) => MEDIA_PERSON_CATEGORY.test(cat))) continue;
    for (const line of String(page.text || "").split("\n")) {
      if (!/^\*[^*:]/.test(line)) continue;
      const word = sentenceKey(cleanWikiquoteLine(line.slice(1)));
      if (!word || word.endsWith(",") || seen.has(word) || skip.has(word) || !isSentenceCandidate(word)) continue;
      seen.add(word);
      items.push({ word, genre: quoteGenre(cats), who });
    }
  }
  return items;
}

const WORK_CATEGORY = /(영화|드라마|애니메이션|텔레비전 프로그램)$/;

/** 위키인용집 대사는 한국 영화만 쓴다. 애니·드라마는 유명 대사만 고른 CURATED_LINES 를 쓴다(사용자 결정 2026-10-25). */
function workGenre(cats) {
  if (cats.some((cat) => /애니메이션/.test(cat))) return null;
  if (cats.includes("대한민국의 영화")) return { genre: "영화 명대사", kind: "영화" };
  return null;
}

/** 다섯째 칸은 장면 그림 검색어. "제목"이면 대사 낱말 없이 작품 제목 명장면으로, 그 밖의 글이면 그 글로 찾는다(사용자 2026-10-25: 대사 낱말로 엉뚱한 그림이 나온 줄, 범죄도시는 1편 장면, 블리치는 원피스 그림이 나와 말한 아이젠 장면). */
/** 사용자가 고른 애니·드라마 유명 대사(2026-10-25). 드라마는 작품마다 하나만. 한국 영화도 같은 목록에 둔다(사용자 2026-10-25: "영화 명대사도 코드에 유명 대사 목록 만들어서 늘려줘", 같은 영화 2개까지). 표현은 널리 알려진 한국어 대사 기준. */
export const CURATED_LINES = [
  ["애니 명대사", "애니메이션", "슬램덩크", "왼손은 거들 뿐"],
  ["애니 명대사", "애니메이션", "슬램덩크", "포기하면 그 순간이 바로 시합 종료예요"],
  ["애니 명대사", "애니메이션", "슬램덩크", "영감님의 영광의 시대는 언제였죠?"],
  ["애니 명대사", "애니메이션", "귀멸의 칼날", "생살여탈권을 남에게 쥐어주지 마라"],
  ["애니 명대사", "애니메이션", "귀멸의 칼날", "전집중 물의 호흡"],
  ["애니 명대사", "애니메이션", "주술회전", "괜찮아, 나 최강이니까"],
  ["애니 명대사", "애니메이션", "진격의 거인", "한 마리도 남김없이 구축해 주겠어"],
  ["애니 명대사", "애니메이션", "원피스", "난 해적왕이 될 남자다"],
  ["애니 명대사", "애니메이션", "나루토", "그게 나의 닌도다"],
  ["애니 명대사", "애니메이션", "데스노트", "나는 신세계의 신이 된다"],
  ["애니 명대사", "애니메이션", "강철의 연금술사", "인간은 무언가의 희생 없이는 아무것도 얻을 수 없다"],
  // 마추기(machugi.io) 「애니 명대사」 퀴즈의 문제 그림·글을 클로드 코드가 읽어 옮긴 대사(사용자 2026-10-25: "마추기 아이오에서 '애니 명대사'로 가져와서 이미지를 너가 그대로 텍스트로 바꿔서 문제 답을 만들어놔").
  ["애니 명대사", "애니메이션", "원펀맨", "취미로 히어로를 하는 사람이다"],
  ["애니 명대사", "애니메이션", "드래곤볼", "한계는 깨라고 있는 거다."],
  ["애니 명대사", "애니메이션", "원피스", "등의 상처는 검사의 수치다!"],
  ["애니 명대사", "애니메이션", "최애의 아이", "거짓말은 최고의 사랑이라고"],
  ["애니 명대사", "애니메이션", "코드 기아스", "총을 쏴도 되는 건 총에 맞을 각오를 한 자 뿐이다", "제목"],
  ["애니 명대사", "애니메이션", "슬램덩크", "그래 난 정대만. 포기를 모르는 남자지"],
  ["애니 명대사", "애니메이션", "체인소 맨", "시체가 말을 하네?"],
  ["애니 명대사", "애니메이션", "북두의 권", "오마에와 모 신데이루", "제목"],
  ["애니 명대사", "애니메이션", "장송의 프리렌", "용사 힘멜이라면 그렇게 했을 테니까", "제목"],
  ["애니 명대사", "애니메이션", "하이큐!!", "재능은 꽃 피우는 것, 센스는 갈고 닦는 것!"],
  ["애니 명대사", "애니메이션", "블리치", "동경은 이해로부터 가장 먼 감정이야", "블리치 아이젠 명장면"],
  ["애니 명대사", "애니메이션", "헌터x헌터", "헌터란 자유를 좇는 자다", "제목"],
  ["애니 명대사", "애니메이션", "블루 록", "나에게 축구는 살인이다."],
  ["애니 명대사", "애니메이션", "Re: 제로부터 시작하는 이세계 생활", "내가 지금 죽으면 다시 살아나지 못할 것 같아"],
  ["애니 명대사", "애니메이션", "마슐", "근육은 모든 걸 해결한다"],
  ["애니 명대사", "애니메이션", "미라큘러스: 레이디버그와 블랙캣", "안녕? 마이 레이디?"],
  ["애니 명대사", "애니메이션", "어떤 마술의 금서목록", "미안하지만 이 앞은 일방통행이다"],
  ["애니 명대사", "애니메이션", "던전밥", "이제부터 몬스터로 요리를 만들어 보자."],
  ["애니 명대사", "애니메이션", "나루토", "자신을 믿지 않는 녀석 따위는 노력 할 가치도 없다!", "제목"],
  ["애니 명대사", "애니메이션", "스파이 X 패밀리", "세계의 평화를 위해, 완벽한 가족이 필요하다.", "제목"],
  ["애니 명대사", "애니메이션", "포켓몬스터", "피죤투 금방 다녀올께", "제목"],
  ["애니 명대사", "애니메이션", "강철의 연금술사", "연금술이 없어도 모두가 있으니까!"],
  ["애니 명대사", "애니메이션", "너에게 닿기를", "언제쯤... 내 마음이... 너에게 닿을까...?"],
  ["애니 명대사", "애니메이션", "나의 히어로 아카데미아", "너는 히어로가 될 수 있어!"],
  ["애니 명대사", "애니메이션", "곰돌이 푸", "매일 행복하진 않지만 행복한 일은 매일 있어."],
  ["애니 명대사", "애니메이션", "귀멸의 칼날", "악보가 완성됐다! 이기러 가자!"],
  ["애니 명대사", "애니메이션", "올림포스 가디언", "너 때문에 흥이 다 깨져버렸으니까 책임져."],
  ["애니 명대사", "애니메이션", "Re: 제로부터 시작하는 이세계 생활", "여기서부터 시작하죠. 하나부터.. 아니.. 제로부터!"],
  ["애니 명대사", "애니메이션", "모브 사이코 100", "정말로 싫을 때는 말이야... 도망쳐도 된다고!"],
  ["애니 명대사", "애니메이션", "명탐정 코난", "저리 비켜 이상윤!!!"],
  ["애니 명대사", "애니메이션", "명탐정 코난", "진실은 언제나 하나!"],
  ["애니 명대사", "애니메이션", "원피스", "여자의 거짓말을 용서할 줄 하는게 남자다!"],
  ["애니 명대사", "애니메이션", "하이큐!!", "날개가 없기에 인간은 날아오를 방법을 찾는다."],
  ["애니 명대사", "애니메이션", "어떤 마술의 금서목록", "어금니 꽉 물어라 최강... 내 최약은 조금 아플테니까"],
  ["애니 명대사", "애니메이션", "괴수 8호", "괴수 토벌은 내 일이다", "제목"],
  ["애니 명대사", "애니메이션", "하이큐!!", "아래를 보지 마! 배구는 언제나 위를 보는 스포츠다"],
  ["애니 명대사", "애니메이션", "주술회전", "우리는 모두, 혼자서 죽어가는 거야"],
  ["애니 명대사", "애니메이션", "유희왕", "함정 카드 발동"],
  ["애니 명대사", "애니메이션", "디지몬 어드벤처", "안녕, 디지몬! 네가 있어서 난 참 좋았어", "제목"],
  ["애니 명대사", "애니메이션", "강철의 연금술사", "태양에 너무 가까이 다가가면 타버릴 뿐이야"],
  ["애니 명대사", "애니메이션", "나의 히어로 아카데미아", "이제 괜찮다! 왜냐고? 내가 왔으니까!", "제목"],
  ["애니 명대사", "애니메이션", "귀멸의 칼날", "마음을 불태워라. 한계를 뛰어넘어라", "제목"],
  ["영화 명대사", "영화", "기생충", "너는 계획이 다 있구나"],
  ["영화 명대사", "영화", "기생충", "제시카 외동딸 일리노이 시카고", "제목"],
  ["영화 명대사", "영화", "타짜", "묻고 더블로 가"],
  ["영화 명대사", "영화", "타짜", "싸늘하다, 가슴에 비수가 날아와 꽂힌다"],
  ["영화 명대사", "영화", "범죄와의 전쟁: 나쁜놈들 전성시대", "느그 서장 남천동 살제?"],
  ["영화 명대사", "영화", "친구", "니가 가라, 하와이"],
  ["영화 명대사", "영화", "친구", "고마해라, 마이 묵었다 아이가"],
  ["영화 명대사", "영화", "베테랑", "우리가 돈이 없지 가오가 없냐"],
  ["영화 명대사", "영화", "베테랑", "맷돌 손잡이를 어이라고 해요", "제목"],
  ["영화 명대사", "영화", "아저씨", "오늘만 사는 놈은 내일만 사는 놈한테 죽는다"],
  ["영화 명대사", "영화", "아저씨", "금니 빼고 모조리 씹어먹어 줄게"],
  ["영화 명대사", "영화", "부당거래", "호의가 계속되면, 그게 권리인 줄 알아요"],
  ["영화 명대사", "영화", "관상", "내가 왕이 될 상인가"],
  ["영화 명대사", "영화", "범죄도시", "너 내가 누군지 아니?", "범죄도시 1편 장첸 명장면"],
  ["영화 명대사", "영화", "범죄도시", "어, 아직 싱글이야"],
  ["영화 명대사", "영화", "달콤한 인생", "나한테 왜 그랬어요?"],
  ["영화 명대사", "영화", "살인의 추억", "밥은 먹고 다니냐?"],
  ["영화 명대사", "영화", "극한직업", "지금까지 이런 맛은 없었다"],
  ["영화 명대사", "영화", "극한직업", "이것은 갈비인가 통닭인가"],
  ["영화 명대사", "영화", "명량", "신에게는 아직 열두 척의 배가 남아 있사옵니다"],
  ["영화 명대사", "영화", "명량", "죽고자 하면 살 것이요, 살고자 하면 죽을 것이다"],
  ["영화 명대사", "영화", "해바라기", "꼭 그렇게 다 가져가야만 속이 후련했냐"],
  ["영화 명대사", "영화", "내부자들", "모히또 가서 몰디브 한 잔 할라니까"],
  ["영화 명대사", "영화", "내부자들", "어차피 대중들은 개돼지입니다"],
  ["영화 명대사", "영화", "왕의 남자", "나 여기 있고 너 거기 있지"],
  ["영화 명대사", "영화", "암살", "알려줘야지, 우린 계속 싸우고 있다고"],
  ["영화 명대사", "영화", "서울의 봄", "실패하면 반역, 성공하면 혁명 아닙니까"],
  ["영화 명대사", "영화", "봄날은 간다", "라면 먹을래요?"],
  ["영화 명대사", "영화", "봄날은 간다", "사랑이 어떻게 변하니?"],
  ["영화 명대사", "영화", "비트", "나에겐 꿈이 없었다"],
  ["영화 명대사", "영화", "말아톤", "초원이 다리는 백만 불짜리 다리"],
  ["영화 명대사", "영화", "주유소 습격사건", "난 한 놈만 패"],
  ["영화 명대사", "영화", "박하사탕", "나 다시 돌아갈래"],
  ["영화 명대사", "영화", "내 머리 속의 지우개", "내 머릿속에 지우개가 있대"],
  ["영화 명대사", "영화", "최종병기 활", "바람은 계산하는 것이 아니라 극복하는 것이다"],
  // 마추기(machugi.io) 「드라마 & 영화 속 명대사 보고 맞추기」 퀴즈의 문제 그림을 클로드 코드가 읽어 옮긴 대사(사용자 2026-10-25: "이건 영화/드라마야 영화는 영화주제에 드라마는 드라마 주제에 넣으면돼").
  ["영화 명대사", "영화", "신과 함께", "지나간 일에 대해 새로운 눈물을 낭비하지 말자.", "제목"],
  ["영화 명대사", "영화", "건축학개론", "납득이 안 가잖아, 납득이!"],
  ["영화 명대사", "영화", "내 머리 속의 지우개", "용서는 미움에게 방 한 칸만 내주면 되는거래", "제목"],
  ["영화 명대사", "영화", "달콤한 인생", "넌 나에게 모욕감을 줬어!", "달콤한 인생 모욕감 명장면"],
  ["영화 명대사", "영화", "엽기적인 그녀", "견우야 미안해! 나도 어쩔수 없는 여자인가봐!", "제목"],
  ["영화 명대사", "영화", "생활의 발견", "사람되는건 어렵지만 우리 괴물은 되지 말자", "제목"],
  ["영화 명대사", "영화", "접속", "사랑한다면 사랑받길 원하는 겁니다.", "제목"],
  ["영화 명대사", "영화", "영웅", "코레아 우라!! 코레아 우라!!"],
  ["드라마 명대사", "드라마", "오징어 게임", "깐부끼리는 네 거 내 거가 없는 거야"],
  ["드라마 명대사", "드라마", "더 글로리", "브라보, 멋지다 연진아"],
  ["드라마 명대사", "드라마", "도깨비", "너와 함께한 시간 모두 눈부셨다"],
  ["드라마 명대사", "드라마", "태양의 후예", "그 어려운 걸 자꾸 해냅니다, 제가"],
  ["드라마 명대사", "드라마", "시크릿 가든", "이게 최선입니까? 확실해요?"],
  ["드라마 명대사", "드라마", "나의 아저씨", "지안, 편안함에 이르렀나?"],
  ["드라마 명대사", "드라마", "대장금", "홍시 맛이 나서 홍시라 생각했사온데"],
  ["드라마 명대사", "드라마", "모래시계", "나 지금 떨고 있니?"],
  ["드라마 명대사", "드라마", "상속자들", "나 너 좋아하냐?"],
  ["드라마 명대사", "드라마", "파리의 연인", "이 안에 너 있다"],
  ["드라마 명대사", "드라마", "선덕여왕", "저기인가, 저기에 폐하가 계신가...", "제목"],
  ["드라마 명대사", "드라마", "약한영웅 Class 1", "실수.. 하지 않게 조심하라고.", "제목"],
  ["드라마 명대사", "드라마", "달의 연인", "만나지 않았더라면 이리 그리워하지 않았을 것을"],
  ["드라마 명대사", "드라마", "이상한 변호사 우영우", "너는 너답게 살면 돼.", "제목"],
  ["드라마 명대사", "드라마", "내 연애의 모든 것", "니가 언제 오든 널 기다리는 중이야.", "제목"],
  ["드라마 명대사", "드라마", "그 겨울, 바람이 분다", "늘 날 보고있는 느낌이었거든요. 온 몸과, 마음으로."],
  ["드라마 명대사", "드라마", "눈물의 여왕", "사랑해 처음 봤을 때부터 지금까지 사랑했어"],
  ["드라마 명대사", "드라마", "모범택시", "선생님이 대마를 달라 한것도 아니고.."],
  ["드라마 명대사", "드라마", "스물다섯 스물하나", "좋아하는 사람 생기면 꼭 말해, 망설이지 말고.", "제목"],
  ["드라마 명대사", "드라마", "옥씨부인전", "그 종사관 나리는 그 여인의 첫사람이 맞습니다.", "제목"],
].map(([genre, kind, series, word, imageBy]) => ({ word, genre, series, kind, ...(imageBy ? { imageBy } : {}) }));

export function curatedLineSentences(lines = CURATED_LINES) {
  return lines
    .filter((row) => isSentenceCandidate(row.word))
    .map((row) => ({ ...row, word: sentenceKey(row.word) }));
}

/** 위키인용집 한국 영화 문서의 대사(* 또는 : 줄). 앞의 '인물:'은 떼고, 작품 제목은 문서 제목 그대로 쓴다. */
export function wikiquoteFilmQuotes(pages = [], { exclude = [] } = {}) {
  const skip = new Set(exclude.map(sentenceKey));
  const seen = new Set();
  const items = [];
  for (const page of pages) {
    const series = String(page?.title || "").trim();
    const cats = page?.cats || [];
    if (!series || cats.some((cat) => PERSON_CATEGORY.test(cat)) || !cats.some((cat) => WORK_CATEGORY.test(cat))) continue;
    const work = workGenre(cats);
    if (!work) continue;
    for (const line of String(page.text || "").split("\n")) {
      if (!/^(\*[^*:]|:)/.test(line)) continue;
      const word = sentenceKey(cleanWikiquoteLine(line.replace(/^[*:]+/, "")).replace(/^[^:：]{1,12}[:：]\s*/, ""));
      if (!word || word.endsWith(",") || seen.has(word) || skip.has(word) || !isSentenceCandidate(word)) continue;
      seen.add(word);
      items.push({ word, ...work, series });
    }
  }
  return items;
}

export function movieQuoteSentences(curated = MOVIE_CURATED) {
  return curated
    .filter((row) => row?.genre === "명대사" && KOREAN_CURATED_FILMS.has(row.series) && isSentenceCandidate(row.word))
    .map((row) => ({ word: sentenceKey(row.word), genre: "영화 명대사", series: row.series || "", kind: "영화" }));
}

export function proverbImageQueries(word) {
  return [`${word} 속담 그림`, `${word} 속담`];
}

export function quoteImageQueries(row) {
  const movie = String(row?.series || "").trim();
  if (row?.imageBy === "제목") return [`${movie} 명장면`, `영화 ${movie} 명장면`];
  if (row?.imageBy) return [row.imageBy, `영화 ${row.imageBy}`];
  return [`${movie} ${row.word} 명장면`, `${movie} ${row.word}`, `${movie} 명장면`].map((q) => q.trim());
}

/** 사용자 결정(2026-10-25): 같은 영화의 명대사는 2개까지. */
export const FILM_LINES_PER_WORK = 2;

/** 띄어쓰기·문장부호만 다른 같은 대사를 하나로 본다(채점과 같은 기준). */
function sameLineKey(text) {
  return String(text ?? "").normalize("NFC").replace(/[^가-힣]/g, "");
}

export function buildSentencePool(raw = {}, curated = MOVIE_CURATED, lines = CURATED_LINES) {
  const seen = new Set();
  const perFilm = new Map();
  const out = [];
  const proverbs = Array.isArray(raw?.items) ? raw.items : [];
  const quoteImages = raw?.quoteImages && typeof raw.quoteImages === "object" ? raw.quoteImages : {};
  // 직접 고른 대사(애니·드라마, 코드의 한국 영화)를 먼저 둬서 겹치거나 2개를 넘을 때 남긴다.
  for (const row of [...curatedLineSentences(lines), ...movieQuoteSentences(curated), ...proverbs]) {
    const word = sentenceKey(row?.word);
    const key = sameLineKey(word);
    if (!word || seen.has(key) || !isSentenceCandidate(word)) continue;
    if (row.genre === "영화 명대사") {
      const count = perFilm.get(row.series) || 0;
      if (count >= FILM_LINES_PER_WORK) continue;
      perFilm.set(row.series, count + 1);
    }
    seen.add(key);
    const image = String(row.image || quoteImages[word] || "").trim();
    out.push({ ...row, word, genre: row.genre || "속담", ...(image ? { image } : {}) });
  }
  return { fetchedAt: Number(raw?.fetchedAt) || 0, items: out };
}

export function filterSentences(pool, sources = SENTENCE_SOURCES) {
  const pick = new Set(sources);
  return (pool?.items || []).filter((row) => pick.has(row.genre));
}

export function pickSentenceEntries(pool, { exclude, sources } = {}, count = 1) {
  const n = Math.max(1, Math.min(3, Math.floor(Number(count) || 1)));
  const all = filterSentences(pool, sources);
  let left = exclude instanceof Set ? all.filter((row) => !exclude.has(row.word)) : all.slice();
  if (!left.length && all.length && exclude instanceof Set) {
    exclude.clear();
    left = all.slice();
  }
  if (!left.length) throw new Error("낼 문장이 없습니다");
  const out = [];
  while (out.length < n && left.length) {
    out.push(left.splice(Math.floor(Math.random() * left.length), 1)[0]);
  }
  return out;
}

export async function loadSentencePool(fetchImpl = fetch) {
  try {
    const res = await fetchImpl(SENTENCE_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`sentences ${res.status}`);
    return buildSentencePool(await res.json());
  } catch {
    return buildSentencePool({});
  }
}

export async function fetchProverbTitles(fetchImpl = fetch) {
  const titles = [];
  let cont = "";
  for (let page = 0; page < 20; page += 1) {
    const url = new URL(WIKT_API);
    url.search = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: PROVERB_CATEGORY,
      cmnamespace: "0",
      cmlimit: "500",
      format: "json",
      formatversion: "2",
      ...(cont ? { cmcontinue: cont } : {}),
    }).toString();
    const res = await fetchImpl(url, { headers: { "user-agent": USER_AGENT } });
    if (!res.ok) throw new Error(`wiktionary ${res.status}`);
    const data = await res.json();
    for (const row of data?.query?.categorymembers || []) {
      if (row?.title) titles.push(row.title);
    }
    cont = data?.continue?.cmcontinue || "";
    if (!cont) break;
  }
  return titles;
}

async function wikiJson(fetchImpl, api, params) {
  const url = new URL(api);
  url.search = new URLSearchParams({ format: "json", formatversion: "2", ...params }).toString();
  for (let i = 0; i < 4; i += 1) {
    const res = await fetchImpl(url, { headers: { "user-agent": USER_AGENT } });
    if (res.status === 429) {
      await new Promise((ok) => setTimeout(ok, 10000 * (i + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`wiki ${res.status}`);
    return res.json();
  }
  throw new Error("wiki 429");
}

export async function fetchWikiquotePages(fetchImpl = fetch, { pauseMs = 0 } = {}) {
  const wait = () => (pauseMs ? new Promise((ok) => setTimeout(ok, pauseMs)) : null);
  const titles = [];
  let cont = "";
  for (let page = 0; page < 50; page += 1) {
    const data = await wikiJson(fetchImpl, WIKIQUOTE_API, {
      action: "query",
      list: "allpages",
      apnamespace: "0",
      aplimit: "500",
      apfilterredir: "nonredirects",
      ...(cont ? { apcontinue: cont } : {}),
    });
    titles.push(...(data?.query?.allpages || []).map((row) => row.title));
    cont = data?.continue?.apcontinue || "";
    await wait();
    if (!cont) break;
  }
  const pages = [];
  for (let i = 0; i < titles.length; i += 50) {
    const data = await wikiJson(fetchImpl, WIKIQUOTE_API, {
      action: "query",
      prop: "revisions|categories",
      rvprop: "content",
      rvslots: "main",
      cllimit: "max",
      titles: titles.slice(i, i + 50).join("|"),
    });
    for (const row of data?.query?.pages || []) {
      pages.push({
        title: row.title,
        text: row.revisions?.[0]?.slots?.main?.content || "",
        cats: (row.categories || []).map((cat) => String(cat.title || "").replace(/^분류:/, "")),
      });
    }
    await wait();
  }
  return pages;
}

/** 말한 사람 사진: 한국어 위키백과 문서의 대표 그림(위키미디어 공용). */
export async function fetchSpeakerImages(names = [], fetchImpl = fetch, { pauseMs = 0 } = {}) {
  const images = {};
  for (let i = 0; i < names.length; i += 50) {
    const batch = names.slice(i, i + 50);
    const data = await wikiJson(fetchImpl, WIKIPEDIA_API, {
      action: "query",
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "400",
      redirects: "1",
      titles: batch.join("|"),
    });
    const from = {};
    for (const row of [...(data?.query?.normalized || []), ...(data?.query?.redirects || [])]) {
      from[row.to] = from[row.from] || row.from;
    }
    for (const row of data?.query?.pages || []) {
      if (row.thumbnail?.source) images[from[row.title] || row.title] = row.thumbnail.source;
    }
    if (pauseMs) await new Promise((ok) => setTimeout(ok, pauseMs));
  }
  return images;
}

/** 위키백과에 사진이 없으면 위키인용집 문서에 연결된 위키데이터 항목의 사진(P18, 위키미디어 공용)을 쓴다. 이름은 바꾸지 않는다. */
export async function fetchWikidataSpeakerImages(names = [], fetchImpl = fetch, { pauseMs = 0 } = {}) {
  const wait = () => (pauseMs ? new Promise((ok) => setTimeout(ok, pauseMs)) : null);
  const itemOf = {};
  for (let i = 0; i < names.length; i += 50) {
    const data = await wikiJson(fetchImpl, WIKIQUOTE_API, {
      action: "query",
      prop: "pageprops",
      ppprop: "wikibase_item",
      titles: names.slice(i, i + 50).join("|"),
    });
    const from = {};
    for (const row of data?.query?.normalized || []) from[row.to] = row.from;
    for (const row of data?.query?.pages || []) {
      const id = row.pageprops?.wikibase_item;
      if (id) itemOf[from[row.title] || row.title] = id;
    }
    await wait();
  }
  const ids = [...new Set(Object.values(itemOf))];
  const fileOf = {};
  for (let i = 0; i < ids.length; i += 50) {
    const data = await wikiJson(fetchImpl, WIKIDATA_API, {
      action: "wbgetentities",
      ids: ids.slice(i, i + 50).join("|"),
      props: "claims",
    });
    for (const [id, entity] of Object.entries(data?.entities || {})) {
      const file = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (file) fileOf[id] = file;
    }
    await wait();
  }
  const images = {};
  for (const [name, id] of Object.entries(itemOf)) {
    if (fileOf[id]) images[name] = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileOf[id])}?width=500`;
  }
  return images;
}
