/* 지금 몇 시예요? — 시간 묻고 답하기 (#114). Search Console 노출 검색어(what time is it in korean …) 기준
   시각 읽기는 shared/korean/time.ts — 시계 앱과 같은 함수라 읽기가 어긋나지 않는다.
   설명 글은 영어만, 배우는 한국어(예문 · 카드 · 이응이)는 한국어 + 영어 (#122) */
import { josa, native, nativeCounter, sino } from "../korean/numbers";
import { readHalf, readHour, readMin, readTime } from "../korean/time";
import type { Example } from "../doc";
import type { Note } from "./types";

/** 세 시 → 세 시예요, 세 시 십 분 → 세 시 십 분이에요 */
const isIt = (s: string) => josa(s, "이에요", "예요") + ".";
/** 예문 + 옆에 같은 시각의 시계 (h 는 0~23) */
const at = (h: number, m: number, ko: string, en: string, also?: string): Example => ({ ko, en, clock: h * 60 + m, ...(also && { also }) });
const h12 = (h: number) => h % 12 || 12;
const ONES = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
/** 분 예시 — [분, 만드는 법]. 한 자리 · 10 은 만드는 법이 없다 */
const MINUTES: [number, string][] = [
  [5, ""],
  [10, ""],
  [15, "10 + 5"],
  [20, "2 × 10"],
  [23, "2 × 10 + 3"],
  [30, "3 × 10"],
  [45, "4 × 10 + 5"],
  [59, "5 × 10 + 9"],
];

