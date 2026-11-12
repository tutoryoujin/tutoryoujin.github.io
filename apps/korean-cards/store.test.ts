/* 저장된 진행을 지금 덱에 맞추기 — 덱에 카드를 더해도 새 카드가 나온다 (#53) */
import { describe, expect, it } from "vitest";
import { restore, type StudyState } from "./store";
import type { Card, Deck } from "./types";

const card = (id: string): Card => ({ id, ko: id, en: id, note: "", group: "g" });
const deckOf = (...ids: string[]): Deck => ({
  id: "test",
  title: { ko: "시험", en: "Test" },
  emoji: "🧪",
  cover: ids[0],
  color: "blue",
  unit: { ko: "단어", en: "words" },
  art: "icon",
  groups: { g: { ko: "묶음", en: "group", color: "blue" } },
  cards: ids.map(card),
});
const st = (s: Partial<StudyState>): StudyState => ({
  queue: [],
  index: 0,
  round: 1,
  missed: [],
  learnedThisRound: 0,
  phase: "card",
  ...s,
});
/** 남은 카드 수 — progress() 와 같은 셈 */
const remaining = (s: StudyState) => (s.phase === "card" ? s.missed.length + (s.queue.length - s.index) : s.missed.length);

describe("restore", () => {
  it("덱과 맞지 않는 기록은 버린다 (카드가 지워짐)", () => {
    expect(restore(deckOf("a", "b"), st({ queue: ["a", "x"] }))).toBeNull();
    expect(restore(deckOf("a"), null)).toBeNull();
  });

  it("덱이 그대로면 기록도 그대로, cards 만 적는다", () => {
    const raw = st({ queue: ["b", "a"], index: 1, cards: ["a", "b"] });
    expect(restore(deckOf("a", "b"), raw)).toEqual(raw);
  });

  it("회차 중에 카드가 늘면 이번 회차 queue 뒤에 붙는다", () => {
    const s = restore(deckOf("a", "b", "c"), st({ queue: ["b", "a"], index: 1, cards: ["a", "b"] }))!;
    expect(s.queue).toEqual(["b", "a", "c"]);
    expect(s.index).toBe(1);
    expect(s.cards).toEqual(["a", "b", "c"]);
    expect(remaining(s)).toBe(2);
  });

  it("다 외운 뒤 카드가 늘면 다음 회차(missed)로 — 외운 것으로 세지 않는다", () => {
    const deck = deckOf("a", "b", "c", "d");
    const s = restore(deck, st({ queue: ["a"], index: 1, round: 2, phase: "end", cards: ["a", "b", "c"] }))!;
    expect(s.missed).toEqual(["d"]);
    expect(deck.cards.length - remaining(s)).toBe(3);
  });

  it("2회차 이후: 앞 회차에서 외운 카드는 다시 나오지 않는다", () => {
    const s = restore(deckOf("a", "b", "c", "d"), st({ queue: ["a"], round: 2, cards: ["a", "b", "c"] }))!;
    expect(s.queue).toEqual(["a", "d"]);
  });

  it("cards 가 없는 예전 1회차 기록: queue 가 덱 전체였으니 새 카드를 안다", () => {
    const s = restore(deckOf("a", "b", "c"), st({ queue: ["b", "a"], index: 2, missed: ["a"], phase: "end" }))!;
    expect(s.missed).toEqual(["a", "c"]);
  });

  it("cards 가 없는 예전 2회차 기록: 지금 덱을 다 안다고 본다 — 기록은 그대로", () => {
    const raw = st({ queue: ["a"], round: 2 });
    const s = restore(deckOf("a", "b", "c"), raw)!;
    expect(s.queue).toEqual(["a"]);
    expect(s.missed).toEqual([]);
    expect(s.cards).toEqual(["a", "b", "c"]);
  });
});
