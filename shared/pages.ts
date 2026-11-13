/* ============================================================
   앱이 아닌 페이지 — 개인정보 처리방침 같은 것.

   앱(shared/apps.ts)과 달리 헤더 메뉴 · 첫 화면 카드에는 나오지 않고,
   검색 메타 · 정적 본문 · sitemap 에만 들어간다 (shared/seo.ts).
   폴더는 앱과 같이 apps/<slug>/index.html — vite 가 그대로 빌드한다.

   slug 는 주소다. 한번 나가면 바꾸지 않는다.
   ============================================================ */
import type { Block, Lead } from "./doc";
import { privacyBlocks, PRIVACY_UPDATED } from "./privacy";
import { SITE, type SiteConfig } from "./site";

export type SitePage = {
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
};

export const PAGES: SitePage[] = [
  {
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
];

export const pageBySlug = (slug: string) => PAGES.find((p) => p.slug === slug);