export const whatTimeIsItInKorean: Note = {
  slug: "what-time-is-it-in-korean",
  added: "2026-11-23",
  title: { ko: "지금 몇 시예요? 한국어로 시간 묻고 답하기", en: "What time is it in Korean? How to ask and answer" },
  // 검색 제목에는 한글을 넣지 않는다 (#72). 시계 앱(How to Tell Time in Korean)과 겹치지 않게 「묻기」 쪽으로
  searchTitle: "What Time Is It in Korean? Ask and Answer",
  description:
    "How to ask “What time is it?” in Korean (지금 몇 시예요?), how to answer, and why 3 o’clock is 세 시, not 삼 시. 한국어로 시간 묻고 답하기.",
  summary: {
    ko: "지금 몇 시예요? 시간을 묻는 말, 대답하는 말, 시계 읽는 법.",
    en: "How to ask the time, how to answer, and how to read the clock.",
  },
  category: "words-expressions",
  thumb: { tone: "orange", mark: "🕒" },
  apps: ["korean-clock"],
  blocks: [
    {
      t: "p",
      en: "Want to ask the time in Korean? There’s one phrase you’ll hear all the time. Here’s how to ask it, how to answer it, and how Koreans read the clock.",
    },
    { t: "ieung", mood: "huh", ko: "지금 몇 시예요?", en: "What time is it now?" },
    { t: "h", en: "Asking the time" },
    {
      t: "ex",
      items: [{ ko: "지금 몇 시예요?", en: "What time is it now? (jigeum myeot si-yeyo?)" }],
    },
    {
      t: "p",
      en: "지금 means “now,” 몇 means “how many,” and 시 means “o’clock.” So 몇 시 is literally “how-many o’clock”: what time.",
    },
    {
      t: "tip",
      en: "To ask a stranger, get their attention with 저기요 first: “저기요, 지금 몇 시예요?” With close friends, drop the polite ending: “지금 몇 시야?”",
    },
    { t: "h", en: "Answering" },
    {
      t: "p",
      en: "Before you answer, you need to know one thing. Korean has two sets of numbers: native Korean (하나, 둘, 셋…) and Sino-Korean (일, 이, 삼…). Telling time uses both, and each has its job. Hours use native Korean numbers. Minutes use Sino-Korean numbers.",
    },
    { t: "ieung", mood: "focus", ko: "시는 하나, 둘, 셋. 분은 일, 이, 삼.", en: "Hours: 하나, 둘, 셋. Minutes: 일, 이, 삼." },
    {
      t: "p",
      en: "A few native numbers get shorter before 시: 하나 → 한, 둘 → 두, 셋 → 세, 넷 → 네. That’s why 3 o’clock is 세 시, not 셋 시. The same goes for 11 and 12: 열한 시, 열두 시.",
    },
    {
      t: "cards",
      items: Array.from({ length: 12 }, (_, i) => i + 1).map((h) => ({
        mark: String(h),
        ko: readHour(h),
        en: `${h} o’clock`,
        ...(native(h) !== nativeCounter(h) && { sub: `${native(h)} → ${nativeCounter(h)}` }),
      })),
    },
    {
      t: "p",
      en: "Minutes use Sino-Korean numbers. Learn these ten and you can read every minute on the clock.",
    },
    {
      t: "cards",
      items: Array.from({ length: 10 }, (_, i) => i + 1).map((n) => ({ mark: String(n), ko: sino(n), en: ONES[n - 1] })),
    },
    {
      t: "p",
      en: "Bigger numbers are built like simple math. 10 is just 십 (no 일 in front). For 11 to 19, add the digit after 십: 15 is 십오 (10 + 5). For 20, 30, 40 and 50, put the digit before 십: 20 is 이십 (2 × 10). Then add the rest: 23 is 이십삼 (2 × 10 + 3). Put 분 after it, and you’ve got the minutes.",
    },
    {
      t: "cards",
      items: MINUTES.map(([m, how]) => ({ mark: `:${String(m).padStart(2, "0")}`, ko: readMin(m), en: `${m} minutes`, ...(how && { sub: how }) })),
    },
    {
      t: "p",
      en: "Now put it together: say the time and add 예요 or 이에요 (“it is”). 시 ends in a vowel, so it takes 예요. 분 (minute) ends in a consonant, so it takes 이에요.",
    },
    {
      t: "ex",
      items: [
        at(3, 0, isIt(readTime(3, 0)), "It’s 3 o’clock."),
        at(3, 10, isIt(readTime(3, 10)), "It’s 3:10."),
        at(3, 30, isIt(readHalf(3)), "It’s half past 3 (3:30). 반 means “half,” and it’s what most people say.", isIt(readTime(3, 30))),
        at(4, 45, isIt(readTime(4, 45)), "It’s 4:45."),
      ],
    },
    { t: "h", en: "AM, PM, and “around”" },
    {
      t: "p",
      en: "오전 is AM and 오후 is PM. They go before the time, not after. In conversation people also use 아침 (morning), 저녁 (evening) and 밤 (night). 쯤 means “around” and sticks right onto the time.",
    },
    {
      t: "ex",
      items: [
        at(9, 0, `오전 ${isIt(readTime(9, 0))}`, "It’s 9 AM."),
        at(14, 30, `오후 ${isIt(readHalf(h12(14)))}`, "It’s 2:30 PM."),
        at(19, 0, `저녁 ${readHour(h12(19))}에 만나요.`, "Let’s meet at 7 in the evening."),
        at(12, 0, `${readHour(12)} 정각이에요.`, "It’s exactly 12 o’clock."),
        { ko: `${readHour(3)}쯤 갈게요.`, en: "I’ll come around 3." },
      ],
    },
    { t: "h", en: "Spelling mix-ups" },
    {
      t: "list",
      items: [
        { en: "몇 ends in ㅊ, not ㅅ, so 몃 is a misspelling. It’s easy to mix up because 몇 시 sounds like [멷씨]." },
        { en: "When you spell the numbers out, put spaces between the words: 몇 시, 세 시 십 분." },
        { en: "With digits, Koreans usually write them together: 3시 10분." },
      ],
    },
    { t: "h", en: "Your turn" },
    {
      t: "p",
      en: "So, what time is it where you are? Look at a clock and say it in Korean. Want more practice? Open the Korean Clock app below: turn the hands to any time, hear it read aloud, then test yourself with the quiz.",
    },
    { t: "ieung", mood: "yay", ko: "한국어로 말해 보세요!", en: "Say it in Korean!" },
  ],
};
