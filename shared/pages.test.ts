/* 앱이 아닌 페이지 — 개인정보 처리방침 (#79) */
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { APPS } from "./apps";
import { docHtml, docText } from "./doc";
import { NOT_FOUND, PAGES } from "./pages";
import { privacyBlocks } from "./privacy";
import { headTags, jsonLd, llmsTxt, noteOg, pageLang, pageMeta, prerenderHtml, sitemapXml } from "./seo";
import { SITE, type SiteConfig } from "./site";

const OFF: SiteConfig = { ...SITE, analytics: { provider: "goatcounter", id: "" }, subscribe: { provider: "kit", formId: "" } };
const ON: SiteConfig = { ...SITE, analytics: { provider: "goatcounter", id: "tutoryoujin" }, subscribe: { provider: "kit", formId: "123" } };

describe("페이지 목록", () => {
  it("apps/ 의 폴더는 모두 앱이거나 페이지다 — 빠지면 빌드 메타가 터진다", () => {
    const dir = fileURLToPath(new URL("../apps/", import.meta.url));
    const known = new Set([...APPS.map((a) => a.slug), ...PAGES.map((p) => p.slug), NOT_FOUND.slug]);
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      if (d.isDirectory() && existsSync(dir + d.name + "/index.html")) expect(known, d.name).toContain(d.name);
    }
  });
  it("앱과 페이지의 주소가 겹치지 않는다", () => {
    for (const p of PAGES) expect(APPS.map((a) => a.slug)).not.toContain(p.slug);
  });
  it("메타 · sitemap · 구조화 데이터 · 정적 본문", () => {
    for (const p of PAGES) {
      const m = pageMeta(p.slug);
      expect(m.url).toBe(`https://tutoryoujin.github.io/${p.slug}/`);
      expect(m.title.length).toBeLessThanOrEqual(65);
      expect(m.description).toMatch(/^[A-Z]/);
      expect(m.description).toMatch(/[가-힣]/);
      expect(headTags(p.slug).find((t) => t.tag === "title")?.children).toBe(m.title);
      expect(sitemapXml()).toContain(`<loc>${m.url}</loc>`);
      const types = (jsonLd(p.slug) as { "@graph": { "@type": string }[] })["@graph"].map((g) => g["@type"]);
      expect(types).toEqual([{ page: "WebPage", notes: "CollectionPage", note: "BlogPosting" }[p.kind], "BreadcrumbList"]);
      const html = prerenderHtml(p.slug);
      expect(html).toMatch(/^<main data-prerender /);
      expect(html).toContain("<h1");
      expect(html).toContain(`href="/"`);
    }
  });
});

describe("개인정보 처리방침", () => {
  const text = (c: SiteConfig) => docText(privacyBlocks(c));
  it("꺼진 기능은 적지 않는다 — 분석 · 이메일", () => {
    expect(text(OFF)).not.toContain("GoatCounter");
    expect(text(OFF)).not.toContain("Kit");
    expect(text(OFF)).not.toMatch(/email/i);
  });
  it("켜면 그 문단이 생긴다", () => {
    expect(text(ON)).toContain("GoatCounter");
    expect(text(ON)).toContain("Kit");
    expect(text(ON)).toMatch(/unsubscribe/);
  });
  it("모든 문단이 영어 · 한국어 둘 다", () => {
    for (const b of privacyBlocks(ON)) {
      const items = b.t === "quiz" ? b.items.map((i) => i.q) : "items" in b ? b.items : b.t === "widget" ? [] : [b];
      for (const i of items) {
        expect(i.en, JSON.stringify(i)).toMatch(/[A-Za-z]/);
        expect(i.ko, JSON.stringify(i)).toMatch(/[가-힣]/);
      }
    }
  });
  it("정적 본문은 화면과 같은 글 — 영어가 앞", () => {
    const html = docHtml(privacyBlocks(OFF), "en");
    expect(html).toContain("No sign-up, no accounts, no cookies.");
    expect(html.indexOf("No sign-up")).toBeLessThan(html.indexOf("가입도"));
    expect(prerenderHtml("privacy")).toContain("No sign-up");
  });
});

