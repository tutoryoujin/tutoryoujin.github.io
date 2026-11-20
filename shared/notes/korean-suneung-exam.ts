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
  apps: ["calendar-practice", "korean-clock"],
  blocks: [
    {
      t: "p",
      ko: "11월이 되면 한국 뉴스에 이 말이 계속 나와요. ‘수능’이에요. 수능은 대학에 가려고 보는 시험이에요. 그런데 한국에서는 시험 하나가 아니라 나라 전체의 큰일이에요.",
      en: "Every November, one word fills the Korean news: 수능 (suneung). It’s the exam students take to get into university. But in Korea, it’s not just a test. It’s a day the whole country plans around.",
    },
    { t: "h", ko: "1년에 딱 한 번", en: "Once a year, for everyone" },
    {
      t: "p",
      ko: "수능은 1년에 딱 한 번 있어요. 전국의 모든 수험생이 같은 날, 같은 시간에, 같은 시험을 봐요. 2026년에는 11월 19일 목요일이었어요. 이날 시험을 못 보면 1년을 기다려야 해요.",
      en: "Suneung happens only once a year. Every test taker in the country sits the same exam, on the same day, at the same time. In 2026 it was Thursday, November 19. Miss it, and you wait a whole year.",
    },
    {
      t: "p",
      ko: "과목은 여러 개지만 제일 중요한 건 국어, 영어, 수학이에요. 세 과목을 줄여서 ‘국영수’라고 불러요.",
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
    { t: "h", ko: "비행기도 멈춰요", en: "Even the planes stop" },
    {
      t: "p",
      ko: "영어 시험은 듣기로 시작해요. 이 듣기 시간에는 비행기가 뜨지도 내리지도 않아요. 비행기 소리가 시험을 방해하면 안 되니까요. 하늘을 날던 비행기도 높이 올라가서 기다려요.",
      en: "The English section starts with listening. During that part, planes don’t take off or land anywhere in the country, so no engine noise can get in the way. Planes already in the air circle high above and wait.",
    },
    {
      t: "p",
      ko: "다른 것도 많이 바뀌어요. 회사는 출근 시간을 늦추고, 지하철과 버스는 더 많이 다녀요. 늦은 수험생을 경찰차가 시험장까지 태워 주기도 해요.",
      en: "Other things change too. Offices start later so the roads are clear, and subways and buses run more often. Police cars sometimes give late students a ride to the exam hall.",
    },
    {
      t: "ex",
      items: [
        { ko: "오늘 수능 날이에요.", en: "Today is Suneung day." },
        { ko: "영어 듣기 시간에는 비행기가 안 떠요.", en: "Planes don’t fly during the English listening test." },
      ],
    },
    { t: "h", ko: "올해는 휴대폰이 울렸어요", en: "This year, the phones rang" },
    {
      t: "p",
      ko: "시험장에는 휴대폰 같은 전자 기기를 가져가면 안 돼요. 그런데 요즘은 인공 지능(AI)을 쓸 수 있는 기기가 많아져서 걱정이 커졌어요. 올해는 스마트 안경이나 작은 카메라를 가져온 사람도 있었어요.",
      en: "You can’t bring phones or other electronic devices into the exam room. But now that so many gadgets can run AI, worries have grown. This year, some people were even caught with smart glasses or tiny cameras.",
    },
    {
      t: "p",
      ko: "그래서 정부는 시험 중에 전국 휴대폰에 재난 문자를 세 번 보냈어요. 시험장에서 휴대폰이 울리면 바로 들키니까요. 이 문자로만 50명 넘게 걸렸어요.",
      en: "So the government sent an emergency alert to every phone in the country, three times during the exam. If a phone went off in an exam room, its owner was caught on the spot. More than 50 people were caught by the alerts alone.",
    },
    {
      t: "tip",
      ko: "‘재난 문자’는 지진이나 태풍 같은 일이 있을 때 모든 휴대폰에 오는 문자예요. 소리가 아주 커요.",
      en: "재난 문자 (jaenan munja) is the emergency text sent to every phone for earthquakes, storms and the like. It’s very loud.",
    },
    { t: "h", ko: "수능 날 쓰는 말", en: "Words for exam day" },
    {
      t: "cards",
      items: [
        { mark: "✏️", ko: "수험생", en: "test taker" },
        { mark: "📝", ko: "시험을 보다", en: "to take a test" },
        { mark: "🎉", ko: "붙다", en: "to pass (lit. to stick)" },
        { mark: "😢", ko: "떨어지다", en: "to fail (lit. to fall)" },
      ],
    },
    {
      t: "p",
      ko: "수능 전에는 수험생에게 찹쌀떡이나 엿을 줘요. 끈적끈적해서 시험에 ‘붙으라’는 뜻이에요. 미역국은 미끄러워서 시험 날에는 안 먹어요.",
      en: "Before the exam, people give test takers sticky rice cakes or taffy, hoping they’ll “stick” (붙다, pass). Seaweed soup is slippery, so nobody eats it on exam day. You don’t want to slip!",
    },
    {
      t: "ex",
      items: [
        { ko: "시험 잘 보세요!", en: "Good luck on your exam!" },
        { ko: "수능 대박!", en: "Ace the Suneung! (lit. “Suneung jackpot!”)" },
        { ko: "꼭 붙을 거예요.", en: "You’ll definitely pass." },
        { ko: "그동안 수고했어요.", en: "You worked so hard. Well done." },
      ],
    },
    { t: "h", ko: "어떻게 생각하세요?", en: "What do you think?" },
    {
      t: "p",
      ko: "하루 시험 때문에 비행기가 멈추고, 온 나라가 조용해져요. 대단하다고 생각하는 사람도 있고, 너무 힘들다고 생각하는 사람도 있어요. 여러분 나라에도 이런 시험이 있어요? 이런 수능 문화에 대해 어떻게 생각하세요?",
      en: "For one exam, planes stop and the whole country goes quiet. Some people find it amazing; others think it puts too much pressure on students. Does your country have a test like this? What do you think of Korea’s Suneung culture?",
    },
  ],
};
