import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 앱 하나 = apps/<slug>/index.html 하나. 폴더만 만들면 빌드에 들어간다.
// 결과는 dist/<slug>/index.html → https://tutoryoujin.github.io/<slug>/
const here = fileURLToPath(new URL(".", import.meta.url));
const apps = resolve(here, "apps");
const pages: Record<string, string> = { home: resolve(apps, "index.html") };
for (const d of readdirSync(apps, { withFileTypes: true })) {
  const html = resolve(apps, d.name, "index.html");
  if (d.isDirectory() && existsSync(html)) pages[d.name] = html;
}

export default defineConfig({
  root: apps,
  publicDir: resolve(here, "public"),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@yj": resolve(here, "shared") } },
  build: { outDir: resolve(here, "dist"), emptyOutDir: true, rollupOptions: { input: pages } },
});
