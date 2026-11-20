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
import { NOTES, NOTES_TITLE, notesForApp, paginate, RELATED_NOTES, type Note } from "./notes";
import { NOT_FOUND, pageBySlug, PAGES, type SitePage } from "./pages";
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
/** 홈 화면 · 헤더 · 꼬리말의 워드마크 (#84) — 사이트 이름(SITE.name)과 같다 (#72) */
const HOME_TITLE = SITE.name;
/** 사이트를 만든 사람 — 구조화 데이터의 저자. 구독 폼 문구와 같은 사실만 */
const AUTHOR = { name: "Youjin", jobTitle: "Korean teacher", description: "A Korean teacher in Seoul" }; // llmsTxt 에도 같은 말

/** 브라우저 주소창 색 — tokens.json 의 bg (라이트 · 다크) */
const THEME_COLOR = { light: "#fbf5ec", dark: "#15172b" }; // tokens.json 의 bg

export type PageMeta = { url: string; title: string; description: string; image?: { url: string; alt: string } };


/**
 * 페이지 언어 — <html lang> · 구조화 데이터 inLanguage 의 첫 말 (#95).
 * 앱 밖 페이지(홈 · 블로그 · 처방침 · 404)는 화면이 영어 먼저라 "en", 한국어 줄에는 lang="ko" 를 붙인다.
 * 앱은 화면이 한국어 먼저라 "ko" 그대로 — 앱 안 순서 규칙은 #92 에서 정한다.
 * 글꼴(한글은 어느 쪽이든 한글 글꼴) · 발음(speak() 가 ko-KR 을 직접 정한다)은 lang 에 기대지 않는다
 */
export function pageLang(slug: string, apps: AppInfo[] = APPS): "en" | "ko" {
  return apps.some((a) => a.slug === slug) ? "ko" : "en";
}
const inLanguage = (slug: string, apps: AppInfo[]) => (pageLang(slug, apps) === "en" ? ["en", "ko"] : ["ko", "en"]);
const findApp = (slug: string, apps: AppInfo[]) => {
  const a = apps.find((x) => x.slug === slug);
  if (!a) throw new Error(`shared/apps.ts 에 없는 앱이에요: ${slug}`);
  return a;
};

/** 앱 안 화면(덱 · 출처 …)의 브라우저 제목. sub 가 없으면 빌드가 넣은 검색 제목 그대로 (#51) */
export function screenTitle(slug: string, sub?: string, apps: AppInfo[] = APPS): string {
  return sub ? `${sub} · ${SITE.name}` : pageMeta(slug, SITE, apps).title;
}

/** 블로그 글 공유 그림 — 글을 쓰면 tools/og/build_og.py 를 돌린다 (없으면 테스트가 알려 준다) */
export const noteOg = (slug: string) => `/og/notes/${slug}.png`;

/** slug 가 "" 이면 첫 화면 */
export function pageMeta(slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS): PageMeta {
  if (!slug)
    return {
      url: c.url + "/",
      title: `${HOME.searchTitle} | ${c.name}`,
      description: HOME.description,
      image: { url: c.url + HOME.og.image, alt: HOME.og.alt },
    };
  if (slug === NOT_FOUND.slug)
    return { url: `${c.url}/404.html`, title: `${NOT_FOUND.en} | ${c.name}`, description: NOT_FOUND.description };
  const p = pageBySlug(slug);
  if (p)
    return {
      url: `${c.url}/${p.slug}/`,
      title: `${p.searchTitle} | ${c.name}`,
      description: p.description,
      // 글은 글마다 그림 (tools/og/build_og.py), 목록 · 처방침은 홈 그림
      image: p.note ? { url: c.url + noteOg(p.note.slug), alt: `${NOTES_TITLE.en}: ${p.note.title.en} (${p.note.title.ko})` } : { url: c.url + HOME.og.image, alt: HOME.og.alt },
    };
  const a = findApp(slug, apps);
  return {
    url: `${c.url}/${a.slug}/`,
    // 브랜드는 사이트 이름 하나 — 검색 제목에 한글을 넣지 않는다 (#72)
    title: `${a.searchTitle} | ${c.name}`,
    description: a.description,
    image: a.og && { url: c.url + a.og.image, alt: a.og.alt },
  };
}

