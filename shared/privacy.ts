/* ============================================================
   개인정보 처리방침 /privacy/ (#79) — 실제로 하는 것만 적는다.

   shared/site.ts 의 설정을 따라 바뀐다.
   - 분석이 꺼져 있으면 「방문 세기」 문단이 없다
   - 구독이 꺼져 있으면 「이메일」 문단이 없다
   상품을 팔기 시작하면(#7) 구매 이메일 문단을 더한다.

   학습자가 내용을 읽어야 하는 페이지라 영어가 크고 한국어가 아래 (lead "en", #57).
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
      ko: "가입도, 계정도, 쿠키도 없어요. 공부한 기록은 내 기기에만 남아요.",
    },
    { t: "h", en: "Saved on your device", ko: "내 기기에 남는 것" },
    {
      t: "p",
      en: "Some apps save a little in your browser’s local storage so you can pick up where you left off:",
      ko: "몇몇 앱은 이어서 할 수 있게 브라우저 저장 공간(localStorage)에 조금 남겨요.",
    },
    {
      t: "list",
      items: [
        { en: "which flashcards you’ve learned", ko: "외운 카드" },
        { en: "the name you typed and any spelling you fixed", ko: "입력한 이름과 직접 고친 표기" },
        { en: "light or dark mode, if you picked one", ko: "밝게 · 어둡게 고른 것" },
        { en: "the last app you opened", ko: "마지막으로 연 앱" },
      ],
    },
    {
      t: "p",
      en: "This never leaves your device, so I can’t see it. To delete it, clear this site’s data in your browser settings.",
      ko: "이 기록은 기기 밖으로 나가지 않아서 저도 볼 수 없어요. 지우려면 브라우저 설정에서 이 사이트 데이터를 지우세요.",
    },
  ];

  if (analyticsOn(c)) {
    const name = ANALYTICS_NAME[c.analytics.provider];
    blocks.push(
      { t: "h", en: "Counting visits", ko: "방문 세기" },
      {
        t: "p",
        en: `I count visits with ${name}, which doesn’t use cookies or build a profile of you. It records which pages are opened, which site you came from, your browser, device type and country, and a few moments in the apps: finishing a deck, subscribing and clicking a product.`,
        ko: `${name}로 방문을 세요. 쿠키를 쓰지 않고, 한 사람을 따라다니며 기록하지 않아요. 연 페이지, 어느 사이트에서 왔는지, 브라우저 · 기기 종류 · 나라, 그리고 앱 안의 몇 가지(덱을 다 본 것, 구독, 상품 누르기)만 세요.`,
      },
    );
  }

  if (subscribeOn(c)) {
    blocks.push(
      { t: "h", en: "Your email", ko: "이메일" },
      {
        t: "p",
        en: "If you subscribe, your email address is kept by Kit, the newsletter service I use. I only use it to send the decks and tips you signed up for, and I don’t sell or share it.",
        ko: "구독하면 이메일 주소는 제가 쓰는 뉴스레터 서비스 Kit 에 저장돼요. 신청한 덱과 팁을 보내는 데만 쓰고, 팔거나 다른 곳에 넘기지 않아요.",
      },
      {
        t: "p",
        en: "Every email has an unsubscribe link. To have your address deleted completely, reply to any email and ask.",
        ko: "모든 메일에 구독 취소 링크가 있어요. 주소를 아예 지우고 싶으면 받은 메일에 답장으로 말해 주세요.",
      },
    );
  }

  blocks.push(
    { t: "h", en: "What other services see", ko: "다른 서비스가 보는 것" },
    {
      t: "list",
      items: [
        {
          en: "The site is hosted on GitHub Pages. Like any web host, GitHub sees your IP address when a page loads.",
          ko: "사이트는 GitHub Pages 에 있어요. 다른 웹 호스팅처럼 페이지를 열 때 GitHub 이 IP 주소를 받아요.",
        },
        {
          en: "Fonts come from Google Fonts and jsDelivr, so they see your IP address too.",
          ko: "글꼴은 Google Fonts 와 jsDelivr 에서 받아서 그곳도 IP 주소를 받아요.",
        },
        {
          en: "🔊 Listen uses your browser’s own voice. Some browsers send the words to their servers to make the sound.",
          ko: "🔊 들어 보기는 브라우저의 목소리를 써요. 어떤 브라우저는 소리를 만들려고 그 글자를 자기 서버로 보내요.",
        },
      ],
    },
    { t: "h", en: "If this changes", ko: "바뀌면" },
    {
      t: "p",
      en: "I’ll update this page and the date at the top.",
      ko: "이 페이지와 맨 위의 날짜를 고칠게요.",
    },
  );
  return blocks;
}
