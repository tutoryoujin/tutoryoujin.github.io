# 전체 점검 — A. 잘못된 것

2026-11-12 점검. 검사 4종(테스트 373개 · 타입 · 클래스 · 빌드)은 통과한 상태에서 찾은 것.

| # | 무엇 | 어디 | 이슈 |
|---|---|---|---|
| A1 | 카드 앱이 `document.title` 을 「한국어 카드 with Youjin」으로 덮어씀. 빌드가 넣은 검색 제목(`Korean Vocabulary Flashcards \| …`)이 사라짐 | `apps/korean-cards/App.tsx:63` | [#51](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/51) |
| A2 | 홈 공유 그림에 앱 4개뿐 (한국어 이름 없음). 스크립트가 `APPS[:4]` 고정이라 다시 돌리면 시계가 빠짐. alt 문구도 「네 가지 앱」, 홈 description 에도 이름 앱 없음 | `tools/home/build_og.py`, `shared/seo.ts:26` | [#46](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/46) ([댓글](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/46#issuecomment-6816546649)) |
| A3 | `npm run new` 직후 `npm test` 실패. `notes.ts` 항목을 안 만들고 안내도 없음 | `scripts/new-app.mjs:96` | [#52](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/52) |
| A4 | 덱에 카드를 나중에 더하면 기존 학생에게 새 카드가 안 나오고 「외움」으로 계산됨. `validState` 가 지워진 카드만 봄 | `apps/korean-cards/store.ts:78` | [#53](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/53) |
| A5 | `theme.css` 에 `--shadow-card: var(--shadow-card)` 자기 참조가 빌드 결과에 그대로 나감. 지금은 `tokens.css` 가 레이어 밖이라 이겨서 동작. 순서 바뀌면 그림자 사라짐 | `scripts/build-tokens.mjs:146` | [#54](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/54) |
| A6 | `useHashTab` 이 탭 바꿀 때 `?query` 를 지움 (`location.pathname` 만 씀) | `shared/ui/parts.tsx:126` | [#55](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/55) |
| A7 | 달력 퀴즈 섞기가 `sort(() => Math.random() - 0.5)` (치우침). 퀴즈 길이 10 이 `QUIZ_LEN` 과 `Quiz` 기본값 두 곳에 따로 | `apps/calendar-practice/App.tsx:297` | [#56](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/56) |
| A8 | 달력 `TODAY` 가 모듈 로드 때 고정. 자정 넘기면 「오늘」이 어제 | `apps/calendar-practice/App.tsx:27` | [#56](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/56) |
| A9 | 공휴일 표에 제헌절(7/17) 없음. 2026년부터 공휴일 재지정으로 기억하나 **확인 못 함** | `apps/calendar-practice/reading.ts:26` | [#56](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/56) |
| A10 | CLAUDE.md: 제목 오타 「(`@yj/ui`)제」, Python 경로 `.venv/Scripts/pip install Pillow svglib` (스크립트는 `.venv/bin/pip install Pillow`, svglib 안 씀) | `CLAUDE.md:127` | [#61](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/61) |
| A11 | `npm run names` 가 `vite-node` 를 쓰는데 `devDependencies` 에 없음 (vitest 딸려 온 것에 기댐) | `package.json:15` | [#61](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/61) |
| A12 | `tools/hangul-name/build.ts` 는 타입 검사 안 받음 (`tsconfig` include 밖) | `tsconfig.json:17` | [#61](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/61) |

## 이슈별로 보기

| 이슈 | 내용 | 라벨 | 항목 |
|---|---|---|---|
| [#51](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/51) | 카드: `document.title` 이 검색 제목 덮어씀 | High | A1 |
| [#46](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/46) | 홈 공유 그림 다시 만들기 (범위 댓글 추가) | — | A2 |
| [#52](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/52) | 새 앱 스크립트: `notes.ts` 항목 없어 테스트 깨짐 | Middle | A3 |
| [#53](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/53) | 카드: 덱에 카드 더하면 기존 학생에게 안 나옴 | Middle | A4 |
| [#54](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/54) | 토큰: 그림자 자기 참조 | Low | A5 |
| [#55](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/55) | `useHashTab`: query 지움 · 리스너 재등록 | Low | A6 |
| [#56](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/56) | 달력: 섞기 · 퀴즈 길이 · 자정 · 공휴일 확인 | Middle | A7 · A8 · A9 |
| [#61](https://github.com/tutoryoujin/tutoryoujin.github.io/issues/61) | 저장소 청소: CLAUDE.md · 개발 설정 | Low | A10 · A11 · A12 |
