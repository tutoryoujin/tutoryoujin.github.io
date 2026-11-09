/* ============================================================
   방문 분석 — 쿠키 없는 서비스만 (GoatCounter · Plausible · Umami).

   - analyticsScript() : vite.config.ts 가 모든 index.html 에 넣을 <script> 태그. 꺼져 있으면 null
   - track()           : 커스텀 이벤트 (덱 완료, 구독 …). 꺼져 있으면 아무 일도 안 한다

   새 서비스를 들일 때는 PROVIDERS 에 한 칸만 더한다.
   ============================================================ */
import { analyticsOn, SITE, type AnalyticsProvider, type SiteConfig } from "./site";

export type ScriptTag = { src: string; attrs: Record<string, string | true> };
export type EventProps = Record<string, string | number | boolean>;

type Win = {
  goatcounter?: { count?: (v: { path: string; title?: string; event?: boolean }) => void };
  plausible?: (name: string, opts?: { props?: EventProps }) => void;
  umami?: { track?: (name: string, data?: EventProps) => void };
};

const PROVIDERS: Record<AnalyticsProvider, { script: (id: string, src?: string) => ScriptTag; send: (w: Win, name: string, props?: EventProps) => void }> = {
  goatcounter: {
    script: (id, src) => ({
      src: src ?? "https://gc.zgo.at/count.js",
      attrs: { "data-goatcounter": `https://${id}.goatcounter.com/count`, async: true },
    }),
    // GoatCounter 이벤트는 이름 하나뿐이라 값을 경로에 붙인다: deck-complete/food
    send: (w, name, props) =>
      w.goatcounter?.count?.({ path: [name, ...Object.values(props ?? {})].join("/"), title: name, event: true }),
  },
  plausible: {
    script: (id, src) => ({ src: src ?? "https://plausible.io/js/script.js", attrs: { "data-domain": id, defer: true } }),
    send: (w, name, props) => w.plausible?.(name, props ? { props } : undefined),
  },
  umami: {
    script: (id, src) => ({ src: src ?? "https://cloud.umami.is/script.js", attrs: { "data-website-id": id, defer: true } }),
    send: (w, name, props) => w.umami?.track?.(name, props),
  },
};

export function analyticsScript(c: SiteConfig = SITE): ScriptTag | null {
  if (!analyticsOn(c)) return null;
  return PROVIDERS[c.analytics.provider].script(c.analytics.id.trim(), c.analytics.src);
}

/** 이벤트 이름. 여기 모아 두면 대시보드에서 찾기 쉽다 */
export type EventName = "deck-complete" | "subscribe" | "product-click";

/** 커스텀 이벤트. 분석이 꺼져 있거나 스크립트가 아직 안 왔거나 막혀 있으면 조용히 넘어간다 */
export function track(name: EventName, props?: EventProps, c: SiteConfig = SITE, w: Win | undefined = globalThis as Win) {
  if (!analyticsOn(c) || !w) return;
  try {
    PROVIDERS[c.analytics.provider].send(w, name, props);
  } catch {
    // 분석이 학습을 막으면 안 된다
  }
}
