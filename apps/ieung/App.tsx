import { useId, useState, type ReactNode } from "react";
import { Box, Btn, cn, Ieung, ListenBtn, Note, Page, Quiz, Tabs, canSpeak, speak, useHashTab, type Choice, type Question, type TabDef } from "@yj/ui";
import { compose, decompose, shapeOf } from "@yj/korean/hangul";
import { ieungSeats, linked, MOVES, NG_WORDS, PAIRS, SILENT_WORDS, STAYS, SWITCH_VOWELS, type Seat } from "./data";
import "./ieung.css";

/* ============================================================
   한국어 이응 (#97) — 같은 ㅇ 이 블록 안 자리에 따라 다르게 소리 난다.
   첫자리 = 소리 없음 (gray) · 받침 = [ng] (mint) · 견주는 받침 ㄱ = 딱 끊김 (coral).
   색만으로 가르지 않는다 — 🤫 · 👃 · 🧱 아이콘과 글자를 늘 같이 둔다.
   ============================================================ */

const TABS: TabDef<"switch" | "ng" | "link" | "quiz">[] = [
  { key: "switch", ko: "스위치", en: "Switch" },
  { key: "ng", ko: "ng ≠ g", en: "Compare" },
  { key: "link", ko: "이어 읽기", en: "Linking" },
  { key: "quiz", ko: "퀴즈", en: "Quiz" },
];

const section = "flex flex-col gap-3.5";
const titleKo = "block font-display text-[1.3rem] leading-[1.3]";
const titleEn = "block text-[0.82rem] font-bold text-muted";

export function App() {
  const [tab, setTab] = useHashTab(TABS);
  return (
    <Page
      app="ieung"
      legal={
        <>
          소리는 기기의 브라우저 목소리예요. 기기마다 조금씩 다르게 들릴 수 있어요.
          <br />
          Audio uses your browser’s built-in voice, so it may sound a little different on each device.
        </>
      }
    >
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "switch" && <SwitchTab />}
      {tab === "ng" && <CompareTab />}
      {tab === "link" && <LinkTab />}
      {tab === "quiz" && <QuizTab />}
    </Page>
  );
}

/* ---------- 작은 부품 ---------- */

const Title = ({ ko, en }: { ko: ReactNode; en: ReactNode }) => (
  <h2 className="mb-3 text-center font-normal">
    <span className={titleKo}>{ko}</span>
    <span className={titleEn}>{en}</span>
  </h2>
);

