# 한국어 with Youjin — 앱 모음

한국어를 배우는 사람을 위한 작은 앱들이 **이 저장소 하나**에 모여 있습니다.
저장소 `tutoryoujin/tutoryoujin.github.io` → https://tutoryoujin.github.io/

| 주소 | 폴더 |
| --- | --- |
| `/` | `apps/index.html` — 앱 목록 |
| `/<slug>/` | `apps/<slug>/` — 앱 하나 |

**slug 는 학생들에게 나간 주소입니다. 바꾸지 마세요.**

## 기술 스택

React 18 · TypeScript · Vite 5 (여러 페이지 빌드) · Vitest. 서버 없음 — GitHub Pages 정적 배포.

```
npm install
npm run dev          # http://localhost:5173/<slug>/
npm test             # 한국어 읽기 규칙 테스트
npm run typecheck
npm run build        # dist/
npm run new -- <slug> "<한국어 이름>" "<English name>" <emoji>
```

main 에 올라가면 `.github/workflows/deploy.yml` 이 검사 → 빌드 → 배포합니다. 검사가 하나라도 실패하면 배포하지 않아요.

## 구조

```
shared/
  apps.ts            앱 목록 — 메뉴 · 첫 화면 · 꼬리말이 모두 여기서 나온다
  tokens/            tokens.json(원본) → tokens.css(생성물, npm run tokens)
  ui/                공통 컴포넌트 — import { … } from "@yj/ui"
  korean/            숫자 읽기(sino · native · nativeCounter · josa) + 테스트
apps/
  index.html, home.tsx
  <slug>/            index.html · main.tsx · App.tsx · <slug>.css
scripts/             build-tokens.mjs · new-app.mjs
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

**앱 두 개에 같은 코드가 생기면 `shared/` 로 올리세요.** 그게 이 구조의 이유입니다.

## 디자인 시스템 — 화면에 보이는 것을 만들기 전에 읽을 것

**https://claude.ai/artifact/CEpgfyaaxJuP8MysgFHWbH**

Artifact 툴 `read` 로 `project/README.md` 를 먼저. 토큰은 `project/tokens.json`, 컴포넌트는 `project/components/<이름>/README.md`.
토큰을 바꾸면 `shared/tokens/tokens.json` 을 교체하고 `npm run tokens`.

### 매번 틀리는 것들

- **색을 새로 만들지 마세요.** 악센트 8쌍(`blue` `pink` `yellow` `mint` `lavender` `coral` `orange` `gray`) 안에서 고르고, 뜻 이름은 앱 CSS 의 `:root` 에 `var()` 별칭으로 (`--clk-hour-bg: var(--orange-bg)`). 별칭 쪽에 hex 금지.
- **`-bg` 와 `-ink` 는 쌍입니다.** `Seg`·`Note` 는 `tone="orange"` 처럼 이름만 받아 쌍으로 칠합니다.
- **색만으로 구분하지 마세요.** 파스텔 8색은 명도가 거의 같습니다. 항상 글자를 같이 둡니다.
- **다크 모드 세 상태**는 `tokens.css` 가 처리합니다. 앱 CSS 에서 `@media (prefers-color-scheme)` 안에만 색을 정의하지 마세요.
- **한국어가 먼저, 영어는 바로 아래 더 작게 `muted`.** 외국인 학습자용이라 설명·피드백에 영어가 빠지면 안 됩니다. 컴포넌트가 `ko` / `en` 을 따로 받는 이유입니다. 해요체. 한자 쓰지 않음.
- 꼬리말은 `<하는 일>, 매일 조금씩.` — "매일 조금씩" 은 바꾸지 않습니다.
- 누를 수 있는 것은 최소 44px.

## 작업 규칙

- 기본 브랜치면 브랜치를 먼저 땁니다.
- 읽기 규칙(숫자, 조사, 시각 …)을 고치면 테스트를 같이 고칩니다. 틀린 읽기는 학생이 그대로 외웁니다.
- 줄끝은 LF.
