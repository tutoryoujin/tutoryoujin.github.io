/* ============================================================
   학습 화면. 회차 방식 — 못 외운 카드만 모아 다음 회차에서 다시.
   ============================================================ */
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Ieung, type Mood } from "@yj/ui";
import { Art } from "./Art";
import { celebrate, stopConfetti } from "./confetti";
import { cardOf, colorOf, imgSrc } from "./decks";
import { load, save, touch, validState, type StudyState } from "./store";
import type { Deck } from "./types";

const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const fresh = (deck: Deck): StudyState => ({
  queue: shuffle(deck.cards.map((c) => c.id)),
  index: 0,
  round: 1,
  missed: [],
  learnedThisRound: 0,
  phase: "card",
});

export function Study({ deck }: { deck: Deck }) {
  const [state, setState] = useState<StudyState>(() => {
    const saved = load(deck.id);
    return validState(deck, saved) ? saved : fresh(deck);
  });
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const celebrateNext = useRef(false);
  const streak = useRef(0);
  const [reaction, setReaction] = useState<{ mood: Mood; miss: boolean; n: number } | null>(null);

  const total = deck.cards.length;
  const onCard = state.phase === "card";
  const n = state.queue.length;

  // 화면에 있는 동안만: 키보드 · 스크롤 잠금 · 색종이 정리
  useEffect(() => {
    document.body.classList.add("studying");
    return () => {
      document.body.classList.remove("studying");
      stopConfetti();
    };
  }, []);

  const commit = (next: StudyState) => {
    save(deck.id, next);
    setState(next);
  };

  const answer = (known: boolean) => {
    if (leaving || state.phase !== "card") return;
    const id = state.queue[state.index];
    const next: StudyState = {
      ...state,
      missed: known ? state.missed : [...state.missed, id],
      learnedThisRound: state.learnedThisRound + (known ? 1 : 0),
      index: state.index + 1,
    };
    if (next.index >= next.queue.length) {
      next.phase = "end";
      if (next.missed.length === 0) celebrateNext.current = true;
    }
    save(deck.id, next);
    touch();
    // 회차가 끝나면 결과 화면에 이응이 따로 선다. 한 화면에 이응은 하나
    if (next.phase === "card") {
      // 정답이면 신나요, 다섯 장 연속이면 놀라요, 오답이면 헷갈려요. 슬픈 이응은 없다
      streak.current = known ? streak.current + 1 : 0;
      const mood: Mood = !known ? "huh" : streak.current % 5 === 0 ? "wow" : "yay";
      setReaction((r) => ({ mood, miss: !known, n: (r?.n ?? 0) + 1 }));
    }
    if (reduceMotion()) setState(next);
    else {
      setLeaving(known ? "right" : "left");
      setTimeout(() => {
        setLeaving(null);
        setState(next);
      }, 220);
    }
  };

  // 다 외운 회차가 끝나면 한 번 축하
  useEffect(() => {
    if (state.phase === "end" && state.missed.length === 0 && celebrateNext.current) {
      celebrateNext.current = false;
      const t = setTimeout(celebrate, 150);
      return () => clearTimeout(t);
    }
  }, [state]);

  const flipRef = useRef<() => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as Element;
      if (t.closest?.("button, a") && (e.key === " " || e.key === "Enter")) return;
      if (state.phase !== "card") return;
      if (e.key === " ") {
        e.preventDefault();
        flipRef.current();
      } else if (e.key === "ArrowLeft") answer(false);
      else if (e.key === "ArrowRight") answer(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const restart = () => {
    stopConfetti();
    commit(fresh(deck));
  };

  return (
    <div className="app">
      <header className="top">
        <div className="top-left">
          <a className="nav-back" href="#/" aria-label="홈 / Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </a>
          <h1 className="title">
            {deck.title.ko}
            <span className="title-en">{deck.title.en}</span>
          </h1>
        </div>
        <button
          className="pill"
          type="button"
          onClick={() => {
            if (confirm("진행 상황을 지우고 처음부터 시작할까요?\nClear your progress and start from the beginning?")) restart();
          }}
        >
          <span className="ko">처음부터</span>
          <span className="en">From the start</span>
        </button>
      </header>

      <div className="status" aria-live="polite">
        <span className="round">
          {state.round}회차 <span className="round-en">Round {state.round}</span>
        </span>
        <div className="bar" aria-hidden="true">
          <i style={{ width: (onCard ? (state.index / n) * 100 : 100) + "%" }} />
        </div>
        <span>
          {onCard ? Math.min(state.index + 1, n) : n} / {n}
        </span>
      </div>

      <main className="stage">
        {onCard ? (
          <FlashCard key={`${state.round}-${state.index}`} deck={deck} state={state} leaving={leaving} onAnswer={answer} flipRef={flipRef} />
        ) : state.missed.length === 0 ? (
          <section className="panel">
            <div className="panel-mascot">
              <span className="pop" role="button" tabIndex={0} aria-label="다시 축하하기 / Celebrate again" onClick={celebrate} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && celebrate()}>
                <Ieung mood="proud" />
              </span>
            </div>
            <h2>모두 외웠어요!</h2>
            <p className="sub-en">You memorized them all!</p>
            <p>
              {state.round}회차 만에 {deck.unit.ko} {total}개를 다 외웠어요.
              <span className="p-en">
                You memorized all {total} {deck.unit.en} in {state.round} {state.round === 1 ? "round" : "rounds"}.
              </span>
            </p>
            <button className="btn known" type="button" onClick={restart}>
              <span className="ko">처음부터 다시 하기</span>
              <span className="en">Start again from the beginning</span>
            </button>
            <a className="btn" href="#/">
              <span className="ko">다른 카드 보러 가기</span>
              <span className="en">Try another deck</span>
            </a>
          </section>
        ) : (
          <section className="panel">
            <div className="panel-mascot">
              <Ieung mood="yay" />
            </div>
            <h2>{state.round}회차 끝!</h2>
            <p className="sub-en">Round {state.round} done!</p>
            <p>
              이번에 {state.learnedThisRound}개를 외웠어요. 아직 {state.missed.length}개가 남았어요.
              <span className="p-en">
                You memorized {state.learnedThisRound} this time. {state.missed.length} still left.
              </span>
            </p>
            <div className="missed">
              {state.missed.map((id) => {
                const c = cardOf(deck, id);
                return (
                  <span key={id} className={`c-${colorOf(deck, c)}`}>
                    {c.ko}
                  </span>
                );
              })}
            </div>
            <button
              className="btn known"
              type="button"
              onClick={() =>
                commit({ queue: shuffle(state.missed), index: 0, round: state.round + 1, missed: [], learnedThisRound: 0, phase: "card" })
              }
            >
              <span className="ko">남은 {state.missed.length}개 다시 보기</span>
              <span className="en">Review the {state.missed.length} left</span>
            </button>
          </section>
        )}
      </main>

      <div className="actions" style={{ visibility: onCard ? "visible" : "hidden" }}>
        <Reaction r={reaction} />
        <button className="btn" type="button" disabled={!onCard} onClick={() => answer(false)}>
          <span className="ko">못 외웠어요</span>
          <span className="en">Not memorized</span>
        </button>
        <button className="btn known" type="button" disabled={!onCard} onClick={() => answer(true)}>
          <span className="ko">외웠어요</span>
          <span className="en">Memorized</span>
        </button>
      </div>
    </div>
  );
}

