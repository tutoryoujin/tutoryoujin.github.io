import { existsSync, readdirSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";
import { analyticsScript } from "./shared/analytics";
import { NOTES } from "./shared/notes";
import { headTags, jsonLdText, llmsTxt, PRERENDER_HIDE, PRERENDER_SHOW, prerenderHtml, robotsTxt, sitemapXml } from "./shared/seo";
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
  transformIndexHtml: () => [
    { tag: "script", children: THEME_BOOT, injectTo: "head-prepend" },
    // 크롤러용 정적 본문은 첫 그림부터 숨긴다 — 자바스크립트가 꺼져 있으면 보인다 (#69)
    { tag: "style", children: PRERENDER_HIDE, injectTo: "head-prepend" },
    { tag: "noscript", children: PRERENDER_SHOW, injectTo: "head-prepend" },
  ],
};

// 검색·공유 메타 + 방문 분석 — 모든 index.html 에. 내용은 shared/apps.ts · shared/site.ts 에서.
// 분석 id 가 비어 있으면 스크립트를 아예 넣지 않는다.
const slugOf = (file: string) => relative(apps, dirname(file)).split(sep).join("/");

/* 글 /notes/<slug>/ — 글마다 index.html 을 따로 두지 않는다 (#50).
   notes/index.html(목록) 하나를 빌드하고, 글마다 그 결과를 복사해 메타 · 정적 본문만 바꾼다.
   바꿀 자리를 표시하려고 목록 페이지만 메타를 글자로 넣는다 (<!--yj:head--> … <!--/yj:head-->). */
const escAttr = (t: string) => t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const escText = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const headHtml = (slug: string) =>
  headTags(slug)
    .map((t) => {
      const attrs = Object.entries(t.attrs ?? {})
        .map(([k, v]) => ` ${k}="${escAttr(v)}"`)
        .join("");
      return t.tag === "title" ? `<title>${escText(t.children ?? "")}</title>` : `<${t.tag}${attrs} />`;
    })
    .join("\n    ") + `\n    <script type="application/ld+json">${jsonLdText(slug)}</script>`;
const HEAD = (inner: string) => `<!--yj:head-->\n    ${inner}\n    <!--/yj:head-->`;
const ROOT = (inner: string) => `<!--yj:root-->${inner}<!--/yj:root-->`;
const HEAD_RE = /<!--yj:head-->[\s\S]*?<!--\/yj:head-->/;
const ROOT_RE = /<!--yj:root-->[\s\S]*?<!--\/yj:root-->/;

const notesPages: Plugin = {
  name: "yj-notes-pages",
  enforce: "post",
  // 개발 서버: /notes/<slug>/ 도 목록 페이지가 받는다 (화면은 주소를 보고 글을 고른다)
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const [path, q] = (req.url ?? "").split("?");
      if (/^\/notes\/[a-z0-9-]+\/?$/.test(path)) req.url = "/notes/index.html" + (q ? "?" + q : "");
      next();
    });
  },
  generateBundle(_, bundle) {
    const list = bundle["notes/index.html"];
    if (!list || list.type !== "asset") throw new Error("notes/index.html 이 빌드에 없어요");
    const src = String(list.source);
    if (!HEAD_RE.test(src) || !ROOT_RE.test(src)) throw new Error("notes/index.html 에 바꿀 자리 표시가 없어요");
    for (const n of NOTES) {
      const slug = `notes/${n.slug}`;
      const source = src.replace(HEAD_RE, HEAD(headHtml(slug))).replace(ROOT_RE, ROOT(prerenderHtml(slug)));
      this.emitFile({ type: "asset", fileName: `${slug}/index.html`, source });
    }
  },
};

const siteHead: Plugin = {
  name: "yj-site-head",
  transformIndexHtml(html, ctx) {
    const slug = slugOf(ctx.filename);
    const root = '<div id="root"></div>';
    if (!html.includes(root)) throw new Error(`${ctx.filename}: <div id="root"></div> 가 없어요`);
    const a = analyticsScript();
    const analytics: HtmlTagDescriptor[] = a ? [{ tag: "script", attrs: { src: a.src, ...a.attrs }, injectTo: "head" }] : [];
    // 글 목록은 메타 · 정적 본문을 표시 안에 글자로 — 글마다 복사할 때 바꾼다 (notesPages)
    if (slug === "notes")
      return {
        html: html
          .replace("</head>", `  ${HEAD(headHtml(slug))}\n  </head>`)
          .replace(root, `<div id="root">${ROOT(prerenderHtml(slug))}</div>`),
        tags: analytics,
      };
    const tags: HtmlTagDescriptor[] = headTags(slug).map((t) => ({ ...t, injectTo: "head" }));
    tags.push({ tag: "script", attrs: { type: "application/ld+json" }, children: jsonLdText(slug), injectTo: "head" }, ...analytics);
    // 정적 본문 — 자바스크립트를 안 돌리는 크롤러용. React 가 뜨면 그대로 덮는다
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
  plugins: [themeBoot, siteHead, notesPages, react(), tailwindcss()],
  resolve: { alias: { "@yj": resolve(here, "shared") } },
  build: { outDir: resolve(here, "dist"), emptyOutDir: true, rollupOptions: { input: pages } },
});
