// tokens.json → tokens.css
//
//   npm run tokens          생성
//   npm run tokens:check    어긋났는지만 확인 (CI)
//
// 흐름:  디자인 시스템 아티팩트 (사람이 고치는 곳)
//          ↓ 손으로 내려받아 교체
//        shared/tokens/tokens.json
//          ↓ 이 스크립트
//        shared/tokens/tokens.css   ← 모든 앱이 import 한다
//
// 예전 korean-cards/tools/sync_shared.py 의 생성 부분을 그대로 옮겼다.
// 출력이 글자 하나까지 같아야 한다.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../shared/tokens/", import.meta.url));
const data = JSON.parse(readFileSync(dir + "tokens.json", "utf8"));

const ACCENTS = ["blue", "pink", "yellow", "mint", "lavender", "coral", "orange", "gray"];
const SECTIONS = [
  [["bg", "surface", "ink", "muted", "line", "primary", "primary-ink", "sky", "sky-ink"], "바탕과 글자"],
  [
    ACCENTS.flatMap((a) => [a + "-bg", a + "-ink"]),
    "악센트 8쌍 — -bg 와 -ink 는 쌍이다. 섞으면 한쪽 테마에서 글자가 안 보인다",
  ],
  [["ieung-body", "ieung-limb", "ieung-face", "ieung-blush"], "마스코트 이응 — 다크에서도 밝게 남는다. blue-bg 의 별칭이 아니다"],
  [
    ["ieung-light", "ieung-shade", "ieung-stem-light", "ieung-stem-dark", "ieung-cheek"],
    "입체 이응 — 테마가 바뀌어도 같은 값이라 라이트 블록에만 있다",
  ],
  [["sun", "sat", "special"], "달력 전용"],
  [
    ["cal-year", "cal-month", "cal-day", "cal-week", "ok", "bad"].flatMap((t) => [t + "-bg", t + "-ink"]),
    "뜻 이름은 별칭이다. 여기에 hex 를 다시 적지 말 것",
  ],
];

function cssBlock(tokens, theme, indent) {
  const out = [];
  for (const [group, head] of SECTIONS) {
    const rows = tokens.filter((t) => group.includes(t.name));
    if (!rows.length) continue;
    const lines = [];
    for (const t of rows) {
      let v = t.value;
      if (typeof v === "string") {
        if (theme !== "light") continue; // 별칭은 라이트 블록에서 한 번만
        v = `var(--${v.replace(/[{}]/g, "")})`;
      } else if (theme in v) v = v[theme];
      else continue; // 라이트 값만 있는 토큰 — 다크에서도 같은 값을 쓴다
      lines.push(`${indent}--${t.name}: ${v};`);
    }
    if (!lines.length) continue; // 다크에서 통째로 빠지는 묶음
    out.push(`${indent}/* ${head} */`, ...lines, "");
  }
  return out.join("\n").trimEnd();
}

const colors = data.color.tokens;
const scalars = [
  [
    "글꼴 — Nunito 가 영문·숫자, Jua 가 한글을 맡는다 (한 스택에서 글자별로 분기)",
    [
      ["--font-app", '"Nunito", "Jua", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'],
      ["--font-display", '"Jua", "Nunito", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'],
      [
        "--font-reading",
        '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif',
      ],
    ],
  ],
  ["간격", data.spacing.tokens.map((t) => ["--" + t.name, t.value])],
  ["모서리", data.radius.tokens.map((t) => ["--" + t.name, t.value])],
];
const shadows = data.shadow.tokens;

const scalarBlock = (indent) =>
  scalars
    .flatMap(([head, rows]) => [`${indent}/* ${head} */`, ...rows.map(([k, v]) => `${indent}${k}: ${v};`), ""])
    .join("\n")
    .trimEnd();
const shadowBlock = (theme, indent) => shadows.map((t) => `${indent}--${t.name}: ${t.value[theme]};`).join("\n");

const css = `/* 한국어 with Youjin — 디자인 시스템 토큰.

   shared/tokens/tokens.json 에서 scripts/build-tokens.mjs 가 생성한다. 직접 고치지 말 것.
   값을 바꾸려면 디자인 시스템 아티팩트에서 고치고 tokens.json 을 교체한 뒤
   npm run tokens 를 돌린다.
   https://claude.ai/artifact/CEpgfyaaxJuP8MysgFHWbH

   다크는 세 상태를 전부 정의한다. @media 안에만 있는 색이 하나라도 있으면
   사용자가 테마를 직접 고른 순간 그 색만 빠진다. */
:root {
${cssBlock(colors, "light", "  ")}

${scalarBlock("  ")}

  /* 그림자 — folder 는 위쪽으로 드리운다 */
${shadowBlock("light", "  ")}

  color-scheme: light;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${cssBlock(colors, "dark", "    ")}

${shadowBlock("dark", "    ")}
    color-scheme: dark;
  }
}

:root[data-theme="dark"] {
${cssBlock(colors, "dark", "  ")}

${shadowBlock("dark", "  ")}
  color-scheme: dark;
}
`;

const out = dir + "tokens.css";
if (process.argv.includes("--check")) {
  if (!existsSync(out) || readFileSync(out, "utf8") !== css) {
    console.error("shared/tokens/tokens.css 가 tokens.json 과 어긋나요. npm run tokens 를 돌리세요.");
    process.exit(1);
  }
  console.log("tokens.css OK");
} else {
  writeFileSync(out, css);
  console.log("generated shared/tokens/tokens.css");
}
