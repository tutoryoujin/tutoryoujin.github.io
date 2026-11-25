import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";
import { canSpeak, speak } from "./speech";

/* ============================================================
   작은 부품들. 언어 규칙은 #102 —
   - 짧은 라벨(버튼 · 탭 · 제목)은 영어가 크고 한국어가 아래 작게. ko / en 을 따로 받는다
   - 긴 설명(Note)은 영어만. 문장 안에 필요한 한국어 낱말은 그대로
   - 배우는 한국어(Seg 알약 · 예문)는 한국어가 크게
   ============================================================ */

/** 악센트 8쌍 — 이 밖의 색은 만들지 않는다 */
export type Accent = "blue" | "pink" | "yellow" | "mint" | "lavender" | "coral" | "orange" | "gray";
/**
 * 색 이름. 악센트 8쌍이거나, 앱 CSS 에서 만든 별칭의 앞부분("clk-hour" →
 * --clk-hour-bg / --clk-hour-ink). -bg 와 -ink 는 늘 같이 쓰이게 이름만 받는다.
 */
export type Tone = Accent | (string & {});
const toneStyle = (t: Tone): CSSProperties => ({ background: `var(--${t}-bg)`, color: `var(--${t}-ink)` });

/** 흰 상자. 화면의 큰 덩어리마다 하나. 레트로 — 남색 굵은 테, 그림자 없이 (홈 카드와 같은 모양) */
export const boxClass = "rounded-[24px] border-2 border-ink bg-surface p-4";
/**
 * labelledBy 에 상자 제목(h3 …)의 id 를 주면 <section aria-labelledby> 로 그린다 (#101).
 * 제목이 없는 상자는 div 그대로 — 이름 없는 section 은 뜻이 없다.
 */
export const Box = ({ children, className, labelledBy, ...rest }: { children: ReactNode; className?: string; labelledBy?: string } & Record<string, unknown>) =>
  labelledBy ? (
    <section className={cn(boxClass, className)} aria-labelledby={labelledBy} {...rest}>
      {children}
    </section>
  ) : (
    <div className={cn(boxClass, className)} {...rest}>
      {children}
    </div>
  );

