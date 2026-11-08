import { useEffect, useState, type ReactNode } from "react";
import { Btn, ListenBtn, Note, Page, Tabs, canSpeak, hasKoreanVoice, onVoicesChanged, speak, useHashTab, type TabDef } from "@yj/ui";
import { MIXED_PARTS, canBeJong, compose, isCommon, soundOf } from "@yj/korean/hangul";
import { josa } from "@yj/korean/numbers";
import { AIR_PAIRS, CONSONANTS, MIXED, VOWELS, cellsOf } from "./glyphs";
import { blockType, layoutSyllable, type Role } from "./layout";
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
    <section className="hb">
      <div className="yj-box hb-stage">
        <BuildBlock parts={parts} ghost={ghost} />
        <div className="hb-glyph" aria-live="polite">
          {syl ? (
            <>
              <span className="hb-syl">{syl}</span>
              <ShapeLine jung={parts.jung!} jong={parts.jong} />
            </>
          ) : (
            <span className="hb-hint">
              <span className="ko">{cho ? "모음을 골라요" : "자음부터 골라요"}</span>
              <span className="en">{cho ? "Now pick a vowel" : "Start with a consonant"}</span>
            </span>
          )}
        </div>
      </div>

      <div className="hb-slots">
        {(["cho", "jung", "jong"] as Role[]).map((r) => {
          const ch = r === "cho" ? cho : parts[r];
          const isGhost = r === "cho" && ghost;
          return (
            <button
              key={r}
              type="button"
              className={`hb-slot tone-${TONE[r]}${ch ? "" : " is-empty"}${isGhost ? " is-ghost" : ""}`}
              disabled={!parts[r]}
              onClick={() => remove(r)}
              aria-label={parts[r] ? `${ROLE_NAME[r].ko} ${ch} 빼기 · remove` : ROLE_NAME[r].ko}
            >
              <small>{ROLE_NAME[r].ko}</small>
              <b>{ch ?? "—"}</b>
              <em>{isGhost ? "빈자리 · seat filler" : ROLE_NAME[r].en}</em>
            </button>
          );
        })}
      </div>
      <p className="hb-tip">
        <span className="ko">넣은 자모를 누르면 빠져요.</span>
        <span className="en">Tap a letter above to take it out.</span>
      </p>

      {msg && <Note tone="bad" ko={msg.ko} en={msg.en} />}
      <BuildNotes parts={parts} syl={syl} ghost={ghost} />

      <h2 className="hb-keys-title">
        <span className="ko">자음</span> <span className="en">Consonants</span>
      </h2>
      <p className="hb-tip">
        <span className="ko">모음 앞이면 첫 자음, 모음 뒤면 받침이 돼요.</span>
        <span className="en">Before the vowel: first consonant. After it: bottom letter.</span>
      </p>
      <div className="hb-keys">
        {Object.entries(CONSONANTS).map(([c, g]) => (
          <button
            key={c}
            type="button"
            className={`hb-key${jongTarget && !canBeJong(c) ? " is-off" : ""}`}
            aria-label={`${c} ${g.ko}`}
            onClick={() => tapConsonant(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <h2 className="hb-keys-title">
        <span className="ko">모음</span> <span className="en">Vowels</span>
      </h2>
      <div className="hb-keys">
        {[...Object.keys(VOWELS), ...Object.keys(MIXED)].map((v) => (
          <button key={v} type="button" className="hb-key is-vowel" aria-label={v} onClick={() => tapVowel(v)}>
            {v}
          </button>
        ))}
      </div>

      <div className="hb-actions">
        {syl && <ListenBtn text={syl} />}
        <Btn variant="ghost" ko="새 글자" en="New block" onClick={() => apply({ cho: null, jung: null, jong: null })} />
      </div>
    </section>
  );
}

function BuildBlock({ parts, ghost }: { parts: Parts; ghost: boolean }) {
  const cho = choOf(parts);
  if (!cho) return <div className="blk-empty" aria-hidden="true" />;
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
    <div className="hb-block">
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
    <span className="hb-shape">
      {t && <b>{t}번 모양 · Type {t}</b>}
      <span className="ko">
        {where.ko}
        {jong && ", 받침은 맨 아래"}
      </span>
      <span className="en">
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
   획 하나 더 — ㄱ→ㅋ · ㄷ→ㅌ · ㅂ→ㅍ · ㅈ→ㅊ (교재 CV02)
   ============================================================ */
/** 자음 하나를 5×5 에 아래 맞춤으로. key 는 자리라서 같은 자리 칸은 그대로 남는다 */
const bottomCells = (ch: string) => {
  const rows = CONSONANTS[ch].rows;
  const off = 5 - rows.length;
  return cellsOf(rows).map(([x, y]) => [x, y + off] as const);
};

function AirTab() {
  const [i, setI] = useState(0);
  const [on, setOn] = useState(false);
  const p = AIR_PAIRS[i];
  const ch = on ? p.air : p.plain;

  const base = new Set(bottomCells(p.plain).map(([x, y]) => `${x},${y}`));
  const cells: BlockCell[] = bottomCells(ch).map(([x, y]) => ({
    key: `${x},${y}`,
    x,
    y,
    tone: base.has(`${x},${y}`) ? "blk-cho" : "blk-add",
  }));

  const pick = (n: number) => {
    setI(n);
    setOn(false);
  };
  const toggle = () => {
    setOn(!on);
    speak(p.syl[on ? 0 : 1]);
  };

  return (
    <section className="hb">
      <div className="hb-pairs" role="radiogroup" aria-label="자음 고르기 · Pick a pair">
        {AIR_PAIRS.map((q, n) => (
          <button key={q.plain} type="button" role="radio" aria-checked={n === i} className="hb-pair" onClick={() => pick(n)}>
            {q.plain} → {q.air}
          </button>
        ))}
      </div>

      <div className="yj-box hb-stage">
        <div className="hb-block">
          <Blocks cells={cells} w={5} h={5} size={36} label={ch} />
        </div>
        <div className="hb-glyph">
          <span className="hb-syl">{ch}</span>
          <span className="hb-shape">
            <span className="ko">
              {CONSONANTS[ch].ko} · {CONSONANTS[ch].en}
            </span>
            <span className="en">{on ? "With a puff of air" : "No puff of air"}</span>
          </span>
        </div>
      </div>

      <div className="hb-legend">
        <span className="hb-chip tone-blk-cho">
          <span className="ko">원래 칸</span> <span className="en">Kept</span>
        </span>
        <span className="hb-chip tone-blk-add">
          <span className="ko">더한 칸</span> <span className="en">Added</span>
        </span>
      </div>

      <Btn ko={on ? `↩ ${p.plain}으로 돌아가기` : `➕ 획 하나 더 → ${p.air}`} en={on ? `Back to ${p.plain}` : `Add one stroke → ${p.air}`} onClick={toggle} />

      <Note
        ko="획 하나 더 = 바람 한 번. 입 모양은 그대로, 숨만 달라져요."
        en="One extra stroke = one puff of air. The mouth shape does not change. Only the breath changes."
      />

      <h2 className="hb-keys-title">
        <span className="ko">소리 비교</span> <span className="en">Say the difference</span>
      </h2>
      <div className="hb-say">
        {p.syl.map((s, n) => (
          <button key={s} type="button" className={`hb-say-btn tone-${n ? "blk-add" : "blk-cho"}`} onClick={() => speak(s)}>
            <b>{s}</b>
            <span className="ko">{n ? "바람 있음" : "바람 없음"}</span>
            <span className="en">{n ? "with air" : "no air"}</span>
          </button>
        ))}
      </div>
      {p.words && (
        <div className="hb-say">
          {p.words.map(([w, en], n) => (
            <button key={w} type="button" className={`hb-say-btn tone-${n ? "blk-add" : "blk-cho"}`} onClick={() => speak(w)}>
              <b>{w}</b>
              <span className="en">{en}</span>
            </button>
          ))}
        </div>
      )}
      <Note
        ko="손바닥을 입 앞에 대 보세요. ㅋ ㅌ ㅍ ㅊ은 바람이 느껴지고, ㄱ ㄷ ㅂ ㅈ은 안 느껴져요."
        en="Put your hand in front of your mouth. With ㅋ ㅌ ㅍ ㅊ you feel the air. With ㄱ ㄷ ㅂ ㅈ you do not."
      />
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
    <section className="hb">
      <p className="hb-tip">
        <span className="ko">누르면 이름을 읽어 줘요.</span>
        <span className="en">Tap a letter to hear its name.</span>
      </p>
      {GROUPS.map((g) => (
        <div key={g.en}>
          <h2 className="hb-keys-title">
            <span className="ko">{g.ko}</span> <span className="en">{g.en}</span>
          </h2>
          <div className="hb-chart">
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
    <button type="button" className="hb-tile" aria-label={`${ch} ${info.ko}`} onClick={() => speak(info.ko)}>
      <span className={`hb-tile-char tone-${tone}`}>{ch}</span>
      <span className="ko">{info.ko}</span>
      <span className="en">{parts ? `${parts[0]} + ${parts[1]} · ${info.en}` : info.en}</span>
    </button>
  );
}
