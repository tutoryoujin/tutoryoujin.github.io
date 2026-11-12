/* ============================================================
   앱 목록 — 하나뿐인 원본.

   여기 한 줄을 넣으면
   - 모든 앱의 헤더 메뉴에 링크가 생기고
   - 첫 화면(/)에 카드가 생기고
   - vite 가 apps/<slug>/ 를 빌드한다 (폴더만 있으면 된다)

   slug 는 주소다. https://tutoryoujin.github.io/<slug>/
   이미 학생들에게 나간 주소라 한번 정하면 바꾸지 않는다.
   ============================================================ */
/** 앱 분류 — 첫 화면 「모든 앱」 탭. 늘릴 때는 CATEGORIES 에 같이 넣는다 */
export type Category = "hangul" | "words" | "numbers" | "life";
export const CATEGORIES: { id: Category; ko: string; en: string }[] = [
  { id: "hangul", ko: "한글", en: "Hangul" },
  { id: "words", ko: "단어", en: "Words" },
  { id: "numbers", ko: "숫자와 시간", en: "Numbers & time" },
  { id: "life", ko: "생활", en: "Daily life" },
];
/** 앱 고유색 — 악센트 쌍 이름 (tokens.json). 카드 · 탭이 --<tone>-bg / --<tone>-ink 를 쓴다 */
export type Tone = "blue" | "pink" | "yellow" | "mint" | "lavender" | "coral" | "orange" | "gray";

export type AppInfo = {
  slug: string;
  category: Category;
  tone: Tone;
  /** "member" = 로그인해야 열린다. 목록에는 잠금으로 보인다 (숨기지 않는다) */
  access: "free" | "member";
  /** 추가된 날 (YYYY-MM-DD) — 첫 화면 「새로 나온 앱」은 최근 것부터 */
  added: string;
  ko: string; // 워드마크 가운데 단어를 포함한 이름 — "한국어 시계"
  en: string;
  emoji: string;
  /** 첫 화면 카드에 쓰는 한 줄. 해요체 */
  about: { ko: string; en: string };
  /** 꼬리말 한 줄. "<하는 일>, 매일 조금씩." — "매일 조금씩"은 바꾸지 않는다 */
  tagline: { ko: string; en: string };
  /**
   * 검색·공유 카드 설명 (meta description · og · twitter).
   * 영어 먼저 + 한국어 한 줄 — 학습자는 영어로 검색한다. 화면 문구는 그대로 한국어 먼저.
   */
  description: string;
  /** 검색 결과 제목 앞부분. 학습자가 영어로 검색하는 말 — "How to Tell Time in Korean" */
  searchTitle: string;
  /**
   * 이 앱에서 배우는 것. 정적 본문 · 구조화 데이터 · llms.txt 에 들어간다 (shared/seo.ts).
   * 앱에 실제로 있는 것만 — 지어내지 않는다. 읽기를 적으면 앱 · 테스트와 맞는지 본다.
   */
  learn: { ko: string; en: string }[];
  /** 공유 카드 그림 (1200×630). public/ 안의 경로. 없으면 작은 카드로 나간다 */
  og?: { image: string; alt: string };
};

