import { describe, expect, it } from "vitest";
import { readDate, readDay, readMonth, readWeekday, readYear } from "./date";

describe("날짜 읽기", () => {
  it("연도", () => expect(readYear(2026)).toBe("이천이십육 년"));
  it.each([
    [1, "일월"],
    [6, "유월"],
    [10, "시월"],
    [11, "십일월"],
    [12, "십이월"],
  ])("%i월 → %s", (m, s) => expect(readMonth(m)).toBe(s));
  it.each([
    [1, "일 일"],
    [6, "육 일"],
    [10, "십 일"],
    [31, "삼십일 일"],
  ])("%i일 → %s", (d, s) => expect(readDay(d)).toBe(s));
  it("유월 · 시월이어도 일은 그대로", () => {
    expect(readDate(6, 6)).toBe("유월 육 일");
    expect(readDate(10, 10)).toBe("시월 십 일");
  });
  it("요일 — 0 = 일요일", () => {
    expect(readWeekday(0)).toBe("일요일");
    expect(readWeekday(5)).toBe("금요일");
  });
});
