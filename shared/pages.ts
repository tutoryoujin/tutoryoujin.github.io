/* ============================================================
   앱이 아닌 페이지 — 개인정보 처리방침 같은 것.

   앱(shared/apps.ts)과 달리 헤더 메뉴 · 첫 화면 카드에는 나오지 않고,
   검색 메타 · 정적 본문 · sitemap 에만 들어간다 (shared/seo.ts).
   폴더는 앱과 같이 apps/<slug>/index.html — vite 가 그대로 빌드한다.

   slug 는 주소다. 한번 나가면 바꾸지 않는다.
   ============================================================ */
import type { Block, Lead } from "./doc";
import { NOTES, NOTES_TITLE, type Note } from "./notes";
import { privacyBlocks, PRIVACY_UPDATED } from "./privacy";
import { SITE, type SiteConfig } from "./site";

export type SitePage = {
  /** page = 보통 페이지 · notes = 글 목록 · note = 글 하나 (/notes/<slug>/) */
  kind: "page" | "notes" | "note";
  slug: string;
  ko: string;
  en: string;
  /** 검색 결과 제목 앞부분 */
  searchTitle: string;
  /** meta description — 영어 먼저 + 한국어 */
  description: string;
  /** 어느 말을 크게 둘지 (shared/doc.ts) */
  lead: Lead;
  /** 마지막으로 고친 날 (YYYY-MM-DD) */
  updated: string;
  /** 본문 — 설정(분석 · 구독)에 따라 달라질 수 있어서 함수 */
  blocks: (c?: SiteConfig) => Block[];
  /** kind "note" 일 때 그 글 */
  note?: Note;
};

export const PAGES: SitePage[] = [
  {
    kind: "page",
    slug: "privacy",
    ko: "개인정보 처리방침",
    en: "Privacy",
    searchTitle: "Privacy",
    description:
      "What Korean with Youjin keeps and what it doesn’t: no accounts, no cookies, progress saved only on your device. 개인정보 처리방침.",
    lead: "en",
    updated: PRIVACY_UPDATED,
    blocks: (c = SITE) => privacyBlocks(c),
  },
  {
    kind: "notes",
    slug: "notes",
    ko: NOTES_TITLE.ko,
    en: NOTES_TITLE.en,
    // 「| Korean with Youjin」까지 65자 안 (#72)
    searchTitle: "Korean Learning Blog: Grammar & Culture",
    description:
      "Short posts on Korean grammar, words and culture for beginners, by Youjin, a Korean teacher in Seoul. 한국어를 배우는 사람을 위한 짧은 글.",
    lead: "en",
    updated: NOTES[0]?.updated ?? NOTES[0]?.added ?? "",
    blocks: () => [],
  },
  // 글 하나 = 주소 하나. 빌드는 notes/index.html 을 글마다 복사한다 (vite.config.ts)
  ...NOTES.map(
    (n): SitePage => ({
      kind: "note",
      slug: `notes/${n.slug}`,
      ko: n.title.ko,
      en: n.title.en,
      searchTitle: n.searchTitle,
      description: n.description,
      lead: "en",
      updated: n.updated ?? n.added,
      blocks: () => n.blocks,
      note: n,
    }),
  ),
];

export const pageBySlug = (slug: string) => PAGES.find((p) => p.slug === slug);

/**
 * 404 — 지난 주소 · 오타로 온 사람에게 GitHub 기본 404 대신 (#95).
 * apps/404/ 로 빌드하고 vite.config.ts 가 dist/404.html 로 옮긴다 (GitHub Pages 가 찾는 이름).
 * 페이지 목록(PAGES)에는 넣지 않는다 — sitemap · 구조화 데이터에 들어가면 안 된다
 */
export const NOT_FOUND = {
  slug: "404",
  en: "Page not found",
  ko: "페이지를 찾을 수 없어요",
  lead: {
    en: "The address may be old or mistyped. Try one of these.",
    ko: "주소가 바뀌었거나 잘못 적혔을 수 있어요. 여기서 골라 보세요.",
  },
  description: "This page doesn’t exist. Find free apps for learning Korean and the Korean Learning Blog. 페이지를 찾을 수 없어요.",
};
