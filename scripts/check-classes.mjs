// 없는 유틸리티 찾기
//
//   npm run check:classes
//
// 테마에서 Tailwind 기본 팔레트·글자 크기·모서리·그림자·화면 폭을 지웠다
// (shared/tokens/theme.css). 그래서 bg-white, text-sm, rounded-2xl, md: 같은
// 이름은 아무 CSS 도 만들지 않는다 — 그런데 Tailwind 는 조용히 넘어간다.
// 화면에서 슬쩍 모양이 빠지는 걸 여기서 잡는다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

const root = fileURLToPath(new URL("..", import.meta.url));
const entry = root + "shared/ui/styles.css";
const compiler = await compile(readFileSync(entry, "utf8"), { base: root + "shared/ui", onDependency() {} });

const scanner = new Scanner({
  sources: ["apps", "shared"].map((d) => ({ base: root + d, pattern: "**/*.{tsx,ts}", negated: false })),
});
const candidates = scanner.scan();

// 테마에 기대는 유틸리티만 본다. 그 밖의 낱말(주석·문자열)은 너무 많다
const THEMED =
  /^(?:[a-z-]+:|\[[^\]]+\]:)*!?-?(?:text|bg|from|via|to|rounded(?:-[trblse]{1,2})?|shadow|inset-shadow|font|border(?:-[xytrblse])?|outline|ring|fill|stroke|decoration|accent|caret|divide|placeholder)-[a-z0-9-]+(?:\/\d+)?$/;
const BREAKPOINT = /^(?:[a-z-]+:)*(?:xs|md|lg|xl|2xl):/;
// 클래스가 아니라 SVG 속성·CSS 속성 이름으로 문자열에 나오는 것
const PROPS = new Set(["font-family", "font-size", "font-weight", "font-style", "text-anchor", "text-align", "text-decoration", "stroke-linecap", "stroke-linejoin", "stroke-width", "stroke-dasharray", "stroke-opacity", "fill-opacity", "fill-rule", "border-radius"]);
const isTw = (c) => !PROPS.has(c) && (THEMED.test(c) || BREAKPOINT.test(c));

let css = compiler.build([]);
const bad = [];
for (const c of [...new Set(candidates)].filter(isTw).sort()) {
  const next = compiler.build([c]);
  if (next === css) bad.push(c);
  css = next;
}
if (bad.length) {
  console.error("CSS 를 만들지 않는 유틸리티 — 테마에 없는 이름이에요 (shared/tokens/theme.css):");
  for (const c of bad) console.error("  " + c);
  console.error("글자 크기 text-[1rem] · 모서리 rounded-[16px] 처럼 적거나, 디자인 시스템 이름(text-label, rounded-md)을 쓰세요.");
  process.exit(1);
}
console.log("classes OK");
