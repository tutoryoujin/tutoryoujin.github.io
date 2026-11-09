/* 첫 화면(/) — shared/apps.ts 의 앱을 모두 보여 준다. 여기는 손댈 일이 거의 없다. */
import { APPS } from "@yj/apps";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn, Footer, Ieung, mainClass, mount, type Mood } from "@yj/ui";
import "./home.css";

function Home() {
  return (
    <>
      <main className={mainClass}>
        <div className="pt-3 text-center">
          <div className="mx-auto w-28">
            <Ieung mood="yay" />
          </div>
          <h1 className="mt-2 mb-1 text-[2em] leading-[1.2] font-normal">
            <span className="block font-display text-[1.7rem]">한국어 with Youjin</span>
            <span className="text-[0.85rem] font-bold text-muted">Small apps for learning Korean</span>
          </h1>
        </div>
        <ul className="grid gap-2.5">
          {APPS.map((a) => (
            <li key={a.slug}>
              <a
                className="flex min-h-11 items-center gap-3.5 rounded-lg bg-surface px-4 py-3.5 text-ink no-underline shadow-card"
                href={`/${a.slug}/`}
              >
                <span className="grid size-13 flex-none place-items-center rounded-md bg-sky text-[2rem]" aria-hidden="true">
                  {a.emoji}
                </span>
                <span>
                  <b className="font-display text-[1.2rem] font-normal">{a.ko}</b>
                  <small className="ml-1.5 text-[0.75rem] font-bold text-muted">{a.en}</small>
                  <span className="mt-0.5 block text-[0.9rem]">
                    {a.about.ko}
                    <em className="block text-[0.78rem] font-bold not-italic text-muted">{a.about.en}</em>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <IeungStory />
      </main>
      <Footer />
    </>
  );
}

/* 이응이 — 누를 때마다 한 줄씩 말하고 표정이 바뀐다.
   이야기는 디자인 시스템 「마스코트 · 이야기」(빈자리 · 포도알)에서 고른다. 새 설정을 지어내지 않는다. */
type Line = { mood: Mood; ko: string; en: string; fx?: "in" };
const HELLO: Line = { mood: "basic", ko: "안녕하세요! 저를 눌러 보세요.", en: "Hi! Tap me." };
const SLEEP: Line = { mood: "sleepy", ko: "쿨쿨… 눌러서 깨워 주세요.", en: "Zzz… tap to wake me up." };
const LINES: Line[] = [
  { mood: "yay", ko: "저는 이응이예요!", en: "I'm Ieung‑i!" },
  { mood: "wink", ko: "한글 ㅇ에서 따서 만들었어요.", en: "I'm made from the Hangul letter ㅇ." },
  { mood: "huh", ko: "‘아’ 하고 읽어 보세요. 제 소리는 안 나요.", en: "Say 아 — you can't hear me at all." },
  { mood: "focus", ko: "첫소리 ㅇ은 소리 없는 빈자리예요.", en: "At the start, ㅇ is a silent, empty seat." },
  { mood: "sparkle", ko: "비어 있으니까 뭐든 담을 수 있어요!", en: "Empty means I can hold anything!", fx: "in" },
  { mood: "love", ko: "여러분이 외운 낱말도 제 안에 담겨요.", en: "Every word you learn goes inside me.", fx: "in" },
  { mood: "wow", ko: "받침에 가면 ‘ng’ 소리가 나요!", en: "At the bottom, I say “ng”!" },
  { mood: "tongue", ko: "동그란 몸은 포도알이에요.", en: "My round body is a grape." },
  { mood: "proud", ko: "머리 위는 포도 꼭지! ㅎ의 윗획이랑 닮았지요?", en: "The T on top is the stem — just like the top of ㅎ!" },
  { mood: "moved", ko: "빈자리에 하나씩, 매일 조금씩.", en: "One seat at a time, a little every day." },
];
// 튀어나오는 글자는 모두 ㅇ 이 든 글자. 담기는 줄에서는 낱말이 이응이 안으로 떨어진다
const POP = ["ㅇ", "아", "오", "우", "이", "응", "앙", "영"];
const WORDS = ["사과", "하늘", "친구", "학교", "사랑", "바다"];
const TONES = ["blue", "pink", "yellow", "mint", "lavender", "coral", "orange"];
const SLEEP_MS = 15000;

type Bit = { id: number; text: string; tone: string; x: number; r: number; fx: "out" | "in" };

function IeungStory() {
  const [n, setN] = useState(-1); // -1 = 아직 안 누름
  const [asleep, setAsleep] = useState(false);
  const [bits, setBits] = useState<Bit[]>([]);
  const seq = useRef(0);

  // 가만히 두면 잠든다
  useEffect(() => {
    if (asleep) return;
    const t = setTimeout(() => setAsleep(true), SLEEP_MS);
    return () => clearTimeout(t);
  }, [n, asleep]);

  const line = asleep ? SLEEP : n < 0 ? HELLO : LINES[n];

  const poke = () => {
    // 자다 깨면 하던 말을 다시 한다
    const next = asleep && n >= 0 ? n : (n + 1) % LINES.length;
    setAsleep(false);
    setN(next);
    const fx = LINES[next].fx ?? "out";
    const pool = fx === "in" ? WORDS : POP;
    const fresh: Bit[] = Array.from({ length: fx === "in" ? 3 : 5 }, (_, i) => ({
      id: ++seq.current,
      text: pool[Math.floor(Math.random() * pool.length)],
      tone: TONES[(seq.current + i) % TONES.length],
      x: fx === "in" ? (i - 1) * 75 : (i - 2) * 46 + (Math.random() * 16 - 8),
      r: Math.random() * 30 - 15,
      fx,
    }));
    setBits((b) => [...b.slice(-12), ...fresh]);
    const ids = new Set(fresh.map((f) => f.id));
    setTimeout(() => setBits((b) => b.filter((x) => !ids.has(x.id))), 1600);
  };

  return (
    <section
      className="mt-9 overflow-hidden rounded-lg bg-surface px-4 pt-5 pb-4 text-center break-keep shadow-card"
      aria-labelledby="ieung-title"
    >
      <h2 id="ieung-title" className="text-[1.5em] leading-[1.2] font-normal">
        <span className="block font-display text-[1.35rem]">이응이를 소개해요</span>
        <span className="text-[0.8rem] font-bold text-muted">Meet Ieung{"‑"}i</span>
      </h2>

      <div className="mt-3.5 flex flex-col items-center">
        {/* 말풍선 — 줄이 바뀔 때마다 톡 튀어나온다. 높이를 잡아 둬서 이응이가 들썩이지 않는다.
            z-2: 튀는 글자가 말풍선 글을 가리지 않게 */}
        <p
          className={cn(
            "relative z-2 flex min-h-19 max-w-75 flex-col justify-center rounded-lg bg-sky px-4 py-3 font-display text-[1.1rem] leading-[1.35] text-sky-ink",
            "animate-[ieung-bubble_0.35s_cubic-bezier(0.3,1.5,0.5,1)] motion-reduce:animate-none",
            "after:absolute after:bottom-[-9px] after:left-1/2 after:-ml-2.5 after:border-[10px] after:border-b-0 after:border-transparent after:border-t-sky after:content-['']",
          )}
          key={`${asleep}-${n}`}
          aria-live="polite"
        >
          {line.ko}
          <em className="mt-0.5 block font-app text-[0.8rem] font-bold not-italic text-sky-ink opacity-80">{line.en}</em>
        </p>
        <button
          type="button"
          className="relative mt-1.5 w-[190px] cursor-pointer rounded-lg bg-transparent p-0 [-webkit-tap-highlight-color:transparent] focus-visible:outline-offset-4"
          onClick={poke}
          aria-label="이응이 누르기 / Tap Ieung-i"
        >
          {/* 누르면 말랑하게 눌렸다가 튄다 */}
          <span className="block animate-[ieung-poke_0.45s_ease-out] motion-reduce:animate-none" key={`${n}-${asleep}`}>
            <Ieung mood={line.mood} />
          </span>
          {/* 튀어나오는 글자 (out) · 안으로 담기는 낱말 (in). 색은 -bg/-ink 쌍, 글자가 같이 있다 */}
          {bits.map((b) => (
            <span
              key={b.id}
              className={cn(
                "pointer-events-none absolute top-[55%] left-1/2 rounded-full px-2.5 py-1 font-display text-[1rem] whitespace-nowrap opacity-0 motion-reduce:hidden",
                b.fx === "out" ? "animate-[ieung-out_1.4s_ease-out_forwards]" : "animate-[ieung-in_1.3s_ease-in_forwards]",
              )}
              style={{ "--x": `${b.x}px`, "--r": `${b.r}deg`, background: `var(--${b.tone}-bg)`, color: `var(--${b.tone}-ink)` } as CSSProperties}
              aria-hidden="true"
            >
              {b.text}
            </span>
          ))}
        </button>
      </div>

      <p className="mt-1 text-[0.8rem] font-bold text-muted" aria-hidden="true">
        {n < 0 ? "👆 이응이를 눌러 보세요 · Tap Ieung‑i" : `${n + 1} / ${LINES.length}`}
      </p>
    </section>
  );
}

mount(<Home />);
