import type { ReactNode } from "react";
import { cn } from "@yj/ui";
import { decompose } from "@yj/korean/hangul";
import type { Option } from "./convert";
import { barcode, barcodeWidth, breakdown, buildSteps, introduce, pad, stamp, STAMP, STATUS_NOTE } from "./model";

export type Issued = { input: string; option: Option; serial: number; at: Date };

/** 조립 단계 — 글자마다 몇 번째 단계부터 시작하는지 */
export function stepPlan(text: string) {
  const steps = buildSteps(text).map((s) => (decompose(s[s.length - 1]) ? s : []));
  const offsets: number[] = [];
  let total = 0;
  for (const s of steps) {
    offsets.push(total);
    total += s.length;
  }
  return { steps, offsets, total };
}

const ko = "font-display";
const en = "text-[0.7rem] font-bold text-(--hn-paper-soft)";
const num = "font-reading tabular-nums";

/** 점선으로 잇는 한 줄 — 왼쪽 ······ 오른쪽 */
function Line({ l, r, className, dots = true }: { l: ReactNode; r: ReactNode; className?: string; dots?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-baseline gap-1.5", className)}>
      <span className="min-w-0">{l}</span>
      <span className={cn("min-w-2 flex-1", dots && "-translate-y-1 border-b border-dotted border-(--hn-paper-soft)")} aria-hidden="true" />
      <span className="shrink-0 text-right">{r}</span>
    </div>
  );
}
const Rule = ({ double }: { double?: boolean }) => (
  <hr className={cn("my-1 border-0 border-t border-(--hn-paper-ink)", double ? "border-t-[3px] border-double" : "border-dashed")} />
);
/** 한국어 이름표 + 작은 영어 */
const Label = ({ k, e }: { k: string; e: string }) => (
  <>
    <span className={ko}>{k}</span> <span className={en}>{e}</span>
  </>
);

/**
 * 영수증. revealed 는 조립이 몇 단계까지 됐는지 (끝났으면 Infinity).
 * printing 이면 투입구에서 밀려 나오는 움직임을 건다 (motion-safe 에만).
 */
