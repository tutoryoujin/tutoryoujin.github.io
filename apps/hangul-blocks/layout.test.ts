import { describe, expect, it } from "vitest";
import { CHO, JUNG, canBeJong, commonSyllables, decompose } from "@yj/korean/hangul";
import { AIR_PAIRS, CONSONANTS, VOWELS, Y_PAIRS, cellsOf, sizeOf } from "./glyphs";
import { blockType, layoutSyllable, strokeDiff, stretchTall } from "./layout";

describe("자모 그림", () => {
  it("자음 19 · 모음 14 가 다 있다 (섞인 모음 7 은 이어 붙인다)", () => {
    for (const c of CHO) expect(CONSONANTS[c], c).toBeDefined();
    expect(Object.keys(VOWELS)).toHaveLength(14);
  });

  it("모두 5×5 안에 들어가고, 줄 길이가 같다", () => {
    for (const [ch, g] of Object.entries({ ...CONSONANTS, ...VOWELS })) {
      const { w, h } = sizeOf(g.rows);
      expect(w, ch).toBeLessThanOrEqual(5);
      expect(h, ch).toBeLessThanOrEqual(5);
      for (const r of g.rows) expect(r.length, ch).toBe(w);
    }
  });

  // ㄱ→ㅋ · ㄷ→ㅌ · ㅈ→ㅊ 은 원래 칸이 그대로 있고 새 칸만 떨어진다 (아래 맞춤).
  // ㅂ→ㅍ 은 모양이 바뀌어서 여기서 뺀다.
  it.each(AIR_PAIRS.filter((p) => p.plain !== "ㅂ").map((p) => [p.plain, p.more]))("%s → %s 는 칸만 더한다", (a, b) => {
    const bottom = (rows: string[]) => cellsOf(rows).map(([x, y]) => `${x},${y + 5 - rows.length}`);
    const after = new Set(bottom(CONSONANTS[b].rows));
    const before = bottom(CONSONANTS[a].rows);
    for (const c of before) expect(after.has(c), c).toBe(true);
    expect(after.size).toBeGreaterThan(before.length);
  });

  // 모음은 짧은 획 하나가 둘이 된다 — 칸이 꼭 하나 늘고, 크기는 같다 (같은 자리에서 바뀌어 보이게)
  it.each(Y_PAIRS.map((p) => [p.plain, p.more]))("%s → %s 는 칸이 하나 는다", (a, b) => {
    expect(cellsOf(VOWELS[b].rows)).toHaveLength(cellsOf(VOWELS[a].rows).length + 1);
    expect(sizeOf(VOWELS[b].rows)).toEqual(sizeOf(VOWELS[a].rows));
  });

  // 들려주는 소리가 그 자모로 만든 글자여야 한다 — 아 → 야
  it.each([...AIR_PAIRS, ...Y_PAIRS].map((p) => [p.plain, p.more, p.syl] as const))("%s → %s 의 예시 글자", (a, b, syl) => {
    const first = (s: string) => decompose(s)!;
    const pick = (d: { cho: string; jung: string }, ch: string) => (ch in CONSONANTS ? d.cho : d.jung);
    expect(pick(first(syl[0]), a)).toBe(a);
    expect(pick(first(syl[1]), b)).toBe(b);
  });
});

describe("stretchTall", () => {
  it("짧은 획을 비율대로 옮긴다", () => {
    expect(stretchTall(VOWELS["ㅏ"].rows, 7)).toEqual(["#.", "#.", "#.", "##", "#.", "#.", "#."]);
    expect(stretchTall(VOWELS["ㅣ"].rows, 7)).toHaveLength(7);
  });
});

