/* 무슨 띠예요? — 한국의 열두 띠. 띠 계산은 shared/korean/tti.ts (테스트 있음) */
import { TTI, ttiName, yearsOf } from "../korean/tti";
import type { Note } from "./types";

export const koreanZodiacTti: Note = {
  slug: "korean-zodiac-tti",
  added: "2026-11-13",
  title: { ko: "무슨 띠예요? 한국의 열두 띠", en: "What’s your Korean zodiac animal?" },
  searchTitle: "Korean Zodiac Animals (띠, tti) Explained",
  description:
    "The Korean zodiac (띠, tti): the twelve animals, how to find yours from your birth year, and how to say “I’m a Horse” in Korean. 무슨 띠예요? 열두 띠와 말하는 법.",
  summary: {
    ko: "태어난 해의 동물로 나이를 알아요. 내 띠 찾기와 말하는 법.",
    en: "Your birth-year animal, how to find it, and how to say it.",
  },
  apps: ["calendar-practice"],
  blocks: [
    {
      t: "p",
      ko: "한국 사람들은 처음 만난 사람에게 “무슨 띠예요?” 하고 묻기도 해요. 띠는 태어난 해의 동물이에요. 열두 동물이 한 해씩 돌아가요.",
      en: "Koreans sometimes ask someone they’ve just met, “무슨 띠예요?” — “What’s your animal?” Your 띠 (tti) is the animal of the year you were born. Twelve animals take turns, one year each.",
    },
    { t: "h", ko: "내 띠 찾기", en: "Find your animal" },
    { t: "widget", id: "tti-finder" },
    { t: "h", ko: "열두 띠", en: "The twelve animals" },
    {
      t: "p",
      ko: "쥐부터 돼지까지 이 순서로 돌아요. 2026년은 말의 해예요.",
      en: "They always go in this order, from Rat to Pig. 2026 is the Year of the Horse.",
    },
    {
      t: "cards",
      items: TTI.map((t) => ({ mark: t.emoji, ko: ttiName(t), en: t.en, sub: yearsOf(t, 1960, 2031).slice(-5).join(" · ") })),
    },
    { t: "h", ko: "이렇게 말해요", en: "How to say it" },
    {
      t: "ex",
      items: [
        { ko: "무슨 띠예요?", en: "What’s your animal?" },
        { ko: "저는 말띠예요.", en: "I’m a Horse." },
        { ko: "저는 호랑이띠예요.", en: "I’m a Tiger." },
      ],
    },
    {
      t: "tip",
      ko: "띠 뒤에는 늘 ‘예요’를 붙여요. ‘띠’에는 받침이 없으니까요.",
      en: "띠 has no final consonant, so it always takes 예요, never 이에요.",
    },
    { t: "h", ko: "왜 띠를 물어봐요?", en: "Why do people ask?" },
    {
      t: "p",
      ko: "한국에서는 나이에 따라 말투와 부르는 말이 달라져요. 그래서 나이를 알고 싶어 하는 사람이 많아요. 그런데 나이를 바로 묻기가 조금 어색할 때 띠를 물어봐요. 띠를 알면 나이를 거의 알 수 있어요.",
      en: "In Korea, age changes how people talk to each other and what they call each other. But asking someone’s age straight out can feel a bit blunt, so people ask for their animal instead. Know the animal, and you can usually tell the age.",
    },
    {
      t: "p",
      ko: "열두 살 차이가 나면 띠가 같아요. 이걸 ‘띠동갑’이라고 해요. ‘동갑’은 나이가 같다는 뜻이에요.",
      en: "People twelve years apart have the same animal. That’s called 띠동갑. (동갑 means “the same age.”)",
    },
    {
      t: "ex",
      items: [
        { ko: "우리 띠동갑이에요!", en: "We’re the same animal, twelve years apart!" },
        { ko: "우리 동갑이에요.", en: "We’re the same age." },
      ],
    },
    { t: "h", ko: "1월이나 2월에 태어났다면", en: "Born in January or February?" },
    {
      t: "p",
      ko: "보통은 태어난 해로 띠를 말해요. 그런데 옛날 달력은 설날(음력 1월 1일)에 새해가 시작돼요. 그래서 설날 전에 태어났으면 앞 해의 띠라고 하는 사람도 있어요. 설날은 해마다 1월 말에서 2월 중순 사이예요.",
      en: "Most people just go by their birth year. But the traditional calendar starts the year at Seollal, the Lunar New Year. So if you were born before Seollal, some people would say you have the previous year’s animal. Seollal falls between late January and mid-February.",
    },
    { t: "h", ko: "새해에는 그해의 동물", en: "Each new year has its animal" },
    {
      t: "p",
      ko: "새해가 되면 뉴스와 가게에서 그해의 동물을 자주 봐요. 새해 인사는 이렇게 해요.",
      en: "Around the new year, you’ll see that year’s animal everywhere, from the news to shop windows. Here’s the new year greeting:",
    },
    {
      t: "ex",
      items: [
        { ko: "새해 복 많이 받으세요.", en: "Happy New Year! (lit. “Receive lots of luck in the new year.”)" },
        { ko: "2026년은 말의 해예요.", en: "2026 is the Year of the Horse." },
      ],
    },
  ],
};
