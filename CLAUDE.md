# 한국어 with Youjin — 앱 모음

한국어를 배우는 사람을 위한 작은 앱들이 **이 저장소 하나**에 모여 있습니다.
저장소 `tutoryoujin/tutoryoujin.github.io` → https://tutoryoujin.github.io/

| 주소 | 폴더 |
| --- | --- |
| `/` | `apps/index.html` — 앱 목록 |
| `/<slug>/` | `apps/<slug>/` — 앱 하나 |

**slug 는 학생들에게 나간 주소입니다. 바꾸지 마세요.**

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
  site.ts            사이트 설정 — 분석(provider · id) · Kit 구독 폼 id · 상품 배열 · 구독/상품 문구. 비우면 그 기능은 꺼진다
  analytics.ts       쿠키 없는 분석 스크립트(GoatCounter · Plausible · Umami) + track()
  seo.ts             <title> · description · OG · Twitter · favicon 메타, sitemap.xml · robots.txt (vite.config.ts 가 넣는다)
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
public/              그대로 복사되는 파일. 앱 그림은 public/<slug>/…
```

### 공통 컴포넌트 (`@yj/ui`)

| 이름 | 하는 일 |
| --- | --- |
| `mount(<App/>)` | 그리기 + 이응 그림 정의 |
| `<Page app="slug" legal={…}>` | 헤더 · 메뉴 · 꼬리말. 이름·꼬리말은 `apps.ts` 에서 |
| `Tabs` · `useHashTab` | 탭. 주소 `#key` 로 바로 열린다 |
| `Box` · `Btn` · `ListenBtn` | 상자, 큰 버튼, 🔊 들어 보기 |
| `Seg` · `Segments` | 문장을 뜻마다 색 알약으로 쪼개기 |
| `Note` | ✨ 알아 두기 (ko · en · ex) |
| `Quiz` | 보기 넷 퀴즈 — 채점 · 오답 이유 · 결과 · 다시 보기 |
| `Ieung` | 움직이는 입체 이응 (표정 12종) |
| `speak()` | 한국어 TTS |
| `Subscribe` | 이메일 구독 폼 (Kit). `site.ts` 에 폼 id 가 없으면 안 그린다 |
| `Products` | 상품 목록. `site.ts` 의 `products` 가 비면 안 그린다 |
| `track()` | 분석 이벤트 (`deck-complete` · `subscribe` · `product-click`). 분석이 꺼져 있으면 아무 일도 안 한다 |
| `cn()` | 클래스 합치기 (tailwind-merge). 뒤의 것이 이긴다 |
| `Footer` · `mainClass` · `boxClass` | 겉 부품을 컴포넌트 없이 쓸 때 |

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

- **한국어 카드** — 덱은 `apps/korean-cards/decks/*.ts`, 새 덱은 `decks/index.ts` 에 한 줄. 그림은 `public/korean-cards/img/<덱>/<카드>.webp`.
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

## 사이트 설정 · SEO

- index.html 에 `<title>` · description · og 를 적지 마세요. `vite.config.ts` 가 `shared/seo.ts` 로 넣습니다.
  공유 그림이 있으면 `apps.ts` 의 `og` 에 (1200×630, `public/` 경로).
- 분석 · 구독 · 상품은 `shared/site.ts` 값만 바꿉니다. 꺼졌을 때 아무것도 안 나오는지는 `shared/site.test.ts` 가 봅니다.
- 수업 · 튜터링 · 예약 · 외부 결제 안내는 넣지 않습니다. 기능을 `?ref` 나 localStorage 로 숨기지 않습니다.

## 작업 규칙

- 기본 브랜치면 브랜치를 먼저 땁니다.
- 읽기 규칙(숫자, 조사, 시각 …)을 고치면 테스트를 같이 고칩니다. 틀린 읽기는 학생이 그대로 외웁니다.
- 줄끝은 LF.
