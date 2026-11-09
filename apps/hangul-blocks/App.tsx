import { useEffect, useState, type ReactNode } from "react";
import {
  Btn,
  ListenBtn,
  Note,
  Page,
  Tabs,
  boxClass,
  canSpeak,
  cn,
  hasKoreanVoice,
  onVoicesChanged,
  speak,
  useHashTab,
  type TabDef,
} from "@yj/ui";
import { MIXED_PARTS, canBeJong, compose, isCommon, soundOf } from "@yj/korean/hangul";
import { josa } from "@yj/korean/numbers";
import { AIR_PAIRS, CONSONANTS, MIXED, VOWELS, Y_PAIRS, cellsOf, type StrokePair } from "./glyphs";
import { blockType, layoutSyllable, strokeDiff, type Role } from "./layout";
import { Blocks, fitSize, type BlockCell } from "./Blocks";
import "./hangul-blocks.css";

type Tab = "build" | "air" | "chart";
const TABS: TabDef<Tab>[] = [
  { key: "build", ko: "만들기", en: "Build" },
  { key: "air", ko: "획 하나 더", en: "One more stroke" },
  { key: "chart", ko: "자모표", en: "All letters" },
];

export function App() {
  const [tab, setTab] = useHashTab(TABS);
  return (
    <Page
      app="hangul-blocks"
      legal={
        <>
          글자 블록은 5×5 칸 안에 직접 그렸어요. 소리는 기기의 목소리라서 기기마다 달라요.
          <br />
          The block letters are drawn by hand on a 5×5 grid. Sounds come from your device&apos;s voice, so they vary by device.
        </>
      }
    >
      <VoiceNote />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "build" && <BuildTab />}
      {tab === "air" && <AirTab />}
      {tab === "chart" && <ChartTab />}
    </Page>
  );
}

/** 한국어 목소리가 없는 기기라면 미리 알린다 */
function VoiceNote() {
  const [has, setHas] = useState(hasKoreanVoice);
  useEffect(() => onVoicesChanged(() => setHas(hasKoreanVoice())), []);
  if (canSpeak && has !== false) return null;
  return (
    <Note
      tone="gray"
      ko="이 기기에는 한국어 목소리가 없어요. 소리가 안 나거나 어색할 수 있어요."
      en="This device has no Korean voice, so sounds may be missing or odd."
    />
  );
}

const TONE: Record<Role, string> = { cho: "blk-cho", jung: "blk-jung", jong: "blk-jong" };
/** 별칭 쌍을 바탕·글자로. Tailwind 가 찾을 수 있게 이름을 통째로 적는다 */
const TONE_CLASS: Record<string, string> = {
  "blk-cho": "bg-(--blk-cho-bg) text-(--blk-cho-ink)",
  "blk-jung": "bg-(--blk-jung-bg) text-(--blk-jung-ink)",
  "blk-jong": "bg-(--blk-jong-bg) text-(--blk-jong-ink)",
  "blk-add": "bg-(--blk-add-bg) text-(--blk-add-ink)",
};

/* ---------- 이 앱의 모양 ---------- */
const section = "flex flex-col gap-3";
/** 한국어 줄 */
const ko = "font-display";
/** 영어 줄 */
const en = "text-[0.75rem] font-bold text-muted";
/** 파스텔 위의 영어 줄 — muted 를 쓰지 않는다, 대비가 모자란다 */
const enOnTone = "text-[0.75rem] font-bold opacity-85";
/** 무대 — 블록 + 보통 글꼴 글자. overflow-hidden: 떨어지는 칸이 상자 밖으로 보이지 않게 */
const stage = cn(boxClass, "grid min-h-[250px] grid-cols-2 items-center gap-3 overflow-hidden max-[420px]:grid-cols-1");
const blockWrap = "flex min-h-[230px] items-center justify-center";
const glyph = "flex flex-col items-center gap-2 text-center";
/** 블록 옆의 진짜 글자. 학생이 책·간판에서 보는 모양이라 Jua 대신 읽기 글꼴 */
const sylClass = "font-reading text-[5.5rem] leading-none text-ink max-[420px]:text-[4rem]";
const lines = "flex flex-col gap-0.5 leading-[1.3]";
const tip = "flex flex-col items-center text-center leading-[1.3]";
const title = "mt-2 flex items-baseline gap-2 text-[1.05rem] font-normal";
const press = "active:scale-[0.96]";
const keyClass = cn("min-h-13 rounded-sm border border-line px-1.5 py-px font-display text-[1.45rem]", press);
const sayBtn = cn("flex min-h-24 flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-px", press);
const sayRow = "grid grid-cols-2 gap-2";
const sayChar = "font-reading text-[2.2rem] leading-[1.1] font-medium";
const chip = "inline-flex items-baseline gap-1.5 rounded-full px-3 py-1";
const keys = "grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5";
const Title = ({ k, e }: { k: ReactNode; e: ReactNode }) => (
  <h2 className={title}>
    <span className={ko}>{k}</span> <span className={en}>{e}</span>
  </h2>
);

