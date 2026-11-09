import { describe, expect, it } from "vitest";
import { WORDS } from "./words";

describe("한 글자 단어", () => {
  it.each(Object.entries(WORDS))("%s — 받침이 있는 한글 한 글자이고 뜻이 있다", (w, en) => {
    expect(w).toHaveLength(1);
    const code = w.charCodeAt(0) - 0xac00;
    expect(code).toBeGreaterThanOrEqual(0);
    expect(code).toBeLessThan(11172);
    expect(code % 28).not.toBe(0); // 받침 있는 글자만
    expect(en.trim()).not.toBe("");
  });
});
