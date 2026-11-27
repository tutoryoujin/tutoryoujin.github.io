import { describe, expect, it } from "vitest";
import { MIXED, VOWELS, AIR_PAIRS, Y_PAIRS, CONSONANTS } from "./glyphs";
import { WORDS } from "./words";
import { audioKey, FIRST_FILES, recordingFiles } from "./recording";

const files = recordingFiles();
const texts = files.flatMap((f) => f.takes.map((t) => t.text));

describe("녹음 목록 (#39)", () => {
  it("#39 의 파일 나누기 그대로 — n · c01~c19 · p · w1~", () => {
    expect(files.map((f) => f.name).slice(0, 21)).toEqual(["n", ...Array.from({ length: 19 }, (_, i) => `c${String(i + 1).padStart(2, "0")}`), "p"]);
    expect(
      files
        .find((f) => f.name === "c01")!
        .takes.slice(0, 3)
        .map((t) => t.text),
    ).toEqual(["가", "개", "갸"]);
    expect(files.find((f) => f.name === "c12")!.takes[0].text).toBe("아");
  });

  it("같은 글을 두 번 녹음하지 않는다", () => {
    expect(new Set(texts).size).toBe(texts.length);
    expect(new Set(texts.map(audioKey)).size).toBe(texts.length);
  });

  it("앱에서 소리 나는 것은 모두 목록에 있다", () => {
    const need = [
      ...Object.values(CONSONANTS).map((c) => c.ko),
      ...Object.values(VOWELS).map((v) => v.ko),
      ...Object.values(MIXED).map((v) => v.ko),
      ...[...AIR_PAIRS, ...Y_PAIRS].flatMap((p) => [...p.syl, ...(p.words ?? []).map((w) => w[0])]),
      ...Object.keys(WORDS),
    ];
    const have = new Set(texts);
    expect(need.filter((t) => !have.has(t))).toEqual([]);
  });

  it("표준 발음을 같이 적는다 — 자음 + ㅢ 는 [ㅣ], 받침은 혼자 읽는 소리", () => {
    const all = files.flatMap((f) => f.takes);
    expect(all.find((t) => t.text === "늬")).toEqual({ text: "늬", say: "니" });
    expect(all.find((t) => t.text === "희")).toEqual({ text: "희", say: "히" });
    expect(all.find((t) => t.text === "의")).toEqual({ text: "의" });
    expect(all.find((t) => t.text === "값")!.say).toBe("갑");
    expect(all.find((t) => t.text === "가")!.say).toBeUndefined();
  });

  it("먼저 녹음할 파일은 모두 있는 파일", () => {
    const names = new Set(files.map((f) => f.name));
    expect(FIRST_FILES.filter((n) => !names.has(n))).toEqual([]);
  });

  it("열쇠 — 가 → ac00, 기역 → ae30-c5ed", () => {
    expect(audioKey("가")).toBe("ac00");
    expect(audioKey("기역")).toBe("ae30-c5ed");
  });
});
