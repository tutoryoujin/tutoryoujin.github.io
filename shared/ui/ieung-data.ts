// 이응 그림 데이터 — 레트로 이응이 (리브랜딩).
// 그림은 유진 님이 준 레트로 이응이 표정 원본(표정마다 한 장, 투명 배경) — public/mascot/<표정>.webp (앱 /ieung/ 과 겹치지 않게 mascot).
// 다시 그리지 않는다 — 시트의 이응이가 곧 이응이다. 새 표정은 시트에 그려서 잘라 넣는다.
// 몸 전체 움직임(숨쉬기 · 점프 · 기울기)은 shared/ui/ieung.css 의 mv-move · mv-breathe 에 그대로 걸린다.

/** 받은 표정 10 */
export const ART = [
  "neutral", "laughing", "excited", "winking", "surprised", "bashful",
  "curious", "thinking", "sleepy", "proud",
] as const;
export type Art = (typeof ART)[number];

export const MOODS = ["basic","yay","sparkle","wow","wink","focus","sleepy","huh","proud","moved","love","tongue"] as const;
export type Mood = (typeof MOODS)[number];

/** 앱이 부르는 mood → 시트의 표정. mood 이름은 앱 코드 곳곳에 있어서 그대로 둔다 */
export const MOOD_ART: Record<Mood, Art> = {
  basic: "neutral",
  yay: "laughing",
  sparkle: "excited",
  wow: "surprised",
  wink: "winking",
  focus: "thinking",
  sleepy: "sleepy",
  huh: "curious",
  proud: "proud",
  moved: "bashful", // 감동 — 두 손 모은 수줍은 얼굴
  love: "bashful",
  tongue: "winking", // 메롱 — 혀 내민 윙크
};

export const artSrc = (a: Art) => `/mascot/${a}.webp`;

/** 문서에 한 번만 두는 defs — 작은 자리(헤더 · 꼬리말)용 마크. <svg><use href="#ieung-mark"/></svg> 로 쓴다 */
export const IEUNG_DEFS =
  `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>` +
  `<symbol id="ieung-mark" viewBox="0 0 128 128"><image href="/mascot/mark.webp" width="128" height="128"/></symbol>` +
  `<symbol id="ieung-flat" viewBox="0 0 128 128"><image href="/mascot/mark.webp" width="128" height="128"/></symbol>` +
  `</defs></svg>`;

/** 표정마다 SVG 의 안쪽 (viewBox 0 0 240 250). 바닥에 발을 붙여 표정이 바뀌어도 키가 같다 */
export const MOOD_SVG: Record<Mood, string> = Object.fromEntries(
  MOODS.map((m) => [
    m,
    `<g class="mv-move"><g class="mv-breathe"><image href="${artSrc(MOOD_ART[m])}" x="0" y="0" width="240" height="250" preserveAspectRatio="xMidYMax meet"/></g></g>`,
  ]),
) as Record<Mood, string>;
