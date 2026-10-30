import { triviaLengthHint, triviaStage } from "./trivia-bank.js?v=2";

/**
 * 밈 퀴즈: 마추기 아이오 밈 퀴즈(국내 밈 맞추기·2025 최신 릴스 밈 맞히기·2026 밈 맞추기)를 브라우저로 풀며 정답을 옮기고,
 * 짤 그림은 쓰지 않고 그림 내용을 클로드 코드가 글로 설명했다(사용자 2026-10-31: "마추기 아이오에서 가져오기로 했잖아", "만들어").
 * 뺀 것(사용자 지시): 답이 두 가지·영어·특수문자·이모티콘이 든 것, 욕이 든 것. 실제 사람 이름이 답인 것과 비하 표현도 뺐다.
 * 나중에 사진을 띄우기로 하면 항목에 image(https 주소)를 넣으면 정답 공개 때 보인다.
 */
export const MEME_GENRES = ["옛날 밈", "2025 밈", "2026 밈"];

/** [갈래, 정답, 설명(그림 내용), 다른 정답...] */
export const MEME_ITEMS = [
  ["옛날 밈", "그의 손에 쥐어지는 합격 목걸이", "쇼미더머니 예선 장면 자막 「그리고 …」 뒤에 이어지는 말"],
  ["옛날 밈", "이대로 가면 라이더", "가면라이더 사진에 붙은 말장난 한 줄"],
  ["옛날 밈", "봇치야 그게 무슨 소리니", "애니 「봇치 더 록」 장면, 봇치에게 되묻는 대사"],
  ["옛날 밈", "이제 누가 공지해주냐", "단톡방에 정성스럽게 알림 글을 올려 주던 사람이 떠날 때 달리는 답장"],
  ["옛날 밈", "돌리랑 도트가 제일 좋아", "라마 두 마리가 끄는 마차 그림과 함께 도는 말"],
  ["옛날 밈", "그런데 짜잔 절대 라는건 없군요", "같은 남자가 두 컷에 나와 「절대」를 두고 말하는 짤"],
  ["2025 밈", "도우인 챌린지", "남자가 두 손을 앞으로 내밀며 따라 추는 숏폼 챌린지"],
  ["2025 밈", "미나사토 아리가또 카카카카와이", "두 손을 볼에 모으고 일본어로 귀엽게 외치는 릴스"],
  ["2025 밈", "이라이라", "얼굴에 빨간 화남 표시가 뜬 채 일본어로 짜증을 내는 릴스"],
  ["2025 밈", "돈두댓제이미", "운전하던 아주머니가 영어로 「그러지 마」 하며 이름을 부르는 릴스"],
  ["2025 밈", "안녕하세요 누구입니다", "손으로 한쪽 눈을 가리고 하는 인사"],
  ["2025 밈", "바라밤", "여자 셋이 나란히 서서 리듬에 맞춰 외치는 세 글자"],
  ["2025 밈", "부기다운", "체육관에서 여럿이 줄 맞춰 추는 신나는 춤"],
  ["2025 밈", "쉐이칸샹 쉐이칸샹", "줄무늬 티를 입은 남자가 팔을 들고 중국어 가사를 따라 추는 춤"],
  ["2025 밈", "진짜배기", "「최신 명품 트롯」 썸네일 속 트로트 노래"],
  ["2025 밈", "부리부리댄스", "남자가 두 팔을 넓게 벌리고 추는 춤"],
  ["2025 밈", "누가 범인일까", "셀카 영상에서 추리하듯 묻는 한마디"],
  ["2025 밈", "트랄랄레로 트랄랄라", "파란 운동화를 신은 상어 그림"],
  ["2025 밈", "햄부기온앤온", "햄버거 가게 주방 사진 위로 같은 말이 계속 반복되는 짤"],
  ["2025 밈", "짭플래쉬", "아이돌 무대 자막 「오늘 비주얼 장난 아닌데?」로 퍼진 춤"],
  ["2025 밈", "깁미더머니", "두 손을 모으고 돈을 달라고 영어로 조르는 셀카"],
  ["2026 밈", "그대 춤을 추는 나무 같아요", "몸을 흔들며 춤추는 영상 자막 「그대 춤을 추는 …」"],
  ["2026 밈", "옛날 사람들은 멘탈이 완전히 나가버렸습니다", "역사 다큐 말투로 「옛날 사람들은 …」 하고 이어지는 자막"],
  ["2026 밈", "참교육", "교복 입은 학생들 앞에 검은 옷 남자가 선 드라마 장면"],
  ["2026 밈", "카와이 다케자 다메데스카", "분홍 드레스 아이돌 무대, 「귀엽기만 하면 안 되나요?」를 일본어로"],
  ["2026 밈", "나오야 머리 넘기기", "애니 「주술회전」 속 캐릭터의 동작"],
  ["2026 밈", "쉬었음 청년", "고용 그래프가 실린 뉴스에서 퍼진, 일도 구직도 하지 않는 젊은 층을 가리키는 말"],
  ["2026 밈", "아자스", "남자가 손짓하며 추는 춤, 고맙다는 말을 짧게 줄인 말투"],
  ["2026 밈", "왕과 사는 남자", "고궁 문 앞에 두 사람이 선 영화 포스터 제목"],
  ["2026 밈", "스피키", "갈색 망토를 쓴 이모티콘 캐릭터 이름"],
  ["2026 밈", "봄동비빔밥", "납작한 봄 배추와 달걀프라이를 올려 유행한 밥 한 그릇"],
  ["2026 밈", "두바이 쫀득 쿠키", "겉에 코코아 가루를 묻힌 동그란 유행 디저트", "두쫀쿠"],
  ["2026 밈", "늑구", "눈밭을 걷는 늑대에게 붙은 별명"],
  ["2026 밈", "간바레", "소녀 사진 세 컷과 함께 「힘내」를 일본어로 외치는 밈"],
  ["2026 밈", "변기에 넣고 내려", "물 내리는 곳 속에 들어간 작은 동물 그림과 함께 도는 말"],
  ["2026 밈", "코르티스", "빨간 벽 앞에서 남자 둘이 추는 춤으로 유명해진 그룹 이름"],
  ["2026 밈", "너임마청년", "게임 채팅 캡처 속 말투에서 나온 밈"],
  ["2026 밈", "꼬마 선장", "물가에 선, 모자와 선글라스를 쓴 어린아이"],
  ["2026 밈", "담담 디디디디", "고양이 그림 옆에 영어로 적힌 소리를 한글로 읽은 것"],
  ["2026 밈", "뉴라이", "노란 황소 캐릭터가 나오는 애니 장면"],
  ["2026 밈", "붐샤카라카", "아이가 신나게 추는 춤과 외침"],
].map(([genre, word, clue, ...aliases]) => ({ key: `meme:${word}`, genre, word, question: clue, aliases }));

