import { triviaLengthHint, triviaStage } from "./trivia-bank.js?v=3";

/**
 * 밈 퀴즈: 마추기 아이오 밈 퀴즈(쉬운 유명 밈·밈 지박령·국내 밈 맞추기·2025 최신 릴스 밈 맞히기·2026 밈 맞추기)를 브라우저로 풀며
 * 정답과 짤 그림 주소를 옮겼다(사용자 2026-10-31: "마추기 아이오에서 가져오기로 했잖아", "사진 넣어줘").
 * 그림은 내려받지 않고 마추기 그림 서버 주소를 그대로 띄운다(올린 사람이 지우면 그 문제는 그림이 안 나온다).
 * 뺀 것(사용자 지시): 답이 두 가지·영어·숫자·특수문자(문장부호 포함)·이모티콘이 든 것, 욕이 든 것, 같은 밈 중복, 사진에 답 글자가 보이는 것.
 * 실제 사람 이름·별명이 답인 것, 비하·종교·폭력·정치 소재, 너무 길어 채팅으로 치기 어려운 것도 뺐다.
 */
export const MEME_GENRES = ["옛날 밈", "2025 밈", "2026 밈"];
export const MEME_IMAGE_BASE = "https://images.machugi.io/";
export const MEME_QUESTION = "이 짤, 무슨 밈일까요?";

