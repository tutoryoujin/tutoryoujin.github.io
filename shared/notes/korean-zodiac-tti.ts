/* 무슨 띠예요? — 한국의 열두 띠. 띠 계산은 shared/korean/tti.ts (테스트 있음) */
import { TTI, ttiName, yearsOf } from "../korean/tti";
import type { Note } from "./types";

export const koreanZodiacTti: Note = {
  slug: "korean-zodiac-tti",
  added: "2026-11-13",
  title: { ko: "무슨 띠예요? 한국의 열두 띠", en: "What’s your Korean zodiac animal?" },
  // 검색 제목에는 한글을 넣지 않는다 — 띠는 설명 · 본문에 (#72)
  searchTitle: "Korean Zodiac Animals (Tti) Explained",
  description:
    "The Korean zodiac (띠, tti): the twelve animals, how to find yours from your birth year, and how to say “I’m a Horse” in Korean. 무슨 띠예요? 열두 띠와 말하는 법.",
  summary: {
    ko: "태어난 해의 동물로 나이를 알아요. 내 띠 찾기와 말하는 법.",
    en: "Your birth-year animal, how to find it, and how to say it.",
  },
  thumb: { tone: "yellow", mark: "🐴" },
  apps: ["calendar-practice"],
  blocks: [
    {
      t: "p",
      en: "Koreans sometimes ask someone they’ve just met, “무슨 띠예요?” — “What’s your animal?” Your 띠 (tti) is the animal of the year you were born. Twelve animals take turns, one year each.",
    },
    { t: "ieung", mood: "huh", ko: "무슨 띠예요?", en: "What’s your animal?" },
    { t: "h", en: "Find your animal" },
    { t: "widget", id: "tti-finder" },
    { t: "h", en: "The twelve animals" },
    {
      t: "p",
      en: "To answer, just add 띠 right after the animal: 말 (horse) + 띠 → 말띠, 호랑이 (tiger) + 띠 → 호랑이띠. Write them together, with no space. Every card below already has 띠 on the end.",
    },
    {
      t: "p",
      en: "They always go in this order, from Rat to Pig. 2026 is the Year of the Horse.",
    },
    {
      t: "cards",
      items: TTI.map((t) => ({ mark: t.emoji, ko: ttiName(t), en: t.en, sub: yearsOf(t, 1960, 2031).slice(-5).join(" · ") })),
    },
    { t: "h", en: "How to say it" },
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
      en: "띠 has no final consonant, so it always takes 예요, never 이에요.",
    },
    { t: "h", en: "Why do people ask?" },
    {
      t: "p",
      en: "In Korea, age changes how people talk to each other and what they call each other. But asking someone’s age straight out can feel a bit blunt, so people ask for their animal instead. Know the animal, and you can usually tell the age.",
    },
    {
      t: "p",
      en: "People twelve years apart have the same animal. That’s called 띠동갑. (동갑 means “the same age.”)",
    },
    {
      t: "ex",
      items: [
        { ko: "우리 띠동갑이에요!", en: "We’re the same animal, twelve years apart!" },
        { ko: "우리 동갑이에요.", en: "We’re the same age." },
      ],
    },
    { t: "h", en: "Fortunes and matches" },
    {
      t: "p",
      en: "Some people also read their fortune by their animal. Every new year, newspapers and websites print a fortune for each animal. People even check 궁합 (gunghap): whether two people’s animals make a good match.",
    },
    {
      t: "p",
      en: "Of course, it’s just superstition! Most people read it for fun, so don’t take it too seriously.",
    },
    { t: "ieung", mood: "wink", ko: "그냥 재미로 봐요!", en: "It’s just for fun!" },
    {
      t: "ex",
      items: [
        { ko: "올해 운세 봤어요?", en: "Did you check your fortune for this year?" },
        { ko: "우리 궁합이 잘 맞아요.", en: "We’re a good match." },
        { ko: "그냥 재미로 봐요.", en: "It’s just for fun." },
      ],
    },
    { t: "h", en: "Born in January or February?" },
    {
      t: "p",
      en: "Most people just go by their birth year. But the traditional calendar starts the year at Seollal, the Lunar New Year. So if you were born before Seollal, some people would say you have the previous year’s animal. Seollal falls between late January and mid-February.",
    },
    { t: "h", en: "Each new year has its animal" },
    {
      t: "p",
      en: "Around the new year, you’ll see that year’s animal everywhere, from the news to shop windows. Here’s the new year greeting:",
    },
    {
      t: "ex",
      items: [
        { ko: "새해 복 많이 받으세요.", en: "Happy New Year! (lit. “Receive lots of luck in the new year.”)" },
        { ko: "2026년은 말의 해예요.", en: "2026 is the Year of the Horse." },
      ],
    },
    { t: "ieung", mood: "yay", ko: "여러분은 무슨 띠예요?", en: "So, what’s your animal?" },
  ],
};
