/* ============================================================
   날짜 읽기 규칙
   - 연·월·일은 모두 한자어 숫자 (일, 이, 삼 …)
   - 예외: 6월 → 유월, 10월 → 시월
   ============================================================ */
import { native, sino } from "@yj/korean/numbers";
import type { Choice } from "@yj/ui";

export const readYear = (y: number) => sino(y) + " 년";
export const readMonth = (m: number) => (m === 6 ? "유월" : m === 10 ? "시월" : sino(m) + "월");
export const readDay = (d: number) => sino(d) + " 일";

export const WEEK = [
  ["일", "Sun", "Sunday"],
  ["월", "Mon", "Monday"],
  ["화", "Tue", "Tuesday"],
  ["수", "Wed", "Wednesday"],
  ["목", "Thu", "Thursday"],
  ["금", "Fri", "Friday"],
  ["토", "Sat", "Saturday"],
] as const;

export const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* 양력 고정 공휴일 (설날·추석처럼 음력인 날은 해마다 달라서 뺐어요) */
export const HOLIDAYS: Record<string, [string, string]> = {
  "1-1": ["신정", "New Year’s Day"],
  "3-1": ["삼일절", "Independence Movement Day"],
  "5-5": ["어린이날", "Children’s Day"],
  "6-6": ["현충일", "Memorial Day"],
  "8-15": ["광복절", "Liberation Day"],
  "10-3": ["개천절", "National Foundation Day"],
  "10-9": ["한글날", "Hangeul Day"],
  "12-25": ["크리스마스", "Christmas"],
};

export const RELATIVE: Record<number, [string, string]> = {
  [-2]: ["그저께", "the day before yesterday"],
  [-1]: ["어제", "yesterday"],
  0: ["오늘", "today"],
  1: ["내일", "tomorrow"],
  2: ["모레", "the day after tomorrow"],
};

export const SPECIAL_NOTE: Record<number, [string, string]> = {
  6: ["6월은 ‘육월’이 아니라 ‘유월’이라고 읽어요.", "June is read 유월, not 육월."],
  10: ["10월은 ‘십월’이 아니라 ‘시월’이라고 읽어요.", "October is read 시월, not 십월."],
};

const SINO_WHY = { ko: "월·일은 한자어 숫자로 읽어요 (일, 이, 삼…).", en: "Months and days use Sino-Korean numbers (일, 이, 삼…)." };

/** 학생들이 자주 하는 실수로 오답을 만든다 */
export function wrongChoices(m: number, d: number, rand: () => number = Math.random): Choice[] {
  const day = readDay(d);
  const month = readMonth(m);
  const dayWrong: Choice[] = [
    { text: `${month} ${readDay(d === 1 ? 2 : d - 1)}`, why: { ko: "날짜를 다시 봐요.", en: "Check the day again." } },
  ];
  if (d >= 10 && d < 20)
    dayWrong.push({ text: `${month} 일${day}`, why: { ko: "10은 ‘일십’이 아니라 ‘십’이에요.", en: "10 is just 십, not 일십." } });

  if (m === 6 || m === 10) {
    // 유월·시월은 헷갈리는 세 가지 읽기를 꼭 함께 보여 줘요
    // 6월: 유월(정답)·육월·여섯월 / 10월: 시월(정답)·십월·열월
    const [plainWrong, nativeWrong] = m === 6 ? ["육월", "여섯월"] : ["십월", "열월"];
    const special = { ko: SPECIAL_NOTE[m][0], en: SPECIAL_NOTE[m][1] };
    return [
      { text: `${plainWrong} ${day}`, why: special },
      { text: `${nativeWrong} ${day}`, why: special },
      dayWrong[Math.floor(rand() * dayWrong.length)],
    ];
  }
  const pool: Choice[] = [
    { text: `${native(m)}월 ${native(d)} 일`, why: SINO_WHY }, // 고유어 숫자로 읽음
    { text: `${readMonth(m === 12 ? 11 : m + 1)} ${day}`, why: { ko: "달을 다시 봐요.", en: "Check the month again." } },
    ...dayWrong,
  ];
  // 섞어서 셋
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}
