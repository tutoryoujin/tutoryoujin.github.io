import { useId, useState, type ReactNode } from "react";
import { Box, Btn, cn, Ieung, Note, Page, Quiz, TabPanel, Tabs, canSpeak, speak, useHashTab, type Choice, type Question } from "@yj/ui";
import { tabsOf } from "@yj/apps";
import { compose, decompose, shapeOf } from "@yj/korean/hangul";
import { ieungSeats, linked, MOVES, NG_WORDS, PAIRS, SILENT_WORDS, STAYS, SWITCH_VOWELS, type Seat } from "./data";
import { Mouth, type MouthMode } from "./Mouth";
import { Stage } from "./Stage";
import "./ieung.css";

/* ============================================================
   한국어 이응 (#97) — 같은 ㅇ 이 블록 안 자리에 따라 다르게 소리 난다.
   첫자리 = 소리 없음 (gray) · 받침 = [ng] (mint) · 견주는 받침 ㄱ = 딱 끊김 (coral).
   색만으로 가르지 않는다 — 🤫 · 👃 · 🧱 아이콘과 글자를 늘 같이 둔다.
   ============================================================ */

/* 탭 이름은 shared/apps.ts — 정적 본문 h2 와 같은 원본 (#101) */
const TABS = tabsOf("ieung", ["switch", "ng", "link", "quiz"] as const);
const [SWITCH_TAB, NG_TAB, LINK_TAB, QUIZ_TAB] = TABS;

/* 언어 규칙 (#102) — 제목 · 라벨은 영어가 크고 한국어가 아래 작게, 설명 문장은 영어만(say) */
const titleBig = "block font-display text-[1.3rem] leading-[1.3]";
const say = "block font-bold";

export function App() {
  const [tab, setTab] = useHashTab(TABS);
  return (
    <Page
      app="ieung"
      // 꼬리말 고지는 영어만 (#100 · #102)
      legal={{
        en: (
          <>
            Audio uses your browser’s built-in voice, so it may sound a little different on each device.
          </>
        ),
      }}
    >
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {/* 탭 넷을 모두 그린다 — 안 열린 탭은 hidden (#101) */}
      <TabPanel tab={SWITCH_TAB} value={tab}>
        <SwitchTab />
      </TabPanel>
      <TabPanel tab={NG_TAB} value={tab}>
        <CompareTab />
      </TabPanel>
      <TabPanel tab={LINK_TAB} value={tab}>
        <LinkTab />
      </TabPanel>
      <TabPanel tab={QUIZ_TAB} value={tab}>
        <QuizTab />
      </TabPanel>
    </Page>
  );
}

/* ---------- 작은 부품 ---------- */

/** 상자 제목 — 탭 h2 아래라 h3. 이 앱의 상자 제목은 영어만 (#102, 주인이 정함) */
const Title = ({ en, id }: { en: ReactNode; id: string }) => (
  <h3 id={id} className="mb-3 text-center font-normal">
    <span className={titleBig}>{en}</span>
  </h3>
);

/** 제목 있는 상자 — <section aria-labelledby> + h3 */
function TitledBox({ en, children }: { en: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <Box labelledBy={id}>
      <Title id={id} en={en} />
      {children}
    </Box>
  );
}

/** 표시 알약 — 아이콘 + 영어. 색만으로 알리지 않는다 */
const Badge = ({ tone, icon, en, className }: { tone: string; icon: string; en: string; className?: string }) => (
  <span
    className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.85rem] font-extrabold leading-[1.2]", className)}
    style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-ink)` }}
  >
    <span aria-hidden="true">{icon}</span>
    <span className="font-display text-[1rem] font-extrabold">{en}</span>
  </span>
);

/** 코로 계속 흐르는 소리 — 길게 흐르는 물결 (ng) */
function Wave({ className }: { className?: string }) {
  const id = useId();
  return (
    <span className={cn("block h-4 overflow-hidden text-(--ie-ng-ink)", className)} aria-hidden="true">
      <span className="block h-full w-[calc(100%+24px)] motion-safe:animate-[ie-flow_0.9s_linear_infinite]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id={id} width="24" height="16" patternUnits="userSpaceOnUse">
              <path d="M0 8 Q6 2 12 8 T24 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${id})`} />
        </svg>
      </span>
    </span>
  );
}

