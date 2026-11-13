import { describe, expect, it } from "vitest";
import { josa } from "./numbers";
import { TTI, ttiName, ttiOf, yearsOf } from "./tti";

describe("띠", () => {
  it("알려진 해", () => {
    const cases: [number, string][] = [
      [2020, "쥐"], [2021, "소"], [2022, "호랑이"], [2023, "토끼"], [2024, "용"], [2025, "뱀"],
      [2026, "말"], [2027, "양"], [2028, "원숭이"], [2029, "닭"], [2030, "개"], [2031, "돼지"],
      [1988, "용"], [1990, "말"], [1995, "돼지"], [2000, "용"], [1984, "쥐"], [1900, "쥐"],
    ];
    for (const [y, ko] of cases) expect(ttiOf(y).ko, String(y)).toBe(ko);
  });
  it("열두 해마다 같은 띠 — 띠동갑", () => {
    for (let y = 1900; y < 2100; y++) expect(ttiOf(y + 12)).toBe(ttiOf(y));
  });
  it("열두 동물이 다 다르다", () => {
    expect(new Set(TTI.map((t) => t.ko)).size).toBe(12);
  });
  it("그 띠인 해들", () => {
    expect(yearsOf(ttiOf(2026), 1960, 2031)).toEqual([1966, 1978, 1990, 2002, 2014, 2026]);
  });
  it("띠 이름 뒤에는 늘 예요 — 띠는 받침이 없다", () => {
    for (const t of TTI) {
      expect(ttiName(t)).toMatch(/띠$/);
      expect(josa(ttiName(t), "이에요", "예요")).toBe(ttiName(t) + "예요");
    }
  });
  it("정수가 아니면 받지 않는다", () => {
    expect(() => ttiOf(2026.5)).toThrow();
  });
});
