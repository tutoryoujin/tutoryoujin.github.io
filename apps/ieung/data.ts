/* ============================================================
   한국어 이응 (#97) — 단어 · 짝 · 소리 규칙.

   ㅇ 은 블록 안 자리에 따라 일이 다르다.
   - 첫자리(초성): 소리가 없다. 모음이 앉을 자리만 채운다.
   - 받침: [ng]. 끝까지 코로 울린다. [g] 가 아니다.

   단어는 배운 글자 위주, 동사 줄기는 넣지 않는다 (#89 · hangul-blocks words.ts 와 같은 방침).
   ============================================================ */
import { canBeJong, compose, decompose } from "@yj/korean/hangul";

export type Word = { ko: string; en: string };

/** 첫자리 ㅇ 만 있는 단어 — ㅇ 이 모두 소리 없음 */
export const SILENT_WORDS: Word[] = [
  { ko: "아이", en: "child" },
  { ko: "오이", en: "cucumber" },
  { ko: "우유", en: "milk" },
  { ko: "아우", en: "younger brother" },
  { ko: "이", en: "tooth · two" },
  { ko: "오", en: "five" },
];

/** 받침 ㅇ 이 있는 단어 */
export const NG_WORDS: Word[] = [
  { ko: "방", en: "room" },
  { ko: "강", en: "river" },
  { ko: "공", en: "ball" },
  { ko: "상", en: "prize" },
  { ko: "형", en: "older brother" },
  { ko: "영", en: "zero" },
  { ko: "가방", en: "bag" },
  { ko: "사랑", en: "love" },
  { ko: "고양이", en: "cat" },
  { ko: "강아지", en: "puppy" },
];

/** ng / g 짝 — 첫소리 · 모음이 같고 받침만 ㅇ / ㄱ. en 은 뜻이 없으면 비운다 */
export type Pair = { ng: Word & { rom: string }; g: Word & { rom: string } };
export const PAIRS: Pair[] = [
  { ng: { ko: "방", en: "room", rom: "bang" }, g: { ko: "박", en: "gourd", rom: "bak" } },
  { ng: { ko: "강", en: "river", rom: "gang" }, g: { ko: "각", en: "angle", rom: "gak" } },
  { ng: { ko: "공", en: "ball", rom: "gong" }, g: { ko: "곡", en: "song · tune", rom: "gok" } },
  { ng: { ko: "상", en: "prize", rom: "sang" }, g: { ko: "삭", en: "", rom: "sak" } },
  { ng: { ko: "형", en: "older brother", rom: "hyeong" }, g: { ko: "혁", en: "", rom: "hyeok" } },
  { ng: { ko: "영", en: "zero", rom: "yeong" }, g: { ko: "역", en: "station", rom: "yeok" } },
];

/** 받침 ㅇ 이 다음 글자로 넘어가지 않는 예 — 뒤 글자가 ㅇ 으로 시작한다 */
export const STAYS: Word[] = [
  { ko: "고양이", en: "cat" },
  { ko: "영어", en: "English" },
  { ko: "강아지", en: "puppy" },
];
/** 견주어 볼 것 — 다른 받침은 넘어간다 (#74) */
export const MOVES: Word[] = [
  { ko: "한국어", en: "Korean" },
  { ko: "음악", en: "music" },
];

/** 스위치에서 고르는 모음 — 기본 모음 중 혼자 써도 소리가 분명한 여섯. 로마자는 표기법 */
export const SWITCH_VOWELS: { v: string; rom: string }[] = [
  { v: "ㅏ", rom: "a" },
  { v: "ㅓ", rom: "eo" },
  { v: "ㅗ", rom: "o" },
  { v: "ㅜ", rom: "u" },
  { v: "ㅡ", rom: "eu" },
  { v: "ㅣ", rom: "i" },
];

/* ---------- 소리 규칙 ---------- */

export type Seat = "cho" | "jong";
/** 단어 안의 ㅇ 마다 몇 번째 글자의 어느 자리인지 */
export function ieungSeats(word: string): { i: number; seat: Seat }[] {
  const out: { i: number; seat: Seat }[] = [];
  [...word].forEach((s, i) => {
    const d = decompose(s);
    if (d?.cho === "ㅇ") out.push({ i, seat: "cho" });
    if (d?.jong === "ㅇ") out.push({ i, seat: "jong" });
  });
  return out;
}

/**
 * 이어 읽기 — 받침 뒤에 ㅇ 으로 시작하는 글자가 오면 받침이 그 자리로 넘어간다.
 * 한국어 → [한구거] · 음악 → [으막]. ㅇ 받침은 넘어가지 않는다 (고양이 → [고양이]).
 * 홑받침만 다룬다 — ㅎ(좋아 [조아]) · 겹받침(닭이 [달기])은 규칙이 달라 그대로 둔다.
 * asG 를 켜면 ㅇ 받침 뒤에 g 소리를 덧붙인다 — 학생들이 하는 실수 (고양이 → [고양기]).
 * 영어 철자 ng 에 끌려 ㅇ 은 그대로 두고 다음 글자를 ㄱ 으로 시작한다 (finger 처럼).
 */
export function linked(word: string, asG = false): string {
  const parts = [...word].map((s) => decompose(s));
  if (parts.some((p) => !p)) return word;
  const ds = parts as NonNullable<(typeof parts)[number]>[];
  for (let i = 0; i < ds.length - 1; i++) {
    const cur = ds[i];
    const next = ds[i + 1];
    if (next.cho !== "ㅇ" || !canBeJong(cur.jong) || cur.jong === "ㅎ") continue;
    if (cur.jong === "ㅇ") {
      if (asG) next.cho = "ㄱ"; // ㅇ 받침은 그대로, g 가 새로 생긴다
      continue;
    }
    next.cho = cur.jong;
    cur.jong = "";
  }
  return ds.map((d) => compose(d.cho, d.jung, d.jong)).join("");
}
