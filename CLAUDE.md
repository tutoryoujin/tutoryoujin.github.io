# 한국어 with Youjin — 앱 모음

한국어를 배우는 사람 (한국어가 모국어가 아닌 사람 대상)을 위한 작은 앱들이 **이 저장소 하나**에 모여 있습니다.
저장소 `tutoryoujin/tutoryoujin.github.io` → https://tutoryoujin.github.io/

| 주소       | 폴더                        |
| ---------- | --------------------------- |
| `/`        | `apps/index.html` — 앱 목록 |
| `/<slug>/` | `apps/<slug>/` — 앱 하나    |

**slug 는 학생들에게 나간 주소입니다. 바꾸지 마세요.**

## 작업 전에 — 이슈부터 (반드시)

**작업 지시를 받으면 파일을 열거나 코드를 고치기 전에 GitHub 이슈부터 확인합니다.** 작은 수정·문구 한 줄도 예외 없습니다.
질문에 답하거나 상태를 조회만 할 때는 이슈를 만들지 않아도 됩니다.

1. `gh issue list --state all --search "<요청 키워드>"` 로 닫힌 이슈까지 찾고, 고정된 **로드맵 이슈**(#17)에서 지금 단계를 확인합니다.
2. **맞는 이슈가 있으면** `gh issue view <번호>` 로 본문(지켜야 할 것 · 완료 기준 · 시작 조건)을 읽고, 그 내용을 기준으로 시작합니다.
   - 시작 전에 「#번호 기준으로 작업합니다」라고 사용자에게 알립니다.
   - 시작 조건이 아직 안 됐거나, 요청이 이슈 본문과 다르면 작업 전에 사용자에게 묻습니다.
   - 닫힌 이슈와 같은 일이면 다시 열지, 새로 만들지 사용자에게 묻습니다.
3. **맞는 이슈가 없으면** 이슈를 먼저 만들고(할 일 · 지켜야 할 것 · 완료 기준), 번호를 사용자에게 알린 뒤 작업합니다.
4. 작업하면서 범위가 바뀌면 이슈 본문도 고칩니다. 작업 중 나온 「나중에 할 일」은 새 이슈로 남깁니다.
5. 브랜치 이름에 이슈 번호를 넣습니다 — `<종류>/<이슈번호>-<짧은-설명>` (아래 「작업 규칙」).
6. 커밋 메시지에 `Closes #<번호>` 를 적어 main 에 올라가면 닫히게 하고, 로드맵 이슈의 체크도 갱신합니다.
7. 저장소는 공개입니다. 이슈 본문·댓글에 개인 연락처나 외부 플랫폼 약관 분석 같은 민감한 내용을 적지 않습니다.

## 기술 스택

React 18 · TypeScript · Vite 5 (여러 페이지 빌드) · Tailwind CSS 4 · Vitest. 서버 없음 — GitHub Pages 정적 배포.

```
npm install
npm run dev          # http://localhost:5173/<slug>/
npm test             # 한국어 읽기 규칙 테스트
npm run typecheck
npm run check:classes  # 테마에 없는 유틸리티(text-sm, bg-white …) 찾기
npm run build        # dist/
npm run new -- <slug> "<한국어 이름>" "<English name>" <emoji>
```

main 에 올라가면 `.github/workflows/deploy.yml` 이 검사 → 빌드 → 배포합니다. 검사가 하나라도 실패하면 배포하지 않아요.

## 구조

```
shared/
  apps.ts            앱 목록 — 메뉴 · 첫 화면 · 꼬리말 · 검색/공유 메타(description · og)가 모두 여기서 나온다
                     category(분류) · tone(카드 색) · access(free·member) · added(새로 나온 앱 순서)
  recent.ts          이 기기에서 마지막으로 연 앱(yj:last-app — 바꾸지 않는다). <Page> 가 기록, 첫 화면 「이어서 하기」가 읽는다
  site.ts            사이트 설정 — 분석(provider · id) · Kit 구독 폼 id · 상품 배열 · 구독/상품 문구. 비우면 그 기능은 꺼진다
  analytics.ts       쿠키 없는 분석 스크립트(GoatCounter · Plausible · Umami) + track()
  seo.ts             <title> · description · OG · Twitter · favicon 메타, JSON-LD, #root 정적 본문, sitemap.xml · robots.txt · llms.txt (vite.config.ts 가 넣는다)
  subscribe.ts       Kit 폼으로 이메일 보내기
  tokens/            tokens.json(원본) → tokens.css · theme.css · theme.ts (생성물, npm run tokens)
  ui/                공통 컴포넌트 — import { … } from "@yj/ui"
    styles.css       Tailwind 입구 (preflight · 토큰 · 테마 · 이응 키프레임)
  korean/            숫자 읽기(sino · native · nativeCounter · josa) · 한글 합치기(hangul.ts) + 테스트
apps/
  index.html, home.tsx
  <slug>/            index.html · main.tsx · App.tsx · <slug>.css (별칭 · 키프레임만)
scripts/             build-tokens.mjs · new-app.mjs · check-classes.mjs
tools/<slug>/        앱 전용 Python 도구 (카드 그림 · 공유 이미지)
tools/home/          홈 공유 그림 build_og.py — 토큰 · 이응 · apps.ts 를 그대로 읽어 브라우저로 찍는다
                     앱 썸네일 build_shots.py — public/home/<slug>.webp (새 앱을 더하면 한 번 돌린다)
public/              그대로 복사되는 파일. 앱 그림은 public/<slug>/…
```

### 공통 컴포넌트 (`@yj/ui`)제

| 이름                                | 하는 일                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `mount(<App/>)`                     | 그리기 + 이응 그림 정의                                                                             |
| `<Page app="slug" legal={…}>`       | 헤더 · 메뉴 · 꼬리말. 이름·꼬리말은 `apps.ts` 에서                                                  |
| `Tabs` · `useHashTab`               | 탭. 주소 `#key` 로 바로 열린다                                                                      |
| `Box` · `Btn` · `ListenBtn`         | 상자, 큰 버튼, 🔊 들어 보기                                                                         |
| `Seg` · `Segments`                  | 문장을 뜻마다 색 알약으로 쪼개기                                                                    |
| `Note`                              | ✨ 알아 두기 (ko · en · ex)                                                                         |
| `Quiz`                              | 보기 넷 퀴즈 — 채점 · 오답 이유 · 결과 · 다시 보기                                                  |
| `Ieung`                             | 움직이는 입체 이응 (표정 12종)                                                                      |
| `speak()`                           | 한국어 TTS                                                                                          |
| `Subscribe`                         | 이메일 구독 폼 (Kit). `site.ts` 에 폼 id 가 없으면 안 그린다                                        |
| `Products`                          | 상품 목록. `site.ts` 의 `products` 가 비면 안 그린다                                                |
| `track()`                           | 분석 이벤트 (`deck-complete` · `subscribe` · `product-click`). 분석이 꺼져 있으면 아무 일도 안 한다 |
| `cn()`                              | 클래스 합치기 (tailwind-merge). 뒤의 것이 이긴다                                                    |
| `Footer` · `mainClass` · `boxClass` | 겉 부품을 컴포넌트 없이 쓸 때                                                                       |

**앱 두 개에 같은 코드가 생기면 `shared/` 로 올리세요.** 그게 이 구조의 이유입니다.

## 디자인 시스템 — 화면에 보이는 것을 만들기 전에 읽을 것

**https://claude.ai/artifact/CEpgfyaaxJuP8MysgFHWbH**

Artifact 툴 `read` 로 `project/README.md` 를 먼저. 토큰은 `project/tokens.json`, 컴포넌트는 `project/components/<이름>/README.md`.
토큰을 바꾸면 `shared/tokens/tokens.json` 을 교체하고 `npm run tokens`.

### Tailwind

스타일은 JSX 의 `className` 에 유틸리티로 적습니다. 앱 CSS 에는 색 별칭과 `@keyframes` 처럼 유틸리티로 못 쓰는 것만.

- **테마는 `theme.css` 하나** (tokens.json 생성물). Tailwind 기본 팔레트 · 글자 크기 · 모서리 · 그림자 · 화면 폭은 지웠습니다.
  `bg-white` `text-sm` `rounded-2xl` `md:` 은 **조용히 아무것도 안 만듭니다** — `npm run check:classes` 가 잡아요 (CI 도).
- 색 `bg-surface text-muted border-line` · 쌍 `bg-mint-bg text-mint-ink` · 글꼴 `font-display` · 글자 `text-label`(크기+줄높이+굵기)
  · 모서리 `rounded-sm/md/lg/xl/full` · 그림자 `shadow-card` · 화면 폭 `sm:`(600px) 하나. 나머지는 `text-[1.2rem]` `rounded-[16px]` `min-[440px]:`.
- 간격은 Tailwind 기본 4px 단위 (`p-4` = 16px).
- 앱 별칭은 `bg-(--clk-hour-bg) text-(--clk-hour-ink)` 로 씁니다.
- 공통 컴포넌트를 앱에서 고칠 땐 CSS 로 덮지 말고 `className` (예: `<Btn className="mt-0">`). `cn()` 이 겹치는 유틸리티를 정리합니다.
- 앱 CSS 는 레이어 밖이라 유틸리티를 이깁니다. 같은 요소의 같은 속성을 두 곳에서 정하지 마세요.

### 매번 틀리는 것들

- **색을 새로 만들지 마세요.** 악센트 8쌍(`blue` `pink` `yellow` `mint` `lavender` `coral` `orange` `gray`) 안에서 고르고, 뜻 이름은 앱 CSS 의 `:root` 에 `var()` 별칭으로 (`--clk-hour-bg: var(--orange-bg)`). 별칭 쪽에 hex 금지.
- **`-bg` 와 `-ink` 는 쌍입니다.** `Seg`·`Note` 는 `tone="orange"` 처럼 이름만 받아 쌍으로 칠합니다.
- **색만으로 구분하지 마세요.** 파스텔 8색은 명도가 거의 같습니다. 항상 글자를 같이 둡니다.
- **다크 모드 세 상태**는 `tokens.css` 가 처리합니다. 앱 CSS 에서 `@media (prefers-color-scheme)` 안에만 색을 정의하지 마세요.
  처음엔 기기 설정을 따르고, 헤더의 해/달 토글을 누르면 밝게↔어둡게로 바뀌어 `<html data-theme>` + `localStorage["yj:theme"]` 에 남습니다 (`shared/ui/theme.ts`).
  첫 그림 전 적용은 `vite.config.ts` 가 모든 index.html 에 넣는 스크립트가 합니다. 색은 토큰이 바뀌니 `dark:` 는 토큰이 없는 것(그림자 세기 등)에만.
- **한국어가 먼저, 영어는 바로 아래 더 작게 `muted`.** 외국인 학습자용이라 설명·피드백에 영어가 빠지면 안 됩니다. 컴포넌트가 `ko` / `en` 을 따로 받는 이유입니다. 해요체. 한자 쓰지 않음.
- 꼬리말은 `<하는 일>, 매일 조금씩.` — "매일 조금씩" 은 바꾸지 않습니다.
- 누를 수 있는 것은 최소 44px.

## 앱별 메모

- **한국어 카드** — 덱은 `apps/korean-cards/decks/*.ts`, 새 덱은 `decks/index.ts` 에 한 줄.
  덱은 `loadDeck(id)` 로만 받습니다 (무료 = 번들, 유료 = 나중에 서버 #12). 유료 덱은 `decks/paid.ts` 에 **겉면만** — 카드 내용을 저장소에 넣지 마세요.
  판매 링크(`shared/site.ts` products 의 같은 id)가 있어야 홈 더미에 🔒 카드로 보입니다. 기기 기록 꺼내기는 `exportProgress()` (#13 동기화용). 그림은 `public/korean-cards/img/<덱>/<카드>.webp`.
  그림·출처는 `tools/korean-cards/images.json` 에 적고 `build_images.py` 를 돌린다 (출처 화면 데이터 `credits-data.json` 도 같이 생성 — 직접 고치지 말 것). 공유 이미지는 `build_og.py`.
  Python 은 `python -m venv .venv` 후 `.venv/Scripts/pip install Pillow svglib`. 진행 저장 열쇠 `kcards:*` 는 바꾸지 않는다 — 학생들 기록이 날아간다.
- **한국어 달력** — 공휴일은 양력 고정만. 6월·10월(유월·시월)은 퀴즈에 꼭 한 번씩 나온다.
- **한국어 시계** — 시 = orange(고유어), 분 = lavender(한자어) 별칭.
- **한국어 블록** — 설명은 교재(Hangul Basics CV01~03)를 따른다: 세로 모음 → 오른쪽, 가로 모음 → 아래.
  교재의 「n번 모양」 번호는 화면에 쓰지 않는다 — 교재를 모르는 학생에겐 뜻이 없다.
  자모 그림은 `apps/hangul-blocks/glyphs.ts` (5×5, 디자인 캔버스 https://claude.ai/artifact/VzXxCndiskddCmd7twN573 와 같은 데이터).
  「획 하나 더」는 교재의 쌍만 — 자음(바람 한 번) ㄱ→ㅋ · ㄷ→ㅌ · ㅂ→ㅍ · ㅈ→ㅊ,
  모음(앞에 y 소리) ㅏ→ㅑ · ㅓ→ㅕ · ㅗ→ㅛ · ㅜ→ㅠ · ㅐ→ㅒ · ㅔ→ㅖ.
  겹받침(교재 밖)은 만들기에서만 — 받침 뒤에 짝이 되는 자음(+ 표시)을 누르면 합쳐지고, 빼면 뒤 자음만 빠진다.
  두 자음은 맨 아래에 나란히. 읽기는 `shared/korean/hangul.ts` 의 `readJong`: 앞을 읽고, ㄺ · ㄻ · ㄿ 은 뒤, 밟[밥]은 예외.
  만든 글자 아래 영어 뜻은 받침 있는 글자만 (`apps/hangul-blocks/words.ts`, 동사 줄기는 넣지 않는다).
  색 별칭: 첫 자음 = blue, 모음 = pink, 받침 = mint, 더한 칸 = yellow.

- **한국어 이름** — 이름 데이터 `apps/hangul-name/names.json` 은 생성물. `tools/hangul-name/overrides.json`(용례)을 고치고 `npm run names`.
  도장: 표준(overrides) · 흔한 표기 · 규칙 표기(발음 사전 + 표기법) · 추측(철자) · 직접 고침.
  추측 안내 「double-check with Youjin」은 주인이 정한 예외 — 아래 「수업 안내 금지」로 되돌리지 않는다.
  고친 표기는 `hn:fixes`, 다른 기기로는 링크 `?name=Anne&ko=안`. 저장 열쇠는 `hn:*` 만.

## 사이트 설정 · SEO

- index.html 에 `<title>` · description · og 를 적지 마세요. `vite.config.ts` 가 `shared/seo.ts` 로 넣습니다.
  공유 그림이 있으면 `apps.ts` 의 `og` 에 (1200×630, `public/` 경로). 홈 그림은 `public/og.png` ← `tools/home/build_og.py`
  (`.venv/bin/pip install playwright==1.49.1 && .venv/bin/playwright install chromium`). 토큰·앱 목록이 바뀌면 다시 돌린다.
- 검색 제목·설명·배우는 것은 `apps.ts` 의 `searchTitle` · `description`(영어 먼저 + 한국어) · `learn`. 학습자는 영어로 검색해서 메타만 영어가 앞입니다 — 화면은 그대로 한국어 먼저.
  `learn` 에는 앱에 실제로 있는 것만. 구조화 데이터에 평점·리뷰처럼 없는 데이터를 넣지 마세요.
- 빌드 때 각 페이지 `#root` 안에 정적 본문(h1 · 배우는 것 · 앱 링크)이 들어갑니다. 자바스크립트를 안 돌리는 AI 크롤러용이고 React 가 뜨면 덮습니다.
  그래서 index.html 의 `<div id="root"></div>` 를 바꾸지 마세요 (없으면 빌드가 멈춥니다). 크롤러에만 보이는 말을 넣지 마세요.
- 검색엔진 소유 확인 코드는 `site.ts` 의 `verify` (Google Search Console · 네이버 서치어드바이저).
- 분석 · 구독 · 상품은 `shared/site.ts` 값만 바꿉니다. 꺼졌을 때 아무것도 안 나오는지는 `shared/site.test.ts` 가 봅니다.
- 수업 · 튜터링 · 예약 · 외부 결제 안내는 넣지 않습니다. 기능을 `?ref` 나 localStorage 로 숨기지 않습니다.

## 작업 규칙

- 기본 브랜치면 브랜치를 먼저 땁니다. **브랜치 이름에는 이슈 번호를 꼭 넣습니다**: `<종류>/<이슈번호>-<짧은-설명>`
  (예: `feat/23-cafe-deck` · `fix/41-clock-label` · `docs/38-branch-issue-number`). 종류는 `feat` · `fix` · `docs` · `chore`.
  이슈 없이 브랜치를 만들지 않습니다. 이미 만든 브랜치 이름은 바꾸지 않습니다.
- 읽기 규칙(숫자, 조사, 시각 …)을 고치면 테스트를 같이 고칩니다. 틀린 읽기는 학생이 그대로 외웁니다.
- 줄끝은 LF.
