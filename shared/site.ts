/* ============================================================
   사이트 설정 — 분석 · 이메일 구독 · 상품. 하나뿐인 원본.

   값이 비어 있으면 그 기능은 통째로 꺼진다.
   - analytics.id 가 "" → 분석 스크립트를 페이지에 넣지 않는다, track() 은 아무 일도 안 한다
   - subscribe.formId 가 "" → 구독 폼을 그리지 않는다
   - products 가 [] 이거나 판매 링크(href)가 빈 것뿐 → 상품 섹션을 그리지 않는다

   분석 서비스를 바꿀 때는 provider 와 id 만 바꾼다 (shared/analytics.ts 가 나머지를 한다).
     GoatCounter  id = "tutoryoujin"          → https://tutoryoujin.goatcounter.com
     Plausible    id = "tutoryoujin.github.io" (data-domain)
     Umami        id = "<website id uuid>"
   셋 다 쿠키를 쓰지 않는다. src 를 주면 그 주소의 스크립트를 쓴다 (직접 띄운 서버 등).
   ============================================================ */

export type AnalyticsProvider = "goatcounter" | "plausible" | "umami";

export type Product = {
  id: string;
  title: string;
  description: string;
  /** "$4.99" 처럼 보이는 그대로 */
  price?: string;
  /** 판매 페이지 주소 (예: Payhip) */
  href: string;
  /** /korean-cards/img/… 처럼 사이트 안 그림. 없으면 emoji */
  image?: string;
  emoji?: string;
  /** 버튼 글자. 기본 "Get the deck" */
  cta?: string;
};

export type SiteConfig = {
  /** 끝에 / 없이 */
  url: string;
  name: string;
  analytics: { provider: AnalyticsProvider; id: string; src?: string };
  subscribe: { provider: "kit"; formId: string };
  products: Product[];
  /** 검색엔진 소유 확인 코드 (HTML 태그의 content 값). 비면 메타를 넣지 않는다 */
  verify: { google: string; naver: string };
};

export const SITE: SiteConfig = {
  url: "https://tutoryoujin.github.io",
  name: "한국어 with Youjin",
  analytics: { provider: "goatcounter", id: "" },
  subscribe: { provider: "kit", formId: "" },
  products: [],
  verify: { google: "F90xj4F_Hxwna83n8hoXvx_BeCP3RfqCwqV3ME6raUU", naver: "" },
};

/** 구독 폼 문구. 영어 — 처음 오는 사람이 읽는 글이다 */
export const SUBSCRIBE_COPY = {
  title: "Get a free Korean deck every month",
  body: "New flashcard decks for real, everyday Korean, made by Youjin, a Korean teacher in Seoul. Plus short tips you can use right away.",
  fine: "No spam. Unsubscribe anytime.",
  button: "Send me the free deck",
  sending: "Sending…",
  label: "Email address",
  placeholder: "you@example.com",
  invalid: "Please enter a valid email address.",
  success: "Almost done! Check your inbox and confirm your email.",
  error: "Something went wrong. Please try again in a moment.",
};

/** 상품 섹션 문구 */
export const PRODUCTS_COPY = {
  title: "More Korean decks",
  body: "Printable and extra flashcard decks made by Youjin.",
  cta: "Get the deck",
};

export const analyticsOn = (c: SiteConfig = SITE) => c.analytics.id.trim() !== "";
export const subscribeOn = (c: SiteConfig = SITE) => c.subscribe.formId.trim() !== "";
/** 판매 링크가 있는 상품만. 링크가 생기기 전에는 자리만 두고 그리지 않는다 */
export const visibleProducts = (c: SiteConfig = SITE) => c.products.filter((p) => p.href.trim() !== "");
export const productsOn = (c: SiteConfig = SITE) => visibleProducts(c).length > 0;
