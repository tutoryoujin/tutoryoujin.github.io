/* ============================================================
   검색·공유 메타 — 모든 페이지가 같은 모양.

   vite.config.ts 가 빌드할 때 각 index.html 의 <head> 에 넣는다.
   내용은 shared/apps.ts (이름 · description · og) 와 shared/site.ts (주소) 에서 온다.
   그래서 index.html 에는 <title> · description · og 를 적지 않는다.

   sitemap.xml · robots.txt · llms.txt 도 여기서 만든다 — 앱을 더하면 저절로 들어간다.

   검색 · AI 답변(GEO)용 (#19)
   - jsonLd()        구조화 데이터. 있는 사실만 — 평점·리뷰처럼 없는 것은 넣지 않는다
   - prerenderHtml() 빌드 때 #root 안에 넣는 정적 본문. 자바스크립트를 안 돌리는
                     크롤러(대부분의 AI 크롤러)도 내용을 읽는다. React 가 뜨면 그대로 덮는다.
                     화면 내용의 요약이어야 한다 — 크롤러에만 보이는 말을 넣지 않는다
   - 제목은 학습자가 영어로 검색하는 말(searchTitle) + 브랜드
   ============================================================ */
import { APPS, type AppInfo } from "./apps";
import { SITE, type SiteConfig } from "./site";

export type HeadTag = { tag: "title" | "meta" | "link"; attrs?: Record<string, string>; children?: string };

const HOME = {
  searchTitle: "Free Apps for Learning Korean",
  /** tools/home/build_og.py 로 만든다 (#18) */
  og: { image: "/og.png", alt: "이응이와 네 가지 앱 — 한국어 블록, 한국어 카드, 한국어 달력, 한국어 시계" },
  description:
    "Free little apps for learning Korean: build Hangul blocks, learn words with flashcards, read dates and tell time. Made by Youjin, a Korean teacher in Seoul. 한국어를 배우는 사람을 위한 작은 앱 모음.",
};
/** 사이트를 만든 사람 — 구조화 데이터의 저자. 구독 폼 문구와 같은 사실만 */
const AUTHOR = { name: "Youjin", jobTitle: "Korean teacher", description: "A Korean teacher in Seoul" }; // llmsTxt 에도 같은 말

/** 브라우저 주소창 색 — tokens.json 의 bg (라이트 · 다크) */
const THEME_COLOR = { light: "#f5f8ff", dark: "#131a2c" };

export type PageMeta = { url: string; title: string; description: string; image?: { url: string; alt: string } };

/** slug 가 "" 이면 첫 화면 */
export function pageMeta(slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS): PageMeta {
  if (!slug)
    return {
      url: c.url + "/",
      title: `${HOME.searchTitle} | ${c.name}`,
      description: HOME.description,
      image: { url: c.url + HOME.og.image, alt: HOME.og.alt },
    };
  const a = apps.find((x) => x.slug === slug);
  if (!a) throw new Error(`shared/apps.ts 에 없는 앱이에요: ${slug}`);
  return {
    url: `${c.url}/${a.slug}/`,
    title: `${a.searchTitle} | ${a.ko} with Youjin`,
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
  // 사이트 소유 확인 — 코드가 있을 때만 (shared/site.ts)
  if (c.verify.google) tags.push(meta("name", "google-site-verification", c.verify.google));
  if (c.verify.naver) tags.push(meta("name", "naver-site-verification", c.verify.naver));
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

/* ---------- 구조화 데이터 (JSON-LD) ---------- */
export function jsonLd(slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS): object {
  const home = c.url + "/";
  const site = { "@id": home + "#website" };
  const author = { "@id": home + "#youjin" };
  if (!slug) {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          ...site,
          url: home,
          name: c.name,
          alternateName: "Korean with Youjin",
          description: HOME.description,
          inLanguage: ["ko", "en"],
          publisher: author,
        },
        { "@type": "Person", ...author, url: home, ...AUTHOR },
        {
          "@type": "ItemList",
          name: "Apps",
          itemListElement: apps.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: pageMeta(a.slug, c, apps).url, name: `${a.ko} (${a.en})` })),
        },
      ],
    };
  }
  const a = apps.find((x) => x.slug === slug)!;
  const m = pageMeta(slug, c, apps);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebApplication", "LearningResource"],
        "@id": m.url + "#app",
        url: m.url,
        name: `${a.ko} (${a.en})`,
        description: a.description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any (web browser)",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        inLanguage: ["ko", "en"],
        learningResourceType: "Interactive resource",
        educationalLevel: "Beginner",
        teaches: a.learn.map((l) => l.en),
        ...(m.image && { image: m.image.url }),
        author,
        isPartOf: site,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: c.name, item: home },
          { "@type": "ListItem", position: 2, name: a.ko, item: m.url },
        ],
      },
    ],
  };
}

