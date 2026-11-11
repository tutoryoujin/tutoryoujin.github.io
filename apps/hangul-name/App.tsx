import { useEffect, useRef, useState, type FormEvent } from "react";
import { Box, Btn, canSpeak, hasKoreanVoice, Ieung, Note, onVoicesChanged, Page, speak, type Mood } from "@yj/ui";
import { clean, convert, loadNames, MAX_LENGTH, type Names, type Option } from "./convert";
import { introduce, STAMP } from "./model";
import { Receipt, stepPlan, type Issued } from "./Receipt";
import { cleanHangul, FIX_MAX, fixKey, fixLink, readLink, withFix } from "./fixes";
import { renderPng, saveReceipt } from "./save";
import "./hangul-name.css";

/* 기기에만 남긴다. kcards:* · yj:* 와 섞이지 않게 hn: 아래 */
const LAST_KEY = "hn:last";
const SERIAL_KEY = "hn:serial";
/** 고친 표기 — { "anne": "안" } */
const FIX_KEY = "hn:fixes";
const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null; // 사생활 보호 모드 — 조용히 넘긴다
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* 저장 못 해도 화면은 그대로 */
  }
};

const readFixes = (): Record<string, string> => {
  try {
    return JSON.parse(read(FIX_KEY) ?? "{}") ?? {};
  } catch {
    return {};
  }
};
const saveFix = (display: string, text: string) => write(FIX_KEY, JSON.stringify({ ...readFixes(), [fixKey(display)]: text }));

const TRY = ["Sophie", "Michael", "Jasmine", "Sara", "Emma"];
const PRINT_MS = 1550; // 영수증이 다 나오는 데 걸리는 시간 (hn-print 1.5s)
const STEP_MS = 380; // 자모 하나 붙는 간격
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

type Msg = { en: string; ko: string };
const MSG = {
  empty: { en: "Type your name first.", ko: "이름을 먼저 넣어 주세요." },
  letters: { en: "Use English letters (A to Z) so we can sound it out.", ko: "영어 알파벳(A–Z)으로 넣어 주세요." },
  long: { en: `Keep it under ${MAX_LENGTH} letters.`, ko: `${MAX_LENGTH}자까지 넣을 수 있어요.` },
  loadFail: { en: "Couldn’t load the name list. Check your connection and try again.", ko: "이름 목록을 못 받았어요. 연결을 확인하고 다시 눌러 주세요." },
  warming: { en: "Warming up…", ko: "준비하고 있어요…" },
} satisfies Record<string, Msg>;

