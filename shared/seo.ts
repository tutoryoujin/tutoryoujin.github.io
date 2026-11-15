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
import { docHtml } from "./doc";
import { NOTES, NOTES_TITLE, notesForApp, paginate, type Note } from "./notes";
import { pageBySlug, PAGES, type SitePage } from "./pages";
import { SITE, type SiteConfig } from "./site";

export type HeadTag = { tag: "title" | "meta" | "link"; attrs?: Record<string, string>; children?: string };

/** 홈 공유 그림 설명 — 그림(tools/home/build_og.py)과 같은 규칙: 여섯까지 이름, 더 많으면 다섯 + 나머지 수 */
export function ogAlt(apps: AppInfo[]): string {
  const shown = apps.length <= 6 ? apps : apps.slice(0, 5);
  const rest = apps.length - shown.length;
  return `이응이와 앱 ${apps.length}개 — ${shown.map((a) => a.ko).join(", ")}${rest ? ` 외 ${rest}개` : ""}`;
}

const HOME = {
  searchTitle: "Free Apps for Learning Korean",
  /** tools/home/build_og.py 로 만든다 (#18) */
  og: { image: "/og.png", alt: ogAlt(APPS) },
  description:
    "Free little apps for learning Korean: build Hangul blocks, write your name in Hangul, learn words with flashcards, read dates and tell time. Made by Youjin, a Korean teacher in Seoul. 한국어를 배우는 사람을 위한 작은 앱 모음.",
};
/** 사이트를 만든 사람 — 구조화 데이터의 저자. 구독 폼 문구와 같은 사실만 */
const AUTHOR = { name: "Youjin", jobTitle: "Korean teacher", description: "A Korean teacher in Seoul" }; // llmsTxt 에도 같은 말

/** 브라우저 주소창 색 — tokens.json 의 bg (라이트 · 다크) */
const THEME_COLOR = { light: "#f5f8ff", dark: "#131a2c" };

export type PageMeta = { url: string; title: string; description: string; image?: { url: string; alt: string } };

const brand = (a: AppInfo) => `${a.ko} with Youjin`;
const findApp = (slug: string, apps: AppInfo[]) => {
  const a = apps.find((x) => x.slug === slug);
  if (!a) throw new Error(`shared/apps.ts 에 없는 앱이에요: ${slug}`);
  return a;
};

/** 앱 안 화면(덱 · 출처 …)의 브라우저 제목. sub 가 없으면 빌드가 넣은 검색 제목 그대로 (#51) */
export function screenTitle(slug: string, sub?: string, apps: AppInfo[] = APPS): string {
  return sub ? `${sub} · ${brand(findApp(slug, apps))}` : pageMeta(slug, SITE, apps).title;
}

