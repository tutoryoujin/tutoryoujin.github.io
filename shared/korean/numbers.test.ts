import { describe, expect, it } from "vitest";
import { josa, native, nativeCounter, sino } from "./numbers";

// 읽기가 틀리면 학생이 틀린 걸 외운다. 헷갈리는 자리만 골라 못 박아 둔다.
describe("sino", () => {
  it.each([
    [0, "영"],
    [1, "일"],
    [10, "십"],
    [11, "십일"],
    [16, "십육"],
    [20, "이십"],
    [59, "오십구"],
    [100, "백"],
    [2026, "이천이십육"],
    [1004, "천사"],
  ])("%i → %s", (n, s) => expect(sino(n)).toBe(s));
});

describe("native", () => {
  it.each([
    [1, "하나"],
    [3, "셋"],
    [10, "열"],
    [11, "열하나"],
    [20, "스물"],
    [45, "마흔다섯"],
    [99, "아흔아홉"],
  ])("%i → %s", (n, s) => expect(native(n)).toBe(s));
});

describe("nativeCounter", () => {
  it.each([
    [1, "한"],
    [2, "두"],
    [3, "세"],
    [4, "네"],
    [5, "다섯"],
    [11, "열한"],
    [12, "열두"],
    [20, "스무"],
    [21, "스물한"],
    [30, "서른"],
  ])("%i → %s", (n, s) => expect(nativeCounter(n)).toBe(s));
});

describe("josa", () => {
  it("받침 있음 → 앞", () => expect(josa("셋", "은", "는")).toBe("셋은"));
  it("받침 없음 → 뒤", () => expect(josa("하나", "은", "는")).toBe("하나는"));
  it("이/가", () => expect([josa("한", "이", "가"), josa("세", "이", "가")]).toEqual(["한이", "세가"]));
});

it("범위 밖은 던진다", () => {
  expect(() => native(0)).toThrow();
  expect(() => sino(1.5)).toThrow();
});
