/* ============================================================
   글 /notes/ (#50) — 하나뿐인 원본.

   새 글 = shared/notes/<slug>.ts 하나 + 아래 목록에 한 줄.
   그러면 목록 · 검색 · 주소(/notes/<slug>/) · sitemap · llms.txt ·
   관련 앱 아래 링크에 저절로 들어간다.

   - 설명 글(h · p · tip · list · link)은 영어만, 한국어 병기 없음 (#122). 예문 · 카드 · 이응이 말풍선처럼 배우는 한국어는 한국어가 크고 영어가 아래. 해요체. 한자 쓰지 않음
   - 수업 · 튜터링 · 예약 · 외부 결제 안내 없이 학습 팁만
   - 읽기 규칙(숫자 · 띠 …)을 적으면 shared/korean 의 함수로 만들고 테스트한다
   ============================================================ */
import { koreanSuneungExam } from "./korean-suneung-exam";
import { koreanZodiacTti } from "./korean-zodiac-tti";
import type { Note } from "./types";
import { whatTimeIsItInKorean } from "./what-time-is-it-in-korean";

export type { Note } from "./types";
export { CATEGORIES, categoryBySlug, type Category, type CategorySlug } from "./categories";
import { categoryBySlug } from "./categories";

/** 최신순 */
export const NOTES: Note[] = [koreanZodiacTti, koreanSuneungExam, whatTimeIsItInKorean].sort((a, b) => b.added.localeCompare(a.added));

export const noteBySlug = (slug: string) => NOTES.find((n) => n.slug === slug);
/** 글의 분류 */
export const categoryOf = (n: Note) => categoryBySlug(n.category);
/** 같은 분류의 다른 글 — 최신순, 많아야 max 개. 글 끝 「More in …」은 보류 (#123) — 다시 켤 때 쓴다 */
export const sameCategory = (n: Note, max = 3) => NOTES.filter((x) => x.category === n.category && x.slug !== n.slug).slice(0, max);
/** 글 끝 같은 분류 묶음의 제목 — 화면 · 정적 본문이 같은 말 */
export const moreIn = (n: Note) => {
  const c = categoryOf(n);
  return { en: `More in ${c.en}`, ko: `${c.ko} 글 더 보기` };
};

/** 이전 글(더 오래된) · 다음 글(더 새로운) — 모든 글 날짜순 (#119). 같은 분류는 「More in …」이 맡는다 */
export const neighbors = (n: Note) => {
  const i = NOTES.findIndex((x) => x.slug === n.slug);
  return { newer: i > 0 ? NOTES[i - 1] : undefined, older: NOTES[i + 1] as Note | undefined };
};
/** 소제목이 이만큼 이상이면 글 위에 목차 */
export const TOC_MIN = 4;
/** 목차 · 이전/다음 · 고친 날 — 화면 · 정적 본문이 같은 말 */
export const NOTE_UI = {
  toc: { en: "In this post", ko: "이 글의 차례" },
  older: { en: "Older post", ko: "이전 글" },
  newer: { en: "Newer post", ko: "다음 글" },
  updated: "Updated",
};

/** 이 앱과 관련된 글 */
export const notesForApp = (app: string) => NOTES.filter((n) => n.apps.includes(app));

/** 목록 페이지 이름 — 학습자가 붙여 검색하는 말 (korean learning blog, #94) */
export const NOTES_TITLE = { ko: "한국어 공부 블로그", en: "Korean Learning Blog" };
/** 앱 아래 관련 글 묶음의 h2 — 화면(Page) · 정적 본문(seo.ts)이 같은 말 (#101) */
export const RELATED_NOTES = { ko: "같이 읽어 보세요", en: "Read more" };
/** 헤더 링크처럼 짧게 쓸 때 */
export const NOTES_NAV = { ko: "블로그", en: "Blog" };

/** 목록 한 쪽에 몇 개 */
export const NOTES_PER_PAGE = 10;

/** 쪽 나누기 — page 는 1부터. 범위 밖이면 가까운 끝 쪽으로 */
export function paginate<T>(items: T[], page: number, size = NOTES_PER_PAGE): { items: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(pages, Math.max(1, Math.floor(page) || 1));
  return { items: items.slice((p - 1) * size, p * size), page: p, pages };
}

/** 쪽 번호 줄 — 일곱 쪽까지는 모두, 넘으면 처음 · 지금 앞뒤 · 끝과 사이 「…」(null) */
export function pageList(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const out: (number | null)[] = [];
  [...keep].sort((a, b) => a - b).forEach((p, i, a) => {
    if (i && p - a[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}
