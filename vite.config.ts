import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
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

export default defineConfig({
  root: apps,
  publicDir: resolve(here, "public"),
  plugins: [themeBoot, react(), tailwindcss()],
  resolve: { alias: { "@yj": resolve(here, "shared") } },
  build: { outDir: resolve(here, "dist"), emptyOutDir: true, rollupOptions: { input: pages } },
});
