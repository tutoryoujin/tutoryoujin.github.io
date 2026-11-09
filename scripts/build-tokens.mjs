// tokens.json → tokens.css + theme.css
//
//   npm run tokens          생성
//   npm run tokens:check    어긋났는지만 확인 (CI)
//
// 흐름:  디자인 시스템 아티팩트 (사람이 고치는 곳)
//          ↓ 손으로 내려받아 교체
//        shared/tokens/tokens.json
//          ↓ 이 스크립트
//        shared/tokens/tokens.css   ← CSS 변수 (--bg, --blue-bg …). 다크 세 상태
//        shared/tokens/theme.css    ← Tailwind @theme. 위 변수를 유틸리티 이름으로 잇는다
//        shared/tokens/theme.ts     ← 타입 스케일 이름 (tailwind-merge 용)
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

// ---------- theme.css — Tailwind @theme ----------
// 색은 var() 로 잇는다(inline). 값은 tokens.css 한 곳에만 있고, 다크로 바뀌면
// 유틸리티도 같이 바뀐다. Tailwind 기본 팔레트는 지운다 — bg-red-500 같은
// 이름이 아예 없으니 "색을 새로 만들지 마세요" 를 빌드가 지켜 준다.
const themeCss = `/* 한국어 with Youjin — Tailwind 테마.

   shared/tokens/tokens.json 에서 scripts/build-tokens.mjs 가 생성한다. 직접 고치지 말 것.

   bg-blue-bg text-blue-ink   악센트 쌍 — 늘 같이 쓴다
   bg-surface text-muted      바탕과 글자
   font-display text-display-md rounded-lg shadow-card

   기본 팔레트·글꼴·모서리·그림자는 지웠다. 여기 없는 색은 만들 수 없다.
   간격은 Tailwind 기본(4px 단위)을 그대로 쓴다 — p-4 = 16px. */
@theme inline {
  --color-*: initial;
${colors.map((t) => `  --color-${t.name}: var(--${t.name});`).join("\n")}

  --shadow-*: initial;
${shadows.map((t) => `  --shadow-${t.name.replace(/^shadow-/, "")}: var(--${t.name});`).join("\n")}
}

@theme {
  --font-*: initial;
${scalars[0][1].map(([k, v]) => `  ${k}: ${v};`).join("\n")}

  /* 글자 — 디자인 시스템 타입 스케일. 글꼴은 따로: font-display text-display-md */
  --text-*: initial;
${data.type.groups
  .flatMap((g) => g.styles)
  .map((t) => `  --text-${t.name}: ${t.fontSize};\n  --text-${t.name}--line-height: ${t.lineHeight};\n  --text-${t.name}--font-weight: ${t.fontWeight};`)
  .join("\n")}

  --radius-*: initial;
${data.radius.tokens.map((t) => `  --${t.name}: ${t.value};`).join("\n")}

  /* 화면 폭 — 600px 하나만. 나머지 한 번 쓰는 폭은 min-[440px]: 처럼 적는다 */
  --breakpoint-*: initial;
  --breakpoint-sm: 600px;
}

`;

// tailwind-merge 가 text-label 을 글자 크기로 알아보게 이름만 내보낸다 (shared/ui/cn.ts)
const textSizes = data.type.groups.flatMap((g) => g.styles.map((t) => t.name));
const themeTs = `// shared/tokens/tokens.json 에서 scripts/build-tokens.mjs 가 생성한다. 직접 고치지 말 것.
export const TEXT_SIZES = ${JSON.stringify(textSizes)} as const;
`;

const outputs = [
  [dir + "tokens.css", css, "shared/tokens/tokens.css"],
  [dir + "theme.css", themeCss, "shared/tokens/theme.css"],
  [dir + "theme.ts", themeTs, "shared/tokens/theme.ts"],
];
if (process.argv.includes("--check")) {
  let bad = false;
  for (const [out, text, name] of outputs) {
    if (!existsSync(out) || readFileSync(out, "utf8") !== text) {
      console.error(`${name} 가 tokens.json 과 어긋나요. npm run tokens 를 돌리세요.`);
      bad = true;
    }
  }
  if (bad) process.exit(1);
  console.log("tokens OK");
} else {
  for (const [out, text, name] of outputs) {
    writeFileSync(out, text);
    console.log("generated " + name);
  }
}
