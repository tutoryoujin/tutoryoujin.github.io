/* 글 /notes/ (#50) — 글을 더하면 목록 · 주소 · 검색 메타 · 앱 링크에 저절로 들어가는지 */
import { describe, expect, it } from "vitest";
import { APPS } from "../apps";
import { docHtml, headingId, headings } from "../doc";
import { FEED_PATH, headTags, jsonLd, llmsTxt, pageMeta, prerenderHtml, rssXml, sitemapXml } from "../seo";
import { readMonth } from "../korean/date";
import { CATEGORIES, categoryOf, moreIn, neighbors, noteBySlug, NOTE_UI, TOC_MIN, NOTES, NOTES_PER_PAGE, NOTES_TITLE, notesForApp, pageList, paginate, sameCategory } from "./index";

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
  it("구조화 데이터: 글은 BlogPosting(+ 분류 articleSection) + 경로(첫 화면 → 목록 → 글), 목록은 CollectionPage", () => {
    for (const n of NOTES) {
      const g = (jsonLd(`notes/${n.slug}`) as { "@graph": Record<string, unknown>[] })["@graph"];
      expect(g[0]["@type"]).toBe("BlogPosting");
      expect(g[0].articleSection).toBe(categoryOf(n).en);
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

describe("글: 지금 몇 시예요? (#114)", () => {
  // 예문은 shared/korean/time.ts 로 만든다 — 시계 앱과 같은 읽기인지 글자로 한 번 더
  const html = docHtml(noteBySlug("what-time-is-it-in-korean")!.blocks, "en");
  it.each(["세 시예요.", "세 시 십 분이에요.", "세 시 반이에요. (= 세 시 삼십 분이에요.)", "네 시 사십오 분이에요.", "오전 아홉 시예요.", "오후 두 시 반이에요.", "저녁 일곱 시에 만나요.", "세 시쯤 갈게요.", "열두 시 정각이에요."])(
    "%s",
    (s) => expect(html).toContain(s),
  );
  it("예문 옆 시계는 같은 시각", () => {
    const ex = noteBySlug("what-time-is-it-in-korean")!.blocks.flatMap((b) => (b.t === "ex" ? b.items : []));
    const clock = (ko: string) => ex.find((i) => i.ko === ko)?.clock;
    expect(clock("세 시 십 분이에요.")).toBe(3 * 60 + 10);
    expect(clock("오후 두 시 반이에요.")).toBe(14 * 60 + 30);
    expect(clock("저녁 일곱 시에 만나요.")).toBe(19 * 60);
  });
  it("분 — 한자어 숫자 1~10 과 분 읽기", () => {
    const cards = noteBySlug("what-time-is-it-in-korean")!.blocks.flatMap((b) => (b.t === "cards" ? [b.items] : []));
    expect(cards.some((c) => c.map((i) => i.ko).join(" ") === "일 이 삼 사 오 육 칠 팔 구 십")).toBe(true);
    for (const s of ["오 분", "십 분", "십오 분", "이십 분", "이십삼 분", "삼십 분", "사십오 분", "오십구 분"]) expect(html).toContain(s);
    expect(html).not.toContain("일십");
  });
  it("시 카드 12장 — 짧아지는 것만 표시", () => {
    for (const s of ["한 시", "두 시", "세 시", "네 시", "열한 시", "열두 시", "하나 → 한", "열둘 → 열두"]) expect(html).toContain(s);
    expect(html).not.toContain("다섯 → 다섯");
  });
});

describe("글: 오늘 며칠이에요? (#115)", () => {
  // 예문은 shared/korean/date.ts 로 만든다 — 달력 앱과 같은 읽기인지 글자로 한 번 더
  const n = noteBySlug("todays-date-in-korean")!;
  const html = docHtml(n.blocks, "en");
  it.each([
    "오늘 며칠이에요?",
    "오늘 몇 월 며칠이에요?",
    "삼월 일 일이에요.",
    "오월 오 일이에요.",
    "유월 육 일이에요.",
    "시월 십 일이에요.",
    "유월 십 일이에요.",
    "이천이십육 년 십일월 이십칠 일이에요.",
    "금요일이에요.",
    "오늘은 십일월 이십칠 일 금요일이에요.",
  ])("%s", (s) => expect(html).toContain(s));
  it("달 카드 12장 — 유월 · 시월만 바뀜 표시", () => {
    const months = n.blocks.flatMap((b) => (b.t === "cards" && b.items[0].mark === "1월" ? b.items : []));
    expect(months.map((c) => c.ko)).toEqual(Array.from({ length: 12 }, (_, i) => readMonth(i + 1)));
    expect(months.filter((c) => c.sub).map((c) => c.sub)).toEqual(["육월 → 유월", "십월 → 시월"]);
  });
  it("틀린 읽기 · 철자는 바른 쪽으로만 나온다", () => {
    const learn = n.blocks.flatMap((b) => (b.t === "ex" ? b.items.map((i) => i.ko) : [])).join(" ");
    for (const w of ["육월", "십월", "몇 일", "몇일"]) expect(learn).not.toContain(w);
  });
  it("요일 일곱 — 2026-11-27 은 금요일", () => {
    expect(new Date(2026, 10, 27).getDay()).toBe(5);
    for (const s of ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]) expect(html).toContain(s);
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

describe("분류 (#116)", () => {
  it("분류 slug 는 영어 소문자, 겹치지 않는다. 이름은 영어 + 한국어", () => {
    for (const c of CATEGORIES) {
      expect(c.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(c.en).toMatch(/[A-Za-z]/);
      expect(c.ko).toMatch(/[가-힣]/);
    }
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(CATEGORIES.length);
  });
  it("모든 글에 있는 분류", () => {
    for (const n of NOTES) expect(CATEGORIES.map((c) => c.slug), n.slug).toContain(n.category);
  });
  it("같은 분류 글: 자기 자신은 빼고 같은 분류만. 글 끝 「More in」은 보류 (#123)", () => {
    for (const n of NOTES) {
      for (const x of sameCategory(n)) {
        expect(x.category).toBe(n.category);
        expect(x.slug).not.toBe(n.slug);
      }
      const html = prerenderHtml(`notes/${n.slug}`);
      expect(html).toContain(categoryOf(n).en.replace(/&/g, "&amp;"));
      expect(html).not.toContain(moreIn(n).en);
    }
  });
});

describe("글 페이지 다듬기 (#119)", () => {
  it("소제목 id: 영어 소문자 낱말, 글 안에서 겹치지 않는다", () => {
    expect(headingId({ en: "AM, PM, and “around”" })).toBe("am-pm-and-around");
    expect(headingId({ id: "keep-me", en: "New title" })).toBe("keep-me");
    for (const n of NOTES) {
      const ids = headings(n.blocks).map((h) => h.id);
      for (const id of ids) expect(id, n.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(new Set(ids).size, n.slug).toBe(ids.length);
    }
  });
  it("목차: 소제목이 넉넉한 글은 정적 본문에도 목차 · 같은 id", () => {
    for (const n of NOTES) {
      const html = prerenderHtml(`notes/${n.slug}`);
      const toc = headings(n.blocks);
      if (toc.length >= TOC_MIN) for (const h of toc) {
        expect(html).toContain(`href="#${h.id}"`);
        expect(html).toContain(`<h2 id="${h.id}"`);
      }
      else expect(html).not.toContain(NOTE_UI.toc.en);
    }
  });
  it("이전 · 다음 글: 날짜순으로 이어진다", () => {
    NOTES.forEach((n, i) => {
      const { newer, older } = neighbors(n);
      expect(newer).toBe(NOTES[i - 1]);
      expect(older).toBe(NOTES[i + 1]);
    });
  });
  it("RSS: 모든 글 · 자기 주소 · 날짜는 글 날짜 (빌드마다 바뀌지 않는다)", () => {
    const x = rssXml();
    expect(x.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(x).toContain(`<atom:link href="https://tutoryoujin.github.io${FEED_PATH}" rel="self"`);
    for (const n of NOTES) expect(x).toContain(`<guid isPermaLink="true">https://tutoryoujin.github.io/notes/${n.slug}/</guid>`);
    expect(x).toContain("<pubDate>Thu, 19 Nov 2026 15:00:00 GMT</pubDate>"); // 수능 글 2026-11-20 서울 0시
    expect(x).not.toContain("lastBuildDate");
    expect(rssXml()).toBe(x);
  });
  it("블로그 페이지에만 피드 링크", () => {
    const feed = (slug: string) => headTags(slug).some((t) => t.attrs?.type === "application/rss+xml");
    expect(feed("notes")).toBe(true);
    for (const n of NOTES) expect(feed(`notes/${n.slug}`)).toBe(true);
    expect(feed("")).toBe(false);
    expect(feed("korean-clock")).toBe(false);
  });
});

describe("글 안 퀴즈 (#120)", () => {
  const quizzes = NOTES.flatMap((n) => n.blocks.flatMap((b) => (b.t === "quiz" ? [{ n, b }] : [])));
  it("정답은 보기 중 하나뿐, 오답은 서로 다르고 정답과 다르다, 한자 없음", () => {
    for (const { n, b } of quizzes)
      for (const i of b.items) {
        const texts = i.wrong.map((w) => w.text);
        expect(texts, n.slug).not.toContain(i.answer);
        expect(new Set(texts).size, n.slug).toBe(texts.length);
        expect(texts.length, n.slug).toBeGreaterThanOrEqual(2);
        expect(i.answer + texts.join(""), n.slug).not.toMatch(HANJA);
      }
  });
  it("시간 글: 글 안 퀴즈 대신 시계 앱으로 (#123). 수능 · 띠는 연결할 앱 없음", () => {
    const n = noteBySlug("what-time-is-it-in-korean")!;
    expect(n.blocks.some((b) => b.t === "quiz")).toBe(false);
    expect(n.apps).toEqual(["korean-clock"]);
    expect(noteBySlug("korean-suneung-exam")!.apps).toEqual([]);
    expect(noteBySlug("korean-zodiac-tti")!.apps).toEqual([]);
    expect(prerenderHtml("notes/korean-zodiac-tti")).not.toContain("Practice in the app");
  });
});
