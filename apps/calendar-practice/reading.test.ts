import { describe, expect, it } from "vitest";
import { holiday, readDay, readMonth, readYear, wrongChoices } from "./reading";

describe("읽기", () => {
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
    [10, "십 일"],
    [16, "십육 일"],
    [31, "삼십일 일"],
  ])("%i일 → %s", (d, s) => expect(readDay(d)).toBe(s));
});

describe("오답", () => {
  it("정답이 섞이지 않고 모두 이유가 있다", () => {
    for (let m = 1; m <= 12; m++)
      for (let d = 1; d <= 28; d++) {
        const w = wrongChoices(m, d);
        expect(w.map((c) => c.text)).not.toContain(`${readMonth(m)} ${readDay(d)}`);
        expect(w.every((c) => c.why)).toBe(true);
      }
  });
  it("6월은 육월·여섯월을 꼭 보여 준다", () => {
    const t = wrongChoices(6, 3).map((c) => c.text);
    expect(t).toContain("육월 삼 일");
    expect(t).toContain("여섯월 삼 일");
  });
});

describe("양력 고정 공휴일", () => {
  it("늘 있는 날", () => {
    expect(holiday(2026, 10, 9)?.[0]).toBe("한글날");
    expect(holiday(2026, 6, 6)?.[0]).toBe("현충일");
    expect(holiday(2026, 6, 7)).toBeUndefined();
  });
  it("노동절(5월 1일)은 2026년부터", () => {
    expect(holiday(2026, 5, 1)?.[0]).toBe("노동절");
    expect(holiday(2025, 5, 1)).toBeUndefined();
  });
  it("제헌절(7월 17일)은 2007년까지, 그리고 2026년부터 다시", () => {
    expect(holiday(2026, 7, 17)?.[0]).toBe("제헌절");
    expect(holiday(2025, 7, 17)).toBeUndefined();
    expect(holiday(2008, 7, 17)).toBeUndefined();
    expect(holiday(2007, 7, 17)?.[0]).toBe("제헌절");
  });
});
