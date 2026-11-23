import type { ReactNode } from "react";
import { ordered, type Block, type Lead, type Prose } from "../doc";
import { Bubble } from "./Bubble";
import { ClockFace } from "./ClockFace";
import { cn } from "./cn";
import { Ieung } from "./Ieung";
import { canSpeak, speak } from "./speech";

/* ============================================================
   글 블록을 화면에 그린다 (shared/doc.ts). 정적 본문(docHtml)과 같은 글이다.

     <Doc blocks={…} lead="ko" widgets={{ "tti-finder": <TtiFinder /> }} />
   ============================================================ */

/** 큰 줄 + 아래 작은 muted 줄. 한 언어만 있으면 그 줄 하나 (#122) */
function Two({ b, lead, className, smallClass }: { b: Prose; lead: Lead; className?: string; smallClass?: string }) {
  const [big, small] = ordered(b, lead);
  const other = lead === "ko" ? "en" : "ko";
  return (
    <>
      <span className={cn("block", className)} lang={small || b[lead] ? lead : other}>
        {big}
      </span>
      {small && (
        <span className={cn("mt-0.5 block text-[0.9em] font-semibold text-muted", smallClass)} lang={other}>
          {small}
        </span>
      )}
    </>
  );
}

/** 🔊 들어 보기 — 예문 (이응이 말풍선에는 두지 않는다) */
function Listen({ ko }: { ko: string }) {
  if (!canSpeak) return null;
  return (
    <button
      type="button"
      className="grid size-11 flex-none place-items-center rounded-full border border-line bg-bg text-[1.1rem]"
      aria-label={`들어 보기 / Listen: ${ko}`}
      onClick={() => speak(ko)}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  );
}

export function Doc({ blocks, lead, widgets = {} }: { blocks: Block[]; lead: Lead; widgets?: Record<string, ReactNode> }) {
  return (
    <div className="break-keep text-[1.05rem] leading-[1.65]">
      {blocks.map((b, i) => (
        <DocBlock key={i} b={b} lead={lead} widgets={widgets} />
      ))}
    </div>
  );
}

function DocBlock({ b, lead, widgets }: { b: Block; lead: Lead; widgets: Record<string, ReactNode> }) {
  switch (b.t) {
    case "h":
      return (
        <h2 className="mt-10 mb-1 font-display text-[1.45rem] leading-[1.25] font-extrabold">
          <Two b={b} lead={lead} smallClass="font-app text-[0.7em] font-bold" />
        </h2>
      );
    case "p":
      return (
        <p className="mt-4 font-bold">
          <Two b={b} lead={lead} />
        </p>
      );
    case "tip":
      return (
        <p className="mt-4 rounded-md border-l-4 border-primary bg-surface px-4 py-3 font-bold">
          <span aria-hidden="true">✨ </span>
          <Two b={b} lead={lead} className="inline" />
        </p>
      );
    case "list":
      return (
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-6 font-bold marker:text-muted">
          {b.items.map((it, i) => (
            <li key={i}>
              <Two b={it} lead={lead} />
            </li>
          ))}
        </ul>
      );
    case "ex":
      return (
        <ul className="mt-4 flex flex-col gap-2">
          {b.items.map((it, i) => (
            <li key={i} className={cn("flex items-center gap-3 rounded-lg border-2 border-ink bg-surface py-2.5 pr-2", it.clock === undefined ? "pl-4" : "pl-2.5")}>
              {it.clock !== undefined && (
                // 글자가 같은 시각을 말하니 그림은 장식 — 화면 읽기에는 글자만
                <span className="w-16 flex-none" aria-hidden="true">
                  <ClockFace t={it.clock} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[1.3rem] leading-[1.3]" lang="ko">
                  {it.ko}
                </span>
                {it.also && (
                  <span className="block font-display text-[1.05rem] leading-[1.3] text-muted" lang="ko">
                    = {it.also}
                  </span>
                )}
                <span className="block text-[0.9rem] font-semibold text-muted" lang="en">
                  {it.en}
                </span>
              </span>
              <Listen ko={it.ko} />
            </li>
          ))}
        </ul>
      );
    case "cards":
      return (
        <ul className="mt-4 grid grid-cols-2 gap-2 min-[440px]:grid-cols-3">
          {b.items.map((it, i) => (
            <li key={i} className="rounded-lg border-2 border-ink bg-surface px-3 py-3 text-center">
              <span className="block text-[1.9rem] leading-none" aria-hidden="true">
                {it.mark}
              </span>
              <span className="mt-1.5 block font-display text-[1.25rem] leading-[1.2]" lang="ko">
                {it.ko}
              </span>
              <span className="block text-[0.85rem] font-bold text-muted" lang="en">
                {it.en}
              </span>
              {it.sub && <span className="mt-1 block text-[0.75rem] leading-[1.35] font-semibold text-muted">{it.sub}</span>}
            </li>
          ))}
        </ul>
      );
    case "link":
      return (
        <p className="mt-4">
          <a
            href={b.href}
            target="_blank"
            rel="noopener"
            className="flex min-h-11 items-center gap-3 rounded-lg border-2 border-ink bg-surface px-4 py-3 font-bold text-ink no-underline"
          >
            {b.mark && (
              <span className="text-[1.6rem] leading-none" aria-hidden="true">
                {b.mark}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <Two b={b} lead={lead} />
            </span>
            <span aria-hidden="true">↗</span>
            <span className="sr-only">(opens in a new tab · 새 탭)</span>
          </a>
        </p>
      );
    case "widget":
      return <>{widgets[b.id] ?? null}</>;
    case "ieung":
      return (
        <div className="mt-6 flex items-center gap-3">
          <span className="w-24 flex-none min-[440px]:w-28">
            <Ieung mood={b.mood} scene={b.scene} />
          </span>
          <Bubble ko={b.ko} en={b.en} tail="left" className="min-w-0 flex-1 animate-none" />
        </div>
      );
  }
}