describe("영어로 검색하는 학습자 (#95)", () => {
  const attr = (slug: string, key: string) => headTags(slug).find((t) => t.attrs?.property === key || t.attrs?.name === key)?.attrs?.content;
  it("앱 밖 페이지는 lang en, 앱은 ko (앱 안 순서는 #92)", () => {
    expect(pageLang("")).toBe("en");
    expect(pageLang(NOT_FOUND.slug)).toBe("en");
    for (const p of PAGES) expect(pageLang(p.slug), p.slug).toBe("en");
    for (const a of APPS) expect(pageLang(a.slug), a.slug).toBe("ko");
  });
  it("og:locale 은 모든 페이지 en_US, 한국어는 alternate", () => {
    for (const slug of ["", ...APPS.map((a) => a.slug), ...PAGES.map((p) => p.slug)]) {
      expect(attr(slug, "og:locale"), slug).toBe("en_US");
      expect(attr(slug, "og:locale:alternate"), slug).toBe("ko_KR");
    }
  });
  it("구조화 데이터 inLanguage 는 페이지 언어가 먼저", () => {
    const lang = (slug: string) => (jsonLd(slug) as { "@graph": { inLanguage?: string[] }[] })["@graph"][0].inLanguage;
    expect(lang("")).toEqual(["en", "ko"]);
    for (const p of PAGES) expect(lang(p.slug), p.slug).toEqual(["en", "ko"]);
    for (const a of APPS) expect(lang(a.slug), a.slug).toEqual(["ko", "en"]);
  });
  it("영어 먼저인 정적 본문의 한국어 줄에는 lang=ko", () => {
    for (const slug of ["", NOT_FOUND.slug, ...PAGES.map((p) => p.slug)]) expect(prerenderHtml(slug), slug).toContain(`lang="ko"`);
  });
  it("홈 정적 본문 h1 은 화면과 같은 「Korean with Youjin」(#84)", () => {
    expect(prerenderHtml("")).toMatch(/<h1[^>]*>Korean with Youjin</);
  });
  it("llms.txt 는 화면 순서를 맞게 적는다 — 「Every screen shows Korean first」가 아니다", () => {
    expect(llmsTxt()).not.toContain("Every screen shows Korean first");
    expect(llmsTxt()).toContain("lead with English");
  });
  it("sitemap lastmod 는 고친 날을 아는 페이지에만", () => {
    const xml = sitemapXml();
    for (const p of PAGES) expect(xml, p.slug).toContain(`<loc>${pageMeta(p.slug).url}</loc><lastmod>${p.updated}</lastmod>`);
    for (const a of APPS) expect(xml, a.slug).toContain(`<loc>${pageMeta(a.slug).url}</loc></url>`);
    expect(xml).toContain(`<loc>https://tutoryoujin.github.io/</loc></url>`);
    for (const m of xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) expect(m[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("모든 앱 · 블로그 글에 공유 그림이 있고, public/ 에 파일도 있다", () => {
    const pub = (u: string) => fileURLToPath(new URL("../public" + new URL(u).pathname, import.meta.url));
    for (const slug of [...APPS.map((a) => a.slug), ...PAGES.map((p) => p.slug)]) {
      const img = pageMeta(slug).image;
      expect(img, `${slug} — 그림이 없으면 tools/og/build_og.py`).toBeTruthy();
      expect(existsSync(pub(img!.url)), `${img!.url} — .venv/bin/python tools/og/build_og.py`).toBe(true);
      expect(img!.alt).toBeTruthy();
    }
    for (const p of PAGES.filter((x) => x.note)) expect(pageMeta(p.slug).image!.url).toContain(noteOg(p.note!.slug));
  });
  it("404: 색인하지 않고 대표 주소 없음, sitemap 에 없음, 앱 · 블로그 · 홈 링크", () => {
    const tags = headTags(NOT_FOUND.slug);
    expect(tags.find((t) => t.attrs?.name === "robots")?.attrs?.content).toBe("noindex");
    expect(tags.some((t) => t.attrs?.rel === "canonical")).toBe(false);
    expect(pageMeta(NOT_FOUND.slug).title.length).toBeLessThanOrEqual(65);
    expect(sitemapXml()).not.toContain("404");
    const html = prerenderHtml(NOT_FOUND.slug);
    expect(html).toMatch(/^<main data-prerender /);
    for (const href of ["/", "/notes/", ...APPS.map((a) => `/${a.slug}/`)]) expect(html).toContain(`href="${href}"`);
  });
});
