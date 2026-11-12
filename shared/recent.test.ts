import { describe, expect, it } from "vitest";
import { APPS, CATEGORIES } from "./apps";
import { markApp, readRecent, RECENT_KEY, setStep } from "./recent";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe("마지막으로 연 앱 (#48)", () => {
  it("열쇠는 yj:last-app — 학생 기록이라 바꾸지 않는다", () => {
    expect(RECENT_KEY).toBe("yj:last-app");
  });
  it("기록이 없거나 깨졌으면 null", () => {
    const s = mem();
    expect(readRecent(s)).toBeNull();
    s.setItem(RECENT_KEY, "{oops");
    expect(readRecent(s)).toBeNull();
  });
  it("같은 앱을 다시 열면 진도는 그대로, 다른 앱을 열면 진도 없이", () => {
    const s = mem();
    setStep("korean-cards", { ko: "감정", en: "Emotions" }, 7, 20, s);
    markApp("korean-cards", s);
    expect(readRecent(s)).toEqual({ slug: "korean-cards", step: { ko: "감정", en: "Emotions" }, done: 7, total: 20 });
    markApp("korean-clock", s);
    expect(readRecent(s)).toEqual({ slug: "korean-clock" });
  });
});

describe("앱 목록 (#48)", () => {
  it("분류는 CATEGORIES 안, added 는 YYYY-MM-DD, tone 은 앱마다 다르다", () => {
    const ids = CATEGORIES.map((c) => c.id);
    for (const a of APPS) {
      expect(ids, a.slug).toContain(a.category);
      expect(a.added, a.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(new Set(APPS.map((a) => a.tone)).size).toBe(APPS.length);
  });
});
