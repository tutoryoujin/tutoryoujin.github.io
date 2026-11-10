/* 덱 불러오기 · 유료 덱 자리 · 진행 기록 내보내기 (#2) */
import { SITE, type SiteConfig } from "@yj/site";
import { describe, expect, it } from "vitest";
import { CATALOG, DECKS, hasCard, infoOf, loadDeck, peekDeck, shelf } from "./decks";
import { PAID } from "./decks/paid";
import { exportProgress } from "./store";
import type { DeckInfo } from "./types";

const cafe: DeckInfo = {
  id: "cafe-plus",
  title: { ko: "카페", en: "At the café" },
  emoji: "☕",
  cover: "americano",
  color: "orange",
  unit: { ko: "카페 표현", en: "café phrases" },
  count: 30,
  access: "paid",
  product: "cafe-pack",
};
const withLink = (href: string): SiteConfig => ({
  ...SITE,
  products: [{ id: "cafe-pack", title: "Café deck", description: "", href }],
});

describe("홈 더미", () => {
  it("지금 설정이면 무료 덱만, 예전 순서 그대로 — 화면이 바뀌지 않는다", () => {
    expect(shelf().map((s) => s.info.id)).toEqual(DECKS.map((d) => d.id));
    expect(shelf().every((s) => !s.product)).toBe(true);
  });
  it("유료 덱은 판매 링크가 없으면 안 보인다", () => {
    const catalog = [...DECKS.map(infoOf), cafe];
    expect(shelf(withLink(""), catalog).map((s) => s.info.id)).not.toContain("cafe-plus");
    expect(shelf({ ...SITE, products: [] }, catalog).map((s) => s.info.id)).not.toContain("cafe-plus");
    expect(shelf(SITE, [...DECKS.map(infoOf), { ...cafe, product: undefined }]).map((s) => s.info.id)).not.toContain("cafe-plus");
  });
  it("판매 링크가 있으면 무료 덱 뒤에 잠긴 카드로", () => {
    const items = shelf(withLink("https://example.com/cafe"), [...DECKS.map(infoOf), cafe]);
    const last = items[items.length - 1];
    expect(last.info.id).toBe("cafe-plus");
    expect(last.product?.href).toBe("https://example.com/cafe");
  });
  it("유료 덱 목록에는 카드 내용이 없다 — 저장소에 올리면 누구나 받는다", () => {
    for (const d of PAID) {
      expect(d.access).toBe("paid");
      expect("cards" in d).toBe(false);
    }
  });
  it("덱 주소(id)는 겹치지 않는다", () => {
    const ids = CATALOG.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("loadDeck", () => {
  it("무료 덱은 번들에서 바로, 기다림 없이도 peekDeck 으로", async () => {
    for (const d of DECKS) {
      expect(peekDeck(d.id)).toBe(d);
      expect(await loadDeck(d.id)).toBe(d);
    }
  });
  it("없는 덱 · 아직 받을 곳 없는 유료 덱은 undefined", async () => {
    expect(await loadDeck("nope")).toBeUndefined();
    expect(await loadDeck("cafe-plus")).toBeUndefined();
  });
  it("카드 찾기는 덱 객체 기준 — 나중에 받은 덱도 된다", () => {
    const d = { ...DECKS[0], id: "later", cards: [{ ...DECKS[0].cards[0], id: "x" }] };
    expect(hasCard(d, "x")).toBe(true);
    expect(hasCard(d, DECKS[0].cards[1].id)).toBe(false);
  });
  it("겉면 정보의 카드 수", () => {
    expect(infoOf(DECKS[0]).count).toBe(DECKS[0].cards.length);
  });
});

describe("exportProgress", () => {
  const fake = (o: Record<string, string>) => {
    const keys = Object.keys(o);
    return { length: keys.length, key: (i: number) => keys[i] ?? null, getItem: (k: string) => o[k] ?? null };
  };
  it("kcards:* 만 그대로 꺼낸다", () => {
    expect(exportProgress(fake({ "kcards:food": "{}", "kcards:last": "1", "yj:theme": "dark", other: "x" }))).toEqual({
      "kcards:food": "{}",
      "kcards:last": "1",
    });
  });
  it("저장소가 없거나 막혀 있어도 빈 값", () => {
    expect(exportProgress(undefined)).toEqual({});
    const broken = { length: 1, key: () => { throw new Error("blocked"); }, getItem: () => null };
    expect(exportProgress(broken)).toEqual({});
  });
});
