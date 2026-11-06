import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { canSpeak, speak } from "./speech";

/* ============================================================
   작은 부품들. 모두 "한국어 먼저, 영어는 아래 더 작게" 를 지킨다.
   ko / en 을 따로 받는 이유가 그것이다 — 한 문자열로 받으면
   영어를 빼먹기 쉽다.
   ============================================================ */

/** 악센트 8쌍 — 이 밖의 색은 만들지 않는다 */
export type Accent = "blue" | "pink" | "yellow" | "mint" | "lavender" | "coral" | "orange" | "gray";
/**
 * 색 이름. 악센트 8쌍이거나, 앱 CSS 에서 만든 별칭의 앞부분("clk-hour" →
 * --clk-hour-bg / --clk-hour-ink). -bg 와 -ink 는 늘 같이 쓰이게 이름만 받는다.
 */
export type Tone = Accent | (string & {});
const toneStyle = (t: Tone): CSSProperties => ({ background: `var(--${t}-bg)`, color: `var(--${t}-ink)` });

export const Box = ({ children, className = "", ...rest }: { children: ReactNode; className?: string } & Record<string, unknown>) => (
  <div className={`box ${className}`} {...rest}>
    {children}
  </div>
);

/** 큰 버튼. variant="ghost" 는 흰 바탕 */
export function Btn(props: { ko: ReactNode; en: ReactNode; onClick?: () => void; variant?: "ghost"; id?: string }) {
  return (
    <button id={props.id} className={`btn ${props.variant ?? ""}`} type="button" onClick={props.onClick}>
      <span className="ko">{props.ko}</span>
      <span className="en">{props.en}</span>
    </button>
  );
}

/** 🔊 들어 보기. TTS 가 없는 브라우저에서는 그리지 않는다 */
export function ListenBtn({ text, variant }: { text: string; variant?: "ghost" }) {
  if (!canSpeak) return null;
  return <Btn ko="🔊 들어 보기" en="Listen" variant={variant} onClick={() => speak(text)} />;
}

/**
 * 색 알약 — 문장을 쪼개 뜻마다 색을 입힌다.
 * 파스텔 8색은 명도가 거의 같아서 caption 과 en 으로 늘 글자를 같이 둔다.
 */
export function Seg({ tone, caption, en, children }: { tone: Tone; caption: ReactNode; en?: ReactNode; children: ReactNode }) {
  return (
    <div className="seg" style={toneStyle(tone)}>
      <small>{caption}</small>
      <span>{children}</span>
      {en && <em>{en}</em>}
    </div>
  );
}
export const Segments = ({ children }: { children: ReactNode }) => <div className="segments">{children}</div>;

/** ✨ 알아 두기. ex 는 예시 한 줄 */
export function Note({ ko, en, ex, tone }: { ko: ReactNode; en: ReactNode; ex?: ReactNode; tone?: Tone }) {
  const style = tone ? ({ "--note-accent": `var(--${tone}-ink)` } as CSSProperties) : undefined;
  return (
    <div className="note" style={style}>
      <span className="ko">✨ {ko}</span>
      <span className="en">{en}</span>
      {ex && <span className="ex">{ex}</span>}
    </div>
  );
}

/* ---------- 탭 ---------- */
export type TabDef<K extends string> = { key: K; ko: string; en: string };

/**
 * 탭 상태를 주소(#key)에 남긴다. 수업 중에 "퀴즈 탭" 링크를 바로 보낼 수 있다.
 * 첫 탭은 주소에 아무것도 붙이지 않는다.
 */
export function useHashTab<K extends string>(tabs: TabDef<K>[]): [K, (k: K) => void] {
  const read = () => {
    const h = location.hash.slice(1) as K;
    return tabs.some((t) => t.key === h) ? h : tabs[0].key;
  };
  const [tab, setTab] = useState<K>(read);
  useEffect(() => {
    const on = () => setTab(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  });
  const go = (k: K) => {
    setTab(k);
    history.replaceState(null, "", k === tabs[0].key ? location.pathname : "#" + k);
  };
  return [tab, go];
}

export function Tabs<K extends string>({ tabs, value, onChange }: { tabs: TabDef<K>[]; value: K; onChange: (k: K) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} className="tab" role="tab" type="button" aria-selected={t.key === value} onClick={() => onChange(t.key)}>
          <span className="ko">{t.ko}</span>
          <span className="en">{t.en}</span>
        </button>
      ))}
    </div>
  );
}