/** <script type="application/ld+json"> 안에 그대로 넣을 글. </script> 로 끊기지 않게 < 를 막는다 */
export const jsonLdText = (slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS) =>
  JSON.stringify(jsonLd(slug, c, apps)).replace(/</g, "\\u003c");

/* ---------- 정적 본문 ---------- */
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const wrap = "mx-auto w-full max-w-(--shell-width) px-4 pt-6 pb-10 text-ink";
const h1 = "font-display text-[1.7rem] leading-[1.2] font-normal";
const sub = "block text-[0.85rem] font-bold text-muted";
const h2 = "mt-6 mb-2 font-display text-[1.2rem] font-normal";
const li = "mt-1.5";
const link = "text-primary underline";

export function prerenderHtml(slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS): string {
  const appLink = (a: AppInfo) =>
    `<li class="${li}"><a class="${link}" href="/${a.slug}/">${esc(a.ko)} · ${esc(a.en)}</a> — ${esc(a.about.ko)} <span class="text-muted">${esc(a.about.en)}</span></li>`;
  if (!slug) {
    return (
      `<main class="${wrap}">` +
      `<h1 class="${h1}">${esc(c.name)}<span class="${sub}">${esc(HOME.searchTitle)}</span></h1>` +
      `<p class="mt-2">${esc(HOME.description)}</p>` +
      `<h2 class="${h2}">앱 · Apps</h2><ul>${apps.map(appLink).join("")}</ul>` +
      `</main>`
    );
  }
  const a = apps.find((x) => x.slug === slug)!;
  const others = apps.filter((x) => x.slug !== slug);
  return (
    `<main class="${wrap}">` +
    `<h1 class="${h1}">${esc(a.ko)} with Youjin<span class="${sub}">${esc(a.en)} — ${esc(a.searchTitle)}</span></h1>` +
    `<p class="mt-2">${esc(a.about.ko)} <span class="text-muted">${esc(a.about.en)}</span></p>` +
    `<p class="mt-1 text-muted">${esc(a.description)}</p>` +
    `<h2 class="${h2}">이 앱에서 배우는 것 · What you’ll learn</h2>` +
    `<ul>${a.learn.map((l) => `<li class="${li}">${esc(l.ko)} <span class="text-muted">— ${esc(l.en)}</span></li>`).join("")}</ul>` +
    `<h2 class="${h2}">다른 앱 · More apps</h2><ul>${others.map(appLink).join("")}` +
    `<li class="${li}"><a class="${link}" href="/">${esc(c.name)} — 모든 앱 · All apps</a></li></ul>` +
    `</main>`
  );
}

/* ---------- llms.txt — AI 가 읽는 사이트 요약 (https://llmstxt.org) ---------- */
export function llmsTxt(c: SiteConfig = SITE, apps: AppInfo[] = APPS) {
  const lines = [
    `# ${c.name} (Korean with Youjin)`,
    ``,
    `> ${HOME.description}`,
    ``,
    `Free, no sign-up web apps for beginners learning Korean. Every screen shows Korean first with an English line below. Made by ${AUTHOR.name}, a Korean teacher in Seoul.`,
    ``,
    `## Apps`,
    ``,
  ];
  for (const a of apps) {
    lines.push(`- [${a.en} (${a.ko})](${pageMeta(a.slug, c, apps).url}): ${a.searchTitle}. ${a.about.en}.`);
    for (const l of a.learn) lines.push(`  - ${l.en}`);
  }
  lines.push(``, `## Optional`, ``, `- [Sitemap](${c.url}/sitemap.xml)`, ``);
  return lines.join("\n");
}