/** slug 가 "" 이면 첫 화면 */
export function pageMeta(slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS): PageMeta {
  if (!slug)
    return {
      url: c.url + "/",
      title: `${HOME.searchTitle} | ${c.name}`,
      description: HOME.description,
      image: { url: c.url + HOME.og.image, alt: HOME.og.alt },
    };
  const p = pageBySlug(slug);
  if (p)
    return {
      url: `${c.url}/${p.slug}/`,
      title: `${p.searchTitle} | ${c.name}`,
      description: p.description,
      image: { url: c.url + HOME.og.image, alt: HOME.og.alt },
    };
  const a = findApp(slug, apps);
  return {
    url: `${c.url}/${a.slug}/`,
    title: `${a.searchTitle} | ${brand(a)}`,
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
  const urls = [pageMeta("", c, apps).url, ...apps.map((a) => pageMeta(a.slug, c, apps).url), ...PAGES.map((p) => pageMeta(p.slug, c, apps).url)];
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
  const p = pageBySlug(slug);
  if (p) {
    const m = pageMeta(slug, c, apps);
    const list = pageMeta("notes", c, apps).url;
    const main =
      p.kind === "note"
        ? {
            "@type": "Article",
            "@id": m.url + "#article",
            url: m.url,
            headline: p.note!.searchTitle,
            name: `${p.ko} (${p.en})`,
            description: p.description,
            datePublished: p.note!.added,
            dateModified: p.updated,
            inLanguage: ["ko", "en"],
            ...(m.image && { image: m.image.url }),
            author,
            publisher: author,
            isPartOf: site,
            mainEntityOfPage: m.url,
          }
        : p.kind === "notes"
          ? {
              "@type": "CollectionPage",
              "@id": m.url + "#page",
              url: m.url,
              name: `${p.ko} (${p.en})`,
              description: p.description,
              inLanguage: ["ko", "en"],
              isPartOf: site,
              author,
              mainEntity: {
                "@type": "ItemList",
                itemListElement: NOTES.map((n, i) => ({ "@type": "ListItem", position: i + 1, url: pageMeta(`notes/${n.slug}`, c, apps).url, name: n.title.en })),
              },
            }
          : { "@type": "WebPage", "@id": m.url + "#page", url: m.url, name: `${p.en} (${p.ko})`, description: p.description, dateModified: p.updated, inLanguage: ["en", "ko"], isPartOf: site, author };
    const name = (x: { ko: string; en: string }) => (p.lead === "en" ? x.en : x.ko);
    const trail: [string, string][] = p.kind === "note" ? [[name(NOTES_TITLE), list], [name(p), m.url]] : [[name(p), m.url]];
    return { "@context": "https://schema.org", "@graph": [main, breadcrumb(c, trail)] };
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
      breadcrumb(c, [[a.ko, m.url]]),
    ],
  };
}

/** 첫 화면 → … 경로. trail 은 [이름, 주소] 차례대로 */
function breadcrumb(c: SiteConfig, trail: [string, string][]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [[c.name, c.url + "/"], ...trail].map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  };
}

/** <script type="application/ld+json"> 안에 그대로 넣을 글. </script> 로 끊기지 않게 < 를 막는다 */
export const jsonLdText = (slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS) =>
  JSON.stringify(jsonLd(slug, c, apps)).replace(/</g, "\\u003c");

/* ---------- 정적 본문 ---------- */
/**
 * 정적 본문은 크롤러용이라, 자바스크립트가 도는 브라우저에서는 첫 그림부터 숨긴다 (#69).
 * 안 숨기면 React 가 뜨기 전까지 꾸밈 없는 글자 화면이 잠깐 보였다가 앱으로 바뀐다.
 * 자바스크립트가 꺼진 브라우저(<noscript>)와 크롤러는 그대로 본다. vite.config.ts 가 <head> 에 넣는다
 */
export const PRERENDER_HIDE = "[data-prerender]{display:none}";
export const PRERENDER_SHOW = "<style>[data-prerender]{display:block}</style>";
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
      `<main data-prerender class="${wrap}">` +
      `<h1 class="${h1}">${esc(c.name)}<span class="${sub}">${esc(HOME.searchTitle)}</span></h1>` +
      `<p class="mt-2">${esc(HOME.description)}</p>` +
      `<h2 class="${h2}">앱 · Apps</h2><ul>${apps.map(appLink).join("")}</ul>` +
      `</main>`
    );
  }
  const p = pageBySlug(slug);
  if (p) return pageHtml(p, c, apps);
  const a = apps.find((x) => x.slug === slug)!;
  const others = apps.filter((x) => x.slug !== slug);
  return (
    `<main data-prerender class="${wrap}">` +
    `<h1 class="${h1}">${esc(a.ko)} with Youjin<span class="${sub}">${esc(a.en)} — ${esc(a.searchTitle)}</span></h1>` +
    `<p class="mt-2">${esc(a.about.ko)} <span class="text-muted">${esc(a.about.en)}</span></p>` +
    `<p class="mt-1 text-muted">${esc(a.description)}</p>` +
    `<h2 class="${h2}">이 앱에서 배우는 것 · What you’ll learn</h2>` +
    `<ul>${a.learn.map((l) => `<li class="${li}">${esc(l.ko)} <span class="text-muted">— ${esc(l.en)}</span></li>`).join("")}</ul>` +
    (notesForApp(a.slug).length ? `<h2 class="${h2}">관련 글 · Related posts</h2><ul>${notesForApp(a.slug).map((n) => noteLink(n, "ko")).join("")}</ul>` : "") +
    `<h2 class="${h2}">다른 앱 · More apps</h2><ul>${others.map(appLink).join("")}` +
    `<li class="${li}"><a class="${link}" href="/">${esc(c.name)} — 모든 앱 · All apps</a></li></ul>` +
    `</main>`
  );
}

