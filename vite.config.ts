import { existsSync, readdirSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";
import { analyticsScript } from "./shared/analytics";
import { headTags, jsonLdText, llmsTxt, prerenderHtml, robotsTxt, sitemapXml } from "./shared/seo";
import { THEME_BOOT } from "./shared/ui/theme";

// 앱 하나 = apps/<slug>/index.html 하나. 폴더만 만들면 빌드에 들어간다.
// 결과는 dist/<slug>/index.html → https://tutoryoujin.github.io/<slug>/
const here = fileURLToPath(new URL(".", import.meta.url));
const apps = resolve(here, "apps");
const pages: Record<string, string> = { home: resolve(apps, "index.html") };
for (const d of readdirSync(apps, { withFileTypes: true })) {
  const html = resolve(apps, d.name, "index.html");
  if (d.isDirectory() && existsSync(html)) pages[d.name] = html;
}

// 고른 테마를 첫 그림 전에 건다 — 모든 앱 index.html 에 자동으로. 새 앱도 따로 할 일 없다
const themeBoot: Plugin = {
  name: "yj-theme-boot",
  transformIndexHtml: () => [{ tag: "script", children: THEME_BOOT, injectTo: "head-prepend" }],
};

// 검색·공유 메타 + 방문 분석 — 모든 index.html 에. 내용은 shared/apps.ts · shared/site.ts 에서.
// 분석 id 가 비어 있으면 스크립트를 아예 넣지 않는다.
const slugOf = (file: string) => relative(apps, dirname(file)).split(sep).join("/");
const siteHead: Plugin = {
  name: "yj-site-head",
  transformIndexHtml(html, ctx) {
    const slug = slugOf(ctx.filename);
    const tags: HtmlTagDescriptor[] = headTags(slug).map((t) => ({ ...t, injectTo: "head" }));
    tags.push({ tag: "script", attrs: { type: "application/ld+json" }, children: jsonLdText(slug), injectTo: "head" });
    const a = analyticsScript();
    if (a) tags.push({ tag: "script", attrs: { src: a.src, ...a.attrs }, injectTo: "head" });
    // 정적 본문 — 자바스크립트를 안 돌리는 크롤러용. React 가 뜨면 그대로 덮는다
    const root = '<div id="root"></div>';
    if (!html.includes(root)) throw new Error(`${ctx.filename}: <div id="root"></div> 가 없어요`);
    return { html: html.replace(root, `<div id="root">${prerenderHtml(slug)}</div>`), tags };
  },
  // 앱을 더하면 sitemap 에도 저절로 들어간다
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml() });
    this.emitFile({ type: "asset", fileName: "robots.txt", source: robotsTxt() });
    this.emitFile({ type: "asset", fileName: "llms.txt", source: llmsTxt() });
  },
};

export default defineConfig({
  root: apps,
  publicDir: resolve(here, "public"),
  plugins: [themeBoot, siteHead, react(), tailwindcss()],
  resolve: { alias: { "@yj": resolve(here, "shared") } },
  build: { outDir: resolve(here, "dist"), emptyOutDir: true, rollupOptions: { input: pages } },
});
