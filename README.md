# 치지직 채팅 퀴즈

스트리머 화면에 초성/그림을 띄우고, 시청자 채팅 단어로 채점한다.  
정적 페이지(GitHub Pages) + Cloudflare Worker(로그인·채팅 토큰).

한 페이지에서 방송 영역(위)과 조작(아래)을 같이 쓴다.  
OBS에는 위쪽 방송 영역만 크롭해서 넣으면 된다.

## 로컬

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

- 기본: http://127.0.0.1:4173/  
- 개발(가짜 채팅·남 채널): http://127.0.0.1:4173/?dev=1  

## 테스트

```bash
npm test
```

## Worker

로그인은 브라우저만으로 안 된다. Cloudflare Worker가 Client Secret으로 토큰을 교환한다.

1. [치지직 개발자 센터](https://developers.chzzk.naver.com/)에서 앱 생성  
2. **로그인 리디렉션 URL**  
   `https://chzzk-chat-quiz.web404dev.workers.dev/auth/callback`  
   (Worker 주소가 바뀌면 그에 맞게 수정)  
3. `worker/` 에서:

```bash
npx wrangler login
npx wrangler secret put CHZZK_CLIENT_ID
npx wrangler secret put CHZZK_CLIENT_SECRET
npx wrangler deploy
```

프론트의 Worker 주소는 `app.js`의 `WORKER_BASE`에 고정되어 있다.  
비밀값은 레포에 넣지 말고 `wrangler secret`만 쓴다.

## GitHub Pages (공개)

1. 이 폴더를 GitHub 레포에 올린다.  
2. Settings → Pages → Branch `main` / 저장소 루트.  
3. 배포 URL로 접속해 로그인·퀴즈를 진행한다.

## 문장 출처

뒤죽박죽 문장의 속담은 [위키낱말사전 분류:한국어 속담](https://ko.wiktionary.org/wiki/분류:한국어_속담)(CC BY-SA 4.0), 명언과 한국 영화 대사는 [위키인용집](https://ko.wikiquote.org/)(CC BY-SA 4.0)에서(코드에 적힌 한국 영화 명대사 12개도 함께 쓴다), 애니·드라마 명대사와 한국 영화 유명 대사는 `sentence-bank.js` 의 유명 대사 목록(`CURATED_LINES`, 영화는 같은 영화 2개까지)에서, 말한 사람 사진은 한국어 위키백과 대표 그림(위키미디어 공용)에서, 없으면 그 위키인용집 문서에 연결된 위키데이터 사진에서 받는다. 문장은 3어절 이상, 섞이는 글자(띄어쓰기·문장부호 빼고) 20자 이하만 쓴다. 명언은 말한 사람의 위키인용집 분류 이름으로 연예·음악·스포츠·과학·역사·정치·철학·종교·문학·예술·그 밖 7종류로 나눈다(`sentence-bank.js` 의 `QUOTE_KINDS`, 위쪽 종류가 먼저). 애니 명대사 목록에는 마추기(machugi.io) 「애니 명대사」 퀴즈의 문제 그림을, 영화·드라마 목록에는 「드라마 & 영화 속 명대사 보고 맞추기」 퀴즈의 문제 그림을 읽어 옮긴 대사도 있다(한 번 옮긴 것, 자동 갱신 아님). 갱신은 관리 화면 '문장' 또는 20일 스케줄. 빼고 싶은 문장은 `sentence-exclude.json` 에 적고 다시 갱신한다. 속담·명대사 결과 그림이 안 맞으면 같은 파일의 `images` 에 그 문장을 적고 다시 갱신한다. 다른 그림을 찾아 바꾸고, 버린 그림 주소는 `rejectedImages` 에 남아 다시 쓰지 않는다(`images` 는 갱신하면 비워짐).

## 설계 메모

상세 규칙은 `2026-09-12-chzzk-chat-quiz-design.md` 참고.
