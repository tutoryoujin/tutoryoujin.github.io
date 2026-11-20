import type { ReactNode } from "react";
import { ordered, type Bi, type Block, type Lead } from "../doc";
import { cn } from "./cn";
import { canSpeak, speak } from "./speech";

/* ============================================================
   글 블록을 화면에 그린다 (shared/doc.ts). 정적 본문(docHtml)과 같은 글이다.

     <Doc blocks={…} lead="ko" widgets={{ "tti-finder": <TtiFinder /> }} />
   ============================================================ */

/** 큰 줄 + 아래 작은 muted 줄 */
function Two({ b, lead, className, smallClass }: { b: Bi; lead: Lead; className?: string; smallClass?: string }) {
  const [big, small] = ordered(b, lead);
  return (
    <>
      <span className={cn("block", className)} lang={lead}>
        {big}
      </span>
      <span className={cn("mt-0.5 block text-[0.9em] font-semibold text-muted", smallClass)} lang={lead === "ko" ? "en" : "ko"}>
        {small}
      </span>
    </>
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
        <h2 className="mt-10 mb-1 font-display text-[1.45rem] leading-[1.25] font-normal">
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
            <li key={i} className="flex items-center gap-3 rounded-lg bg-surface py-2.5 pr-2 pl-4 shadow-card">
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[1.3rem] leading-[1.3]" lang="ko">
                  {it.ko}
                </span>
                <span className="block text-[0.9rem] font-semibold text-muted" lang="en">
                  {it.en}
                </span>
              </span>
              {canSpeak && (
                <button
                  type="button"
                  className="grid size-11 flex-none place-items-center rounded-full border border-line bg-bg text-[1.1rem]"
                  aria-label={`들어 보기 / Listen: ${it.ko}`}
                  onClick={() => speak(it.ko)}
                >
                  <span aria-hidden="true">🔊</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      );
    case "cards":
      return (
        <ul className="mt-4 grid grid-cols-2 gap-2 min-[440px]:grid-cols-3">
          {b.items.map((it, i) => (
            <li key={i} className="rounded-lg bg-surface px-3 py-3 text-center shadow-card">
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
            className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 font-bold text-ink no-underline shadow-card"
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
  }
}