export function App() {
  const [input, setInput] = useState(() => read(LAST_KEY) ?? "");
  const [data, setData] = useState<Names | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);

  const [issued, setIssued] = useState<Issued | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [printKey, setPrintKey] = useState(0);
  const [printing, setPrinting] = useState(false);
  const [revealed, setRevealed] = useState(Infinity);

  /* ---------- 이름 데이터 — 처음 쓸 때 받는다 ---------- */
  const ensure = async (): Promise<Names | null> => {
    if (data) return data;
    setLoading(true);
    try {
      const d = await loadNames();
      setData(d);
      return d;
    } catch {
      setMsg(MSG.loadFail);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 고친 영수증 링크(?name=Anne&ko=안)로 왔으면 그 영수증을, 아니면 지난번 영수증을 (움직임 없이) 보여 준다
  useEffect(() => {
    const link = readLink(location.search);
    if (link) {
      saveFix(link.input, link.text);
      write(LAST_KEY, link.input);
      setInput(link.input);
      history.replaceState(null, "", location.pathname + location.hash); // 다시 열면 기기에 남은 것으로
    }
    const last = link?.input ?? read(LAST_KEY);
    const c = last ? clean(last) : null;
    if (!c?.ok) return;
    void ensure().then((d) => {
      const opts = d && withFix(convert(c.words, d), readFixes()[fixKey(c.display)]);
      if (!opts?.length) return;
      setOptions(opts);
      setIssued({ input: c.display, option: opts[0], serial: Number(read(SERIAL_KEY)) || 1, at: new Date() });
    });
  }, []);

  /* ---------- 뽑기 ---------- */
  const print = async (name = input) => {
    const c = clean(name);
    if (!c.ok) return setMsg(MSG[c.reason]); // 영수증은 그대로 둔다
    setMsg(null);
    const d = await ensure();
    if (!d) return;
    const opts = withFix(convert(c.words, d), readFixes()[fixKey(c.display)]);
    if (!opts.length) return setMsg(MSG.letters);
    const serial = (Number(read(SERIAL_KEY)) || 0) + 1;
    write(SERIAL_KEY, String(serial));
    write(LAST_KEY, c.display);
    setOptions(opts);
    setIssued({ input: c.display, option: opts[0], serial, at: new Date() });
    setPrintKey((k) => k + 1);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void print();
  };

  /* ---------- 출력 → 자모 조립 (ㅅ → 소 → 손) ---------- */
  useEffect(() => {
    if (!printKey || !issued) return;
    setPrinting(true);
    if (reducedMotion()) {
      setRevealed(Infinity); // 움직임 없이 완성된 상태만
      return;
    }
    const total = stepPlan(issued.option.text).total;
    setRevealed(0);
    let n = 0;
    let t = setTimeout(function tick() {
      n++;
      setRevealed(n >= total ? Infinity : n);
      if (n < total) t = setTimeout(tick, STEP_MS);
    }, PRINT_MS);
    return () => clearTimeout(t);
  }, [printKey]); // 새로 뽑을 때만

  const pick = (o: Option) => {
    if (!issued) return;
    setIssued({ ...issued, option: o });
    setPrinting(false);
    setRevealed(Infinity);
    speak(o.text);
  };

  /** 영수증 고치기 — 고친 표기를 기기에 남기고 후보 맨 앞에 */
  const edit = (text: string) => {
    if (!issued) return;
    saveFix(issued.input, text);
    const opts = withFix(options.filter((o) => o.status !== "edited"), text);
    setOptions(opts);
    setIssued({ ...issued, option: opts[0] });
    setPrinting(false);
    setRevealed(Infinity);
  };

  const done = !!issued && revealed === Infinity;
  const mood: Mood = msg ? "huh" : loading ? "sleepy" : issued && !done ? "focus" : done ? (issued.option.status === "guessed" ? "huh" : "yay") : "basic";
  const status = loading ? MSG.warming : msg;

  return (
    <Page
      app="hangul-name"
      legal={
        <>
          이름 발음은 CMU 발음 사전에서, 이름 목록은 미국 사회보장국 출생 이름 통계에서 왔어요.
          <br />
          Pronunciations from the{" "}
          <a className="underline" href="https://github.com/cmusphinx/cmudict">
            CMU Pronouncing Dictionary
          </a>{" "}
          (
          <a className="underline" href="https://github.com/tutoryoujin/tutoryoujin.github.io/blob/main/apps/hangul-name/LICENSE-cmudict.txt">
            BSD 2-Clause, © Carnegie Mellon University
          </a>
          ). Names from US Social Security baby-name data.
        </>
      }
    >
      {/* 이름 기계 */}
      <section className="relative z-[2] rounded-t-[24px] rounded-b-[12px] bg-(--hn-machine-bg) px-4 pt-4 text-(--hn-machine-ink)" aria-label="한글 이름 기계 / Hangul Name Machine">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 leading-[1.15]">
            <h2 className="font-display text-[1.6rem] font-normal">한글 이름 기계</h2>
            <p className="text-[0.72rem] font-bold tracking-[0.12em] opacity-80">HANGUL NAME MACHINE</p>
          </div>
          <span className="block size-16 shrink-0 [&_svg]:size-full">
            <Ieung mood={mood} />
          </span>
        </div>

        <form className="mt-3" onSubmit={onSubmit} autoComplete="off">
          <label htmlFor="hn-name" className="block leading-[1.25]">
            <span className="block font-bold">Type your name in English letters.</span>
            <span className="text-[0.75rem] font-bold opacity-80">영어 알파벳으로 이름을 넣어 주세요.</span>
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="hn-name"
              className="min-h-14 min-w-0 flex-1 rounded-md bg-surface px-3 text-[1.2rem] font-extrabold tracking-[0.04em] text-ink uppercase placeholder:font-normal placeholder:text-muted placeholder:normal-case"
              value={input}
              maxLength={MAX_LENGTH + 10}
              placeholder="e.g. Sophie"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              onFocus={() => void ensure()}
              onChange={(e) => setInput(e.target.value)}
            />
            <Btn tone="hn-print" ko="뽑기" en="PRINT" className="mt-0 w-24 shrink-0" onClick={() => void print()} disabled={loading} aria-busy={loading} />
          </div>
        </form>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[0.8rem] font-bold">
          <span className="opacity-80">Try · 예시</span>
          {TRY.map((n) => (
            <button
              key={n}
              type="button"
              className="min-h-11 rounded-sm border border-current/40 px-3"
              onClick={() => {
                setInput(n);
                void print(n);
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="mt-2 min-h-10 leading-[1.25]" role="status" aria-live="polite">
          {status && (
            <>
              <span className="block font-bold">{status.en}</span>
              <span className="text-[0.75rem] font-bold opacity-80">{status.ko}</span>
            </>
          )}
        </p>
        {/* 투입구 */}
        <div className="mx-1.5 mt-1 h-3 rounded-t-md" style={{ background: "rgb(0 0 0 / var(--hn-slot-shade))" }} aria-hidden="true" />
      </section>

      {/* 영수증 — 투입구 아래로 나온다 */}
      <div className="relative z-[1] -mt-3.5 overflow-hidden px-4 pb-4 min-[400px]:px-5" aria-live="polite">
        {issued ? (
          <Receipt key={printKey} issued={issued} revealed={revealed} printing={printing} />
        ) : (
          <p className="rounded-b-md border-2 border-t-0 border-dashed border-line px-4 py-6 text-center leading-[1.3]">
            <span className="block font-bold">Your receipt prints here.</span>
            <span className="text-[0.78rem] font-bold text-muted">영수증이 여기로 나와요.</span>
          </p>
        )}
      </div>

      {issued && done && <After issued={issued} options={options} onPick={pick} onEdit={edit} />}
    </Page>
  );
}

/* ---------- 영수증 아래 — 후보 · 듣기 · 복사 · 저장 · 예요/이에요 ---------- */
function After({ issued, options, onPick, onEdit }: { issued: Issued; options: Option[]; onPick: (o: Option) => void; onEdit: (text: string) => void }) {
  const text = issued.option.text;
  const intro = introduce(text);
  const voice = useKoreanVoice();
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<Msg | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftBad, setDraftBad] = useState(false);

  // 공유 시트는 누른 직후에만 열려서, 그림을 미리 만들어 둔다
  const png = useRef<{ key: Issued; blob: Blob } | null>(null);
  useEffect(() => {
    let live = true;
    setPreview(null);
    setNote(null);
    renderPng(issued)
      .then((blob) => {
        if (live) png.current = { key: issued, blob };
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [issued]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setNote({ en: `Copy this: ${text}`, ko: "길게 눌러 복사해 주세요." });
    }
  };

  const openEdit = () => {
    setDraft(text);
    setDraftBad(false);
    setEditing(true);
  };
  const applyEdit = (e: FormEvent) => {
    e.preventDefault();
    const c = cleanHangul(draft);
    if (!c.ok) return setDraftBad(true);
    setEditing(false);
    onEdit(c.text);
  };

  const copyLink = async () => {
    const url = fixLink(location.origin + location.pathname, issued.input, text);
    try {
      await navigator.clipboard.writeText(url);
      setNote({ en: "Link copied. Whoever opens it gets this receipt.", ko: "링크를 복사했어요. 열면 이 영수증이 나와요." });
    } catch {
      setNote({ en: `Copy this link: ${url}`, ko: "링크를 길게 눌러 복사해 주세요." });
    }
  };

  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      const ready = png.current?.key === issued ? png.current!.blob : undefined;
      const r = await saveReceipt(issued, ready);
      if (r.how === "preview") setPreview(r.url);
      else if (r.how === "downloaded") setNote({ en: "Saved! Check your downloads.", ko: "저장했어요. 내려받은 파일을 확인해 보세요." });
    } catch {
      setNote({ en: "Couldn’t make the image. Try again.", ko: "그림을 못 만들었어요. 다시 눌러 주세요." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {options.length > 1 && (
        <Box>
          <p className="text-center leading-[1.3]">
            <span className="block font-bold">This name is written more than one way. Listen, then pick the one closest to how you say it.</span>
            <span className="text-[0.78rem] font-bold text-muted">쓰는 법이 여러 가지예요. 듣고 골라 보세요.</span>
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="표기 고르기 / Pick a spelling">
            {options.map((o) => (
              <button
                key={o.text}
                type="button"
                role="radio"
                aria-checked={o.text === text}
                className="flex min-h-14 min-w-28 flex-col items-center justify-center rounded-md border-2 border-dashed border-line px-4 py-1.5 leading-[1.2] aria-checked:border-solid aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-ink"
                onClick={() => onPick(o)}
              >
                <span className="font-display text-[1.6rem]">
                  {canSpeak && <span aria-hidden="true">🔊 </span>}
                  {o.text}
                </span>
                <span className="text-[0.7rem] font-bold">
                  {STAMP[o.status].ko} · {STAMP[o.status].en}
                </span>
              </button>
            ))}
          </div>
        </Box>
      )}

      <Box>
        <div className="grid grid-cols-2 gap-2">
          {canSpeak && (
            <>
              <Btn className="mt-0" ko="🔊 이름 듣기" en="Hear your name" onClick={() => speak(text)} />
              <Btn className="mt-0" variant="ghost" ko="🔊 문장 듣기" en="Hear the sentence" onClick={() => speak(intro.sentence)} />
            </>
          )}
          <Btn className="mt-0" variant="ghost" ko={copied ? "복사했어요" : "📋 복사"} en={copied ? "Copied!" : "Copy name"} onClick={() => void copy()} />
          <Btn className="mt-0" variant="ghost" ko="💾 저장" en={saving ? "Making the image…" : "Save image"} onClick={() => void save()} disabled={saving} aria-busy={saving} />
          <Btn className="mt-0" variant="ghost" ko="✏️ 고치기" en="Edit spelling" onClick={openEdit} />
          {issued.option.status === "edited" && <Btn className="mt-0" variant="ghost" ko="🔗 링크 복사" en="Copy link" onClick={() => void copyLink()} />}
        </div>
        {editing && (
          <form className="mt-3 rounded-md border-2 border-line bg-bg p-3" onSubmit={applyEdit}>
            <label htmlFor="hn-fix" className="block leading-[1.25]">
              <span className="block font-bold">Type the Hangul spelling you want.</span>
              <span className="text-[0.75rem] font-bold text-muted">원하는 한글 표기를 넣어 주세요. ({issued.input})</span>
            </label>
            <input
              id="hn-fix"
              lang="ko"
              className="mt-2 min-h-14 w-full rounded-md border-2 border-line bg-surface px-3 font-display text-[1.6rem] text-ink"
              value={draft}
              maxLength={FIX_MAX + 5}
              autoComplete="off"
              autoFocus
              onChange={(e) => {
                setDraft(e.target.value);
                setDraftBad(false);
              }}
            />
            {draftBad && (
              <p className="mt-1.5 leading-[1.25]" role="alert">
                <span className="block font-bold">Use Hangul blocks only (up to {FIX_MAX}), like 안.</span>
                <span className="text-[0.75rem] font-bold text-muted">한글 글자만 넣어 주세요. ({FIX_MAX}자까지)</span>
              </p>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Btn className="mt-0" variant="ghost" ko="취소" en="Cancel" onClick={() => setEditing(false)} />
              <Btn className="mt-0" type="submit" ko="고치기" en="Apply" />
            </div>
          </form>
        )}
        {voice === false && (
          <Note
            tone="gray"
            ko="이 기기에서는 한국어 소리가 안 나올 수 있어요."
            en={canSpeak ? "No Korean voice on this device, so Listen may sound wrong. Add a Korean voice in your device’s speech settings, or try another browser." : "This browser can’t read text aloud. Try Safari or Chrome to hear your name."}
          />
        )}
        <p className="mt-2 leading-[1.25] empty:hidden" role="status" aria-live="polite">
          {note && (
            <>
              <span className="block font-bold">{note.en}</span>
              <span className="text-[0.75rem] font-bold text-muted">{note.ko}</span>
            </>
          )}
        </p>
        {preview && (
          <figure className="mt-3">
            <figcaption className="mb-2 text-center leading-[1.25]">
              <span className="block font-bold">Long-press the image to save it.</span>
              <span className="text-[0.75rem] font-bold text-muted">그림을 길게 눌러 저장하세요.</span>
            </figcaption>
            <img className="w-full rounded-md shadow-card" src={preview} alt={`${text} — 한글 이름 영수증 / Hangul name receipt`} />
          </figure>
        )}

        <Note
          tone="pink"
          className="mt-3.5"
          ko={intro.reason.ko}
          en={intro.reason.en}
          ex={
            <>
              {intro.parts.before}
              <span className="text-pink-ink">{intro.parts.ending}</span>
              {intro.parts.after}
            </>
          }
        />
      </Box>
    </>
  );
}

/** 한국어 목소리가 있는지 — 목록이 늦게 오면 그때 다시 본다. TTS 자체가 없으면 false */
function useKoreanVoice(): boolean | null {
  const [v, setV] = useState(() => (canSpeak ? hasKoreanVoice() : false));
  useEffect(() => onVoicesChanged(() => setV(hasKoreanVoice())), []);
  return v;
}