describe("배치", () => {
  it("세로 모음은 오른쪽 — 가는 옆으로 넓다", () => {
    const l = layoutSyllable("ㄱ", "ㅏ", null);
    expect(l.w).toBeGreaterThan(l.h);
  });
  it("가로 모음은 아래 — 고는 위아래로 길다", () => {
    const l = layoutSyllable("ㄱ", "ㅗ", null);
    expect(l.h).toBeGreaterThan(l.w);
  });
  it("받침은 맨 아래", () => {
    const l = layoutSyllable("ㄱ", "ㅏ", "ㅇ");
    const jong = l.pieces.find((p) => p.role === "jong")!;
    const top = Math.max(...l.pieces.filter((p) => p.role !== "jong").flatMap((p) => p.cells.map(([, y]) => y)));
    expect(Math.min(...jong.cells.map(([, y]) => y))).toBeGreaterThan(top);
  });
  it.each([
    ["ㅏ", null, 1],
    ["ㅗ", null, 2],
    ["ㅏ", "ㅇ", 3],
    ["ㅗ", "ㅁ", 4],
    ["ㅘ", null, null],
  ] as const)("%s + %s → %s번 모양", (v, j, t) => expect(blockType(v, j)).toBe(t));

  // 자주 쓰는 2,350자 중 겹받침이 없는 글자 전부: 조각끼리 겹치지 않고, 맞닿지도 않는다
  it("자주 쓰는 글자 전부 — 조각 사이에 빈 줄이 있다", () => {
    let n = 0;
    const bad: string[] = [];
    for (const s of commonSyllables()) {
      const d = decompose(s)!;
      if (d.jong && !canBeJong(d.jong)) continue; // 겹받침은 다루지 않는다
      if (!JUNG.includes(d.jung as (typeof JUNG)[number])) bad.push(`${s} 모음`);
      const l = layoutSyllable(d.cho, d.jung, d.jong || null);
      const owner = new Map<string, string>();
      for (const p of l.pieces)
        for (const [x, y] of p.cells) {
          if (x < 0 || x >= l.w || y < 0 || y >= l.h) bad.push(`${s} 칸이 밖으로 ${x},${y}`);
          const k = `${x},${y}`;
          if (owner.has(k)) bad.push(`${s} 겹침 ${k}`);
          owner.set(k, p.role);
        }
      for (const [k, role] of owner) {
        const [x, y] = k.split(",").map(Number);
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const o = owner.get(`${x + dx},${y + dy}`);
          if (o && o !== role) bad.push(`${s} 의 ${role} 와 ${o} 가 붙음`);
        }
      }
      n++;
    }
    expect(bad).toEqual([]);
    expect(n).toBeGreaterThan(2000);
  });
});

describe("획 하나 더 — 노란 칸", () => {
  // ㅏ → ㅑ 에서 두 획이 다 노랗게 나오던 문제. 더한 획은 언제나 하나다
  it.each([...AIR_PAIRS, ...Y_PAIRS].filter((p) => p.plain !== "ㅂ").map((p) => [p.plain, p.more]))("%s → %s", (a, b) => {
    const g = (ch: string) => (CONSONANTS[ch] ?? VOWELS[ch]).rows;
    const diff = strokeDiff(cellsOf(g(a)), cellsOf(g(b)));
    const added = diff.filter((c) => c.added).length;
    expect(added, "더한 칸").toBe(cellsOf(g(b)).length - cellsOf(g(a)).length);
    // 원래 칸은 하나도 빠짐없이 어딘가로 간다 (from 이 겹치지 않는다)
    const froms = diff.filter((c) => !c.added).map((c) => c.from.join(","));
    expect(new Set(froms).size).toBe(cellsOf(g(a)).length);
  });

  it("ㅏ → ㅑ: 원래 획은 위로 옮기고 아래 획 하나만 새로", () => {
    const diff = strokeDiff(cellsOf(VOWELS["ㅏ"].rows), cellsOf(VOWELS["ㅑ"].rows));
    expect(diff.filter((c) => c.added).map((c) => [c.x, c.y])).toEqual([[1, 3]]);
    expect(diff.find((c) => c.x === 1 && c.y === 1)?.from).toEqual([1, 2]);
  });
});
