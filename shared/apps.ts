/* ============================================================
   앱 목록 — 하나뿐인 원본.

   여기 한 줄을 넣으면
   - 모든 앱의 헤더 메뉴에 링크가 생기고
   - 첫 화면(/)에 카드가 생기고
   - vite 가 apps/<slug>/ 를 빌드한다 (폴더만 있으면 된다)

   slug 는 주소다. https://tutoryoujin.github.io/<slug>/
   이미 학생들에게 나간 주소라 한번 정하면 바꾸지 않는다.
   ============================================================ */
export type AppInfo = {
  slug: string;
  ko: string; // 워드마크 가운데 낱말을 포함한 이름 — "한국어 시계"
  en: string;
  emoji: string;
  /** 첫 화면 카드에 쓰는 한 줄. 해요체 */
  about: { ko: string; en: string };
  /** 꼬리말 한 줄. "<하는 일>, 매일 조금씩." — "매일 조금씩"은 바꾸지 않는다 */
  tagline: { ko: string; en: string };
};

export const APPS: AppInfo[] = [
  {
    slug: "korean-cards",
    ko: "한국어 카드",
    en: "Korean Word Cards",
    emoji: "🃏",
    about: { ko: "뒤집어서 외우는 낱말 카드", en: "Flip cards to learn new words" },
    tagline: { ko: "한 장씩, 매일 조금씩.", en: "Learn Korean, one card at a time." },
  },
  {
    slug: "calendar-practice",
    ko: "한국어 달력",
    en: "Korean Calendar",
    emoji: "📆",
    about: { ko: "날짜를 한국어로 읽어요", en: "Read dates in Korean" },
    tagline: { ko: "날짜 읽기, 매일 조금씩.", en: "Read Korean dates, one day at a time." },
  },
  {
    slug: "korean-clock",
    ko: "한국어 시계",
    en: "Korean Clock",
    emoji: "🕒",
    about: { ko: "시곗바늘을 돌리면 한국어로 읽어 줘요", en: "Turn the hands, hear the time in Korean" },
    tagline: { ko: "시계 읽기, 매일 조금씩.", en: "Tell time in Korean, one minute at a time." },
  },
];

export const appBySlug = (slug: string) => {
  const a = APPS.find((x) => x.slug === slug);
  if (!a) throw new Error(`shared/apps.ts 에 없는 앱이에요: ${slug}`);
  return a;
};

/** 워드마크 가운데 낱말. "한국어 시계" → "시계" */
export const wordOf = (a: AppInfo) => a.ko.replace(/^한국어\s*/, "");