const ROLE_NAME: Record<Role, { ko: string; en: string }> = {
  cho: { ko: "첫 자음", en: "First consonant" },
  jung: { ko: "모음", en: "Vowel" },
  jong: { ko: "받침", en: "Bottom letter" },
};

/* ============================================================
   만들기
   ============================================================ */
type Parts = { cho: string | null; jung: string | null; jong: string | null };
type Msg = { ko: ReactNode; en: ReactNode };

/** 첫 자음이 비어 있으면 소리 없는 ㅇ 이 자리를 채운다 (교재: 모든 칸은 자음으로 시작) */
const choOf = (p: Parts) => p.cho ?? (p.jung ? "ㅇ" : null);
const syllableOf = (p: Parts) => {
  const c = choOf(p);
  return c && p.jung ? compose(c, p.jung, p.jong ?? "") : null;
};

function BuildTab() {
  const [parts, setParts] = useState<Parts>({ cho: "ㄱ", jung: "ㅏ", jong: null });
  const [msg, setMsg] = useState<Msg | null>(null);

  const apply = (next: Parts) => {
    setParts(next);
    setMsg(null);
    const s = syllableOf(next);
    if (s) speak(s);
    else if (next.cho) speak(CONSONANTS[next.cho].ko);
  };

  const tapConsonant = (c: string) => {
    // 모음 앞이면 첫 자음, 모음 뒤면 받침
    if (!parts.cho || !parts.jung) return apply({ ...parts, cho: c });
    if (!canBeJong(c))
      return setMsg({ ko: "ㄸ · ㅃ · ㅉ은 받침이 될 수 없어요.", en: "ㄸ, ㅃ and ㅉ never sit at the bottom." });
    apply({ ...parts, jong: c });
  };
  const tapVowel = (v: string) => apply({ ...parts, jung: v });
  const remove = (r: Role) => apply({ ...parts, [r]: null });

  const cho = choOf(parts);
  const ghost = !parts.cho && !!cho;
  const syl = syllableOf(parts);
  const jongTarget = !!(parts.cho && parts.jung);

  return (
    <section className={section}>
      <div className={stage}>
        <BuildBlock parts={parts} ghost={ghost} />
        <div className={glyph} aria-live="polite">
          {syl ? (
            <>
              <span className={sylClass}>{syl}</span>
              <ShapeLine jung={parts.jung!} jong={parts.jong} />
            </>
          ) : (
            <span className={lines}>
              <span className={cn(ko, "text-[1.1rem]")}>{cho ? "모음을 골라요" : "자음부터 골라요"}</span>
              <span className={en}>{cho ? "Now pick a vowel" : "Start with a consonant"}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["cho", "jung", "jong"] as Role[]).map((r) => {
          const ch = r === "cho" ? cho : parts[r];
          const isGhost = r === "cho" && ghost;
          return (
            <button
              key={r}
              type="button"
              className={cn(
                "flex min-h-19 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 leading-[1.15]",
                ch ? TONE_CLASS[TONE[r]] : "border-2 border-dashed border-line bg-surface text-muted",
              )}
              disabled={!parts[r]}
              onClick={() => remove(r)}
              aria-label={parts[r] ? `${ROLE_NAME[r].ko} ${ch} 빼기 · remove` : ROLE_NAME[r].ko}
            >
              <small className="font-display text-[0.8rem]">{ROLE_NAME[r].ko}</small>
              <b className={cn("font-display text-[1.6rem] font-normal", isGhost && "opacity-55")}>{ch ?? "—"}</b>
              <em className="text-[0.68rem] font-bold not-italic">{isGhost ? "빈자리 · seat filler" : ROLE_NAME[r].en}</em>
            </button>
          );
        })}
      </div>
      <p className={tip}>
        <span className={ko}>넣은 자모를 누르면 빠져요.</span>
        <span className={en}>Tap a letter above to take it out.</span>
      </p>

      {msg && <Note tone="bad" ko={msg.ko} en={msg.en} />}
      <BuildNotes parts={parts} syl={syl} ghost={ghost} />

      <Title k="자음" e="Consonants" />
      <p className={tip}>
        <span className={ko}>모음 앞이면 첫 자음, 모음 뒤면 받침이 돼요.</span>
        <span className={en}>Before the vowel: first consonant. After it: bottom letter.</span>
      </p>
      <div className={keys}>
        {Object.entries(CONSONANTS).map(([c, g]) => (
          <button
            key={c}
            type="button"
            className={cn(
              keyClass,
              // 받침 자리인데 받침이 될 수 없는 자음. 눌러도 이유를 알려 준다
              jongTarget && !canBeJong(c) ? "border-dashed bg-surface text-muted" : TONE_CLASS["blk-cho"],
            )}
            aria-label={`${c} ${g.ko}`}
            onClick={() => tapConsonant(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <Title k="모음" e="Vowels" />
      <div className={keys}>
        {[...Object.keys(VOWELS), ...Object.keys(MIXED)].map((v) => (
          <button key={v} type="button" className={cn(keyClass, TONE_CLASS["blk-jung"])} aria-label={v} onClick={() => tapVowel(v)}>
            {v}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2">
        {syl && <ListenBtn text={syl} className="mt-0" />}
        <Btn variant="ghost" className="mt-0" ko="새 글자" en="New block" onClick={() => apply({ cho: null, jung: null, jong: null })} />
      </div>
    </section>
  );
}

function BuildBlock({ parts, ghost }: { parts: Parts; ghost: boolean }) {
  const cho = choOf(parts);
  if (!cho) return <div className="size-[150px] rounded-md border-2 border-dashed border-line" aria-hidden="true" />;
  const l = layoutSyllable(cho, parts.jung, parts.jong);
  // key 에 자모를 넣는다 — 모음만 바뀌면 첫 자음 칸은 key 가 그대로라서 미끄러져 간다
  const cells: BlockCell[] = l.pieces.flatMap((p) =>
    p.cells.map(([x, y], i) => ({
      key: `${p.role}-${p.ch}-${i}`,
      x,
      y,
      tone: TONE[p.role],
      ghost: p.role === "cho" && ghost,
    })),
  );
  const syl = syllableOf(parts);
  return (
    <div className={blockWrap}>
      <Blocks cells={cells} w={l.w} h={l.h} size={fitSize(l.w, l.h, 220, 30)} label={syl ?? cho} />
    </div>
  );
}

/** 교재의 말: 세우면 오른쪽, 눕히면 아래 */
function ShapeLine({ jung, jong }: { jung: string; jong: string | null }) {
  const t = blockType(jung, jong);
  const where =
    t === null
      ? { ko: "두 모음: 하나는 아래, 하나는 오른쪽", en: "Two vowels: one below, one on the right" }
      : t % 2 === 1
        ? { ko: "세로 모음 → 오른쪽", en: "Long line standing up → goes RIGHT" }
        : { ko: "가로 모음 → 아래", en: "Long line lying down → goes BELOW" };
  return (
    <span className={lines}>
      {t && (
        <b className="text-[0.75rem] font-extrabold text-muted">
          {t}번 모양 · Type {t}
        </b>
      )}
      <span className={ko}>
        {where.ko}
        {jong && ", 받침은 맨 아래"}
      </span>
      <span className={en}>
        {where.en}
        {jong && "; the bottom letter goes at the bottom"}
      </span>
    </span>
  );
}

/** 교재에서 짚어 주는 것들 — 지금 만든 글자에 해당하는 것만 */
function BuildNotes({ parts, syl, ghost }: { parts: Parts; syl: string | null; ghost: boolean }) {
  const notes: ReactNode[] = [];
  const { jung, jong } = parts;

  if (ghost)
    notes.push(
      <Note
        key="ghost"
        ko="모든 칸은 자음으로 시작해요. 소리가 없을 때는 ㅇ이 자리만 채워요."
        en="Every block starts with a consonant. With no sound, a silent ㅇ just fills the seat."
      />,
    );
  else if (parts.cho === "ㅇ" && jung)
    notes.push(<Note key="o-top" ko="맨 위의 ㅇ은 소리가 없어요." en="ㅇ at the start has no sound." />);
  if (jong === "ㅇ")
    notes.push(<Note key="o-bottom" ko="받침 ㅇ은 ng 소리예요." en="At the bottom, ㅇ sounds like ng — as in singer, not finger." />);

  if (syl && jong) {
    const said = soundOf(syl);
    if (said !== syl)
      notes.push(
        <Note
          key="sound"
          tone="blk-jong"
          ko={`받침 소리는 일곱 개뿐이에요. ${josa(syl, "은", "는")} [${said}]${josa(said, "으로", "로").slice(said.length)} 읽어요.`}
          en={`Only 7 sounds at the bottom: ${syl} sounds like [${said}].`}
        />,
      );
  }

  if (jung === "ㅐ" || jung === "ㅔ") notes.push(<Note key="ae" ko="ㅐ와 ㅔ는 소리가 같아요." en="ㅐ and ㅔ sound the same." />);
  if (jung === "ㅒ" || jung === "ㅖ") notes.push(<Note key="yae" ko="ㅒ와 ㅖ는 소리가 같아요." en="ㅒ and ㅖ sound the same." />);
  if (jung === "ㅚ" || jung === "ㅙ" || jung === "ㅞ")
    notes.push(<Note key="oe" ko="ㅚ · ㅙ · ㅞ는 소리가 거의 같아요." en="ㅚ, ㅙ and ㅞ sound almost the same." />);
  if (jung && jung in MIXED_PARTS) {
    const [a, b] = MIXED_PARTS[jung];
    notes.push(
      <Note key="mixed" ko={`${a} + ${b} = ${jung}. 두 모음이지만 한 박자예요.`} en={`${a} + ${b} = ${jung}. Two vowels, but one beat.`} />,
    );
  }

  if (syl && !isCommon(syl))
    notes.push(
      <Note
        key="rare"
        tone="gray"
        ko="잘 안 쓰는 글자예요. 목소리가 어색하게 읽을 수도 있어요."
        en="This block is rarely used, so the voice may read it oddly."
      />,
    );
  return <>{notes}</>;
}

/* ============================================================
   획 하나 더 (교재 CV01 · CV02)
     자음: ㄱ→ㅋ · ㄷ→ㅌ · ㅂ→ㅍ · ㅈ→ㅊ   획 하나 더 = 바람 한 번
     모음: ㅏ→ㅑ · ㅓ→ㅕ · ㅗ→ㅛ · ㅜ→ㅠ · ㅐ→ㅒ · ㅔ→ㅖ   획 하나 더 = 앞에 y 소리
   ============================================================ */
const PAIRS = [...AIR_PAIRS, ...Y_PAIRS];

/**
 * 자모 하나를 5×5 에. 자음은 아래 맞춤(ㅈ→ㅊ 처럼 윗줄에 칸이 얹히게),
 * 모음은 가운데. key 는 자리라서 같은 자리 칸은 그대로 남고 새 칸만 떨어진다.
 */
const stageCells = (ch: string) => {
  const isCons = ch in CONSONANTS;
  const rows = (isCons ? CONSONANTS : VOWELS)[ch].rows;
  const ox = (5 - rows[0].length) >> 1;
  const oy = isCons ? 5 - rows.length : (5 - rows.length) >> 1;
  return cellsOf(rows).map(([x, y]) => [x + ox, y + oy] as const);
};

const SAY: Record<StrokePair["kind"], { off: [string, string]; on: [string, string] }> = {
  air: { off: ["바람 없음", "no air"], on: ["바람 있음", "with air"] },
  y: { off: ["그냥 소리", "plain"], on: ["앞에 y", "y in front"] },
};

function AirTab() {
  const [i, setI] = useState(0);
  const [on, setOn] = useState(false);
  const p = PAIRS[i];
  const ch = on ? p.more : p.plain;
  const info = CONSONANTS[ch] ?? VOWELS[ch];
  const plainName = (CONSONANTS[p.plain] ?? VOWELS[p.plain]).ko;
  const baseTone = p.kind === "air" ? "blk-cho" : "blk-jung";

  // 옮긴 칸은 원래 자리 key 를 그대로 써서 미끄러지고, 더한 칸만 노랗게 떨어진다
  const cells: BlockCell[] = on
    ? strokeDiff(stageCells(p.plain), stageCells(p.more)).map((c) => ({
        key: `${c.from[0]},${c.from[1]}`,
        x: c.x,
        y: c.y,
        tone: c.added ? "blk-add" : baseTone,
      }))
    : stageCells(p.plain).map(([x, y]) => ({ key: `${x},${y}`, x, y, tone: baseTone }));

  const pick = (n: number) => {
    setI(n);
    setOn(false);
  };
  const toggle = () => {
    setOn(!on);
    speak(p.syl[on ? 0 : 1]);
  };

  const group = (k: string, e: string, list: StrokePair[], offset: number) => (
    <div>
      <Title k={k} e={e} />
      <div className="mt-1.5 grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-1.5" role="radiogroup" aria-label={`${k} · ${e}`}>
        {list.map((q, n) => (
          <button
            key={q.plain}
            type="button"
            role="radio"
            aria-checked={n + offset === i}
            className="min-h-12 rounded-full border border-line bg-surface px-1.5 py-px font-display text-[1.15rem] text-ink aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-ink"
            onClick={() => pick(n + offset)}
          >
            {q.plain} → {q.more}
          </button>
        ))}
      </div>
    </div>
  );

  const say = SAY[p.kind];

  return (
    <section className={section}>
      {group("자음", "Consonants: one puff of air", AIR_PAIRS, 0)}
      {group("모음", "Vowels: a y sound in front", Y_PAIRS, AIR_PAIRS.length)}

      <div className={stage}>
        <div className={blockWrap}>
          <Blocks cells={cells} w={5} h={5} size={36} label={ch} />
        </div>
        <div className={glyph}>
          <span className={sylClass}>{ch}</span>
          <span className={lines}>
            <span className={ko}>
              {info.ko} · {info.en}
            </span>
            <span className={en}>
              {p.kind === "air" ? (on ? "With a puff of air" : "No puff of air") : on ? "A y sound in front" : "No y sound"}
            </span>
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <span className={cn(chip, TONE_CLASS[baseTone])}>
          <span className={ko}>원래 칸</span> <span className={enOnTone}>Kept</span>
        </span>
        <span className={cn(chip, TONE_CLASS["blk-add"])}>
          <span className={ko}>더한 칸</span> <span className={enOnTone}>Added</span>
        </span>
      </div>

      <Btn
        ko={on ? `↩ ${p.plain}${josa(plainName, "으로", "로").slice(plainName.length)} 돌아가기` : `➕ 획 하나 더 → ${p.more}`}
        en={on ? `Back to ${p.plain}` : `Add one stroke → ${p.more}`}
        onClick={toggle}
      />

      {p.kind === "air" ? (
        <Note
          ko="획 하나 더 = 바람 한 번. 입 모양은 그대로, 숨만 달라져요."
          en="One extra stroke = one puff of air. The mouth shape does not change. Only the breath changes."
        />
      ) : (
        <Note
          ko={`획 하나 더 = 소리 앞에 y가 붙어요. ${p.syl[0]} → ${p.syl[1]}`}
          en={`Add ONE more line → the sound gets a Y in front. ${p.syl[0]} → ${p.syl[1]}`}
        />
      )}

      <Title k="소리 비교" e="Say the difference" />
      <div className={sayRow}>
        {p.syl.map((s, n) => (
          <button key={s} type="button" className={cn(sayBtn, TONE_CLASS[n ? "blk-add" : baseTone])} onClick={() => speak(s)}>
            <b className={sayChar}>{s}</b>
            <span className={ko}>{(n ? say.on : say.off)[0]}</span>
            <span className={enOnTone}>{(n ? say.on : say.off)[1]}</span>
          </button>
        ))}
      </div>
      {p.words && (
        <div className={sayRow}>
          {p.words.map(([w, en], n) => (
            <button key={w} type="button" className={cn(sayBtn, TONE_CLASS[n ? "blk-add" : baseTone])} onClick={() => speak(w)}>
              <b className={sayChar}>{w}</b>
              <span className={enOnTone}>{en}</span>
            </button>
          ))}
        </div>
      )}

      {p.kind === "air" && (
        <Note
          ko="손바닥을 입 앞에 대 보세요. ㅋ ㅌ ㅍ ㅊ은 바람이 느껴지고, ㄱ ㄷ ㅂ ㅈ은 안 느껴져요."
          en="Put your hand in front of your mouth. With ㅋ ㅌ ㅍ ㅊ you feel the air. With ㄱ ㄷ ㅂ ㅈ you do not."
        />
      )}
      {(p.plain === "ㅐ" || p.plain === "ㅔ") && (
        <Note
          ko="ㅐ와 ㅔ가 소리가 같듯이, ㅒ와 ㅖ도 소리가 같아요."
          en="Just like ㅐ and ㅔ, ㅒ and ㅖ sound exactly the same."
        />
      )}
    </section>
  );
}

/* ============================================================
   자모표 — 교재 순서
   ============================================================ */
const GROUPS: { ko: string; en: string; items: string[] }[] = [
  { ko: "자음 · 처음 10개", en: "Basic consonants", items: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅎ"] },
  { ko: "자음 · 바람 소리 4개", en: "Strong air", items: ["ㅋ", "ㅌ", "ㅍ", "ㅊ"] },
  { ko: "자음 · 두 번 쓰기 5개", en: "Same letter twice", items: ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"] },
  { ko: "모음 · 기본 10개", en: "Basic vowels", items: ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"] },
  { ko: "모음 · ㅣ를 더한 4개", en: "ㅣ added", items: ["ㅐ", "ㅔ", "ㅒ", "ㅖ"] },
  { ko: "모음 · 두 모음을 한 박자로 7개", en: "Two in one beat", items: ["ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"] },
];

function ChartTab() {
  return (
    <section className={section}>
      <p className={tip}>
        <span className={ko}>누르면 이름을 읽어 줘요.</span>
        <span className={en}>Tap a letter to hear its name.</span>
      </p>
      {GROUPS.map((g) => (
        <div key={g.en}>
          <Title k={g.ko} e={g.en} />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2">
            {g.items.map((ch) => (
              <ChartTile key={ch} ch={ch} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function ChartTile({ ch }: { ch: string }) {
  const info: { ko: string; en: string } = CONSONANTS[ch] ?? VOWELS[ch] ?? MIXED[ch];
  // 자모표는 블록 대신 보통 글꼴(Pretendard)로 크게 — 잘 보이는 게 먼저다
  const tone = ch in CONSONANTS ? "blk-cho" : "blk-jung";
  const parts = MIXED_PARTS[ch];
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg border border-line bg-surface px-1.5 pt-3 pb-2.5 leading-[1.2] text-ink",
        press,
      )}
      aria-label={`${ch} ${info.ko}`}
      onClick={() => speak(info.ko)}
    >
      {/* 자모표는 블록 대신 읽기 글꼴로 크게. 책에서 보는 모양 그대로 */}
      <span className={cn("mb-1.5 w-full rounded-md pt-3 pb-3.5 font-reading text-[3rem] leading-none font-medium", TONE_CLASS[tone])}>
        {ch}
      </span>
      <span className={cn(ko, "text-[1rem]")}>{info.ko}</span>
      <span className={en}>{parts ? `${parts[0]} + ${parts[1]} · ${info.en}` : info.en}</span>
    </button>
  );
}
