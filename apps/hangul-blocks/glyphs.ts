/* ============================================================
   블록 자모 — 자모 하나를 5×5 칸 안에 그린 그림.

   "#" 이 칸, "." 이 빈자리. 그림마다 크기가 다르다(가장 작게 잘라 둔다).
   디자인 캔버스의 「자음 19 · 모음 21」 판과 같은 데이터다.
   https://claude.ai/artifact/VzXxCndiskddCmd7twN573

   ㅈ → ㅊ 은 윗줄에 칸만 더하면 되도록 ㅈ 을 4줄로 그렸다.
   ㄱ → ㅋ · ㄷ → ㅌ 도 칸만 더하면 된다. ㅂ → ㅍ 은 모양이 바뀐다.
   ============================================================ */

export type Glyph = { rows: string[]; ko: string; en: string };

/** 교재 순서: 첫 10 → 바람 넷 → 두 번 쓰기 다섯 */
export const CONSONANTS: Record<string, Glyph> = {
  ㄱ: { ko: "기역", en: "g", rows: ["#####", "....#", "....#", "....#", "....#"] },
  ㄴ: { ko: "니은", en: "n", rows: ["#....", "#....", "#....", "#....", "#####"] },
  ㄷ: { ko: "디귿", en: "d", rows: ["#####", "#....", "#....", "#....", "#####"] },
  ㄹ: { ko: "리을", en: "l", rows: ["#####", "....#", "#####", "#....", "#####"] },
  ㅁ: { ko: "미음", en: "m", rows: ["#####", "#...#", "#...#", "#...#", "#####"] },
  ㅂ: { ko: "비읍", en: "b", rows: ["#...#", "#...#", "#####", "#...#", "#####"] },
  ㅅ: { ko: "시옷", en: "s", rows: ["..#..", ".#.#.", ".#.#.", "#...#", "#...#"] },
  ㅇ: { ko: "이응", en: "silent / ng", rows: [".###.", "#...#", "#...#", "#...#", ".###."] },
  ㅈ: { ko: "지읒", en: "j", rows: ["#####", "..#..", ".#.#.", "#...#"] },
  ㅎ: { ko: "히읗", en: "h", rows: ["..#..", "#####", ".###.", ".#.#.", ".###."] },
  ㅋ: { ko: "키읔", en: "k", rows: ["#####", "....#", "#####", "....#", "....#"] },
  ㅌ: { ko: "티읕", en: "t", rows: ["#####", "#....", "#####", "#....", "#####"] },
  ㅍ: { ko: "피읖", en: "p", rows: ["#####", ".#.#.", ".#.#.", ".#.#.", "#####"] },
  ㅊ: { ko: "치읓", en: "ch", rows: ["..#..", "#####", "..#..", ".#.#.", "#...#"] },
  ㄲ: { ko: "쌍기역", en: "kk", rows: ["##.##", ".#..#", ".#..#", ".#..#", ".#..#"] },
  ㄸ: { ko: "쌍디귿", en: "tt", rows: ["##.##", "#..#.", "#..#.", "#..#.", "##.##"] },
  ㅃ: { ko: "쌍비읍", en: "pp", rows: ["#.#.#", "#.#.#", "#####", "#.#.#", "#####"] },
  ㅆ: { ko: "쌍시옷", en: "ss", rows: [".#.#.", ".#.#.", "#.#.#", "#.#.#"] },
  ㅉ: { ko: "쌍지읒", en: "jj", rows: ["#####", ".#.#.", "#.#.#", "#.#.#"] },
};

