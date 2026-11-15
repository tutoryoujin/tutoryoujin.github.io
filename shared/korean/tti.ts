/* ============================================================
   띠 — 태어난 해의 동물. 열두 동물이 한 해씩 돌아간다.

   2020 = 쥐, 2026 = 말. 띠는 해를 기준으로 한다.
   설날(음력 1월 1일) 전에 태어난 사람은 앞 해의 띠로 치기도 한다 — 그래서
   ttiOf 는 해만 받고, 1·2월 생일은 화면에서 「앞 해라면」을 같이 보여 준다.
   ============================================================ */
export type Tti = { ko: string; en: string; emoji: string };

/** 쥐부터. 순서가 곧 띠 계산 */
export const TTI: Tti[] = [
  { ko: "쥐", en: "Rat", emoji: "🐭" },
  { ko: "소", en: "Ox", emoji: "🐮" },
  { ko: "호랑이", en: "Tiger", emoji: "🐯" },
  { ko: "토끼", en: "Rabbit", emoji: "🐰" },
  { ko: "용", en: "Dragon", emoji: "🐲" },
  { ko: "뱀", en: "Snake", emoji: "🐍" },
  { ko: "말", en: "Horse", emoji: "🐴" },
  { ko: "양", en: "Sheep", emoji: "🐑" },
  { ko: "원숭이", en: "Monkey", emoji: "🐵" },
  { ko: "닭", en: "Rooster", emoji: "🐔" },
  { ko: "개", en: "Dog", emoji: "🐶" },
  { ko: "돼지", en: "Pig", emoji: "🐷" },
];

/** 그 해의 띠. 4년(쥐)에서 12년마다 돈다 */
export function ttiOf(year: number): Tti {
  if (!Number.isInteger(year)) throw new RangeError(`해는 정수여야 해요: ${year}`);
  return TTI[(((year - 4) % 12) + 12) % 12];
}

/** 그 띠인 해들. from ~ to 사이 */
export function yearsOf(t: Tti, from: number, to: number): number[] {
  const out: number[] = [];
  for (let y = from; y <= to; y++) if (ttiOf(y) === t) out.push(y);
  return out;
}

/** "말띠" — 띠 이름 */
export const ttiName = (t: Tti) => t.ko + "띠";
