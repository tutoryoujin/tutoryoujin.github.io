/* ============================================================
   날짜 읽기 — 달력 앱 · 블로그 글이 같이 쓴다 (#115)
   - 연 · 월 · 일은 모두 한자어 숫자 (일, 이, 삼 …)
   - 예외: 6월 → 유월, 10월 → 시월 (일은 그대로 육 일, 십 일)
   ============================================================ */
import { sino } from "./numbers";

export const readYear = (y: number) => sino(y) + " 년";
export const readMonth = (m: number) => (m === 6 ? "유월" : m === 10 ? "시월" : sino(m) + "월");
export const readDay = (d: number) => sino(d) + " 일";
/** 유월 육 일 */
export const readDate = (m: number, d: number) => `${readMonth(m)} ${readDay(d)}`;

/** 요일 — 0 = 일요일 (Date.getDay 와 같은 순서) */
export const WEEK = [
  ["일", "Sun", "Sunday"],
  ["월", "Mon", "Monday"],
  ["화", "Tue", "Tuesday"],
  ["수", "Wed", "Wednesday"],
  ["목", "Thu", "Thursday"],
  ["금", "Fri", "Friday"],
  ["토", "Sat", "Saturday"],
] as const;
/** 0 → 일요일 */
export const readWeekday = (wd: number) => WEEK[wd][0] + "요일";

/** 오늘을 0 으로 센 날 — 그저께 · 어제 · 오늘 · 내일 · 모레 */
export const RELATIVE: Record<number, [string, string]> = {
  [-2]: ["그저께", "the day before yesterday"],
  [-1]: ["어제", "yesterday"],
  0: ["오늘", "today"],
  1: ["내일", "tomorrow"],
  2: ["모레", "the day after tomorrow"],
};
