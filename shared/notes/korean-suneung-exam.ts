/* 수능 — 한국에서 가장 조용한 날 (#109). 2026년 일은 교육부 발표(2026-11-20) 기준 */
import type { Note } from "./types";

export const koreanSuneungExam: Note = {
  slug: "korean-suneung-exam",
  added: "2026-11-20",
  title: { ko: "수능이 뭐예요? 비행기도 멈추는 날", en: "What is Suneung? The day even planes stop" },
  searchTitle: "Suneung: Korea’s College Entrance Exam Day",
  description:
    "Suneung (수능), Korea’s college entrance exam: one day a year, the same test for everyone, and planes grounded for the English listening section. 수능이 뭐예요? 한국의 수능 문화와 말.",
  summary: {
    ko: "1년에 한 번, 모두 같은 날 같은 시험. 비행기까지 멈추는 수능 이야기.",
    en: "One day a year, one test for everyone, and even the planes stop.",
  },
  category: "korean-culture",
  thumb: { tone: "lavender", mark: "✏️" },
  // 「Practice in the app」은 글과 직접 관련 있는 앱만 (#123)
  apps: [],
  blocks: [
    {
      t: "p",
      en: "Every November, one word fills the Korean news: 수능 (suneung). It’s the exam students take to get into university. But in Korea, it’s not just a test. It’s a day the whole country plans around.",
    },
    { t: "ieung", scene: "study", ko: "수능이 뭐예요?", en: "What is Suneung?" },
    { t: "h", en: "Once a year, for everyone" },
    {
      t: "p",
      en: "Suneung happens only once a year. Every test taker in the country sits the same exam, on the same day, at the same time. In 2026 it was Thursday, November 19. Miss it, and you wait a whole year.",
    },
    {
      t: "p",
      en: "There are several subjects, but the big three are Korean, English, and math. Together they have a nickname: 국영수 (guk-yeong-su), the first syllable of each.",
    },
    {
      t: "cards",
      items: [
        { mark: "📖", ko: "국어", en: "Korean (language)" },
        { mark: "🔤", ko: "영어", en: "English" },
        { mark: "➗", ko: "수학", en: "Math" },
      ],
    },
    { t: "h", en: "Even the planes stop" },
    { t: "ieung", mood: "wow", ko: "비행기도 멈춰요?", en: "Even the planes stop?" },
    {
      t: "p",
      en: "The English section starts with listening. During that part, planes don’t take off or land anywhere in the country, so no engine noise can get in the way. Planes already in the air circle high above and wait.",
    },
    {
      t: "p",
      en: "Other things change too. Offices start later so the roads are clear, and subways and buses run more often. Police cars sometimes give late students a ride to the exam hall.",
    },
    {
      t: "ex",
      items: [
        { ko: "오늘 수능 날이에요.", en: "Today is Suneung day." },
        { ko: "영어 듣기 시간에는 비행기가 안 떠요.", en: "Planes don’t fly during the English listening test." },
      ],
    },
    { t: "h", en: "This year, the phones rang" },
    {
      t: "p",
      en: "You can’t bring phones or other electronic devices into the exam room. But now that so many gadgets can run AI, worries have grown. This year, some people were even caught with smart glasses or tiny cameras.",
    },
    {
      t: "p",
      en: "So the government sent an emergency alert to every phone in the country, three times during the exam. If a phone went off in an exam room, its owner was caught on the spot. More than 50 people were caught by the alerts alone.",
    },
    {
      t: "tip",
      en: "재난 문자 (jaenan munja) is the emergency text sent to every phone for earthquakes, storms and the like. It’s very loud.",
    },
    { t: "h", en: "Words for exam day" },
    {
      t: "cards",
      items: [
        { mark: "✏️", ko: "수험생", en: "test taker" },
        { mark: "📝", ko: "시험을 보다", en: "to take a test", sub: "= 시험을 치다" },
        { mark: "🎉", ko: "붙다", en: "to pass (lit. to stick)", sub: "= 합격하다" },
        { mark: "😢", ko: "떨어지다", en: "to fail (lit. to fall)" },
      ],
    },
    {
      t: "tip",
      en: "시험을 보다 and 시험을 치다 mean the same thing: to take a test. 붙다 and 합격하다 both mean to pass. In everyday talk, 붙다 is more common.",
    },
    {
      t: "p",
      en: "붙다 literally means “to stick.” So before the exam, there’s a custom of giving test takers something sticky, like 엿 (yeot, Korean taffy) or sticky rice cakes, so they’ll stick to the exam and pass. Seaweed soup is the opposite: it’s slippery, so nobody eats it on exam day. You don’t want to slip!",
    },
    { t: "ieung", mood: "yay", ko: "꼭 붙으세요!", en: "I hope you pass!" },
    {
      t: "ex",
      items: [
        { ko: "시험 잘 보세요!", en: "Good luck on your exam!" },
        { ko: "수능 대박!", en: "Ace the Suneung! (lit. “Suneung jackpot!”)" },
        { ko: "꼭 붙을 거예요.", en: "You’ll definitely pass." },
        { ko: "그동안 수고했어요.", en: "You worked so hard. Well done." },
      ],
    },
    { t: "h", en: "After the exam: discounts!" },
    {
      t: "p",
      en: "Once the exam is over, something fun is waiting. Show your 수험표 (suheompyo, exam admission ticket) and you can get discounts at restaurants, movie theaters, clothing stores, theme parks and more. So students hang on to that little ticket long after the exam ends.",
    },
    {
      t: "ex",
      items: [
        { ko: "수험표 있으세요?", en: "Do you have your exam ticket?" },
        { ko: "수험표 보여 주시면 할인돼요.", en: "Show your exam ticket and you get a discount." },
      ],
    },
    { t: "h", en: "What do you think?" },
    {
      t: "p",
      en: "For one exam, planes stop and the whole country goes quiet. Some people find it amazing; others think it puts too much pressure on students. Does your country have a test like this? What do you think of Korea’s Suneung culture?",
    },
    { t: "ieung", mood: "huh", ko: "어떻게 생각하세요?", en: "What do you think?" },
    {
      t: "p",
      en: "Curious what the English test on the Suneung looks like? Give it a try here!",
    },
    {
      t: "link",
      mark: "📄",
      href: "https://cdn.kice.re.kr/27dae-suneung/27DaeSuneung_3.pdf",
      en: "Suneung English test, November 2026 (PDF, official)",
    },
  ],
};
