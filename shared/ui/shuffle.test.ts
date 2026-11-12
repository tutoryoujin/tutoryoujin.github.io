import { describe, expect, it } from "vitest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("원본을 바꾸지 않고 같은 것들을 돌려준다", () => {
    const a = [1, 2, 3, 4, 5];
    const s = shuffle(a);
    expect(a).toEqual([1, 2, 3, 4, 5]);
    expect([...s].sort()).toEqual(a);
  });
  it("고르게 섞는다 — 첫 자리에 오는 횟수가 거의 같다", () => {
    const n = 20000;
    const first = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) first[shuffle([0, 1, 2, 3])[0]]++;
    for (const c of first) expect(Math.abs(c / n - 0.25)).toBeLessThan(0.02);
  });
});