/** 시간이 지나면 글자 수 → 초성(상식과 같은 단계). */
export const memeStage = triviaStage;
export const memeLengthHint = triviaLengthHint;

export function buildMemePool(items = MEME_ITEMS) {
  const seen = new Set();
  const out = [];
  for (const row of items) {
    const word = String(row?.word || "").trim();
    const question = String(row?.question || "").trim();
    const image = String(row?.image || "").trim();
    if (!/^[가-힣]+( [가-힣]+)*$/.test(word) || !question || seen.has(word) || (image && !/^https:\/\//.test(image))) continue;
    seen.add(word);
    out.push({ key: `meme:${word}`, genre: String(row.genre || ""), word, question, aliases: (row.aliases || []).filter(Boolean), image, level: "" });
  }
  return { fetchedAt: 0, items: out };
}

/** genres 가 비었거나 없으면 전체. */
export function filterMemeEntries(pool, genres = null) {
  const pick = Array.isArray(genres) && genres.length ? new Set(genres) : null;
  return (pool?.items || []).filter((row) => !pick || pick.has(row.genre));
}

export function pickMemeEntries(pool, { exclude, genres } = {}, count = 1) {
  const n = Math.max(1, Math.min(3, Math.floor(Number(count) || 1)));
  const all = filterMemeEntries(pool, genres);
  let left = exclude instanceof Set ? all.filter((row) => !exclude.has(row.key)) : all.slice();
  if (!left.length && all.length && exclude instanceof Set) {
    for (const row of all) exclude.delete(row.key);
    left = all.slice();
  }
  if (!left.length) throw new Error("낼 밈 문제가 없습니다");
  const out = [];
  while (out.length < n && left.length) out.push(left.splice(Math.floor(Math.random() * left.length), 1)[0]);
  return out;
}