export function Receipt({ issued, revealed, printing }: { issued: Issued; revealed: number; printing: boolean }) {
  const { option, serial, at } = issued;
  const text = option.text;
  const { blocks, letters, finals } = breakdown(text);
  const plan = stepPlan(text);
  const intro = introduce(text);
  const bars = barcode(text, serial);
  const done = revealed >= plan.total;

  // 글자마다 지금 보일 모양
  const glyphs = [...text].map((ch, i) => {
    const s = plan.steps[i];
    if (!s.length) return { ch, shown: ch, step: -1 };
    const k = Math.min(revealed - plan.offsets[i], s.length);
    return { ch, shown: k > 0 ? s[k - 1] : "", step: k };
  });
  const syllableOffsets = [...text].flatMap((_, i) => (plan.steps[i].length ? [plan.offsets[i]] : []));

  return (
    <article
      className={cn(
        "relative flex flex-col gap-1.5 bg-(--hn-paper) px-4 pt-5 pb-5 text-[0.85rem] leading-normal text-(--hn-paper-ink)",
        printing && "motion-safe:animate-[hn-print_1.5s_steps(22,end)_both]",
      )}
      aria-label="한글 이름 영수증 / Your Hangul name receipt"
    >
      <div className="text-center leading-[1.15]">
        <div className={cn(ko, "text-[1.5rem]")}>한글 이름 영수증</div>
        <div className="text-[0.66rem] font-bold tracking-[0.14em] text-(--hn-paper-soft)">HANGUL NAME RECEIPT</div>
      </div>
      <Rule />
      <Line
        dots={false}
        l={
          <>
            <Label k="번호" e="No." /> <span className={num}>{pad(serial, 4)}</span>
          </>
        }
        r={<span className={cn(num, "text-[0.8rem]")}>{stamp(at)}</span>}
      />
      <Line dots={false} l={<Label k="이름" e="Name" />} r={<span className="font-extrabold tracking-[0.04em] uppercase">{issued.input}</span>} />
      <Rule double />

      {/* 큰 이름 — 조립되는 동안 화면 읽기 프로그램은 완성된 이름만 읽는다 */}
      <div className="flex min-h-[4.6rem] flex-wrap justify-center gap-x-1.5 py-1.5 font-display text-[4rem] leading-[1.05] max-[360px]:text-[3.2rem]" aria-label={text}>
        {glyphs.map((g, i) =>
          g.ch === " " ? (
            <span key={i} className="min-w-[0.25em]" aria-hidden="true" />
          ) : (
            <span
              key={`${i}-${g.step}`}
              aria-hidden="true"
              className={cn("inline-block min-w-[0.6em] text-center", g.step > 0 && !done && "motion-safe:animate-[hn-pop_0.24s_ease-out]")}
            >
              {g.shown}
            </span>
          ),
        )}
      </div>

      {/* 도장 — 색이 아니라 글자로 읽힌다 */}
      {done && (
        <div
          className={cn(
            "-mt-1 mr-0.5 mb-1 self-end rounded-[4px] border-2 border-(--hn-red) px-2.5 py-0.5 text-center leading-[1.1] text-(--hn-red) rotate-[-6deg]",
            printing && "motion-safe:animate-[hn-stamp_0.35s_ease-out_both] motion-reduce:animate-[hn-glow_0.6s_ease-out_both]",
          )}
        >
          <span className={cn(ko, "block text-[1.05rem]")}>{STAMP[option.status].ko}</span>
          <span className="block text-[0.62rem] font-extrabold tracking-[0.08em] uppercase">{STAMP[option.status].en}</span>
        </div>
      )}

      <Rule />
      <Line dots={false} className="text-[0.7rem] font-bold text-(--hn-paper-soft)" l="글자 · BLOCK" r="소리 · SOUND" />
      {blocks.map((b, bi) => {
        const off = syllableOffsets[bi];
        return (
          <div key={off}>
            <Line className="mt-1 text-[1rem] font-extrabold" l={<span className={cn(ko, "text-[1.2rem] font-normal")}>{b.syl}</span>} r={<span className={num}>{b.sound}</span>} />
            {b.jamo.map((j, k) => (
              <Line
                key={k}
                className={cn("pl-3 transition-opacity duration-200 motion-reduce:transition-none", revealed > off + k ? "" : "opacity-20")}
                l={
                  <>
                    <b
                      className={cn(
                        "mr-1.5 inline-block min-w-[1.6em] rounded-[3px] text-center font-display text-[1rem] font-normal",
                        j.kind === "jung" && "text-(--hn-red)",
                        j.kind === "jong" && "bg-(--hn-paper-ink) text-(--hn-paper)",
                      )}
                    >
                      {j.jamo}
                    </b>
                    {j.kind === "cho" ? (
                      j.sound ? <Label k="첫소리" e="first sound" /> : <Label k="빈자리" e="silent placeholder" />
                    ) : j.kind === "jung" ? (
                      <Label k="모음" e="vowel" />
                    ) : (
                      <Label k="받침" e={j.like ? `final, sounds like ${j.like}` : "final"} />
                    )}
                  </>
                }
                r={<span className={num}>{j.sound || "—"}</span>}
              />
            ))}
          </div>
        );
      })}

      <Rule />
      <Line l={<Label k="글자" e="blocks" />} r={<span className={num}>{blocks.length}</span>} />
      <Line l={<Label k="자모" e="letters" />} r={<span className={num}>{letters}</span>} />
      <Line l={<Label k="받침" e="finals" />} r={<span className={num}>{finals}</span>} />
      <Rule double />
      <Line
        dots={false}
        className="font-extrabold"
        l={<Label k="합계" e="TOTAL" />}
        r={<span className="font-display text-[1.7rem] leading-none font-normal">{text}</span>}
      />
      <Rule />

      <p className="mt-1 font-display text-[1.15rem] leading-[1.4] [overflow-wrap:anywhere]">
        {intro.parts.before}
        <em className="text-(--hn-red) not-italic">{intro.parts.ending}</em>
        {intro.parts.after}
      </p>
      <p className={en}>Hello! I’m {issued.input}.</p>
      <p className="mt-1 text-[0.78rem] font-bold">
        * {STATUS_NOTE[option.status].en}
        <span className="block text-[0.72rem] text-(--hn-paper-soft)">{STATUS_NOTE[option.status].ko}</span>
      </p>

      <svg
        className="mx-auto mt-2 h-11 text-(--hn-paper-ink)"
        viewBox={`0 0 ${barcodeWidth(bars)} 42`}
        width={barcodeWidth(bars)}
        aria-hidden="true"
        focusable="false"
      >
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={42} fill="currentColor" />
        ))}
      </svg>
      <div className="text-center text-[0.68rem] font-bold tracking-[0.14em]">감사합니다 · THANK YOU</div>

      {/* 찢은 아래 끝 */}
      <div
        className="absolute inset-x-0 top-full h-3"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(135deg, var(--hn-paper) 25%, transparent 25%) -6px 0 / 12px 12px, linear-gradient(225deg, var(--hn-paper) 25%, transparent 25%) -6px 0 / 12px 12px",
        }}
      />
    </article>
  );
}