/** 카드 밖, 버튼 바로 위로 잠깐 올라왔다 내려가는 이응 */
function Reaction({ r }: { r: { mood: Mood; miss: boolean; n: number } | null }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!r || !el) return;
    el.classList.remove("show");
    void el.offsetWidth; // 연달아 눌러도 처음부터 다시 올라오게
    el.classList.add("show");
    const t = setTimeout(() => el.classList.remove("show"), 1100);
    return () => clearTimeout(t);
  }, [r]);
  return (
    <div ref={box} className={`react${r?.miss ? " miss" : ""}`} aria-hidden="true">
      {r && <Ieung mood={r.mood} />}
    </div>
  );
}

type CardProps = {
  deck: Deck;
  state: StudyState;
  leaving: "left" | "right" | null;
  onAnswer: (known: boolean) => void;
  flipRef: React.MutableRefObject<() => void>;
};

function FlashCard({ deck, state, leaving, onAnswer, flipRef }: CardProps) {
  const c = cardOf(deck, state.queue[state.index]);
  const photo = deck.art === "photo";
  const [flipped, setFlipped] = useState(false);
  flipRef.current = () => setFlipped((f) => !f);

  // 다음 카드 그림을 미리 받아 둔다
  useEffect(() => {
    const nextId = state.queue[state.index + 1];
    if (nextId) new Image().src = imgSrc(deck, cardOf(deck, nextId));
  }, [deck, state]);

  /* 밀기: 왼쪽 = 못 외웠어요, 오른쪽 = 외웠어요.
     드래그 중에는 다시 그리지 않고 DOM 을 바로 움직인다 */
  const el = useRef<HTMLButtonElement>(null);
  const miss = useRef<HTMLDivElement>(null);
  const know = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, startY: 0, dx: 0, active: false, dragging: false, suppress: false });

  const down = (e: PointerEvent) => {
    if (leaving) return;
    drag.current = { ...drag.current, active: true, dragging: false, dx: 0, startX: e.clientX, startY: e.clientY };
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d.active || !el.current) return;
    d.dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.dragging) {
      if (Math.abs(d.dx) < 10 || Math.abs(d.dx) < Math.abs(dy)) return;
      d.dragging = true;
      el.current.classList.add("dragging");
      try {
        el.current.setPointerCapture(e.pointerId);
      } catch {
        /* 무시 */
      }
    }
    const threshold = Math.min(110, window.innerWidth * 0.25);
    el.current.style.transform = `translateX(${d.dx}px) rotate(${d.dx / 18}deg)`;
    const p = Math.min(Math.abs(d.dx) / threshold, 1);
    miss.current!.style.opacity = String(d.dx < 0 ? p : 0);
    know.current!.style.opacity = String(d.dx > 0 ? p : 0);
  };
  const end = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (!d.dragging || !el.current) return;
    d.suppress = true;
    setTimeout(() => (d.suppress = false), 50);
    el.current.classList.remove("dragging");
    el.current.style.transform = "";
    if (Math.abs(d.dx) >= Math.min(110, window.innerWidth * 0.25)) onAnswer(d.dx > 0);
    else miss.current!.style.opacity = know.current!.style.opacity = "0";
  };

  const art = (cls: string) => (
    <Art src={imgSrc(deck, c)} emoji={c.emoji} className={`${cls} ${photo ? "photo" : "icon"}`} fallbackClass={cls.startsWith("art-") ? "emoji" : ""} />
  );

  return (
    <button
      ref={el}
      className={`card c-${colorOf(deck, c)}${flipped ? " flipped" : ""}${leaving ? " leave-" + leaving : ""}`}
      type="button"
      aria-label={`${c.ko}, 탭해서 뒤집기 / tap to flip`}
      onClick={() => {
        if (drag.current.suppress) {
          drag.current.suppress = false;
          return;
        }
        setFlipped((f) => !f);
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={miss} className="swipe-tag miss" aria-hidden="true">
        못 외웠어요<small>Not memorized</small>
      </div>
      <div ref={know} className="swipe-tag know" aria-hidden="true">
        외웠어요<small>Memorized</small>
      </div>
      <div className="inner">
        <div className={`face front${photo ? " photo" : ""}`} aria-hidden={flipped}>
          {art(photo ? "art-photo" : "art-icon")}
          <div className="word">{c.ko}</div>
          <div className="hint">
            탭해서 뒤집기, 옆으로 밀어서 넘기기
            <br />
            Tap to flip, swipe to move on
          </div>
        </div>
        <div className="face back" aria-hidden={!flipped}>
          <div className="chip">
            {art("")}
            {c.ko}
          </div>
          <p className="meaning">{c.en}</p>
          <p className="note">{c.note}</p>
          {c.ex && (
            <p className="ex">
              <span className="ex-ko">{c.ex.ko}</span>
              <span className="ex-en">{c.ex.en}</span>
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
