/* ============================================================
   글자 블록 배치 — 교재(Hangul Basics)의 네 가지 모양.

     1  세로 모음 → 오른쪽        가   C V
     2  가로 모음 → 아래          고   C / V
     3  1 + 받침 → 맨 아래        강
     4  2 + 받침 → 맨 아래        곰
     섞인 모음(와)은 가로 모음이 아래, 세로 모음이 오른쪽.
   겹받침(닭)은 두 자음을 맨 아래에 나란히. 위보다 넓으면 위를 가운데로 옮긴다.

   자모 그림은 늘이거나 줄이지 않고 제 크기 그대로 놓는다. 그래서
   가는 옆으로 넓고, 고는 위아래로 길다 — 모양 차이가 눈에 보인다.
   조각 사이에는 늘 빈 줄이 하나 있다 (layout.test.ts 가 지킨다).
   ============================================================ */
import { DOUBLE_JONG, MIXED_PARTS, shapeOf } from "@yj/korean/hangul";
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

  // 받침은 늘 맨 아래, 가운데. 겹받침은 자음 둘을 한 칸 띄워 나란히, 아래 맞춤.
  // 조각은 자음마다 따로 — ㄹ → ㄺ 에서 ㄹ 칸이 key 그대로 미끄러지고 ㄱ 만 떨어진다
  const parts = DOUBLE_JONG[jong] ?? [jong];
  const rows = parts.map((ch) => CONSONANTS[ch].rows);
  const sizes = rows.map(sizeOf);
  const jw = sizes.reduce((a, z) => a + z.w, 0) + parts.length - 1;
  const jh = Math.max(...sizes.map((z) => z.h));
  const w = Math.max(topW, jw);
  const shift = (w - topW) >> 1;
  if (shift) for (const p of pieces) p.cells = p.cells.map(([x, y]) => [x + shift, y]);
  let x = (w - jw) >> 1;
  parts.forEach((ch, i) => {
    pieces.push({ role: "jong", ch, cells: at(rows[i], x, topH + 1 + jh - sizes[i].h) });
    x += sizes[i].w + 1;
  });
  return { w, h: topH + 1 + jh, pieces };
}

/**
 * 모음의 긴 획 — 한 줄에 5칸 이상인 세로줄 · 가로줄의 칸 ("x,y").
 * 세로 모음은 세로줄(ㅐ 는 둘), 가로 모음은 가로줄, 섞인 모음은 둘 다.
 * 만들기에서 모음을 넣을 때 이 칸만 잠깐 진하게 — 세로로 긴지 가로로 긴지 보이게.
 */
export function longStroke(cells: readonly Cell[]): Set<string> {
  const byX = new Map<number, Cell[]>();
  const byY = new Map<number, Cell[]>();
  for (const c of cells) {
    byX.set(c[0], [...(byX.get(c[0]) ?? []), c]);
    byY.set(c[1], [...(byY.get(c[1]) ?? []), c]);
  }
  const out = new Set<string>();
  for (const line of [...byX.values(), ...byY.values()]) if (line.length >= 5) for (const [x, y] of line) out.add(`${x},${y}`);
  return out;
}

/* ---------- 획 하나 더 ---------- */

type XY = readonly [number, number];
export type StrokeCell = { x: number; y: number; from: XY; added: boolean };

/**
 * 원래 자모(plain)에서 획 하나 더한 자모(more)로. 칸마다 어디서 왔는지와 새로 더한 칸인지.
 *
 * 그냥 겹치는 칸만 보면 안 된다. ㅏ 의 짧은 획은 가운데 줄인데 ㅑ 의 두 획은 그 위아래라
 * 겹치는 칸이 없어서 두 획이 다 '새 획'으로 보인다. 그래서 자리를 옮긴 칸은 가장 가까운
 * 새 자리로 짝지어 미끄러지게 하고, 짝 없이 남은 칸만 더한 획으로 친다 (ㅏ → ㅑ 는 한 칸).
 */
export function strokeDiff(plain: readonly XY[], more: readonly XY[]): StrokeCell[] {
  const key = ([x, y]: XY) => `${x},${y}`;
  const inPlain = new Set(plain.map(key));
  const inMore = new Set(more.map(key));
  const moved = plain.filter((c) => !inMore.has(key(c)));
  const free = more.filter((c) => !inPlain.has(key(c)));
  const from = new Map<string, XY>();
  for (const m of moved) {
    // 가장 가까운 빈 새 자리로. 거리가 같으면 앞(위 · 왼쪽)의 것
    let best = -1;
    let bestD = Infinity;
    free.forEach((f, i) => {
      if (from.has(key(f))) return;
      const d = Math.abs(f[0] - m[0]) + Math.abs(f[1] - m[1]);
      if (d < bestD) (best = i), (bestD = d);
    });
    if (best >= 0) from.set(key(free[best]), m);
  }
  return more.map((c) => {
    const k = key(c);
    if (inPlain.has(k)) return { x: c[0], y: c[1], from: c, added: false };
    const f = from.get(k);
    return f ? { x: c[0], y: c[1], from: f, added: false } : { x: c[0], y: c[1], from: c, added: true };
  });
}
