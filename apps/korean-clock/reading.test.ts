import { describe, expect, it } from "vitest";
import { parts, readTime, wrongChoices } from "./reading";

describe("readTime", () => {
  it.each([
    [3, 30, "세 시 삼십 분"],
    [1, 5, "한 시 오 분"],
    [12, 45, "열두 시 사십오 분"],
    [11, 59, "열한 시 오십구 분"],
    [7, 0, "일곱 시"],
    [4, 20, "네 시 이십 분"],
  ])("%i:%i → %s", (h, m, s) => expect(readTime(h, m)).toBe(s));
});

it("parts — 자정과 정오", () => {
  expect(parts(0)).toEqual({ h: 12, m: 0, pm: false });
  expect(parts(12 * 60)).toEqual({ h: 12, m: 0, pm: true });
  expect(parts(15 * 60 + 30)).toEqual({ h: 3, m: 30, pm: true });
});

describe("wrongChoices", () => {
  it("정답이 오답에 섞이지 않는다", () => {
    for (let h = 1; h <= 12; h++)
      for (let m = 5; m < 60; m += 5) {
        const all = wrongChoices(h, m, (xs) => xs[0]).concat(wrongChoices(h, m, (xs) => xs[xs.length - 1]));
        expect(all.map((c) => c.text)).not.toContain(readTime(h, m));
      }
  });
  it("9:45 — 분을 고유어로 읽은 보기가 있다", () => {
    expect(wrongChoices(9, 45).map((c) => c.text)).toContain("아홉 시 마흔다섯 분");
  });
});
