/* 글 /notes/ (#50) — 글을 더하면 목록 · 주소 · 검색 메타 · 앱 링크에 저절로 들어가는지 */
import { describe, expect, it } from "vitest";
import { APPS } from "../apps";
import { docHtml } from "../doc";
import { jsonLd, llmsTxt, pageMeta, prerenderHtml, sitemapXml } from "../seo";
import { noteBySlug, NOTES, NOTES_PER_PAGE, NOTES_TITLE, notesForApp, pageList, paginate } from "./index";

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
  it("제목 · 소개 · 배우는 한국어(예문 · 카드 · 이응이)는 한국어 + 영어, 한자 없음", () => {
    for (const n of NOTES) {
      const learn = n.blocks.flatMap((b) => (b.t === "ex" || b.t === "cards" ? b.items : b.t === "ieung" ? [b] : []));
      for (const i of [n.title, n.summary, ...learn]) {
        expect(i.ko, `${n.slug} ${JSON.stringify(i)}`).toMatch(/[가-힣]/);
        expect(i.en, `${n.slug} ${JSON.stringify(i)}`).toMatch(/[A-Za-z]/);
        expect(i.ko + i.en, n.slug).not.toMatch(HANJA);
      }
    }
  });
  it("설명 글(소제목 · 문단 · 알아 두기 · 목록 · 링크)은 영어만 — 한국어 병기 없음 (#122)", () => {
    for (const n of NOTES)
      for (const b of n.blocks) {
        const prose = b.t === "list" ? b.items : b.t === "h" || b.t === "p" || b.t === "tip" || b.t === "link" ? [b] : [];
        for (const i of prose) {
          expect(i.ko, `${n.slug} ${i.en}`).toBeUndefined();
          expect(i.en, n.slug).toMatch(/[A-Za-z]/);
          expect(i.en, n.slug).not.toMatch(HANJA);
        }
      }
  });
  it("바깥 링크는 https", () => {
    for (const n of NOTES) for (const b of n.blocks) if (b.t === "link") expect(b.href, n.slug).toMatch(/^https:\/\//);
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
      expect(html).toContain(docHtml(n.blocks, "en")); // 블로그는 영어 먼저 (#94)
      expect(html).toContain(`href="/notes/"`);
      for (const s of n.apps) expect(html).toContain(`href="/${s}/"`);
    }
    const list = prerenderHtml("notes");
    for (const n of paginate(NOTES, 1).items) expect(list).toContain(`href="/notes/${n.slug}/"`); // 화면 첫 쪽과 같게
  });
  it("이름 · 영어 먼저 (#94)", () => {
    expect(NOTES_TITLE).toEqual({ ko: "한국어 공부 블로그", en: "Korean Learning Blog" });
    expect(prerenderHtml("notes")).toMatch(/Korean Learning Blog<span[^>]*>한국어 공부 블로그</);
    expect(pageMeta("notes").title).toContain("Korean Learning Blog");
  });
});

describe("쪽 나누기 (#94)", () => {
  const xs = Array.from({ length: 23 }, (_, i) => i + 1);
  it("한 쪽에 열 개, 범위 밖은 가까운 끝 쪽", () => {
    expect(NOTES_PER_PAGE).toBe(10);
    expect(paginate(xs, 1)).toEqual({ items: xs.slice(0, 10), page: 1, pages: 3 });
    expect(paginate(xs, 3).items).toEqual([21, 22, 23]);
    expect(paginate(xs, 99).page).toBe(3);
    expect(paginate(xs, 0).page).toBe(1);
    expect(paginate(xs, NaN).page).toBe(1);
    expect(paginate([], 2)).toEqual({ items: [], page: 1, pages: 1 });
  });
  it("쪽 번호 줄 — 일곱 쪽까지는 모두, 넘으면 …", () => {
    expect(pageList(1, 1)).toEqual([1]);
    expect(pageList(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pageList(1, 20)).toEqual([1, 2, null, 20]);
    expect(pageList(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
    expect(pageList(20, 20)).toEqual([1, null, 19, 20]);
  });
  it("관련 앱의 정적 본문에도 글 링크", () => {
    for (const a of APPS) for (const n of notesForApp(a.slug)) expect(prerenderHtml(a.slug)).toContain(`href="/notes/${n.slug}/"`);
  });
});

describe("글: 무슨 띠예요?", () => {
  it("대답은 동물 + 띠, 붙여 쓴다 — 카드도 같은 꼴", () => {
    const n = noteBySlug("korean-zodiac-tti")!;
    expect(docHtml(n.blocks, "en")).toContain("말 (horse) + 띠 → 말띠");
    const cards = n.blocks.flatMap((b) => (b.t === "cards" ? b.items : []));
    for (const c of cards) expect(c.ko).toMatch(/^[가-힣]+띠$/);
  });
});
