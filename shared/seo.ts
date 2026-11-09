/* ============================================================
   검색·공유 메타 — 모든 페이지가 같은 모양.

   vite.config.ts 가 빌드할 때 각 index.html 의 <head> 에 넣는다.
   내용은 shared/apps.ts (이름 · description · og) 와 shared/site.ts (주소) 에서 온다.
   그래서 index.html 에는 <title> · description · og 를 적지 않는다.

   sitemap.xml · robots.txt 도 여기서 만든다 — 앱을 더하면 저절로 들어간다.
   ============================================================ */
import { APPS, type AppInfo } from "./apps";
import { SITE, type SiteConfig } from "./site";

export type HeadTag = { tag: "title" | "meta" | "link"; attrs?: Record<string, string>; children?: string };

const HOME = {
  title: "한국어 with Youjin · Small apps for learning Korean",
  /** tools/home/build_og.py 로 만든다 (#18) */
  og: { image: "/og.png", alt: "이응이와 네 가지 앱 — 한국어 블록, 한국어 카드, 한국어 달력, 한국어 시계" },
  description: "한국어를 배우는 사람을 위한 작은 앱 모음 — 한글, 낱말 카드, 날짜, 시계. Small free apps for learning Korean: Hangul, flashcards, dates and time.",
};

/** 브라우저 주소창 색 — tokens.json 의 bg (라이트 · 다크) */
const THEME_COLOR = { light: "#f5f8ff", dark: "#131a2c" };

export type PageMeta = { url: string; title: string; description: string; image?: { url: string; alt: string } };

/** slug 가 "" 이면 첫 화면 */
export function pageMeta(slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS): PageMeta {
  if (!slug) return { url: c.url + "/", title: HOME.title, description: HOME.description, image: { url: c.url + HOME.og.image, alt: HOME.og.alt } };
  const a = apps.find((x) => x.slug === slug);
  if (!a) throw new Error(`shared/apps.ts 에 없는 앱이에요: ${slug}`);
  return {
    url: `${c.url}/${a.slug}/`,
    title: `${a.ko} with Youjin · ${a.en}`,
    description: a.description,
    image: a.og && { url: c.url + a.og.image, alt: a.og.alt },
  };
}

export function headTags(slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS): HeadTag[] {
  const m = pageMeta(slug, c, apps);
  const meta = (k: "name" | "property", key: string, content: string): HeadTag => ({ tag: "meta", attrs: { [k]: key, content } });
  const tags: HeadTag[] = [
    { tag: "title", children: m.title },
    meta("name", "description", m.description),
    { tag: "link", attrs: { rel: "canonical", href: m.url } },
    // favicon.ico · apple-touch-icon.png 는 favicon.svg 를 그대로 구운 것 (public/)
    { tag: "link", attrs: { rel: "icon", href: "/favicon.ico", sizes: "32x32" } },
    { tag: "link", attrs: { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" } },
    { tag: "link", attrs: { rel: "apple-touch-icon", href: "/apple-touch-icon.png" } },
    { tag: "meta", attrs: { name: "theme-color", content: THEME_COLOR.light, media: "(prefers-color-scheme: light)" } },
    { tag: "meta", attrs: { name: "theme-color", content: THEME_COLOR.dark, media: "(prefers-color-scheme: dark)" } },
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", c.name),
    meta("property", "og:locale", "ko_KR"),
    meta("property", "og:locale:alternate", "en_US"),
    meta("property", "og:url", m.url),
    meta("property", "og:title", m.title),
    meta("property", "og:description", m.description),
    meta("name", "twitter:card", m.image ? "summary_large_image" : "summary"),
    meta("name", "twitter:title", m.title),
    meta("name", "twitter:description", m.description),
  ];
  if (m.image) {
    tags.push(
      meta("property", "og:image", m.image.url),
      // 공유 그림은 모두 1200×630 (apps.ts 의 og 설명 참고)
      meta("property", "og:image:width", "1200"),
      meta("property", "og:image:height", "630"),
      meta("property", "og:image:alt", m.image.alt),
      meta("name", "twitter:image", m.image.url),
      meta("name", "twitter:image:alt", m.image.alt),
    );
  }
  return tags;
}

export function sitemapXml(c: SiteConfig = SITE, apps: AppInfo[] = APPS) {
  const urls = [pageMeta("", c, apps).url, ...apps.map((a) => pageMeta(a.slug, c, apps).url)];
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls.map((u) => `  <url><loc>${u}</loc></url>`),
    `</urlset>`,
    ``,
  ].join("\n");
}

export const robotsTxt = (c: SiteConfig = SITE) => `User-agent: *\nAllow: /\n\nSitemap: ${c.url}/sitemap.xml\n`;