/** 섞인 모음은 그리지 않는다 — 가로 모음 + 세로 모음을 이어 붙인다 (hangul.ts 의 MIXED_PARTS) */
export const VOWELS: Record<string, Glyph> = {
  ㅏ: { ko: "아", en: "a", rows: ["#.", "#.", "##", "#.", "#."] },
  ㅑ: { ko: "야", en: "ya", rows: ["#.", "##", "#.", "##", "#."] },
  ㅓ: { ko: "어", en: "eo", rows: [".#", ".#", "##", ".#", ".#"] },
  ㅕ: { ko: "여", en: "yeo", rows: [".#", "##", ".#", "##", ".#"] },
  ㅗ: { ko: "오", en: "o", rows: ["..#..", "#####"] },
  ㅛ: { ko: "요", en: "yo", rows: [".#.#.", "#####"] },
  ㅜ: { ko: "우", en: "u", rows: ["#####", "..#.."] },
  ㅠ: { ko: "유", en: "yu", rows: ["#####", ".#.#."] },
  ㅡ: { ko: "으", en: "eu", rows: ["#####"] },
  ㅣ: { ko: "이", en: "i", rows: ["#", "#", "#", "#", "#"] },
  ㅐ: { ko: "애", en: "ae", rows: ["#.#", "#.#", "###", "#.#", "#.#"] },
  ㅔ: { ko: "에", en: "e", rows: [".#.#", ".#.#", "##.#", ".#.#", ".#.#"] },
  ㅒ: { ko: "얘", en: "yae", rows: ["#.#", "###", "#.#", "###", "#.#"] },
  ㅖ: { ko: "예", en: "ye", rows: [".#.#", "##.#", ".#.#", "##.#", ".#.#"] },
};

export const MIXED: Record<string, { ko: string; en: string }> = {
  ㅘ: { ko: "와", en: "wa" },
  ㅙ: { ko: "왜", en: "wae" },
  ㅚ: { ko: "외", en: "oe" },
  ㅝ: { ko: "워", en: "wo" },
  ㅞ: { ko: "웨", en: "we" },
  ㅟ: { ko: "위", en: "wi" },
  ㅢ: { ko: "의", en: "ui" },
};

/** 획 하나 더 = 바람 한 번 (교재 CV02). 예시는 교재의 단어 */
/**
 * 획 하나 더 (교재 CV01 · CV02).
 *   자음: 획 하나 더 = 바람 한 번     ㄱ → ㅋ
 *   모음: 획 하나 더 = 앞에 y 소리    ㅏ → ㅑ
 */
export type StrokePair = {
  kind: "air" | "y";
  plain: string;
  more: string;
  syl: [string, string];
  /** 소리 하나로 뜻이 바뀌는 단어 — [한국어, 영어] */
  words?: [[string, string], [string, string]];
};
export const AIR_PAIRS: StrokePair[] = [
  { kind: "air", plain: "ㄱ", more: "ㅋ", syl: ["가", "카"] },
  { kind: "air", plain: "ㄷ", more: "ㅌ", syl: ["다", "타"] },
  { kind: "air", plain: "ㅂ", more: "ㅍ", syl: ["바", "파"], words: [["비", "rain"], ["피", "blood"]] },
  { kind: "air", plain: "ㅈ", more: "ㅊ", syl: ["자", "차"], words: [["자다", "to sleep"], ["차다", "to kick"]] },
];
export const Y_PAIRS: StrokePair[] = [
  { kind: "y", plain: "ㅏ", more: "ㅑ", syl: ["아", "야"] },
  { kind: "y", plain: "ㅓ", more: "ㅕ", syl: ["어", "여"] },
  { kind: "y", plain: "ㅗ", more: "ㅛ", syl: ["오", "요"] },
  { kind: "y", plain: "ㅜ", more: "ㅠ", syl: ["우", "유"] },
  { kind: "y", plain: "ㅐ", more: "ㅒ", syl: ["애", "얘"] },
  { kind: "y", plain: "ㅔ", more: "ㅖ", syl: ["에", "예"] },
];

export type Cell = [x: number, y: number];

export function cellsOf(rows: readonly string[]): Cell[] {
  const out: Cell[] = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => c === "#" && out.push([x, y])));
  return out;
}
export const sizeOf = (rows: readonly string[]) => ({ w: rows[0].length, h: rows.length });
