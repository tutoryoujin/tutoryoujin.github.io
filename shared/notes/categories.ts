/* 블로그 분류 (#116) — 글 하나에 분류 하나.
   slug 는 영어, 한번 정하면 바꾸지 않는다 (분류 페이지 /notes/<slug>/ 가 될 주소, #117).
   이름은 앱 밖 페이지 규칙대로 영어가 크고 한국어가 아래 (#94).
   역사 · 비즈니스처럼 글이 아직 없는 분류는 글이 생길 때 더한다. */
export const CATEGORIES = [
  { slug: "korean-culture", en: "Korean Culture", ko: "한국 문화" },
  { slug: "grammar", en: "Grammar", ko: "문법" },
  { slug: "hangul-pronunciation", en: "Hangul & Pronunciation", ko: "한글 · 발음" },
  { slug: "words-expressions", en: "Words & Expressions", ko: "낱말 · 표현" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type Category = (typeof CATEGORIES)[number];

export const categoryBySlug = (slug: CategorySlug): Category => CATEGORIES.find((c) => c.slug === slug)!;
