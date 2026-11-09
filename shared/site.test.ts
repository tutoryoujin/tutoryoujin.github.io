/* 설정이 꺼져 있으면 아무것도 나오지 않는다 — 분석 · 구독 · 상품. 그리고 켰을 때의 모양 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { analyticsScript, track } from "./analytics";
import { APPS } from "./apps";
import { headTags, robotsTxt, sitemapXml } from "./seo";
import { SITE, SUBSCRIBE_COPY, type SiteConfig } from "./site";
import { subscribeEmail, subscribeEndpoint } from "./subscribe";
import { Products } from "./ui/Products";
import { Subscribe } from "./ui/Subscribe";

const OFF: SiteConfig = { ...SITE, analytics: { provider: "goatcounter", id: "" }, subscribe: { provider: "kit", formId: "" }, products: [] };
const ON: SiteConfig = {
  ...SITE,
  analytics: { provider: "goatcounter", id: "tutoryoujin" },
  subscribe: { provider: "kit", formId: "123" },
  products: [{ id: "travel", title: "Travel Korean", description: "40 cards", price: "$5", href: "https://example.com/travel" }],
};

describe("설정이 꺼져 있으면", () => {
  it("분석 스크립트를 넣지 않는다", () => {
    expect(analyticsScript(OFF)).toBeNull();
    expect(analyticsScript({ ...OFF, analytics: { provider: "umami", id: "   " } })).toBeNull();
  });
  it("track 은 아무 일도 안 한다", () => {
    const count = vi.fn();
    const plausible = vi.fn();
    track("deck-complete", { deck: "food" }, OFF, { goatcounter: { count }, plausible });
    expect(count).not.toHaveBeenCalled();
    expect(plausible).not.toHaveBeenCalled();
  });
  it("구독 폼을 그리지 않고, 보내지도 않는다", async () => {
    expect(renderToStaticMarkup(createElement(Subscribe, { source: "test", config: OFF }))).toBe("");
    expect(subscribeEndpoint(OFF)).toBeNull();
    const f = vi.fn();
    expect(await subscribeEmail("a@b.co", OFF, f)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
  it("상품 섹션을 그리지 않는다", () => {
    expect(renderToStaticMarkup(createElement(Products, { source: "test", config: OFF }))).toBe("");
  });
  it("판매 링크가 없는 상품은 그리지 않는다", () => {
    const noLink: SiteConfig = { ...OFF, products: [{ id: "x", title: "Soon", description: "", href: " " }] };
    expect(renderToStaticMarkup(createElement(Products, { source: "test", config: noLink }))).toBe("");
  });
  it("지금 저장소의 기본 설정도 꺼져 있다 — 켜는 건 site.ts 에 값을 넣을 때만", () => {
    expect(analyticsScript(SITE) === null).toBe(SITE.analytics.id === "");
    expect(renderToStaticMarkup(createElement(Products, { source: "test" })) === "").toBe(SITE.products.length === 0);
  });
});

describe("켜져 있으면", () => {
  it("서비스마다 맞는 스크립트", () => {
    expect(analyticsScript(ON)).toEqual({
      src: "https://gc.zgo.at/count.js",
      attrs: { "data-goatcounter": "https://tutoryoujin.goatcounter.com/count", async: true },
    });
    expect(analyticsScript({ ...ON, analytics: { provider: "plausible", id: "tutoryoujin.github.io" } })?.attrs["data-domain"]).toBe("tutoryoujin.github.io");
    expect(analyticsScript({ ...ON, analytics: { provider: "umami", id: "abc", src: "https://u.example/s.js" } })).toEqual({
      src: "https://u.example/s.js",
      attrs: { "data-website-id": "abc", defer: true },
    });
  });
  it("track 은 서비스의 이벤트 함수를 부른다", () => {
    const count = vi.fn();
    track("deck-complete", { deck: "food" }, ON, { goatcounter: { count } });
    expect(count).toHaveBeenCalledWith({ path: "deck-complete/food", title: "deck-complete", event: true });
    const plausible = vi.fn();
    track("subscribe", { source: "home" }, { ...ON, analytics: { provider: "plausible", id: "x" } }, { plausible });
    expect(plausible).toHaveBeenCalledWith("subscribe", { props: { source: "home" } });
  });
  it("track 은 스크립트가 아직 없어도 터지지 않는다", () => {
    expect(() => track("subscribe", undefined, ON, {})).not.toThrow();
  });
  it("구독 폼을 그린다 — 라벨 · 문구", () => {
    const html = renderToStaticMarkup(createElement(Subscribe, { source: "test", config: ON }));
    expect(html).toContain(SUBSCRIBE_COPY.title);
    expect(html).toContain(SUBSCRIBE_COPY.button);
    expect(html).toContain(SUBSCRIBE_COPY.fine);
    expect(html).toMatch(/<label for="([^"]+)"[^>]*>Email address<\/label>[\s\S]*<input id="\1"/);
  });
  it("Kit 폼으로 email_address 를 보낸다", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ status: "success" }), { status: 200 }));
    expect(await subscribeEmail(" a@b.co ", ON, f as unknown as typeof fetch)).toBe(true);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://app.kit.com/forms/123/subscriptions");
    expect(String(init.body)).toBe("email_address=a%40b.co");
  });
  it("Kit 이 실패하면 false", async () => {
    const bad = vi.fn(async () => new Response("{}", { status: 422 }));
    expect(await subscribeEmail("a@b.co", ON, bad as unknown as typeof fetch)).toBe(false);
    const boom = vi.fn(async () => {
      throw new TypeError("network");
    });
    expect(await subscribeEmail("a@b.co", ON, boom as unknown as typeof fetch)).toBe(false);
    expect(await subscribeEmail("not-an-email", ON, bad as unknown as typeof fetch)).toBe(false);
  });
  it("상품을 그린다", () => {
    const html = renderToStaticMarkup(createElement(Products, { source: "test", config: ON }));
    expect(html).toContain("Travel Korean");
    expect(html).toContain('href="https://example.com/travel"');
  });
});

describe("SEO", () => {
  it("모든 페이지에 같은 메타 묶음", () => {
    for (const slug of ["", ...APPS.map((a) => a.slug)]) {
      const tags = headTags(slug);
      const names = tags.map((t) => t.attrs?.name ?? t.attrs?.property ?? t.attrs?.rel ?? t.tag);
      for (const n of ["title", "description", "canonical", "icon", "apple-touch-icon", "og:title", "og:description", "og:url", "twitter:card", "twitter:title"]) {
        expect(names, `${slug || "home"} ${n}`).toContain(n);
      }
    }
  });
  it("홈과 카드에는 공유 그림이 있고, public/ 에 파일도 있다", () => {
    for (const slug of ["", "korean-cards"]) {
      const img = headTags(slug).find((t) => t.attrs?.property === "og:image")?.attrs?.content;
      expect(img, slug || "home").toMatch(/^https:\/\/tutoryoujin\.github\.io\/.+\.png$/);
      expect(existsSync(fileURLToPath(new URL("../public" + new URL(img!).pathname, import.meta.url))), img).toBe(true);
      expect(headTags(slug).find((t) => t.attrs?.name === "twitter:card")?.attrs?.content).toBe("summary_large_image");
    }
  });
  it("sitemap 은 첫 화면 + 앱 전부, robots 는 sitemap 을 가리킨다", () => {
    const xml = sitemapXml();
    expect(xml).toContain("<loc>https://tutoryoujin.github.io/</loc>");
    for (const a of APPS) expect(xml).toContain(`<loc>https://tutoryoujin.github.io/${a.slug}/</loc>`);
    expect(robotsTxt()).toContain("Sitemap: https://tutoryoujin.github.io/sitemap.xml");
  });
  it("앱 주소(slug)는 그대로", () => {
    expect(APPS.map((a) => a.slug)).toEqual(["hangul-blocks", "korean-cards", "calendar-practice", "korean-clock"]);
  });
});