/** 딱 끊기는 소리 — 짧은 줄 끝에 벽 (ㄱ) */
const Wall = ({ className }: { className?: string }) => (
  <span className={cn("flex h-4 items-center text-(--ie-g-ink)", className)} aria-hidden="true">
    <span className="h-[3px] w-6 rounded-full bg-current" />
    <span className="h-4 w-1.5 rounded-[2px] bg-current" />
  </span>
);

/* ---------- 블록 ---------- */

type Cell = { jamo: string; tone?: string; ghost?: boolean; ring?: boolean; caption?: ReactNode; onClick?: () => void; label?: string; hum?: boolean };

/** 자모 칸 하나 */
function Tile({ cell, className }: { cell: Cell; className?: string }) {
  const empty = !cell.jamo;
  const cls = cn(
    "relative flex min-h-11 flex-col items-center justify-center rounded-md font-display leading-none transition-[opacity,background-color] duration-150 motion-reduce:transition-none",
    empty ? "border-2 border-dashed border-line text-muted" : "border-2 border-transparent",
    !cell.tone && !empty && "bg-bg",
    cell.ghost && "opacity-45",
    cell.ring && "outline-3 outline-offset-2 outline-primary",
    className,
  );
  const style = cell.tone && !empty ? { background: `var(--${cell.tone}-bg)`, color: `var(--${cell.tone}-ink)` } : undefined;
  const body = (
    <>
      <span className={cn("text-[2.6rem]", cell.hum && "motion-safe:animate-[ie-hum_1.2s_ease-in-out_infinite]")}>{cell.jamo || "+"}</span>
      {cell.caption && <span className="mt-1 font-app text-[0.68rem] font-extrabold leading-[1.15]">{cell.caption}</span>}
    </>
  );
  return cell.onClick ? (
    <button type="button" className={cls} style={style} onClick={cell.onClick} aria-label={cell.label}>
      {body}
    </button>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

/**
 * 글자 블록. 세로 모음은 오른쪽, 가로 모음은 아래, 받침은 맨 아래 (교재 순서).
 * jong 이 없고 emptyJong 이면 받침 자리를 점선 칸으로 둔다 (스위치에서 옮길 자리).
 */
function Block({ cho, jung, jong, emptyJong }: { cho: Cell; jung: Cell; jong?: Cell; emptyJong?: Cell }) {
  const tall = shapeOf(jung.jamo) === "tall";
  const bottom = jong ?? emptyJong;
  return (
    <div
      className={cn("mx-auto grid w-[min(100%,220px)] gap-2", tall ? "grid-cols-[1fr_0.75fr]" : "grid-cols-1")}
      style={{ gridTemplateRows: tall ? `1.3fr${bottom ? " 1fr" : ""}` : `1fr 0.8fr${bottom ? " 1fr" : ""}` }}
    >
      <Tile cell={cho} className="min-h-24" />
      <Tile cell={jung} className={tall ? "" : "min-h-16"} />
      {bottom && <Tile cell={bottom} className={cn("min-h-20", tall && "col-span-2")} />}
    </div>
  );
}

/* ---------- 스위치 ---------- */

function SwitchTab() {
  const [vi, setVi] = useState(0);
  const [seat, setSeat] = useState<Seat>("cho");
  const { v, rom } = SWITCH_VOWELS[vi];
  const top = seat === "cho";
  const syl = compose("ㅇ", v, top ? "" : "ㅇ")!;
  const sound = top ? rom : `${rom}ng`;
  const whyId = useId();

  // 자리를 옮기면 바로 들려준다 — 누른 핸들러 안에서 동기로 (iOS)
  const move = (s: Seat) => {
    setSeat(s);
    speak(compose("ㅇ", v, s === "cho" ? "" : "ㅇ")!);
  };

  return (
    <>
      <TitledBox en="Move ㅇ up and down — same letter, two jobs">

        <div className="mb-3 grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Vowel">
          {SWITCH_VOWELS.map((x, i) => (
            <button
              key={x.v}
              type="button"
              role="radio"
              aria-checked={i === vi}
              onClick={() => setVi(i)}
              className="min-h-11 rounded-md border border-line bg-bg font-display text-[1.3rem] aria-checked:border-(--ie-vowel-ink) aria-checked:bg-(--ie-vowel-bg) aria-checked:text-(--ie-vowel-ink)"
            >
              {x.v}
            </button>
          ))}
        </div>

        <Stage vowel={v} rom={rom} seat={seat} onMove={move} />
        <p className="mt-2 text-center text-[0.75rem] font-bold text-muted">Tap ㅇ to make it jump</p>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-full border border-line bg-bg p-1" role="radiogroup" aria-label="Where ㅇ sits">
          {(["cho", "jong"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={seat === s}
              onClick={() => move(s)}
              className={cn(
                "group flex min-h-11 flex-col items-center justify-center rounded-full leading-[1.1]",
                s === "cho" ? "aria-checked:bg-(--ie-silent-bg) aria-checked:text-(--ie-silent-ink)" : "aria-checked:bg-(--ie-ng-bg) aria-checked:text-(--ie-ng-ink)",
              )}
            >
              <span className="font-display text-[1rem]">{s === "cho" ? "⬆ Top" : "⬇ Bottom"}</span>
              <span className="text-[0.66rem] font-bold text-muted group-aria-checked:text-current">{s === "cho" ? "first sound" : "final (batchim)"}</span>
            </button>
          ))}
        </div>
      </TitledBox>

      <Box aria-live="polite" className="text-center">
        <div className="flex items-baseline justify-center gap-3">
          <span className="font-display text-[3.2rem] leading-none">{syl}</span>
          <span className="text-[1.1rem] font-extrabold text-muted">[{sound}]</span>
        </div>
        <div className="mt-3">
          {top ? <Badge tone="ie-silent" icon="🤫" en="Silent" /> : <Badge tone="ie-ng" icon="👃" en="ng" />}
        </div>
        <p className="mt-3 leading-[1.4]">
          {top ? (
            <>
              <span className={say}>At the top, ㅇ is silent — you only hear the vowel.</span>
            </>
          ) : (
            <>
              <span className={say}>At the bottom, ㅇ is the ng in singer — keep humming through your nose.</span>
            </>
          )}
        </p>
        {canSpeak && <Btn en="🔊 Listen" onClick={() => speak(syl)} />}
      </Box>

      <TitledBox en="Hear it in words">
        <WordList en="🤫 Silent ㅇ at the top" words={SILENT_WORDS} tone="ie-silent" />
        <WordList en="👃 ng at the bottom" words={NG_WORDS} tone="ie-ng" className="mt-4" />
      </TitledBox>

      <Box labelledBy={whyId}>
        <div className="flex items-start gap-3">
          <div className="w-14 shrink-0 [&_svg]:h-auto [&_svg]:w-full">
            <Ieung mood="wink" />
          </div>
          <Title id={whyId} en="Why does ㅇ sometimes make no sound?" />
        </div>
        <ul className="flex flex-col gap-2.5 leading-normal">
          <li className={say}>Every Hangul block starts with a consonant. When a syllable starts with a vowel sound, a silent ㅇ just holds the seat.</li>
          <li className={say}>At the bottom, as a final consonant (batchim), ㅇ does have a sound: the ng in singer, not finger.</li>
          <li className={say}>So 앙 has two ㅇs, but only one of them makes a sound.</li>
        </ul>
      </Box>
    </>
  );
}

function WordList({ en, words, tone, className }: { en: string; words: { ko: string; en: string }[]; tone: string; className?: string }) {
  return (
    <div className={className}>
      {/* 상자(h3) 안 소제목 */}
      <h4 className="mb-2 leading-[1.2]">
        <span className="font-display">{en}</span>
      </h4>
      <ul className="grid grid-cols-2 gap-1.5 min-[440px]:grid-cols-3">
        {words.map((w) => (
          <li key={w.ko}>
            <button
              type="button"
              onClick={() => speak(w.ko)}
              className="flex min-h-13 w-full flex-col items-center justify-center rounded-md border-2 px-2 py-1.5 leading-[1.15]"
              style={{ borderColor: `var(--${tone}-bg)` }}
            >
              <span className="font-display text-[1.3rem]">
                <Marked word={w.ko} tone={tone} />
              </span>
              <span className="text-[0.72rem] font-bold text-muted">{w.en}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** ㅇ 이 든 글자에 색 + 밑줄. 받침 ㅇ 글자는 ng 색, 첫자리만이면 silent 색 */
function Marked({ word, tone }: { word: string; tone: string }) {
  const seats = ieungSeats(word);
  return (
    <>
      {[...word].map((s, i) => {
        const mine = seats.filter((x) => x.i === i);
        const hit = tone === "ie-ng" ? mine.some((x) => x.seat === "jong") : mine.length > 0;
        return (
          <span key={i} className={hit ? "underline decoration-2 underline-offset-4" : undefined} style={hit ? { color: `var(--${tone}-ink)` } : undefined}>
            {s}
          </span>
        );
      })}
    </>
  );
}

/* ---------- ng ≠ g ---------- */

const MOUTH_MODES: { k: MouthMode; syl: string; tone: string; en: string; say: string }[] = [
  { k: "a", syl: "아", tone: "ie-vowel", en: "vowel a", say: "Tongue down, mouth open — the air goes out through your mouth." },
  { k: "ng", syl: "앙", tone: "ie-ng", en: "ng", say: "The back of your tongue closes the mouth, but the air keeps flowing out your nose." },
  { k: "k", syl: "악", tone: "ie-g", en: "k", say: "Mouth and nose both close — the air stops dead." },
];

function CompareTab() {
  const [mode, setMode] = useState<MouthMode>("ng");
  const cur = MOUTH_MODES.find((x) => x.k === mode)!;
  return (
    <>
      <TitledBox en="ㅇ at the bottom is a hum through your nose, never a hard g. Stopping with a click is ㄱ.">
        <div className="mb-2 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Pick a sound">
          {MOUTH_MODES.map((x) => (
            <button
              key={x.k}
              type="button"
              role="radio"
              aria-checked={mode === x.k}
              onClick={() => {
                setMode(x.k);
                speak(x.syl);
              }}
              className="flex min-h-14 flex-col items-center justify-center rounded-md border-2 border-line bg-bg leading-[1.15] aria-checked:border-current"
              style={mode === x.k ? { background: `var(--${x.tone}-bg)`, color: `var(--${x.tone}-ink)` } : undefined}
            >
              <span className="font-display text-[1.4rem]">{x.syl}</span>
              <span className="text-[0.68rem] font-extrabold">
                {x.en}
              </span>
            </button>
          ))}
        </div>
        <Mouth mode={mode} />
        <p className="mt-2 text-center leading-[1.35]" aria-live="polite">
          <span className={say}>{cur.say}</span>
        </p>
        <Note tone="ie-g" en="Say it like singer ⭕, not finger ❌ — no g at the end." />
      </TitledBox>

      <TitledBox en="Listen to the pairs back and forth">
        <ul className="flex flex-col gap-2">
          {PAIRS.map((p) => (
            <li key={p.ng.ko} className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5">
              <PairSide w={p.ng} kind="ng" onPlay={() => setMode("ng")} />
              <button
                type="button"
                className="grid min-w-11 place-items-center rounded-md border border-line bg-bg px-1 text-[1.1rem] font-extrabold"
                onClick={() => speak(`${p.ng.ko}. ${p.g.ko}. ${p.ng.ko}. ${p.g.ko}.`)}
                aria-label={`Listen to both: ${p.ng.ko}, ${p.g.ko}`}
              >
                <span aria-hidden="true">⇄</span>
              </button>
              <PairSide w={p.g} kind="g" onPlay={() => setMode("k")} />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-center text-[0.75rem] font-bold text-muted">Tap ⇄ to hear both, one after the other.</p>
        <Note
          tone="gray"
          en="Browser voices can make the difference sound small. Listen to the end: does it hum on, or stop dead?"
        />
      </TitledBox>
    </>
  );
}

function PairSide({ w, kind, onPlay }: { w: { ko: string; en: string; rom: string }; kind: "ng" | "g"; onPlay: () => void }) {
  const tone = kind === "ng" ? "ie-ng" : "ie-g";
  return (
    <button
      type="button"
      onClick={() => {
        speak(w.ko);
        onPlay();
      }}
      className="flex min-h-22 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 leading-[1.15]"
      style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-ink)` }}
    >
      <span className="font-display text-[1.8rem]">{w.ko}</span>
      <span className="text-[0.8rem] font-extrabold">
        <span aria-hidden="true">{kind === "ng" ? "👃 " : "🧱 "}</span>[{w.rom}]
      </span>
      {kind === "ng" ? <Wave className="w-16" /> : <Wall />}
      {w.en && <span className="text-[0.68rem] font-extrabold">{w.en}</span>}
    </button>
  );
}

/* ---------- 이어 읽기 ---------- */

function LinkTab() {
  return (
    <>
      <TitledBox en="ㅇ at the bottom stays put — it never slides into the next syllable">
        <p className={cn("mb-2 leading-[1.3]", say)}>Other final consonants slide over when the next syllable starts with ㅇ.</p>
        <ul className="grid grid-cols-2 gap-2">
          {MOVES.map((w) => (
            <li key={w.ko}>
              <button type="button" onClick={() => speak(w.ko)} className="flex min-h-14 w-full flex-col items-center justify-center rounded-md border border-line bg-bg px-2 py-1.5 leading-[1.2]">
                <span className="font-display text-[1.2rem]">
                  {w.ko} → [{linked(w.ko)}]
                </span>
                <span className="text-[0.72rem] font-bold text-muted">{w.en} · 🔊</span>
              </button>
            </li>
          ))}
        </ul>
        <Note tone="ie-ng" en="ㅇ stays where it is. No g sound appears." />
      </TitledBox>

      {STAYS.map((w) => (
        <StayBox key={w.ko} w={w} />
      ))}
    </>
  );
}

/** 단어 하나 — 단어가 상자 제목(h3) */
function StayBox({ w }: { w: { ko: string; en: string } }) {
  const id = useId();
  return (
    <Box labelledBy={id}>
      <h3 id={id} className="mb-2.5 text-center leading-[1.2] font-normal">
        <span className="block font-display text-[2rem]">
          <Marked word={w.ko} tone="ie-ng" />
        </span>
        <span className="text-[0.8rem] font-bold text-muted">{w.en}</span>
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <ReadBtn ok text={w.ko} />
        <ReadBtn ok={false} text={linked(w.ko, true)} />
      </div>
    </Box>
  );
}

function ReadBtn({ ok, text }: { ok: boolean; text: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      className={cn(
        "flex min-h-16 flex-col items-center justify-center rounded-md border-2 px-2 py-1.5 leading-[1.2]",
        ok ? "border-ok-ink bg-ok-bg text-ok-ink" : "border-bad-ink bg-bad-bg text-bad-ink",
      )}
    >
      <span className="font-display text-[1.3rem]">
        {ok ? "⭕" : "❌"} [{text}]
      </span>
      <span className="text-[0.72rem] font-extrabold">
        {ok ? "Right 🔊" : "A g crept in 🔊"}
      </span>
    </button>
  );
}

/* ---------- 퀴즈 ---------- */

type QuizMode = "seat" | "listen";

function QuizTab() {
  const [mode, setMode] = useState<QuizMode>("seat");
  return (
    <>
      <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-surface p-1" role="radiogroup" aria-label="Pick a quiz">
        {(
          [
            ["seat", "Silent or ng?"],
            ["listen", "Listening: ng or k?"],
          ] as const
        ).map(([k, en]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={mode === k}
            onClick={() => setMode(k)}
            className="group flex min-h-11 flex-col items-center justify-center rounded-full leading-[1.1] aria-checked:bg-primary aria-checked:text-primary-ink"
          >
            <span className="font-display text-[1rem]">{en}</span>
          </button>
        ))}
      </div>
      {mode === "seat" ? (
        <Quiz key="seat" make={makeSeatQuestion} listen={false} label={{ en: "Does this ㅇ make a sound?" }} />
      ) : canSpeak ? (
        <Quiz key="listen" make={makeListenQuestion} label={{ en: "Do you hear ㅇ (ng) or ㄱ (k) at the end?" }} />
      ) : (
        <Box>
          <Note tone="gray" className="mt-0" en="This browser can’t play speech, so the listening quiz is off." />
        </Box>
      )}
    </>
  );
}

const SILENT = "🤫 Silent";
const NG = "👃 ng";
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** 모든 단어의 ㅇ 하나하나 — 첫자리 · 받침으로 나눠 둔다 */
const SEAT_POOL = (() => {
  const all = [...SILENT_WORDS, ...NG_WORDS].flatMap((w) => ieungSeats(w.ko).map((s) => ({ word: w.ko, ...s })));
  return { cho: all.filter((x) => x.seat === "cho"), jong: all.filter((x) => x.seat === "jong") };
})();

function makeSeatQuestion(): Question {
  const t = pick(Math.random() < 0.5 ? SEAT_POOL.cho : SEAT_POOL.jong);
  const syl = [...t.word][t.i];
  const d = decompose(syl)!;
  const top = t.seat === "cho";
  // 문제에서는 색을 입히지 않는다 — 색이 답을 알려 주면 안 된다. 고른 ㅇ 에만 테
  const cell = (jamo: string, mine: boolean): Cell => ({ jamo, ring: mine, caption: mine ? "This one" : undefined });
  const why: Choice["why"] = top
    ? "At the top, ㅇ just holds the seat — only the vowel sounds."
    : "At the bottom, ㅇ is ng — hum it through your nose.";
  return {
    id: `${t.word}-${t.i}-${t.seat}`,
    prompt: (
      <div className="mt-2.5 mb-4">
        <p className="mb-3 text-center font-display text-[2.2rem] leading-none">
          {[...t.word].map((s, i) => (
            <span key={i} className={i === t.i ? "underline decoration-primary decoration-3 underline-offset-6" : "text-muted"}>
              {s}
            </span>
          ))}
        </p>
        <Block cho={cell(d.cho, top)} jung={{ jamo: d.jung }} jong={d.jong ? cell(d.jong, !top) : undefined} />
      </div>
    ),
    answer: top ? SILENT : NG,
    wrong: [{ text: top ? NG : SILENT, why }],
    review: `${t.word} · ${syl} ${top ? "⬆ top" : "⬇ bottom"}`,
    right: top ? "" : `[${t.word}]`,
  };
}

function makeListenQuestion(index: number): Question {
  const p = pick(PAIRS);
  const isNg = Math.random() < 0.5;
  const ans = isNg ? p.ng : p.g;
  const other = isNg ? p.g : p.ng;
  // 두 번째 문제부터는 「다음 문제」 탭 안에서 만들어진다 — 바로 들려준다 (첫 문제는 탭이 없어 버튼으로)
  if (index > 0) speak(ans.ko);
  return {
    id: `${p.ng.ko}-${isNg ? "ng" : "g"}`,
    prompt: (
      <div className="mt-1 mb-3">
        <Btn en="🔊 Play the sound" onClick={() => speak(ans.ko)} />
      </div>
    ),
    answer: ans.ko,
    wrong: [
      {
        text: other.ko,
        why: isNg
          ? "If the end keeps humming through your nose, it’s ㅇ (ng)."
          : "If it stops short, it’s ㄱ (k).",
      },
    ],
    review: `${p.ng.ko} / ${p.g.ko}`,
    right: `[${ans.rom}]`,
  };
}
