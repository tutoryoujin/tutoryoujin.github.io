import { describe, expect, it } from "vitest";
import { decompose } from "@yj/korean/hangul";
import { ieungSeats, linked, MOVES, NG_WORDS, PAIRS, SILENT_WORDS, STAYS } from "./data";

describe("단어 데이터 분해", () => {
  it("첫자리 단어의 ㅇ 은 모두 첫자리", () => {
    for (const w of SILENT_WORDS) {
      const seats = ieungSeats(w.ko);
      expect(seats.length, w.ko).toBeGreaterThan(0);
      expect(seats.every((s) => s.seat === "cho"), w.ko).toBe(true);
    }
  });
  it("받침 단어에는 받침 ㅇ 이 있다", () => {
    for (const w of NG_WORDS) expect(ieungSeats(w.ko).some((s) => s.seat === "jong"), w.ko).toBe(true);
  });
  it("앙 = 첫자리 ㅇ + 받침 ㅇ", () => {
    expect(ieungSeats("앙")).toEqual([
      { i: 0, seat: "cho" },
      { i: 0, seat: "jong" },
    ]);
  });
});

describe("ng / g 짝", () => {
  it.each(PAIRS.map((p) => [p.ng.ko, p.g.ko]))("%s / %s — 받침만 ㅇ 과 ㄱ", (ng, g) => {
    const a = decompose(ng)!;
    const b = decompose(g)!;
    expect(a.jong).toBe("ㅇ");
    expect(b.jong).toBe("ㄱ");
    expect(a.cho).toBe(b.cho);
    expect(a.jung).toBe(b.jung);
  });
  it("로마자는 ng 와 k 로 끝난다", () => {
    for (const p of PAIRS) {
      expect(p.ng.rom.endsWith("ng")).toBe(true);
      expect(p.g.rom.endsWith("k")).toBe(true);
      expect(p.ng.rom.slice(0, -2)).toBe(p.g.rom.slice(0, -1));
    }
  });
});

describe("이어 읽기", () => {
  it("ㅇ 받침은 넘어가지 않는다", () => {
    for (const w of STAYS) expect(linked(w.ko)).toBe(w.ko);
  });
  it("ㅇ 을 ㄱ 처럼 넘기면 틀린 소리", () => {
    expect(linked("고양이", true)).toBe("고야기");
    expect(linked("영어", true)).toBe("여거");
    expect(linked("강아지", true)).toBe("가가지");
  });
  it("다른 받침은 넘어간다", () => {
    expect(linked("한국어")).toBe("한구거");
    expect(linked("음악")).toBe("으막");
    for (const w of MOVES) expect(linked(w.ko)).not.toBe(w.ko);
  });
  it("ㅎ · 겹받침 · 받침 없음은 그대로", () => {
    expect(linked("좋아")).toBe("좋아");
    expect(linked("닭이")).toBe("닭이");
    expect(linked("아이")).toBe("아이");
  });
});
