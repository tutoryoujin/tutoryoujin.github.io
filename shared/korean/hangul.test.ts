import { describe, expect, it } from "vitest";
import { DOUBLE_JONG, canBeJong, commonSyllables, compose, decompose, isCommon, joinJong, readJong, shapeOf, soundOf } from "./hangul";

// 틀린 글자는 학생이 그대로 외운다. 헷갈리는 자리만 골라 못 박아 둔다.
describe("compose", () => {
  it.each([
    ["ㄱ", "ㅏ", "", "가"],
    ["ㄱ", "ㅏ", "ㄴ", "간"],
    ["ㅎ", "ㅏ", "ㄴ", "한"],
    ["ㄱ", "ㅡ", "ㄹ", "글"],
    ["ㅇ", "ㅘ", "", "와"],
    ["ㄸ", "ㅣ", "", "띠"],
    ["ㅎ", "ㅣ", "ㅎ", "힣"],
  ])("%s + %s + %s → %s", (c, v, j, s) => expect(compose(c, v, j)).toBe(s));

  it("없는 자모는 null", () => {
    expect(compose("ㄸ", "ㅏ", "ㄸ")).toBeNull();
    expect(compose("ㅏ", "ㄱ")).toBeNull();
  });
});

describe("decompose", () => {
  it("합친 것을 그대로 되돌린다", () => {
    expect(decompose("값")).toEqual({ cho: "ㄱ", jung: "ㅏ", jong: "ㅄ" });
    expect(decompose("의")).toEqual({ cho: "ㅇ", jung: "ㅢ", jong: "" });
  });
  it("한글 글자가 아니면 null", () => {
    expect(decompose("A")).toBeNull();
    expect(decompose("ㄱ")).toBeNull();
    expect(decompose("가나")).toBeNull();
  });
});

describe("shapeOf", () => {
  it.each([
    ["ㅏ", "tall"],
    ["ㅣ", "tall"],
    ["ㅔ", "tall"],
    ["ㅗ", "flat"],
    ["ㅡ", "flat"],
    ["ㅘ", "mixed"],
    ["ㅢ", "mixed"],
  ])("%s → %s", (v, s) => expect(shapeOf(v)).toBe(s));
});

describe("받침", () => {
  it("ㄸ · ㅃ · ㅉ 는 받침이 안 된다", () => {
    for (const c of ["ㄸ", "ㅃ", "ㅉ"]) expect(canBeJong(c)).toBe(false);
    for (const c of ["ㄱ", "ㄲ", "ㅆ", "ㅎ", "ㅇ"]) expect(canBeJong(c)).toBe(true);
    // 겹받침은 자음 하나가 아니라서 여기서는 false
    for (const c of ["ㄳ", "ㄺ", ""]) expect(canBeJong(c)).toBe(false);
  });

  it.each([
    ["낮", "낟"],
    ["낫", "낟"],
    ["낯", "낟"],
    ["밖", "박"],
    ["부", "부"],
    ["앞", "압"],
    ["간", "간"],
    ["좋", "졷"],
  ])("%s 는 [%s] 로 읽는다", (s, r) => expect(soundOf(s)).toBe(r));
});

describe("겹받침", () => {
  it("11개, 합치면 유니코드 받침이 된다", () => {
    expect(Object.keys(DOUBLE_JONG)).toHaveLength(11);
    for (const [j, [f, b]] of Object.entries(DOUBLE_JONG)) {
      expect(joinJong(f, b)).toBe(j);
      expect(compose("ㄱ", "ㅏ", j)).not.toBeNull();
    }
  });
  it("짝이 없거나 순서가 바뀌면 null", () => {
    expect(joinJong("ㄱ", "ㄹ")).toBeNull();
    expect(joinJong("ㄴ", "ㄱ")).toBeNull();
    expect(joinJong("ㄹ", "ㄹ")).toBeNull();
  });

  // 혼자 읽을 때. 앞을 읽는 것이 보통, ㄺ ㄻ ㄿ 은 뒤, 밟 은 예외
  it.each([
    ["넋", "ㄱ", "넉"],
    ["앉", "ㄴ", "안"],
    ["많", "ㄴ", "만"],
    ["닭", "ㄱ", "닥"],
    ["흙", "ㄱ", "흑"],
    ["삶", "ㅁ", "삼"],
    ["넓", "ㄹ", "널"],
    ["밟", "ㅂ", "밥"],
    ["곬", "ㄹ", "골"],
    ["핥", "ㄹ", "할"],
    ["읊", "ㅍ", "읍"],
    ["잃", "ㄹ", "일"],
    ["값", "ㅂ", "갑"],
  ])("%s 는 %s 을 읽어 [%s]", (s, j, r) => {
    expect(readJong(s)).toBe(j);
    expect(soundOf(s)).toBe(r);
  });
  it("겹받침이 아니면 null", () => expect(readJong("강")).toBeNull());
});

describe("자주 쓰는 글자", () => {
  it("2,350자다", () => expect(commonSyllables()).toHaveLength(2350));
  it.each(["가", "한", "글", "닭", "값"])("%s 는 자주 쓴다", (s) => expect(isCommon(s)).toBe(true));
  // 뷁 · 똠 은 2,350자에 없어서 유명한 글자들
  it.each(["뷁", "똠", "쀍"])("%s 는 잘 안 쓴다", (s) => expect(isCommon(s)).toBe(false));
});
