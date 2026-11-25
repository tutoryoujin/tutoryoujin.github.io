/* ============================================================
   개인정보 처리방침 /privacy/ (#79) — 실제로 하는 것만 적는다.

   shared/site.ts 의 설정을 따라 바뀐다.
   - 분석이 꺼져 있으면 「방문 세기」 문단이 없다
   - 구독이 꺼져 있으면 「이메일」 문단이 없다
   상품을 팔기 시작하면(#7) 구매 이메일 문단을 더한다.

   본문은 영어만 (#102, 주인이 정함). 제목만 영어 + 한국어.
   ============================================================ */
import type { Block } from "./doc";
import { analyticsOn, SITE, subscribeOn, type SiteConfig } from "./site";

/** 내용이 바뀌면 같이 고친다 — 화면 맨 위에 나온다 */
export const PRIVACY_UPDATED = "2026-11-13";

const ANALYTICS_NAME = { goatcounter: "GoatCounter", plausible: "Plausible", umami: "Umami" } as const;

export function privacyBlocks(c: SiteConfig = SITE): Block[] {
  const blocks: Block[] = [
    {
      t: "p",
      en: "No sign-up, no accounts, no cookies. What you study stays on your own device.",
    },
    { t: "h", en: "Saved on your device"},
    {
      t: "p",
      en: "Some apps save a little in your browser’s local storage so you can pick up where you left off:",
    },
    {
      t: "list",
      items: [
        { en: "which flashcards you’ve learned"},
        { en: "the name you typed and any spelling you fixed"},
        { en: "light or dark mode, if you picked one"},
        { en: "the last app you opened"},
      ],
    },
    {
      t: "p",
      en: "This never leaves your device, so I can’t see it. To delete it, clear this site’s data in your browser settings.",
    },
  ];

  if (analyticsOn(c)) {
    const name = ANALYTICS_NAME[c.analytics.provider];
    blocks.push(
      { t: "h", en: "Counting visits"},
      {
        t: "p",
        en: `I count visits with ${name}, which doesn’t use cookies or build a profile of you. It records which pages are opened, which site you came from, your browser, device type and country, and a few moments in the apps: finishing a deck, subscribing and clicking a product.`,
      },
    );
  }

  if (subscribeOn(c)) {
    blocks.push(
      { t: "h", en: "Your email"},
      {
        t: "p",
        en: "If you subscribe, your email address is kept by Kit, the newsletter service I use. I only use it to send the decks and tips you signed up for, and I don’t sell or share it.",
      },
      {
        t: "p",
        en: "Every email has an unsubscribe link. To have your address deleted completely, reply to any email and ask.",
      },
    );
  }

  blocks.push(
    { t: "h", en: "What other services see"},
    {
      t: "list",
      items: [
        {
          en: "The site is hosted on GitHub Pages. Like any web host, GitHub sees your IP address when a page loads.",
        },
        {
          en: "Fonts come from Google Fonts and jsDelivr, so they see your IP address too.",
        },
        {
          en: "🔊 Listen uses your browser’s own voice. Some browsers send the words to their servers to make the sound.",
        },
      ],
    },
    { t: "h", en: "If this changes"},
    {
      t: "p",
      en: "I’ll update this page and the date at the top.",
    },
  );
  return blocks;
}
