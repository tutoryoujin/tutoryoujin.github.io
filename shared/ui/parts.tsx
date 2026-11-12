import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "./cn";
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

/** 흰 상자. 화면의 큰 덩어리마다 하나 */
export const boxClass = "rounded-[24px] bg-surface p-4 shadow-card";
export const Box = ({ children, className, ...rest }: { children: ReactNode; className?: string } & Record<string, unknown>) => (
  <div className={cn(boxClass, className)} {...rest}>
    {children}
  </div>
);

/**
 * 큰 버튼. variant="ghost" 는 흰 바탕. tone 을 주면 그 쌍(-bg 바탕 · -ink 글자 · -ink 테)으로 칠한다.
 * className 은 자리 맞춤(mt-0, min-h-13 …)에만. 색은 variant · tone 으로.
 */
export function Btn(props: {
  ko: ReactNode;
  en: ReactNode;
  onClick?: () => void;
  /** 폼 안에서 제출 버튼으로 쓸 때 "submit" */
  type?: "button" | "submit";
  variant?: "ghost";
  tone?: Tone;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-busy"?: boolean;
}) {
  const toned = !props.variant && props.tone;
  return (
    <button
      id={props.id}
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-busy={props["aria-busy"]}
      style={toned ? { ...toneStyle(props.tone!), borderColor: `var(--${props.tone}-ink)` } : undefined}
      className={cn(
        "mt-3.5 flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-[18px] border-2 leading-[1.2]",
        "transition-transform duration-80 ease-[ease] motion-safe:active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:brightness-95",
        "disabled:opacity-60",
        props.variant === "ghost" ? "border-line bg-surface text-ink" : toned ? "" : "border-primary bg-primary text-primary-ink",
        props.className,
      )}
    >
      <span className="font-display text-[1.1rem]">{props.ko}</span>
      <span className="text-[0.75rem] font-bold opacity-80">{props.en}</span>
    </button>
  );
}

/** 🔊 들어 보기. TTS 가 없는 브라우저에서는 그리지 않는다 */
export function ListenBtn({ text, variant, className }: { text: string; variant?: "ghost"; className?: string }) {
  if (!canSpeak) return null;
  return <Btn ko="🔊 들어 보기" en="Listen" variant={variant} className={className} onClick={() => speak(text)} />;
}

/**
 * 색 알약 — 문장을 쪼개 뜻마다 색을 입힌다.
 * 파스텔 8색은 명도가 거의 같아서 caption 과 en 으로 늘 글자를 같이 둔다.
 */
export function Seg({ tone, caption, en, children, className }: { tone: Tone; caption: ReactNode; en?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-16 rounded-[16px] px-3 py-2 text-center leading-[1.15]", className)} style={toneStyle(tone)}>
      <small className="block text-[0.72rem] font-extrabold opacity-75">{caption}</small>
      <span className="font-display text-[1.35rem]">{children}</span>
      {/* 파스텔 위라 muted 대신 ink 계열 그대로, 크기로만 누른다 */}
      {en && <em className="mt-0.5 block text-[0.68rem] font-extrabold not-italic">{en}</em>}
    </div>
  );
}
export const Segments = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap justify-center gap-2">{children}</div>;

/** ✨ 알아 두기. ex 는 예시 한 줄 */
/** accent 는 왼쪽 띠 색. 악센트 쌍이 아닌 색(달력의 special 등)일 때 CSS 변수 이름으로 */
export function Note({ ko, en, ex, tone, accent, className }: { ko: ReactNode; en: ReactNode; ex?: ReactNode; tone?: Tone; accent?: string; className?: string }) {
  const bar = accent ?? (tone ? `--${tone}-ink` : "--primary");
  return (
    <div
      className={cn("mt-3 rounded-md border-l-4 bg-bg px-3 py-2.5 text-[0.92rem] leading-normal", className)}
      style={{ borderLeftColor: `var(${bar})` }}
    >
      <span className="block font-display text-[1rem]">✨ {ko}</span>
      <span className="block text-[0.85rem] font-bold text-muted">{en}</span>
      {ex && <span className="mt-1.5 block font-display">{ex}</span>}
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
  // 최신 read 를 ref 로 — 리스너는 한 번만 건다
  const readRef = useRef(read);
  readRef.current = read;
  useEffect(() => {
    const on = () => setTab(readRef.current());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  const go = (k: K) => {
    setTab(k);
    // 첫 탭은 주소에 아무것도 안 붙인다. ?query 는 남긴다 (?name= 같은 공유 링크)
    history.replaceState(null, "", location.pathname + location.search + (k === tabs[0].key ? "" : "#" + k));
  };
  return [tab, go];
}

export function Tabs<K extends string>({ tabs, value, onChange }: { tabs: TabDef<K>[]; value: K; onChange: (k: K) => void }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col rounded-full border border-line bg-surface p-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          className="group flex min-h-11 flex-col items-center justify-center rounded-full px-1 py-1.5 leading-[1.1] aria-selected:bg-primary aria-selected:text-primary-ink"
          role="tab"
          type="button"
          aria-selected={t.key === value}
          onClick={() => onChange(t.key)}
        >
          <span className="font-display text-[1rem]">{t.ko}</span>
          <span className="text-[0.68rem] font-bold text-muted group-aria-selected:text-current group-aria-selected:opacity-80">{t.en}</span>
        </button>
      ))}
    </div>
  );
}
