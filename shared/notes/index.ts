/* ============================================================
   글 /notes/ (#50) — 하나뿐인 원본.

   새 글 = shared/notes/<slug>.ts 하나 + 아래 목록에 한 줄.
   그러면 목록 · 검색 · 주소(/notes/<slug>/) · sitemap · llms.txt ·
   관련 앱 아래 링크에 저절로 들어간다.

   - 한국어 먼저, 영어 바로 아래. 해요체. 한자 쓰지 않음
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

/** 목록 페이지 화면 이름 */
export const NOTES_TITLE = { ko: "선생님 메모", en: "Teacher’s notes" };
