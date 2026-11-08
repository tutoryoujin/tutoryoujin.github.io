/* ============================================================
   글자 블록 배치 — 교재(Hangul Basics)의 네 가지 모양.

     1  세로 모음 → 오른쪽        가   C V
     2  가로 모음 → 아래          고   C / V
     3  1 + 받침 → 맨 아래        강
     4  2 + 받침 → 맨 아래        곰
     섞인 모음(와)은 가로 모음이 아래, 세로 모음이 오른쪽.

   자모 그림은 늘이거나 줄이지 않고 제 크기 그대로 놓는다. 그래서
   가는 옆으로 넓고, 고는 위아래로 길다 — 모양 차이가 눈에 보인다.
   조각 사이에는 늘 빈 줄이 하나 있다 (layout.test.ts 가 지킨다).
   ============================================================ */
import { MIXED_PARTS, shapeOf } from "@yj/korean/hangul";
import { CONSONANTS, VOWELS, cellsOf, sizeOf, type Cell } from "./glyphs";

export type Role = "cho" | "jung" | "jong";
export type Piece = { role: Role; ch: string; cells: Cell[] };
export type Layout = { w: number; h: number; pieces: Piece[] };

const at = (rows: readonly string[], ox: number, oy: number): Cell[] => cellsOf(rows).map(([x, y]) => [x + ox, y + oy]);

/** 세로 모음을 높이 h 로 늘린다. 곧은 줄(첫 줄)을 끼워 넣고 짧은 획은 비율대로 옮긴다 */
export function stretchTall(rows: readonly string[], h: number): string[] {
  if (h === rows.length) return [...rows];
  const plain = rows[0];
  const out = Array<string>(h).fill(plain);
  rows.forEach((r, y) => {
    if (r !== plain) out[Math.round((y * (h - 1)) / (rows.length - 1))] = r;
  });
  return out;
}

export function layoutSyllable(cho: string, jung: string | null, jong: string | null): Layout {
  const c = CONSONANTS[cho].rows;
  const cs = sizeOf(c);

  // 자음 하나뿐 — 5×5 가운데
  if (!jung) return { w: 5, h: 5, pieces: [{ role: "cho", ch: cho, cells: at(c, (5 - cs.w) >> 1, (5 - cs.h) >> 1) }] };

  const pieces: Piece[] = [];
  let topW: number;
  let topH: number;
  const shape = shapeOf(jung);

  if (shape === "tall") {
    const v = VOWELS[jung].rows;
    pieces.push({ role: "cho", ch: cho, cells: at(c, 0, (5 - cs.h) >> 1) });
    pieces.push({ role: "jung", ch: jung, cells: at(v, 6, 0) });
    topW = 6 + v[0].length;
    topH = 5;
  } else if (shape === "flat") {
    const v = VOWELS[jung].rows;
    pieces.push({ role: "cho", ch: cho, cells: at(c, 0, 0) });
    pieces.push({ role: "jung", ch: jung, cells: at(v, 0, cs.h + 1) });
    topW = 5;
    topH = cs.h + 1 + v.length;
  } else {
    const [f, t] = MIXED_PARTS[jung];
    const fr = VOWELS[f].rows;
    const leftH = cs.h + 1 + fr.length;
    const tr = stretchTall(VOWELS[t].rows, leftH);
    pieces.push({ role: "cho", ch: cho, cells: at(c, 0, 0) });
    pieces.push({ role: "jung", ch: jung, cells: [...at(fr, 0, cs.h + 1), ...at(tr, 6, 0)] });
    topW = 6 + tr[0].length;
    topH = leftH;
  }

  if (!jong) return { w: topW, h: topH, pieces };

  // 받침은 늘 맨 아래, 가운데
  const j = CONSONANTS[jong].rows;
  const js = sizeOf(j);
  pieces.push({ role: "jong", ch: jong, cells: at(j, (topW - js.w) >> 1, topH + 1) });
  return { w: topW, h: topH + 1 + js.h, pieces };
}

/** 교재의 모양 번호. 섞인 모음은 번호가 없다 */
export function blockType(jung: string, jong: string | null): 1 | 2 | 3 | 4 | null {
  const s = shapeOf(jung);
  if (s === "mixed") return null;
  return ((s === "tall" ? 1 : 2) + (jong ? 2 : 0)) as 1 | 2 | 3 | 4;
}
