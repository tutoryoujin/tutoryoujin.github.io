/* 앱이 아닌 페이지 — 개인정보 처리방침 (#79) */
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { APPS } from "./apps";
import { docHtml, docText } from "./doc";
import { PAGES } from "./pages";
import { privacyBlocks } from "./privacy";
import { headTags, jsonLd, pageMeta, prerenderHtml, sitemapXml } from "./seo";
import { SITE, type SiteConfig } from "./site";

const OFF: SiteConfig = { ...SITE, analytics: { provider: "goatcounter", id: "" }, subscribe: { provider: "kit", formId: "" } };
const ON: SiteConfig = { ...SITE, analytics: { provider: "goatcounter", id: "tutoryoujin" }, subscribe: { provider: "kit", formId: "123" } };

describe("페이지 목록", () => {
  it("apps/ 의 폴더는 모두 앱이거나 페이지다 — 빠지면 빌드 메타가 터진다", () => {
    const dir = fileURLToPath(new URL("../apps/", import.meta.url));
    const known = new Set([...APPS.map((a) => a.slug), ...PAGES.map((p) => p.slug)]);
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
      expect(types).toEqual([{ page: "WebPage", notes: "CollectionPage", note: "Article" }[p.kind], "BreadcrumbList"]);
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
      const items = "items" in b ? b.items : b.t === "widget" ? [] : [b];
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
