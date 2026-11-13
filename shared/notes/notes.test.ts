/* 글 /notes/ (#50) — 글을 더하면 목록 · 주소 · 검색 메타 · 앱 링크에 저절로 들어가는지 */
import { describe, expect, it } from "vitest";
import { APPS } from "../apps";
import { docHtml } from "../doc";
import { jsonLd, llmsTxt, pageMeta, prerenderHtml, sitemapXml } from "../seo";
import { NOTES, notesForApp } from "./index";

const HANJA = /[一-鿿]/;

describe("글 원본", () => {
  it("주소는 영어 소문자 낱말, 겹치지 않는다", () => {
    for (const n of NOTES) expect(n.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(NOTES.map((n) => n.slug)).size).toBe(NOTES.length);
  });
  it("날짜 · 최신순", () => {
    for (const n of NOTES) expect(n.added).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect([...NOTES].sort((a, b) => b.added.localeCompare(a.added))).toEqual(NOTES);
  });
  it("관련 앱은 있는 앱", () => {
    for (const n of NOTES) for (const s of n.apps) expect(APPS.map((a) => a.slug), n.slug).toContain(s);
  });
  it("모든 블록이 한국어 · 영어 둘 다, 한자 없음", () => {
    for (const n of NOTES) {
      for (const b of [{ t: "title", ...n.title }, { t: "summary", ...n.summary }, ...n.blocks]) {
        const items = "items" in b ? b.items : b.t === "widget" ? [] : [b as { ko: string; en: string }];
        for (const i of items) {
          expect(i.ko, `${n.slug} ${JSON.stringify(i)}`).toMatch(/[가-힣]/);
          expect(i.en, `${n.slug} ${JSON.stringify(i)}`).toMatch(/[A-Za-z]/);
          expect(i.ko + i.en, n.slug).not.toMatch(HANJA);
        }
      }
    }
  });
});

describe("글 페이지 — 검색 · 정적 본문", () => {
  it("글마다 주소 · 제목 · 설명", () => {
    for (const n of NOTES) {
      const m = pageMeta(`notes/${n.slug}`);
      expect(m.url).toBe(`https://tutoryoujin.github.io/notes/${n.slug}/`);
      expect(m.title.length, m.title).toBeLessThanOrEqual(65);
      expect(m.description).toMatch(/^[A-Z]/);
      expect(m.description).toMatch(/[가-힣]/);
    }
  });
  it("sitemap · llms.txt 에 목록과 글", () => {
    const xml = sitemapXml();
    expect(xml).toContain("<loc>https://tutoryoujin.github.io/notes/</loc>");
    for (const n of NOTES) {
      expect(xml).toContain(`<loc>https://tutoryoujin.github.io/notes/${n.slug}/</loc>`);
      expect(llmsTxt()).toContain(`(https://tutoryoujin.github.io/notes/${n.slug}/)`);
    }
  });
  it("구조화 데이터: 글은 Article + 경로(첫 화면 → 목록 → 글), 목록은 CollectionPage", () => {
    for (const n of NOTES) {
      const g = (jsonLd(`notes/${n.slug}`) as { "@graph": Record<string, unknown>[] })["@graph"];
      expect(g[0]["@type"]).toBe("Article");
      expect(g[0].datePublished).toBe(n.added);
      expect((g[1].itemListElement as unknown[]).length).toBe(3);
      expect(JSON.stringify(g)).not.toMatch(/aggregateRating|review/i);
    }
    expect((jsonLd("notes") as { "@graph": { "@type": string }[] })["@graph"][0]["@type"]).toBe("CollectionPage");
  });
  it("정적 본문 = 화면의 글 + 앱 링크 + 목록 링크", () => {
    for (const n of NOTES) {
      const html = prerenderHtml(`notes/${n.slug}`);
      expect(html).toMatch(/^<main data-prerender /);
      expect(html).toContain(docHtml(n.blocks, "ko"));
      expect(html).toContain(`href="/notes/"`);
      for (const s of n.apps) expect(html).toContain(`href="/${s}/"`);
    }
    const list = prerenderHtml("notes");
    for (const n of NOTES) expect(list).toContain(`href="/notes/${n.slug}/"`);
  });
  it("관련 앱의 정적 본문에도 글 링크", () => {
    for (const a of APPS) for (const n of notesForApp(a.slug)) expect(prerenderHtml(a.slug)).toContain(`href="/notes/${n.slug}/"`);
  });
});