export function headTags(slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS): HeadTag[] {
  const m = pageMeta(slug, c, apps);
  const meta = (k: "name" | "property", key: string, content: string): HeadTag => ({ tag: "meta", attrs: { [k]: key, content } });
  const notFound = slug === NOT_FOUND.slug;
  const tags: HeadTag[] = [
    { tag: "title", children: m.title },
    meta("name", "description", m.description),
    // 404 는 어느 주소에서나 같은 글이 나온다 — 색인하지 않고, 대표 주소도 두지 않는다
    notFound ? meta("name", "robots", "noindex") : { tag: "link", attrs: { rel: "canonical", href: m.url } },
    // favicon.ico · apple-touch-icon.png 는 favicon.svg 를 그대로 구운 것 (public/)
    { tag: "link", attrs: { rel: "icon", href: "/favicon.ico", sizes: "32x32" } },
    { tag: "link", attrs: { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" } },
    { tag: "link", attrs: { rel: "apple-touch-icon", href: "/apple-touch-icon.png" } },
    { tag: "meta", attrs: { name: "theme-color", content: THEME_COLOR.light, media: "(prefers-color-scheme: light)" } },
    { tag: "meta", attrs: { name: "theme-color", content: THEME_COLOR.dark, media: "(prefers-color-scheme: dark)" } },
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", c.name),
    // 독자는 영어로 검색하는 학습자 — 앱도 en_US 가 기본, 한국어는 alternate (#95)
    meta("property", "og:locale", "en_US"),
    meta("property", "og:locale:alternate", "ko_KR"),
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

/**
 * lastmod 는 고친 날을 아는 페이지(처방침 · 블로그 · 글의 updated)에만 (#95).
 * 홈 · 앱은 고친 날을 따로 적지 않는다 — 앱 added 는 처음 나온 날이라 lastmod 로 쓰면 틀린 날이 된다.
 * 틀린 lastmod 가 쌓이면 검색엔진이 사이트의 lastmod 를 통째로 무시한다
 */
export function sitemapXml(c: SiteConfig = SITE, apps: AppInfo[] = APPS) {
  const urls: { loc: string; lastmod?: string }[] = [
    { loc: pageMeta("", c, apps).url },
    ...apps.map((a) => ({ loc: pageMeta(a.slug, c, apps).url })),
    ...PAGES.map((p) => ({ loc: pageMeta(p.slug, c, apps).url, lastmod: p.updated || undefined })),
  ];
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`),
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
          description: HOME.description,
          inLanguage: inLanguage(slug, apps),
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
            inLanguage: inLanguage(slug, apps),
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
              inLanguage: inLanguage(slug, apps),
              isPartOf: site,
              author,
              mainEntity: {
                "@type": "ItemList",
                itemListElement: NOTES.map((n, i) => ({ "@type": "ListItem", position: i + 1, url: pageMeta(`notes/${n.slug}`, c, apps).url, name: n.title.en })),
              },
            }
          : { "@type": "WebPage", "@id": m.url + "#page", url: m.url, name: `${p.en} (${p.ko})`, description: p.description, dateModified: p.updated, inLanguage: inLanguage(slug, apps), isPartOf: site, author };
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
        inLanguage: inLanguage(slug, apps),
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
/** 영어 먼저인 페이지(lang="en") 안의 한국어 조각 */
const ko = (t: string, cls = "") => `<span lang="ko"${cls ? ` class="${cls}"` : ""}>${esc(t)}</span>`;

export function prerenderHtml(slug: string, c: SiteConfig = SITE, apps: AppInfo[] = APPS): string {
  const appLink = (a: AppInfo) =>
    `<li class="${li}"><a class="${link}" href="/${a.slug}/">${esc(a.ko)} · ${esc(a.en)}</a> — ${esc(a.about.ko)} <span class="text-muted">${esc(a.about.en)}</span></li>`;
  if (!slug) {
    // 홈 화면과 같게 — 제목은 「Korean with Youjin」, 설명 · 앱 이름은 영어가 앞 (#84)
    const appLinkEn = (a: AppInfo) =>
      `<li class="${li}"><a class="${link}" href="/${a.slug}/">${esc(a.en)} · ${ko(a.ko)}</a> — ${esc(a.about.en)} ${ko(a.about.ko, "text-muted")}</li>`;
    return (
      `<main data-prerender class="${wrap}">` +
      `<h1 class="${h1}">${esc(HOME_TITLE)}<span class="${sub}">${esc(HOME.searchTitle)}</span></h1>` +
      `<p class="mt-2">${esc(HOME.description)}</p>` +
      `<h2 class="${h2}">All apps · ${ko("모든 앱")}</h2><ul>${apps.map(appLinkEn).join("")}</ul>` +
      `<p class="mt-6"><a class="${link}" href="/notes/">${esc(NOTES_TITLE.en)} · ${ko(NOTES_TITLE.ko)}</a></p>` +
      `</main>`
    );
  }
  if (slug === NOT_FOUND.slug) return notFoundHtml(apps);
  const p = pageBySlug(slug);
  if (p) return pageHtml(p, c, apps);
  const a = apps.find((x) => x.slug === slug)!;
  const others = apps.filter((x) => x.slug !== slug);
  /* h2 는 화면과 같게 (#101) — 탭 이름 h2 (shared/apps.ts tabs, 화면은 <TabPanel>) + 앱 아래 「같이 읽어 보세요」.
     배우는 것은 그 탭 h2 아래에. 탭이 없는 줄은 첫머리 목록에.
     화면에 h2 로 없는 묶음(배우는 것 · 다른 앱)에는 h2 를 달지 않는다 — 다른 앱은 헤더 메뉴처럼 nav 로 */
  const learnLi = (l: AppInfo["learn"][number]) => `<li class="${li}">${esc(l.ko)} <span class="text-muted">— ${esc(l.en)}</span></li>`;
  const tabs = a.tabs ?? [];
  const loose = a.learn.filter((l) => !tabs.some((t) => t.key === l.tab));
  const notes = notesForApp(a.slug);
  return (
    `<main data-prerender class="${wrap}">` +
    // 헤더와 같게 영어 이름이 크고, 한국어 이름 + with Youjin 이 아래 (#100)
    `<h1 class="${h1}"><span lang="en">${esc(a.en)}</span><span class="${sub}"><span lang="ko">${esc(a.ko)}</span> with Youjin — ${esc(a.searchTitle)}</span></h1>` +
    `<p class="mt-2">${esc(a.about.ko)} <span class="text-muted">${esc(a.about.en)}</span></p>` +
    `<p class="mt-1 text-muted">${esc(a.description)}</p>` +
    (loose.length ? `<ul class="mt-2">${loose.map(learnLi).join("")}</ul>` : "") +
    tabs
      .map((t) => `<section><h2 class="${h2}">${esc(t.ko)} · ${esc(t.en)}</h2><ul>${a.learn.filter((l) => l.tab === t.key).map(learnLi).join("")}</ul></section>`)
      .join("") +
    // 화면과 같게 영어 먼저 (#100)
    (notes.length ? `<h2 class="${h2}">${esc(RELATED_NOTES.en)} · ${ko(RELATED_NOTES.ko)}</h2><ul>${notes.map((n) => noteLink(n, "en")).join("")}</ul>` : "") +
    `<nav class="mt-6" aria-label="다른 앱 / More apps"><ul>${others.map(appLink).join("")}` +
    `<li class="${li}"><a class="${link}" href="/">${esc(c.name)} — 모든 앱 · All apps</a></li></ul></nav>` +
    `</main>`
  );
}

/** 글 링크 한 줄 — 블로그 목록 · 앱 아래 관련 글 모두 영어 먼저 (#100). lead "ko" 는 지금 안 쓴다 */
const noteLink = (n: Note, lead: "ko" | "en") => {
  if (lead === "ko")
    return `<li class="${li}"><a class="${link}" href="/notes/${n.slug}/">${esc(n.title.ko)} · ${esc(n.title.en)}</a> — ${esc(n.summary.ko)} <span class="text-muted">${esc(n.summary.en)}</span></li>`;
  return `<li class="${li}"><a class="${link}" href="/notes/${n.slug}/">${esc(n.title.en)} · ${ko(n.title.ko)}</a> — ${esc(n.summary.en)} ${ko(n.summary.ko, "text-muted")}</li>`;
};

/** 404 — 화면(apps/404/main.tsx)과 같은 글. 지난 주소 · 오타로 온 사람이 빠져나갈 링크 */
function notFoundHtml(apps: AppInfo[]): string {
  return (
    `<main data-prerender class="${wrap}">` +
    `<h1 class="${h1}">${esc(NOT_FOUND.en)}<span class="${sub}" lang="ko">${esc(NOT_FOUND.ko)}</span></h1>` +
    `<p class="mt-2">${esc(NOT_FOUND.lead.en)} ${ko(NOT_FOUND.lead.ko, "text-muted")}</p>` +
    `<ul class="mt-4">` +
    `<li class="${li}"><a class="${link}" href="/">${esc(HOME_TITLE)} — Home · ${ko("첫 화면")}</a></li>` +
    `<li class="${li}"><a class="${link}" href="/notes/">${esc(NOTES_TITLE.en)} · ${ko(NOTES_TITLE.ko)}</a></li>` +
    `</ul>` +
    `<h2 class="${h2}">All apps · ${ko("모든 앱")}</h2><ul>` +
    apps.map((a) => `<li class="${li}"><a class="${link}" href="/${a.slug}/">${esc(a.en)} · ${ko(a.ko)}</a></li>`).join("") +
    `</ul></main>`
  );
}

/** 앱이 아닌 페이지 — 화면과 같은 글 (shared/doc.ts) */
function pageHtml(p: SitePage, c: SiteConfig, apps: AppInfo[]): string {
  const [big, small] = p.lead === "ko" ? [p.ko, p.en] : [p.en, p.ko];
  const home =
    p.lead === "en"
      ? `<p class="mt-8"><a class="${link}" href="/">${esc(HOME_TITLE)} — All apps · ${ko("모든 앱")}</a></p>`
      : `<p class="mt-8"><a class="${link}" href="/">${esc(c.name)} — 모든 앱 · All apps</a></p>`;
  const title = `<h1 class="${h1}">${esc(big)}<span class="${sub}" lang="${p.lead === "ko" ? "en" : "ko"}">${esc(small)}</span></h1>`;
  if (p.kind === "notes")
    return `<main data-prerender class="${wrap}">${title}<p class="mt-2">${esc(p.description)}</p><ul class="mt-4">${paginate(NOTES, 1).items.map((n) => noteLink(n, "en")).join("")}</ul>${home}</main>`; // 화면 첫 쪽과 같게
  if (p.kind === "note") {
    const n = p.note!;
    const practice = n.apps
      .map((s) => apps.find((a) => a.slug === s))
      .filter((a): a is AppInfo => !!a)
      .map((a) => `<li class="${li}"><a class="${link}" href="/${a.slug}/">${esc(a.en)} · ${ko(a.ko)}</a> — ${esc(a.about.en)} ${ko(a.about.ko, "text-muted")}</li>`)
      .join("");
    return (
      `<main data-prerender class="${wrap}">` +
      `<p><a class="${link}" href="/notes/">${esc(NOTES_TITLE.en)} · ${ko(NOTES_TITLE.ko)}</a></p>` +
      title +
      `<p class="mt-2 text-muted">${esc(n.added)} · Youjin</p>` +
      docHtml(n.blocks, "en") +
      (practice ? `<h2 class="${h2}">Practice in the app · ${ko("앱에서 연습하기")}</h2><ul>${practice}</ul>` : "") +
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
    `# ${c.name}`,
    ``,
    `> ${HOME.description}`,
    ``,
    // 화면 순서와 맞게 (#84 · #94): 홈 · 블로그 · 처방침은 영어 먼저, 앱 안에서 배우는 한국어는 크게
    `Free, no sign-up web apps for beginners learning Korean. The home page and blog lead with English, with Korean below. Inside the apps, the Korean you practice is shown large, with English alongside. Made by ${AUTHOR.name}, a Korean teacher in Seoul.`,
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