/** [갈래, 정답, 그림(마추기 그림 서버 안 경로), 다른 정답...] */
export const MEME_ITEMS = [
  ["옛날 밈", "울어라 지옥참마도", "fa549a4a-f50a-4508-b036-16385a8aa7f8.jpeg"],
  ["옛날 밈", "무대를 뒤집어놓으셨다", "52bffcfb-6248-4a46-bb4e-556764ca2b54.jpeg"],
  ["옛날 밈", "어쩔티비", "82acabc4-3fa0-4a66-9bbb-c5b76004f869.jpeg"],
  ["옛날 밈", "나 꿍꼬또 기싱꿍꼬또", "46041df3-0876-4a0f-a2e0-4f88c8cdeaf9.jpeg"],
  ["옛날 밈", "사딸라", "791d1126-46a3-4ec2-8df7-df246ad18049.jpeg"],
  ["옛날 밈", "장충동 왕족발 보쌈", "2715a0be-21ec-4785-b65b-5e0b210b25fa.png"],
  ["옛날 밈", "날이 좋아서 날이 좋지 않아서 날이 적당해서", "a00f7417-3249-4bce-8e59-30f851c5fe23.jpeg"],
  ["옛날 밈", "제가 한 번 먹어보겠습니다", "24e54b08-2b53-4929-aa96-f5163269dd80.jpeg"],
  ["옛날 밈", "나비보벳따우", "c2df8705-5891-4437-80e4-b116c18b9ac7.jpeg"],
  ["옛날 밈", "스키비디 토일렛", "16e1b565-3e07-4d57-876e-4a9ff0ccd159.jpeg"],
  ["옛날 밈", "제로투", "dac7b7b5-91ba-45d4-a485-734092d3c5ae.jpeg"],
  ["옛날 밈", "뉴진스의 하입보이요", "395a4839-2b7b-4adb-ad22-aca60b2734b3.jpeg"],
  ["옛날 밈", "나락", "a5150452-a683-41d7-84a7-2308895564e8.jpeg"],
  ["옛날 밈", "갸루피스", "4915b5be-ea12-443b-a51a-5cc472ad7732.jpeg"],
  ["옛날 밈", "김치 싸대기", "1e13b9bc-620b-48e6-9d95-6d1a7840f593.jpeg"],
  ["옛날 밈", "치즈분수", "fa9f4b41-abf5-48ba-b260-77d011c18e15.jpeg"],
  ["옛날 밈", "당근을 흔들어주세요", "032478fe-4b05-4f48-9203-a99072a4b118.jpeg"],
  ["옛날 밈", "맑은 눈의 광인", "dd0e61bd-c1e4-41d6-9b10-a36052567aa5.jpeg"],
  ["옛날 밈", "슉 슈슉", "192e4f17-c480-4b30-bc49-2d97d4fb2827.jpeg"],
  ["옛날 밈", "슬릭백", "994d5787-e7d8-45ed-a206-9265c93ec15d.jpeg"],
  ["옛날 밈", "무빙맨", "fdbc902a-77c7-4663-a011-5a740a7f3609.jpeg"],
  ["옛날 밈", "알아들었으면 끄덕여", "6191f652-5231-40ec-ad70-4c10903f7335.jpeg"],
  ["옛날 밈", "부럽지가 않어", "2ccafab5-10b4-4170-972b-f1a9ad600651.jpeg"],
  ["옛날 밈", "아니 없어요 그냥", "1b0bbabf-93b9-483e-b72f-61eec1362b40.png", "아니 없어요"],
  ["옛날 밈", "장비를 정지합니다", "889fcfca-297a-47f3-ae01-7894a70d1987.jpeg"],
  ["옛날 밈", "새삥", "3b929145-f2a7-44db-a118-9119f206ba05.jpeg"],
  ["옛날 밈", "비둘기야 밥 먹자", "980fcea1-6a14-4085-bc03-bfd46a035d7a.jpeg"],
  ["옛날 밈", "나 예쁘잖아", "1e620a77-42cd-483d-a81c-0cf21488dd98.jpeg"],
  ["옛날 밈", "아직 한 발 남았다", "05d9436b-f478-45c7-84ab-4f4887cfc8c7.jpeg"],
  ["옛날 밈", "우리는 깐부잖아", "99aa843e-f376-48f1-8245-74edaf5e924a.jpeg"],
  ["옛날 밈", "간 때문이야", "1673f044-070f-4021-850f-c0f5cc06b0d0.jpeg"],
  ["옛날 밈", "멈춰", "50ae3647-d06e-42f2-ba5d-d1efc5ee8cd5.png"],
  ["옛날 밈", "얼음", "a192c9d9-7a27-42f3-8a69-bfff7fb7992a.jpeg"],
  ["옛날 밈", "실례가 안 된다면 아이스크림 하나만 사주십시오", "7082a67d-08e7-4fdf-b33f-555136318467.png"],
  ["옛날 밈", "라고 꾸짖기에는 너무나도 많은 돈이었다", "50a30b83-5c2d-4d09-8133-72b9b075fdd6.png"],
  ["옛날 밈", "빙칠링", "95f7e622-8331-4a37-b26d-e5aa929b3657.jpeg"],
  ["옛날 밈", "안녕하살법", "60f8d9a9-44c0-4f85-97dc-4c5705eaea1b.png"],
  ["옛날 밈", "파자마라도 달려와줘", "4f024911-031d-4662-a1d6-4fb8d88dbbc9.png"],
  ["옛날 밈", "강조되고 반복되는 소리는 강아지를 불안하게 해요", "6ae268d9-c1e5-4e69-af6c-2df110cc964b.png"],
  ["옛날 밈", "안아줘요", "197b4bd4-f46c-42ec-86d7-2be58191e18e.png"],
  ["옛날 밈", "필요한 만큼은 보여 줬다 이 이상은 보여주지 않는다", "e7adc56c-01cc-4a5f-abe1-b2ca82c57e4e.png"],
  ["옛날 밈", "정말 맛있어요 이렇게 맛있는 건 처음 먹어봐요", "e5126e1d-9f0e-4067-9e89-bd9413593586.png"],
  ["옛날 밈", "수상할 정도로 돈이 많은 퍼리", "5b2c39d8-03a2-4b09-a03a-b7d3bea24f54.png"],
  ["옛날 밈", "탈룰라", "28bdd49c-4e28-43e8-8d5d-834aead56be4.png"],
  ["옛날 밈", "토카토카 댄스", "9c6d5154-875c-421f-8056-19f9eca5c30a.jpeg"],
  ["옛날 밈", "고기가 이븐하게 익지 않았어요", "d72acebb-95fe-4f20-a72a-88c5e19e5676.png"],
  ["옛날 밈", "그의 손에 쥐어지는 합격 목걸이", "72d102c0-8647-4422-bc1d-91d82e6a0658"],
  ["옛날 밈", "이대로 가면 라이더", "d7dcd06c-6288-4acd-8bdf-fa2b0d573895"],
  ["옛날 밈", "돌리랑 도트가 제일 좋아", "d154cf3e-42fc-4c38-9491-0ef29246484f"],
  ["옛날 밈", "그런데 짜잔 절대 라는건 없군요", "412fedba-113b-453b-b55d-3e30e240abca"],
  ["옛날 밈", "봇치야 그게 무슨 소리니", "b621cbbd-75d6-48d2-904b-3f50ee413703"],
  ["옛날 밈", "이제 누가 공지해주냐", "93047fbf-3945-4fdb-8a37-6e567ddb2fdd"],
  ["2025 밈", "바라밤", "aa5a3dda-b970-4dca-b6cf-3edcb4acb6e9.png"],
  ["2025 밈", "이라이라", "0ae78327-ad6e-4085-8bed-6b0f6543b2a9.png"],
  ["2025 밈", "트랄랄레로 트랄랄라", "2ac3469e-7220-4100-ac40-be6cc9f7f4ac.webp"],
  ["2025 밈", "안녕하세요 누구입니다", "cc3c604b-43de-4d30-ab5b-63dbd5abacdf.jpeg"],
  ["2025 밈", "쉐이칸샹 쉐이칸샹", "d20e8417-1d70-4979-8ec0-55266eab9f1d.png"],
  ["2025 밈", "치킨 바나나", "dbc62878-69eb-4c3d-b951-06de38b41e66.png"],
  ["2025 밈", "깁미더머니", "6ac369b0-15d6-45d5-9cc5-24de30f2f914.png"],
  ["2025 밈", "짭플래쉬", "ad0750a5-4986-4a51-82ed-8e8c6c1fa701.png"],
  ["2025 밈", "부리부리댄스", "2c1b8887-7d90-4b0f-9772-4788b34794fe.png"],
  ["2025 밈", "미나사토 아리가또 카카카카와이", "9dd89010-fce5-4c86-8372-7f76ac2ff9d6.png"],
  ["2025 밈", "도우인 챌린지", "7a03be62-7ad1-4746-bb48-e8bbc52f2e0b.png"],
  ["2025 밈", "부기다운", "1974ae8a-2d73-4e36-b318-9ccf5e659258.png"],
  ["2025 밈", "돈두댓제이미", "f52897e6-dce1-44a3-a0ea-8c0581ee2017.png"],
  ["2026 밈", "너임마청년", "fcabad53-3a5f-456f-bf35-6d2835e8830a.png"],
  ["2026 밈", "쌍디 무하자야", "v2/3371478980/2b485f3d-6dd1-4f12-b904-5ff18f6de562.png"],
  ["2026 밈", "쨍그랑", "v2/3371478980/893ae7bb-7dab-4e43-a3ff-09c75222cd87.png"],
  ["2026 밈", "두바이 쫀득 쿠키", "v2/3371478980/52f8b7b7-1ce4-4516-b2d8-dc130ecdfb03.png", "두쫀쿠"],
  ["2026 밈", "스피키", "v2/3371478980/2385018b-a7e7-4a7e-8071-00c5c1b60aed.png"],
  ["2026 밈", "소주과일 석류과일", "v2/3371478980/ca755443-91e5-443e-8f31-be30c63bebbb.jpg"],
  ["2026 밈", "강남 옵 헤이", "v2/3371478980/8c84b81c-cc50-472a-be88-94a5c8e636f3.png"],
  ["2026 밈", "코르티스", "v2/3371478980/814fcc3d-c8be-4df4-b25a-f1ec2f53d7ea.png"],
  ["2026 밈", "왁뿌볼", "v2/3371478980/66b075c8-188d-4541-bb49-5d71782860ef.png"],
  ["2026 밈", "간바레", "v2/3371478980/c2d0f92c-43a2-4ca0-96cf-5649ae280aa2.png"],
  ["2026 밈", "캐치캐치", "v2/3371478980/d71cb319-fb81-4610-af2c-58a3ef1fae77.png"],
  ["2026 밈", "꼬마 선장", "v2/3371478980/c8136aa3-3b36-4089-af96-115aecc9f047.png"],
  ["2026 밈", "봄동비빔밥", "v2/3371478980/3a567909-ced4-41ff-8a97-73e38dfa80a9.png"],
  ["2026 밈", "오디세이", "v2/3371478980/d674955d-500c-4f7b-bb79-e66c857c7975.png"],
  ["2026 밈", "뉴라이", "v2/3371478980/3c55f901-7bf7-43ea-8d45-5fe4400ceaa8.png"],
  ["2026 밈", "참교육", "v2/3371478980/413fa891-dd22-4beb-9d4e-24f4a577ee34.png"],
  ["2026 밈", "붐샤카라카", "v2/3371478980/b8e9f192-2137-4175-bcaf-c609441ad0d8.png"],
  ["2026 밈", "메챠 카멜레온", "v2/3371478980/90156fde-357a-4e7a-8e93-71a4f692a506.jpg"],
].map(([genre, word, path, ...aliases]) => ({ key: `meme:${word}`, genre, word, question: MEME_QUESTION, image: MEME_IMAGE_BASE + path, aliases }));

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
