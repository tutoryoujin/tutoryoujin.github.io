/* 첫 화면(/) — shared/apps.ts 의 앱을 모두 보여 준다. 여기는 손댈 일이 거의 없다. */
import { APPS } from "@yj/apps";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Ieung, mount, type Mood } from "@yj/ui";
import "./home.css";

function Home() {
  return (
    <>
      <main className="yj-main home">
        <div className="home-hero">
          <div className="home-mascot">
            <Ieung mood="yay" />
          </div>
          <h1>
            <span className="ko">한국어 with Youjin</span>
            <span className="en">Small apps for learning Korean</span>
          </h1>
        </div>
        <ul className="home-list">
          {APPS.map((a) => (
            <li key={a.slug}>
              <a className="home-card" href={`/${a.slug}/`}>
                <span className="home-emoji" aria-hidden="true">
                  {a.emoji}
                </span>
                <span>
                  <b>{a.ko}</b>
                  <small>{a.en}</small>
                  <span className="home-about">
                    {a.about.ko}
                    <em>{a.about.en}</em>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <IeungStory />
      </main>
      <footer className="site-footer">
        <div className="site-inner">
          <p className="foot-copy">© {new Date().getFullYear()} Made by Youjin. All rights reserved.</p>
        </div>
      </footer>
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
    <section className="home-ieung" aria-labelledby="ieung-title">
      <h2 id="ieung-title">
        <span className="ko">이응이를 소개해요</span>
        <span className="en">Meet Ieung{"‑"}i</span>
      </h2>

      <div className="ieung-stage">
        <p className="ieung-bubble" key={`${asleep}-${n}`} aria-live="polite">
          {line.ko}
          <em>{line.en}</em>
        </p>
        <button type="button" className="ieung-btn" onClick={poke} aria-label="이응이 누르기 / Tap Ieung-i">
          <span className="ieung-poke" key={`${n}-${asleep}`}>
            <Ieung mood={line.mood} />
          </span>
          {bits.map((b) => (
            <span
              key={b.id}
              className={`ieung-bit is-${b.fx}`}
              style={{ "--x": `${b.x}px`, "--r": `${b.r}deg`, background: `var(--${b.tone}-bg)`, color: `var(--${b.tone}-ink)` } as CSSProperties}
              aria-hidden="true"
            >
              {b.text}
            </span>
          ))}
        </button>
      </div>

      <p className="ieung-count" aria-hidden="true">
        {n < 0 ? "👆 이응이를 눌러 보세요 · Tap Ieung‑i" : `${n + 1} / ${LINES.length}`}
      </p>
    </section>
  );
}

mount(<Home />);
