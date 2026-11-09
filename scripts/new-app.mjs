// 새 앱 만들기
//
//   npm run new -- <slug> <한국어 이름> <English name> <emoji>
//   npm run new -- korean-money "한국어 돈" "Korean Money" 💰
//
// apps/<slug>/ 에 뼈대를 만들고 shared/apps.ts 에 한 줄을 넣는다.
// 그러면 모든 앱의 메뉴와 첫 화면에 바로 나온다.
// about · tagline 의 TODO 는 손으로 채운다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [slug, ko, en, emoji = "✨"] = process.argv.slice(2);
if (!slug || !ko || !en || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error('사용법: npm run new -- <slug> "<한국어 이름>" "<English name>" [emoji]');
  console.error("slug 는 영어 소문자·숫자·하이픈. 주소가 되니 한번 정하면 바꾸지 않아요.");
  process.exit(1);
}

const root = fileURLToPath(new URL("..", import.meta.url));
const dir = `${root}apps/${slug}/`;
if (existsSync(dir)) {
  console.error(`apps/${slug}/ 가 이미 있어요.`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

const files = {
  "index.html": `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${ko} (${en})${emoji}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Jua&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
`,
  "main.tsx": `import { mount } from "@yj/ui";
import { App } from "./App";

mount(<App />);
`,
  "App.tsx": `import { Box, Page, Tabs, useHashTab, type TabDef } from "@yj/ui";
import "./${slug}.css";

const TABS: TabDef<"learn" | "quiz">[] = [
  { key: "learn", ko: "배우기", en: "Learn" },
  { key: "quiz", ko: "퀴즈", en: "Quiz" },
];

export function App() {
  const [tab, setTab] = useHashTab(TABS);
  return (
    <Page app="${slug}">
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <Box>
        <p className="text-center font-display text-display-md">여기서 시작해요. {tab}</p>
      </Box>
    </Page>
  );
}
`,
  [`${slug}.css`]: `/* ${ko} — 스타일은 JSX 의 className 에 Tailwind 유틸리티로 적는다.
   이 파일에는 유틸리티로 못 쓰는 것만 둔다:
   - 뜻 이름 색 별칭 (악센트 8쌍의 var() 만, hex 금지)
       :root { --xx-bg: var(--mint-bg); --xx-ink: var(--mint-ink); }
     쓸 때는 bg-(--xx-bg) text-(--xx-ink), 또는 <Seg tone="xx">
   - @keyframes */
`,
};
for (const [name, text] of Object.entries(files)) writeFileSync(dir + name, text);

const appsPath = `${root}shared/apps.ts`;
const apps = readFileSync(appsPath, "utf8");
const entry = `  {
    slug: "${slug}",
    ko: "${ko}",
    en: "${en}",
    emoji: "${emoji}",
    about: { ko: "TODO 한 줄 소개 (해요체)", en: "TODO one-line intro" },
    tagline: { ko: "TODO, 매일 조금씩.", en: "TODO, one ___ at a time." },
  },
];`;
writeFileSync(appsPath, apps.replace(/\n\];/, "\n" + entry));

console.log(`만들었어요: apps/${slug}/`);
console.log(`- shared/apps.ts 의 TODO(about, tagline)를 채우세요`);
console.log(`- npm run dev 후 http://localhost:5173/${slug}/`);