/**
 * 큰 버튼. variant="ghost" 는 흰 바탕. tone 을 주면 그 쌍(-bg 바탕 · -ink 글자)으로 칠한다.
 * 레트로 — 테는 늘 남색 잉크, 아래로 딱딱한 잉크 그림자. 누르면 그림자만큼 내려간다 (홈 버튼과 같은 모양).
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
      style={toned ? toneStyle(props.tone!) : undefined}
      className={cn(
        "mt-3.5 mb-1 flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-full border-2 border-ink leading-[1.2] shadow-[0_4px_0_var(--ink)]",
        "transition-[translate,box-shadow] duration-80 ease-[ease] motion-safe:active:translate-y-0.5 motion-safe:active:shadow-[0_2px_0_var(--ink)] motion-reduce:transition-none motion-reduce:active:brightness-95",
        "disabled:opacity-60 disabled:active:translate-y-0",
        props.variant === "ghost" ? "bg-surface text-ink" : toned ? "" : "bg-primary text-primary-ink",
        props.className,
      )}
    >
      <span className="font-display text-[1.1rem]" lang="en">
        {props.en}
      </span>
      <span className="text-[0.75rem] font-bold opacity-80" lang="ko">
        {props.ko}
      </span>
    </button>
  );
}

/** 🔊 들어 보기. TTS 가 없는 브라우저에서는 그리지 않는다 */
export function ListenBtn({ text, variant, className }: { text: string; variant?: "ghost"; className?: string }) {
  if (!canSpeak) return null;
  return <Btn ko="들어 보기" en="🔊 Listen" variant={variant} className={className} onClick={() => speak(text)} />;
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

/**
 * ✨ 알아 두기 — 설명이라 영어만 (#102). 필요한 한국어 낱말은 en 문장 안에 그대로.
 * ex 는 예시 한 줄(배우는 한국어). accent 는 왼쪽 띠 색 — 악센트 쌍이 아닌 색(달력의 special 등)일 때 CSS 변수 이름으로
 */
export function Note({ en, ex, tone, accent, className }: { en: ReactNode; ex?: ReactNode; tone?: Tone; accent?: string; className?: string }) {
  const bar = accent ?? (tone ? `--${tone}-ink` : "--primary");
  return (
    <div
      className={cn("mt-3 rounded-md border-l-4 bg-bg px-3 py-2.5 text-[0.92rem] leading-normal", className)}
      style={{ borderLeftColor: `var(${bar})` }}
    >
      <span className="block font-bold" lang="en">
        ✨ {en}
      </span>
      {ex && (
        <span className="mt-1.5 block font-display" lang="ko">
          {ex}
        </span>
      )}
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

/* 탭 · 패널 id. 주소의 #key 와 겹치지 않게 앞말을 붙인다 — 같으면 브라우저가 그 자리로 스크롤한다.
   한 페이지에 탭 묶음은 하나뿐이다 */
const tabId = (k: string) => `tab-${k}`;
const panelId = (k: string) => `panel-${k}`;

/**
 * 탭 단추 줄. 패널은 <TabPanel> 로 탭마다 하나씩 — 열린 것만 그리지 말고 전부 그린다 (#101).
 * ← → 로 옆 탭, Home · End 로 처음 · 끝. 누르면 바로 바뀐다 (자동 선택)
 */
export function Tabs<K extends string>({ tabs, value, onChange }: { tabs: TabDef<K>[]; value: K; onChange: (k: K) => void }) {
  const onKey = (e: KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.key === value);
    const n = tabs.length;
    const to = ({ ArrowRight: i + 1, ArrowLeft: i - 1 + n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const k = tabs[to % n].key;
    onChange(k);
    document.getElementById(tabId(k))?.focus();
  };
  return (
    <div className="grid auto-cols-fr grid-flow-col rounded-full border-2 border-ink bg-surface p-1" role="tablist" onKeyDown={onKey}>
      {tabs.map((t) => (
        <button
          key={t.key}
          id={tabId(t.key)}
          className="group flex min-h-11 flex-col items-center justify-center rounded-full px-1 py-1.5 leading-[1.1] aria-selected:bg-primary aria-selected:text-primary-ink"
          role="tab"
          type="button"
          aria-selected={t.key === value}
          aria-controls={panelId(t.key)}
          tabIndex={t.key === value ? 0 : -1}
          onClick={() => onChange(t.key)}
        >
          <span className="font-display text-[1rem]" lang="en">
            {t.en}
          </span>
          <span className="text-[0.68rem] font-bold text-muted group-aria-selected:text-current group-aria-selected:opacity-80" lang="ko">
            {t.ko}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * 탭 하나의 내용. 안 열린 패널도 그리고 hidden 으로만 숨긴다 (#101) —
 * 검색엔진은 숨긴 패널도 읽는다. 열린 탭만 그리면 첫 탭 말고는 HTML 에 없다.
 * 탭 이름이 이 패널의 h2 다. 탭 단추에 이미 보이는 글이라 화면에서는 sr-only 로 겹치지 않게 둔다.
 * 패널 안 상자 제목은 h3, 상자 안 소제목은 h4.
 * 상태는 탭을 옮겨도 남는다 (퀴즈를 하다 다른 탭을 봐도 이어서 한다).
 */
export function TabPanel<K extends string>({ tab, value, children, className }: { tab: TabDef<K>; value: K; children: ReactNode; className?: string }) {
  return (
    <section
      role="tabpanel"
      id={panelId(tab.key)}
      aria-labelledby={tabId(tab.key)}
      hidden={tab.key !== value}
      className={cn("flex flex-col gap-3.5", className)}
    >
      <h2 className="sr-only">
        {tab.en} · <span lang="ko">{tab.ko}</span>
      </h2>
      {children}
    </section>
  );
}
