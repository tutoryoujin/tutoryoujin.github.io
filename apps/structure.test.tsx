// @vitest-environment jsdom
/* ============================================================
   본문 구조 (#101) — 검색엔진이 읽는 헤딩 · 탭 패널을 앱마다 실제로 그려서 본다.

   - h1 은 정확히 하나 (헤더의 앱 이름)
   - 헤딩 단계를 건너뛰지 않는다 (h2 다음에 바로 h4 ❌)
   - 탭 패널은 열린 것만이 아니라 전부 그린다 — 탭마다 h2 가 DOM 에 있다
   - 정적 본문(prerenderHtml)의 h2 는 화면 h2 와 같다. 화면에 없는 h2 를 정적 본문에만 두지 않는다
   ============================================================ */
import { act, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { APPS } from "../shared/apps";
import { prerenderHtml } from "../shared/seo";

// jsdom 에 없는 것 — 앱이 넓은 화면 · 동작 줄이기를 묻고, 화면을 맨 위로 올린다
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = (() => {}) as typeof window.scrollTo;
});

const LOADERS: Record<string, () => Promise<{ App: ComponentType }>> = {
  "hangul-blocks": () => import("./hangul-blocks/App"),
  ieung: () => import("./ieung/App"),
  "hangul-name": () => import("./hangul-name/App"),
  "korean-cards": () => import("./korean-cards/App"),
  "calendar-practice": () => import("./calendar-practice/App"),
  "korean-clock": () => import("./korean-clock/App"),
};

let root: Root | null = null;
let host: HTMLElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = host = null;
  history.replaceState(null, "", "/");
});

async function render(slug: string) {
  const { App } = await LOADERS[slug]();
  history.replaceState(null, "", `/${slug}/`);
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
  await act(async () => root!.render(<App />));
  return host;
}

const headings = (el: ParentNode) => [...el.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")];
const level = (h: Element) => Number(h.tagName[1]);
/** 「같이 읽어 보세요Read more」 · 「같이 읽어 보세요 · Read more」 를 같은 것으로 — 띄어쓰기 · 가운뎃점만 다르다 */
const norm = (t: string | null) => (t ?? "").replace(/[\s·]+/g, "");

describe("앱 본문 구조 (#101)", () => {
  it("모든 앱을 이 테스트가 그린다", () => {
    expect(Object.keys(LOADERS).sort()).toEqual(APPS.map((a) => a.slug).sort());
  });

  for (const a of APPS) {
    describe(a.slug, () => {
      it("h1 은 하나 — 헤더의 앱 이름", async () => {
        const el = await render(a.slug);
        const h1 = el.querySelectorAll("h1");
        expect(h1).toHaveLength(1);
        expect(h1[0].textContent).toContain(a.ko);
        expect(h1[0].closest("header")).not.toBeNull();
      });

      it("헤딩 단계를 건너뛰지 않는다", async () => {
        const el = await render(a.slug);
        let prev = 0;
        for (const h of headings(el)) {
          expect(level(h), `${h.tagName} 「${h.textContent}」 앞이 h${prev}`).toBeLessThanOrEqual(prev + 1);
          prev = level(h);
        }
      });

      if (a.tabs) {
        it("탭 패널을 전부 그리고, 탭 이름이 패널의 h2", async () => {
          const el = await render(a.slug);
          // 사이트 탭(<TabPanel>)만 — 앱 안의 작은 탭(블록 앱 키보드)은 따로다
          const panels = [...el.querySelectorAll<HTMLElement>('[role="tabpanel"][id^="panel-"]')];
          expect(panels).toHaveLength(a.tabs!.length);
          a.tabs!.forEach((t, i) => {
            const p = panels[i];
            const h2 = p.querySelector("h2");
            expect(norm(h2?.textContent ?? null)).toBe(norm(`${t.ko}${t.en}`));
            // 탭 단추와 이어져 있다
            const btn = el.querySelector(`#${p.getAttribute("aria-labelledby")}`);
            expect(btn?.getAttribute("aria-controls")).toBe(p.id);
            // 첫 탭만 보인다
            expect(p.hidden).toBe(i !== 0);
          });
        });

        it("탭마다 배우는 것이 하나는 있다 (정적 본문의 탭 h2 아래)", () => {
          for (const t of a.tabs!) expect(a.learn.some((l) => l.tab === t.key), t.key).toBe(true);
          for (const l of a.learn) if (l.tab) expect(a.tabs!.map((t) => t.key)).toContain(l.tab);
        });
      }

      it("정적 본문의 h2 = 화면의 h2", async () => {
        const el = await render(a.slug);
        const screen = headings(el).filter((h) => level(h) === 2).map((h) => norm(h.textContent));
        const pre = document.createElement("div");
        pre.innerHTML = prerenderHtml(a.slug);
        const prerender = headings(pre).filter((h) => level(h) === 2).map((h) => norm(h.textContent));
        if (a.tabs) expect(prerender).toEqual(screen);
        // 탭이 없는 앱은 화면에만 있는 h2(이름 가게 · 카드 첫 화면 인사)가 있다 — 정적 본문 쪽이 화면에 없는 h2 만 아니면 된다
        else for (const h of prerender) expect(screen).toContain(h);
      });
    });
  }
});

describe("탭 키보드 (#101)", () => {
  it("→ ← Home End 로 탭을 옮긴다", async () => {
    const el = await render("ieung");
    const tabs = [...el.querySelectorAll<HTMLButtonElement>('[role="tab"][aria-controls]')];
    const selected = () => tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    const press = (key: string) =>
      act(() => {
        document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      });
    tabs[0].focus();
    press("ArrowRight");
    expect(selected()).toBe(1);
    expect(document.activeElement).toBe(tabs[1]);
    press("ArrowLeft");
    press("ArrowLeft");
    expect(selected()).toBe(tabs.length - 1);
    press("Home");
    expect(selected()).toBe(0);
    press("End");
    expect(selected()).toBe(tabs.length - 1);
    // 고른 탭만 Tab 키로 들어간다
    expect(tabs.map((t) => t.tabIndex)).toEqual(tabs.map((_, i) => (i === tabs.length - 1 ? 0 : -1)));
    // 패널도 같이 바뀐다
    expect(el.querySelector<HTMLElement>(`#${tabs[tabs.length - 1].getAttribute("aria-controls")}`)!.hidden).toBe(false);
  });
});
