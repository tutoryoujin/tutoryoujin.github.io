/* ============================================================
   글 /notes/ (#50) — 하나뿐인 원본.

   새 글 = shared/notes/<slug>.ts 하나 + 아래 목록에 한 줄.
   그러면 목록 · 검색 · 주소(/notes/<slug>/) · sitemap · llms.txt ·
   관련 앱 아래 링크에 저절로 들어간다.

   - 화면은 영어가 크고 한국어가 아래 (#94). 예문처럼 배우는 한국어는 그대로 크게. 해요체. 한자 쓰지 않음
   - 수업 · 튜터링 · 예약 · 외부 결제 안내 없이 학습 팁만
   - 읽기 규칙(숫자 · 띠 …)을 적으면 shared/korean 의 함수로 만들고 테스트한다
   ============================================================ */
import { koreanZodiacTti } from "./korean-zodiac-tti";
import type { Note } from "./types";

export type { Note } from "./types";

/** 최신순 */
export const NOTES: Note[] = [koreanZodiacTti].sort((a, b) => b.added.localeCompare(a.added));

export const noteBySlug = (slug: string) => NOTES.find((n) => n.slug === slug);
/** 이 앱과 관련된 글 */
export const notesForApp = (app: string) => NOTES.filter((n) => n.apps.includes(app));

/** 목록 페이지 이름 — 학습자가 붙여 검색하는 말 (korean learning blog, #94) */
export const NOTES_TITLE = { ko: "한국어 공부 블로그", en: "Korean Learning Blog" };
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
