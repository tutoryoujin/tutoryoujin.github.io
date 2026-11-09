import { useState } from "react";
import { Box, Btn, cn, ListenBtn, Note, Page, Quiz, Seg, Segments, Tabs, speak, useHashTab, type Question, type TabDef } from "@yj/ui";
import { native, nativeCounter } from "@yj/korean/numbers";
import { ClockFace } from "./ClockFace";
import { contracted, parts, readHour, readMin, readTime, wrapDay, wrongChoices } from "./reading";
import "./clock.css";

const TABS: TabDef<"clock" | "rule" | "quiz">[] = [
  { key: "clock", ko: "시계", en: "Clock" },
  { key: "rule", ko: "읽는 법", en: "How to read" },
  { key: "quiz", ko: "퀴즈", en: "Quiz" },
];
const pad = (n: number) => String(n).padStart(2, "0");
const section = "flex flex-col gap-3.5";

export function App() {
  const [tab, setTab] = useHashTab(TABS);
  return (
    <Page
      app="korean-clock"
      legal={
        <>
          읽기 연습용이라 바늘은 1분 단위로 움직여요. 초는 다루지 않아요.
          <br />
          Made for reading practice — the hands move in 1-minute steps, and seconds are left out.
        </>
      }
    >
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "clock" && <ClockTab />}
      {tab === "rule" && <RuleTab />}
      {tab === "quiz" && <Quiz make={makeQuestion} label={{ ko: "몇 시 몇 분이에요?", en: "What time is it?" }} />}
    </Page>
  );
}

/* ---------- 시계 ---------- */
function ClockTab() {
  const [t, setT] = useState(15 * 60 + 30); // 처음 화면은 오후 세 시 삼십 분
  const { h, m, pm } = parts(t);
  const ampm = pm ? "오후" : "오전";
  const step = (d: number) => setT(wrapDay(t + d));

  return (
    <section className={section}>
      <Box>
        <div className="mx-auto mb-2 grid max-w-55 grid-cols-2 gap-1 rounded-full border border-line bg-bg p-1" role="radiogroup" aria-label="오전 오후 / AM PM">
          {[false, true].map((isPm) => (
            <button
              key={String(isPm)}
              className="group flex min-h-11 flex-col items-center justify-center rounded-full leading-[1.1] aria-checked:bg-(--clk-ampm-bg) aria-checked:text-(--clk-ampm-ink)"
              type="button"
              role="radio"
              aria-checked={pm === isPm}
              onClick={() => pm !== isPm && step(isPm ? 720 : -720)}
            >
              <span className="font-display text-[1rem]">{isPm ? "오후" : "오전"}</span>
              <span className="text-[0.66rem] font-bold text-muted group-aria-checked:text-current">{isPm ? "PM" : "AM"}</span>
            </button>
          ))}
        </div>
        <div className="mx-auto w-[min(100%,320px)]">
          <ClockFace t={t} onChange={setT} />
        </div>
        <p className="mt-1.5 text-center leading-[1.3]">
          <span className="block font-display">바늘을 끌어서 돌려 보세요</span>
          <span className="text-[0.75rem] font-bold text-muted">Drag a hand to turn it</span>
        </p>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[-5, -1, 1, 5].map((d) => (
            <button key={d} className="min-h-11 rounded-md border border-line bg-bg text-[1rem] font-extrabold motion-safe:active:scale-[0.97]" type="button" onClick={() => step(d)}>
              {d > 0 ? "+" : "−"}
              {Math.abs(d)}
              {/* 브라우저 기본 small 은 smaller (preflight 는 80%) */}
              <small className="ml-0.5 font-display text-[smaller] font-normal">분</small>
            </button>
          ))}
        </div>
      </Box>

      <Box aria-live="polite">
        <div className="mt-0.5 mb-3 text-center font-display text-[1.6rem]">
          {ampm} {h}:{pad(m)}
        </div>
        <Segments>
          <Seg tone="clk-ampm" caption={pm ? "PM" : "AM"}>
            {ampm}
          </Seg>
          <Seg tone="clk-hour" caption={`${h}시 · 고유어`} en="Native Korean">
            {readHour(h)}
          </Seg>
          {m ? (
            <Seg tone="clk-min" caption={`${m}분 · 한자어`} en="Sino-Korean">
              {readMin(m)}
            </Seg>
          ) : (
            <Seg tone="clk-ampm" caption="0분" en="o’clock">
              정각
            </Seg>
          )}
        </Segments>
        <p className="mt-3 text-center font-bold text-muted">
          {h}:{pad(m)} {pm ? "PM" : "AM"}
          {m ? "" : " · o’clock"}
        </p>
        {contracted(h) && (
          <Note
            tone="clk-hour"
            ko={`${native(h)} + 시 → ${readHour(h)}`}
            en={`${native(h)} gets shorter before 시: ${nativeCounter(h)}.`}
          />
        )}
        {m === 30 && <Note tone="clk-min" ko={`${readHour(h)} 반이라고도 해요.`} en="You can also say 반 — half past." />}
        <ListenBtn text={`${ampm} ${readTime(h, m)}`} />
        <Btn
          variant="ghost"
          ko="지금 몇 시예요?"
          en="Set to the current time"
          onClick={() => {
            const d = new Date();
            setT(d.getHours() * 60 + d.getMinutes());
          }}
        />
      </Box>
    </section>
  );
}