/** 표시 알약 — 아이콘 + 한국어 + 영어. 색만으로 알리지 않는다 */
const Badge = ({ tone, icon, ko, en, className }: { tone: string; icon: string; ko: string; en: string; className?: string }) => (
  <span
    className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.85rem] font-extrabold leading-[1.2]", className)}
    style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-ink)` }}
  >
    <span aria-hidden="true">{icon}</span>
    <span className="font-display text-[1rem] font-normal">{ko}</span>
    <span>· {en}</span>
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

  // 자리를 옮기면 바로 들려준다 — 누른 핸들러 안에서 동기로 (iOS)
  const move = (s: Seat) => {
    setSeat(s);
    speak(compose("ㅇ", v, s === "cho" ? "" : "ㅇ")!);
  };

  return (
    <section className={section}>
      <Box>
        <Title ko="ㅇ을 위아래로 옮겨 보세요" en="Move ㅇ up and down — same letter, two jobs" />

        <div className="mb-3 grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="모음 / Vowel">
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

        <Block
          cho={{
            jamo: "ㅇ",
            tone: top ? "ie-silent" : undefined,
            ghost: !top,
            caption: top ? "🤫 silent" : "자리만 · seat",
            onClick: () => move("cho"),
            label: "ㅇ을 첫자리로 / Move ㅇ to the top",
          }}
          jung={{ jamo: v, tone: "ie-vowel", caption: rom }}
          jong={top ? undefined : { jamo: "ㅇ", tone: "ie-ng", caption: "👃 ng", hum: true, onClick: () => move("jong"), label: "받침 ㅇ / ㅇ at the bottom" }}
          emptyJong={{ jamo: "", caption: "받침 자리 · tap", onClick: () => move("jong"), label: "ㅇ을 받침으로 / Move ㅇ to the bottom" }}
        />

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-full border border-line bg-bg p-1" role="radiogroup" aria-label="ㅇ의 자리 / Where ㅇ sits">
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
              <span className="font-display text-[1rem]">{s === "cho" ? "⬆ 첫자리" : "⬇ 받침"}</span>
              <span className="text-[0.66rem] font-bold text-muted group-aria-checked:text-current">{s === "cho" ? "Top · first" : "Bottom · final"}</span>
            </button>
          ))}
        </div>
      </Box>

      <Box aria-live="polite" className="text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="w-16 shrink-0 [&_svg]:h-auto [&_svg]:w-full">
            <Ieung mood={top ? "sleepy" : "yay"} />
          </div>
          <div>
            <div className="font-display text-[3.2rem] leading-none">{syl}</div>
            <div className="mt-1 text-[1.1rem] font-extrabold text-muted">[{sound}]</div>
          </div>
        </div>
        <div className="mt-3">
          {top ? <Badge tone="ie-silent" icon="🤫" ko="빈 자리" en="silent" /> : <Badge tone="ie-ng" icon="👃" ko="코로 울려요" en="ng" />}
        </div>
        {!top && <Wave className="mx-auto mt-2 w-40" />}
        <p className="mt-3 leading-[1.4]">
          {top ? (
            <>
              <span className="block font-display text-[1.05rem]">첫자리 ㅇ은 소리가 없어요. 모음 소리만 나요.</span>
              <span className={titleEn}>At the top, ㅇ is silent — you only hear the vowel.</span>
            </>
          ) : (
            <>
              <span className="block font-display text-[1.05rem]">받침 ㅇ은 [ng] 소리예요. 끝까지 코로 울려요.</span>
              <span className={titleEn}>At the bottom, ㅇ is the ng in singer — keep humming through your nose.</span>
            </>
          )}
        </p>
        <ListenBtn text={syl} />
      </Box>

      <Box>
        <Title ko="단어로 들어 보세요" en="Hear it in words · tap to listen" />
        <WordList ko="🤫 첫자리 ㅇ" en="Silent ㅇ at the top" words={SILENT_WORDS} tone="ie-silent" />
        <WordList ko="👃 받침 ㅇ" en="ng at the bottom" words={NG_WORDS} tone="ie-ng" className="mt-4" />
      </Box>

      <Box>
        <div className="flex items-start gap-3">
          <div className="w-14 shrink-0 [&_svg]:h-auto [&_svg]:w-full">
            <Ieung mood="wink" />
          </div>
          <Title ko="ㅇ의 두 얼굴" en="Why does ㅇ sometimes make no sound?" />
        </div>
        <ul className="flex flex-col gap-2.5 leading-normal">
          <li>
            <span className="block font-display">한글 글자 한 칸은 늘 자음으로 시작해요. 모음 소리로 시작하는 글자는 소리 없는 ㅇ이 자리만 채워요.</span>
            <span className={titleEn}>Every Hangul block starts with a consonant. When a syllable starts with a vowel sound, a silent ㅇ just holds the seat.</span>
          </li>
          <li>
            <span className="block font-display">받침 자리의 ㅇ은 소리가 있어요. 영어 singer 의 ng 소리예요.</span>
            <span className={titleEn}>At the bottom, as a final consonant (batchim), ㅇ does have a sound: the ng in singer, not finger.</span>
          </li>
          <li>
            <span className="block font-display">그래서 ‘앙’에는 ㅇ이 두 개 있지만 소리는 하나예요.</span>
            <span className={titleEn}>So 앙 has two ㅇs, but only one of them makes a sound.</span>
          </li>
        </ul>
      </Box>
    </section>
  );
}

function WordList({ ko, en, words, tone, className }: { ko: string; en: string; words: { ko: string; en: string }[]; tone: string; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 leading-[1.2]">
        <span className="font-display">{ko}</span> <span className="text-[0.78rem] font-bold text-muted">{en}</span>
      </p>
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

function CompareTab() {
  return (
    <section className={section}>
      <Box>
        <Title ko="ㅇ 받침은 끝까지 코로 울려요. 혀 뒤로 막고 끊는 건 ㄱ이에요." en="ㅇ at the bottom is a hum through your nose, never a hard g. Stopping with a click is ㄱ." />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col items-center gap-1.5 rounded-lg bg-(--ie-ng-bg) p-3 text-center text-(--ie-ng-ink)">
            <span className="text-[0.75rem] font-extrabold">👃 받침 ㅇ · ng</span>
            <Wave className="w-full" />
            <span className="font-display text-[1rem]">길게 흘러요</span>
            <span className="text-[0.72rem] font-extrabold">keeps flowing</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-lg bg-(--ie-g-bg) p-3 text-center text-(--ie-g-ink)">
            <span className="text-[0.75rem] font-extrabold">🧱 받침 ㄱ · k</span>
            <Wall />
            <span className="font-display text-[1rem]">딱 끊겨요</span>
            <span className="text-[0.72rem] font-extrabold">stops short</span>
          </div>
        </div>
        <Note tone="ie-g" ko="영어 철자에 속지 마세요: singer 의 ng ⭕ / finger 의 ngg ❌" en="Say it like singer ⭕, not finger ❌ — no g at the end." />
      </Box>

      <Box>
        <Title ko="짝으로 번갈아 들어 보세요" en="Listen to the pairs back and forth" />
        <ul className="flex flex-col gap-2">
          {PAIRS.map((p) => (
            <li key={p.ng.ko} className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5">
              <PairSide w={p.ng} kind="ng" />
              <button
                type="button"
                className="grid min-w-11 place-items-center rounded-md border border-line bg-bg px-1 text-[1.1rem] font-extrabold"
                onClick={() => speak(`${p.ng.ko}. ${p.g.ko}. ${p.ng.ko}. ${p.g.ko}.`)}
                aria-label={`${p.ng.ko}, ${p.g.ko} 번갈아 듣기 / Listen to both`}
              >
                <span aria-hidden="true">⇄</span>
              </button>
              <PairSide w={p.g} kind="g" />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-center text-[0.75rem] font-bold text-muted">⇄ 를 누르면 둘을 번갈아 들려줘요 · Tap ⇄ to hear both, one after the other</p>
        <Note
          tone="gray"
          ko="브라우저 목소리로는 차이가 작게 들릴 수 있어요. 소리 끝이 코로 이어지는지, 딱 멈추는지 들어 보세요."
          en="Browser voices can make the difference sound small. Listen to the end: does it hum on, or stop dead?"
        />
      </Box>
    </section>
  );
}

function PairSide({ w, kind }: { w: { ko: string; en: string; rom: string }; kind: "ng" | "g" }) {
  const tone = kind === "ng" ? "ie-ng" : "ie-g";
  return (
    <button
      type="button"
      onClick={() => speak(w.ko)}
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
    <section className={section}>
      <Box>
        <Title ko="ㅇ 받침은 다음 글자로 안 넘어가요" en="ㅇ at the bottom stays put — it never slides into the next syllable" />
        <p className="mb-2 leading-[1.3]">
          <span className="block font-display">다른 받침은 뒤에 ㅇ이 오면 넘어가요.</span>
          <span className={titleEn}>Other final consonants slide over when the next syllable starts with ㅇ.</span>
        </p>
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
        <Note tone="ie-ng" ko="ㅇ 받침은 그대로 있어요. g 소리가 새로 생기지 않아요." en="ㅇ stays where it is. No g sound appears." />
      </Box>

      {STAYS.map((w) => (
        <Box key={w.ko}>
          <div className="mb-2.5 text-center leading-[1.2]">
            <span className="block font-display text-[2rem]">
              <Marked word={w.ko} tone="ie-ng" />
            </span>
            <span className="text-[0.8rem] font-bold text-muted">{w.en}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ReadBtn ok text={w.ko} />
            <ReadBtn ok={false} text={linked(w.ko, true)} />
          </div>
        </Box>
      ))}
    </section>
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
      <span className="text-[0.72rem] font-extrabold">{ok ? "맞는 소리 · right 🔊" : "g 가 생겼어요 · wrong 🔊"}</span>
    </button>
  );
}

/* ---------- 퀴즈 ---------- */

type QuizMode = "seat" | "listen";

function QuizTab() {
  const [mode, setMode] = useState<QuizMode>("seat");
  return (
    <section className={section}>
      <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-surface p-1" role="radiogroup" aria-label="퀴즈 고르기 / Pick a quiz">
        {(
          [
            ["seat", "소리가 날까?", "Silent or ng?"],
            ["listen", "듣기: ㅇ? ㄱ?", "Listening: ng or k?"],
          ] as const
        ).map(([k, ko, en]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={mode === k}
            onClick={() => setMode(k)}
            className="group flex min-h-11 flex-col items-center justify-center rounded-full leading-[1.1] aria-checked:bg-primary aria-checked:text-primary-ink"
          >
            <span className="font-display text-[1rem]">{ko}</span>
            <span className="text-[0.66rem] font-bold text-muted group-aria-checked:text-current">{en}</span>
          </button>
        ))}
      </div>
      {mode === "seat" ? (
        <Quiz key="seat" make={makeSeatQuestion} label={{ ko: "이 ㅇ은 소리가 날까?", en: "Does this ㅇ make a sound?" }} />
      ) : canSpeak ? (
        <Quiz key="listen" make={makeListenQuestion} label={{ ko: "들리는 건 ㅇ 받침? ㄱ 받침?", en: "Do you hear ㅇ (ng) or ㄱ (k) at the end?" }} />
      ) : (
        <Box>
          <Note tone="gray" className="mt-0" ko="이 브라우저는 소리를 낼 수 없어요." en="This browser can’t play speech, so the listening quiz is off." />
        </Box>
      )}
    </section>
  );
}

const SILENT = "🤫 소리 없음 · silent";
const NG = "👃 [ng] 소리 · ng";
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
  const cell = (jamo: string, mine: boolean): Cell => ({ jamo, ring: mine, caption: mine ? "이 ㅇ · this one" : undefined });
  const why: Choice["why"] = top
    ? { ko: "첫자리 ㅇ은 자리만 채워요. 모음 소리만 나요.", en: "At the top, ㅇ just holds the seat — only the vowel sounds." }
    : { ko: "받침 ㅇ은 [ng] 소리예요. 코로 울려요.", en: "At the bottom, ㅇ is ng — hum it through your nose." };
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
    review: `${t.word} · ${syl} ${top ? "⬆ 첫자리" : "⬇ 받침"}`,
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
        <Btn ko="🔊 들어 보기" en="Play the sound" onClick={() => speak(ans.ko)} />
      </div>
    ),
    answer: ans.ko,
    wrong: [
      {
        text: other.ko,
        why: isNg
          ? { ko: "끝까지 코로 울리면 ㅇ 받침이에요.", en: "If the end keeps humming through your nose, it’s ㅇ (ng)." }
          : { ko: "딱 끊기면 ㄱ 받침이에요.", en: "If it stops short, it’s ㄱ (k)." },
      },
    ],
    review: `${p.ng.ko} / ${p.g.ko}`,
    right: `[${ans.rom}]`,
  };
}