export const APPS: AppInfo[] = [
  // 한글부터 — 다른 앱은 모두 한글을 읽을 줄 안다는 데서 시작한다
  {
    slug: "hangul-blocks",
    category: "hangul",
    tone: "blue",
    access: "free",
    added: "2026-11-08",
    ko: "한국어 블록",
    en: "Hangul Blocks",
    emoji: "🧱",
    about: { ko: "자음·모음을 누르면 글자 블록이 쌓여요", en: "Tap letters and stack them into a Hangul block" },
    tagline: { ko: "글자 만들기, 매일 조금씩.", en: "Build Hangul, one block at a time." },
    description: "Tap consonants and vowels to build Hangul syllable blocks — a free, visual way to start reading Korean. 자음과 모음을 눌러 한글 글자 블록을 만들어 봐요.",
    searchTitle: "Learn Hangul by Building Syllable Blocks",
    learn: [
      { ko: "자음과 모음이 모여 글자 한 칸이 되는 법", en: "How consonants and vowels stack into one syllable block" },
      { ko: "세로 모음은 오른쪽, 가로 모음은 아래", en: "Vertical vowels go to the right, horizontal vowels go below" },
      { ko: "획 하나 더: ㄱ→ㅋ, ㅏ→ㅑ", en: "Add one stroke: ㄱ→ㅋ (a puff of air), ㅏ→ㅑ (a y sound)" },
      { ko: "받침과 겹받침 읽기", en: "Reading final consonants (batchim), including double ones" },
    ],
  },
  // 그다음 자기 이름 — 처음 쓰는 한글 단어
  {
    slug: "hangul-name",
    category: "hangul",
    tone: "pink",
    access: "free",
    added: "2026-11-11",
    ko: "한국어 이름",
    en: "Your Name in Hangul",
    emoji: "🧾",
    about: { ko: "영어 이름을 넣으면 한글 영수증이 나와요", en: "Type your name, get it in Hangul on a receipt" },
    tagline: { ko: "이름 쓰기, 매일 조금씩.", en: "Write your name in Hangul, one block at a time." },
    description: "Type your English name and print it in Hangul — letter by letter, with how to say “I’m ___” in Korean. 영어 이름을 한글로 바꿔 영수증으로 뽑아 줘요.",
    searchTitle: "Your Name in Korean (Hangul)",
    learn: [
      { ko: "영어 이름을 한글로 쓰는 법 (외래어 표기법)", en: "How your English name is written in Hangul, following Korea’s official loanword rules" },
      { ko: "글자마다 첫소리 · 모음 · 받침 풀어 보기", en: "Each block broken into its first sound, vowel and final consonant" },
      { ko: "저는 ___예요 / 이에요 — 받침에 따라 고르기", en: "Introducing yourself: 저는 ___예요 or 이에요, depending on the last letter" },
      { ko: "이름과 자기소개 문장 들어 보기", en: "Hear your name and your self-introduction read aloud" },
    ],
  },
  {
    slug: "korean-cards",
    category: "words",
    tone: "yellow",
    access: "free",
    added: "2026-11-06",
    ko: "한국어 카드",
    en: "Korean Word Cards",
    emoji: "🃏",
    about: { ko: "뒤집어서 외우는 단어 카드", en: "Flip cards to learn new words" },
    tagline: { ko: "한 장씩, 매일 조금씩.", en: "Learn Korean, one card at a time." },
    description: "Free Korean vocabulary flashcards with pictures — emotions, Korean food, family, places and weather. 뒤집으며 외우는 한국어 단어 카드.",
    searchTitle: "Korean Vocabulary Flashcards",
    learn: [
      { ko: "감정 · 한국 음식 · 가족 · 장소 · 날씨 단어 100개", en: "100 everyday words: emotions, Korean food, family, places and weather" },
      { ko: "카드마다 그림과 짧은 설명", en: "Every card has a picture and a short note" },
      { ko: "못 외운 카드는 다음 회차에 다시", en: "Cards you miss come back in the next round" },
    ],
    og: { image: "/korean-cards/img/og.png", alt: "포개어 쌓은 덱 카드 세 장 — 감정, 한국 음식, 가족" },
  },
  {
    slug: "calendar-practice",
    category: "numbers",
    tone: "mint",
    access: "free",
    added: "2026-11-06",
    ko: "한국어 달력",
    en: "Korean Calendar",
    emoji: "📆",
    about: { ko: "날짜를 한국어로 읽어요", en: "Read dates in Korean" },
    tagline: { ko: "날짜 읽기, 매일 조금씩.", en: "Read Korean dates, one day at a time." },
    description: "Learn to read dates in Korean — years, months, days and weekdays — and practice with a quiz. 날짜를 한국어로 읽고 퀴즈로 연습해요.",
    searchTitle: "How to Read Dates in Korean",
    learn: [
      { ko: "연도 · 월 · 일 · 요일을 한국어로 읽기", en: "Reading the year, month, day and weekday in Korean" },
      { ko: "6월은 유월, 10월은 시월", en: "Why June is 유월 and October is 시월" },
      { ko: "양력 고정 공휴일", en: "Korea's fixed-date public holidays" },
      { ko: "퀴즈로 날짜 읽기 연습", en: "A date-reading quiz" },
    ],
  },
  {
    slug: "korean-clock",
    category: "numbers",
    tone: "lavender",
    access: "free",
    added: "2026-11-06",
    ko: "한국어 시계",
    en: "Korean Clock",
    emoji: "🕒",
    about: { ko: "시곗바늘을 돌리면 한국어로 읽어 줘요", en: "Turn the hands, hear the time in Korean" },
    tagline: { ko: "시계 읽기, 매일 조금씩.", en: "Tell time in Korean, one minute at a time." },
    description: "Turn the clock hands and hear the time in Korean. Hours use native Korean numbers, minutes use Sino-Korean. 시곗바늘을 돌리면 한국어로 읽어 줘요.",
    searchTitle: "How to Tell Time in Korean",
    learn: [
      { ko: "시는 고유어: 한 시, 두 시, 세 시", en: "Hours use native Korean numbers: 한 시, 두 시, 세 시" },
      { ko: "분은 한자어: 십 분, 삼십 분", en: "Minutes use Sino-Korean numbers: 십 분, 삼십 분" },
      { ko: "시곗바늘을 돌리면 소리로 읽어 줘요", en: "Turn the hands and hear the time read aloud" },
      { ko: "퀴즈로 시각 읽기 연습", en: "A time-reading quiz" },
    ],
  },
];

export const appBySlug = (slug: string) => {
  const a = APPS.find((x) => x.slug === slug);
  if (!a) throw new Error(`shared/apps.ts 에 없는 앱이에요: ${slug}`);
  return a;
};

/** 워드마크 가운데 단어. "한국어 시계" → "시계" */
export const wordOf = (a: AppInfo) => a.ko.replace(/^한국어\s*/, "");