/** 글 링크 한 줄 — 블로그 목록(영어 먼저) · 앱 아래 관련 글(한국어 먼저) */
const noteLink = (n: Note, lead: "ko" | "en") => {
  const [t1, t2] = lead === "en" ? [n.title.en, n.title.ko] : [n.title.ko, n.title.en];
  const [s1, s2] = lead === "en" ? [n.summary.en, n.summary.ko] : [n.summary.ko, n.summary.en];
  return `<li class="${li}"><a class="${link}" href="/notes/${n.slug}/">${esc(t1)} · ${esc(t2)}</a> — ${esc(s1)} <span class="text-muted">${esc(s2)}</span></li>`;
};

/** 앱이 아닌 페이지 — 화면과 같은 글 (shared/doc.ts) */
function pageHtml(p: SitePage, c: SiteConfig, apps: AppInfo[]): string {
  const [big, small] = p.lead === "ko" ? [p.ko, p.en] : [p.en, p.ko];
  const home = `<p class="mt-8"><a class="${link}" href="/">${esc(c.name)} — 모든 앱 · All apps</a></p>`;
  const title = `<h1 class="${h1}">${esc(big)}<span class="${sub}">${esc(small)}</span></h1>`;
  if (p.kind === "notes")
    return `<main data-prerender class="${wrap}">${title}<p class="mt-2">${esc(p.description)}</p><ul class="mt-4">${paginate(NOTES, 1).items.map((n) => noteLink(n, "en")).join("")}</ul>${home}</main>`; // 화면 첫 쪽과 같게
  if (p.kind === "note") {
    const n = p.note!;
    const practice = n.apps
      .map((s) => apps.find((a) => a.slug === s))
      .filter((a): a is AppInfo => !!a)
      .map((a) => `<li class="${li}"><a class="${link}" href="/${a.slug}/">${esc(a.en)} · ${esc(a.ko)}</a> — ${esc(a.about.en)} <span class="text-muted">${esc(a.about.ko)}</span></li>`)
      .join("");
    return (
      `<main data-prerender class="${wrap}">` +
      `<p><a class="${link}" href="/notes/">${esc(NOTES_TITLE.en)} · ${esc(NOTES_TITLE.ko)}</a></p>` +
      title +
      `<p class="mt-2 text-muted">${esc(n.added)} · Youjin</p>` +
      docHtml(n.blocks, "en") +
      (practice ? `<h2 class="${h2}">Practice in the app · 앱에서 연습하기</h2><ul>${practice}</ul>` : "") +
      home +
      `</main>`
    );
  }
  return (
    `<main data-prerender class="${wrap}">` +
    title +
    `<p class="mt-2 text-muted">Updated ${esc(p.updated)}</p>` +
    docHtml(p.blocks(c), p.lead) +
    home +
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
  if (NOTES.length) {
    lines.push(``, `## ${NOTES_TITLE.en}`, ``);
    for (const n of NOTES) lines.push(`- [${n.searchTitle}](${pageMeta(`notes/${n.slug}`, c, apps).url}): ${n.summary.en}`);
  }
  lines.push(``, `## Optional`, ``, `- [Sitemap](${c.url}/sitemap.xml)`, ``);
  return lines.join("\n");
}
