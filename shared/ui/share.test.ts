// @vitest-environment jsdom
/* 공유하기 (#118) — 공유 시트 → 링크 복사 → 직접 복사 순서 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { shareLink } from "./Share";

const data = { title: "t", text: "x", url: "https://tutoryoujin.github.io/notes/a/" };
const nav = (o: Record<string, unknown>) => vi.stubGlobal("navigator", o);
const abort = Object.assign(new Error("cancel"), { name: "AbortError" });

afterEach(() => vi.unstubAllGlobals());

describe("shareLink", () => {
  it("공유 시트가 있으면 시트", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    nav({ share, clipboard: { writeText: vi.fn() } });
    expect(await shareLink(data)).toBe("sheet");
    expect(share).toHaveBeenCalledWith(data);
  });
  it("시트를 닫으면 아무것도 안 함", async () => {
    const writeText = vi.fn();
    nav({ share: vi.fn().mockRejectedValue(abort), clipboard: { writeText } });
    expect(await shareLink(data)).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });
  it("시트가 없거나 막히면 링크 복사", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    nav({ clipboard: { writeText } });
    expect(await shareLink(data)).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(data.url);
    nav({ share: vi.fn().mockRejectedValue(new Error("NotAllowed")), clipboard: { writeText } });
    expect(await shareLink(data)).toBe("copied");
  });
  it("복사도 막히면 링크를 보여 준다", async () => {
    nav({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    expect(await shareLink(data)).toBe("manual");
  });
});
