/* 오늘 며칠이에요? — 날짜 묻고 답하기 (#115). Search Console 노출 검색어(today's date in korean …) 기준.
   #85 초안 4번(유월 · 시월)을 이어받음.
   날짜 읽기는 shared/korean/date.ts — 달력 앱과 같은 함수라 읽기가 어긋나지 않는다.
   설명 글은 영어만, 배우는 한국어(예문 · 카드 · 이응이)는 한국어 + 영어 (#122) */
import { readDate, readMonth, readWeekday, readYear, RELATIVE, WEEK } from "../korean/date";
import { josa, sino } from "../korean/numbers";
import type { Example } from "../doc";
import type { Note } from "./types";

const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** 유월 육 일 → 유월 육 일이에요. */
const isIt = (s: string) => josa(s, "이에요", "예요") + ".";
const ord = (d: number) => d + (d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th");
/** 날짜 대답 예문 */
const date = (m: number, d: number, en?: string): Example => ({ ko: isIt(readDate(m, d)), en: en ?? `It’s ${MONTH_EN[m - 1]} ${ord(d)}.` });
/** 요일 이름의 글자 뜻 (일 · 월 · 화 · 수 · 목 · 금 · 토) */
const WEEK_MEANING = ["sun", "moon", "fire", "water", "wood", "metal", "earth"];

export const todaysDateInKorean: Note = {
  slug: "todays-date-in-korean",
  added: "2026-11-27",
  title: { ko: "오늘 며칠이에요? 한국어로 날짜 묻고 답하기", en: "What’s today’s date in Korean? How to ask and answer" },
  // 검색 제목에는 한글을 넣지 않는다 (#72). 달력 앱(How to Read Dates in Korean)과 겹치지 않게 「묻기」 쪽으로
  searchTitle: "Today’s Date in Korean: Ask and Answer",
  description:
    "How to ask “What’s the date today?” in Korean (오늘 며칠이에요?), how to answer, why it’s 며칠 and not 몇 일, and why June is 유월. 한국어로 날짜 묻고 답하기.",
  summary: {
    ko: "오늘 며칠이에요? 날짜를 묻는 말, 대답하는 말, 유월과 시월.",
    en: "How to ask the date, how to answer, and why June is 유월.",
  },
  category: "words-expressions",
  thumb: { tone: "mint", mark: "📆" },
  apps: ["calendar-practice"],
  blocks: [
    {
      t: "p",
      en: "Want to ask the date in Korean? It takes one short question. Here’s how to ask it, how to answer it, and the two months that don’t follow the rule.",
    },
    { t: "ieung", mood: "huh", ko: "오늘 며칠이에요?", en: "What’s the date today?" },
    { t: "h", en: "Asking the date" },
    {
      t: "ex",
      items: [
        { ko: "오늘 며칠이에요?", en: "What’s the date today? (oneul myeochil-ieyo?)" },
        { ko: "오늘 몇 월 며칠이에요?", en: "What month and day is it today?" },
      ],
    },
    {
      t: "p",
      en: "오늘 means “today.” 며칠 asks “which day of the month,” and 몇 월 asks “which month.” The short question is the one you’ll hear most. Add 몇 월 when the month matters too.",
    },
    {
      t: "tip",
      en: "You can swap 오늘 for other days: 내일 며칠이에요? (What’s the date tomorrow?) With close friends, drop the polite ending: 오늘 며칠이야?",
    },
    { t: "h", en: "Answering" },
    {
      t: "p",
      en: "Months and days both use Sino-Korean numbers (일, 이, 삼…). For the month, put 월 after the number. For the day, put 일 after the number. Then add 이에요 (“it is”): 일 ends in a consonant, so it always takes 이에요.",
    },
    { t: "ieung", mood: "focus", ko: "숫자 + 월, 숫자 + 일", en: "Number + 월 (month), number + 일 (day)" },
    {
      t: "cards",
      items: Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
        mark: `${m}월`,
        ko: readMonth(m),
        en: MONTH_EN[m - 1],
        ...(readMonth(m) !== sino(m) + "월" && { sub: `${sino(m)}월 → ${readMonth(m)}` }),
      })),
    },
    {
      t: "ex",
      items: [date(3, 1), date(5, 5, "It’s May 5th. (Children’s Day in Korea)"), date(8, 15), date(12, 25)],
    },
    {
      t: "p",
      en: "Korean says dates from big to small: year, then month, then day. Years use Sino-Korean numbers too, with 년 after them.",
    },
    {
      t: "ex",
      items: [{ ko: isIt(`${readYear(2026)} ${readDate(11, 27)}`), en: "It’s November 27th, 2026." }],
    },
    { t: "h", en: "Why June is 유월 and October is 시월" },
    {
      t: "p",
      en: "Look at the month cards again. Only June and October change. 육월 becomes 유월 and 십월 becomes 시월: the final consonant drops because it’s easier to say. Even when they’re written 6월 and 10월, you read them 유월 and 시월.",
    },
    {
      t: "p",
      en: "Days don’t change. The 6th is still 육 일 and the 10th is still 십 일, so you get dates like these:",
    },
    {
      t: "ex",
      items: [date(6, 6, "It’s June 6th. (Memorial Day in Korea)"), date(10, 10), date(6, 10)],
    },
    { t: "ieung", mood: "wink", ko: "육월 ❌ 유월 ⭕", en: "June is 유월, not 육월." },
    { t: "h", en: "며칠, not 몇 일" },
    {
      t: "p",
      en: "몇 means “how many” and 일 means “day,” so you might expect 몇 일. But the right spelling is always 며칠, written as one word. Compare 몇 년 (how many years), which sounds like [면년]. If the day word were 몇 + 일, it would sound like [면닐]. Koreans say [며칠], so it’s written 며칠.",
    },
    {
      t: "list",
      items: [
        { en: "몇 월 (which month) stays two words, with a space: 몇 월 며칠." },
        { en: "With digits, Koreans write the numbers and the words together: 6월 6일." },
        { en: "며칠 also means “a few days”: 며칠 전 is “a few days ago.”" },
      ],
    },
    { t: "h", en: "Days of the week" },
    {
      t: "ex",
      items: [
        { ko: "오늘 무슨 요일이에요?", en: "What day of the week is it today?" },
        { ko: isIt(readWeekday(5)), en: "It’s Friday." },
      ],
    },
    {
      t: "p",
      en: "Every day ends in 요일. The first syllable is an old name for the sun, the moon, or one of the five elements.",
    },
    {
      t: "cards",
      items: WEEK.map(([, short, en], wd) => ({ mark: short, ko: readWeekday(wd), en, sub: WEEK_MEANING[wd] })),
    },
    {
      t: "p",
      en: "Put it all together and the weekday comes last:",
    },
    {
      t: "ex",
      items: [{ ko: `오늘은 ${isIt(`${readDate(11, 27)} ${readWeekday(5)}`)}`, en: "Today is Friday, November 27th." }],
    },
    { t: "h", en: "Yesterday, today, tomorrow" },
    {
      t: "cards",
      items: [-2, -1, 0, 1, 2].map((n) => ({ mark: n > 0 ? `+${n}` : String(n), ko: RELATIVE[n][0], en: RELATIVE[n][1] })),
    },
    {
      t: "ex",
      items: [
        { ko: "어제 며칠이었어요?", en: "What was the date yesterday?" },
        { ko: "내일 무슨 요일이에요?", en: "What day of the week is tomorrow?" },
      ],
    },
    { t: "h", en: "Your turn" },
    {
      t: "p",
      en: "So, what’s the date today where you are? Say it in Korean: month, day, then the weekday. Want more practice? Open the Korean Calendar app below: tap any day to hear it read aloud, then test yourself with the quiz.",
    },
    { t: "ieung", mood: "yay", ko: "오늘 며칠이에요? 한국어로 말해 보세요!", en: "What’s the date today? Say it in Korean!" },
  ],
};