/* ---------- 읽는 법 ---------- */
const rule = "flex flex-col gap-0.5 rounded-lg p-3 text-center leading-[1.2]";
const ruleSmall = "text-[0.75rem] font-extrabold";
const ruleB = "font-display text-[1.6rem] font-normal";
const ruleSpan = "font-display text-[1rem]";
const ruleEm = "text-[0.75rem] font-bold not-italic";
// h2 크기는 브라우저 기본(1.5em) 그대로 — 영어 줄의 줄 높이가 여기서 나온다
const secTitle = "mb-2.5 text-[1.5em] font-normal leading-[1.2]";
const secKo = "block font-display text-[1.2rem]";
const secEn = "text-[0.75rem] font-bold text-muted";
const row =
  "grid min-h-13 w-full grid-cols-[auto_1fr] items-center gap-x-2 rounded-md border border-line bg-bg px-2.5 py-1.5 text-left";
const num = "min-w-[2.6em] text-[0.8rem] font-extrabold text-muted";
const word = "font-display text-[1.2rem]";
const MINUTES = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function RuleTab() {
  return (
    <section className={section}>
      <Box>
        <div className="mb-3 text-center leading-[1.35]">
          <span className="block font-display text-[1.4rem]">시는 고유어, 분은 한자어</span>
          <span className="text-[0.82rem] font-bold text-muted">Hours use native Korean numbers. Minutes use Sino-Korean numbers.</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className={cn(rule, "bg-(--clk-hour-bg) text-(--clk-hour-ink)")}>
            <small className={ruleSmall}>시 · Hour</small>
            <b className={ruleB}>고유어</b>
            <span className={ruleSpan}>하나, 둘, 셋…</span>
            <em className={ruleEm}>Native Korean</em>
          </div>
          <div className={cn(rule, "bg-(--clk-min-bg) text-(--clk-min-ink)")}>
            <small className={ruleSmall}>분 · Minute</small>
            <b className={ruleB}>한자어</b>
            <span className={ruleSpan}>일, 이, 삼…</span>
            <em className={ruleEm}>Sino-Korean</em>
          </div>
        </div>
      </Box>

      <Box>
        <h2 className={secTitle}>
          <span className={secKo}>시 — 몇 시예요?</span>
          <span className={secEn}>Hours · tap to listen</span>
        </h2>
        <ul className="grid grid-cols-2 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <li key={h}>
              <button className={row} type="button" onClick={() => speak(readHour(h))}>
                <span className={num}>{h}시</span>
                <span className={cn(word, "text-(--clk-hour-ink)")}>{readHour(h)}</span>
                {contracted(h) && (
                  <span className="col-[2] text-[0.72rem] font-bold text-muted">
                    {native(h)} → {nativeCounter(h)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <Note
          tone="clk-hour"
          ko="하나·둘·셋·넷은 시 앞에서 짧아져요."
          en="1, 2, 3 and 4 get shorter before 시 — and so do 11 and 12."
          ex="하나 → 한 · 둘 → 두 · 셋 → 세 · 넷 → 네 · 열하나 → 열한 · 열둘 → 열두"
        />
      </Box>

      <Box>
        <h2 className={secTitle}>
          <span className={secKo}>분 — 몇 분이에요?</span>
          <span className={secEn}>Minutes · tap to listen</span>
        </h2>
        <ul className="grid grid-cols-2 gap-1.5">
          {MINUTES.map((m) => (
            <li key={m}>
              <button className={row} type="button" onClick={() => speak(readMin(m))}>
                <span className={num}>{m}분</span>
                <span className={cn(word, "text-(--clk-min-ink)")}>{readMin(m)}</span>
              </button>
            </li>
          ))}
        </ul>
        <Note
          tone="clk-min"
          ko="30분은 ‘반’이라고도 해요."
          en="You can say 반 (half) for 30 minutes."
          ex="세 시 삼십 분 = 세 시 반 · half past three"
        />
      </Box>
    </section>
  );
}

/* ---------- 퀴즈 ---------- */
function makeQuestion(): Question {
  const h = Math.floor(Math.random() * 12) + 1;
  const m = (Math.floor(Math.random() * 11) + 1) * 5; // 5분 ~ 55분
  return {
    id: `${h}:${m}`,
    prompt: (
      <div className="mx-auto mt-2.5 mb-4 w-[min(100%,240px)]">
        <ClockFace t={h * 60 + m} />
      </div>
    ),
    answer: readTime(h, m),
    wrong: wrongChoices(h, m),
    review: `${h}:${pad(m)}`,
    right: `${h}:${pad(m)}`,
  };
}
