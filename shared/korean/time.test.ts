import { describe, expect, it } from "vitest";
import { readHalf, readTime } from "./time";

describe("시각 읽기", () => {
  it.each([
    [3, 0, "세 시"],
    [3, 10, "세 시 십 분"],
    [11, 59, "열한 시 오십구 분"],
    [12, 30, "열두 시 삼십 분"],
  ])("%i:%i → %s", (h, m, s) => expect(readTime(h, m)).toBe(s));
  it("반", () => expect(readHalf(12)).toBe("열두 시 반"));
});
