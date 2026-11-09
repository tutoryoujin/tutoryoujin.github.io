/* ============================================================
   학습 화면. 회차 방식 — 못 외운 카드만 모아 다음 회차에서 다시.
   ============================================================ */
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cn, Ieung, Subscribe, track, type Mood } from "@yj/ui";
import { Art, TONE } from "./Art";
import { celebrate, stopConfetti } from "./confetti";
import { cardOf, colorOf, imgSrc } from "./decks";
import { load, markOpened, save, touch, validState, type StudyState } from "./store";
import type { Deck } from "./types";

/* 큰 버튼 — 회차 끝 화면에도 같이 쓴다 */
const btn =
  "flex min-h-17 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[20px] border-2 border-line bg-surface px-2 py-2.5 text-ink " +
  "transition-transform duration-80 ease-[ease] focus-visible:outline-offset-3 active:scale-97 disabled:cursor-default disabled:opacity-40";
const known = "border-primary bg-primary text-primary-ink";
const btnKo = "text-[1.15rem] leading-[1.2] font-bold";
const btnEn = "text-[0.78rem] leading-[1.2] font-bold opacity-75";

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

  // 열면 바로 기록한다 — 카드를 안 넘기고 나가도 홈에서 책갈피가 꽂히고 "0 / 20 외웠어요" 가 된다.
  // 섞은 순서도 같이 남아 다시 열면 같은 순서로 이어진다
  useEffect(() => {
    markOpened(deck.id);
    save(deck.id, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 연 순간 한 번만
  }, [deck.id]);

  // 화면에 있는 동안만: 키보드 · 스크롤 잠금 · 색종이 정리
  useEffect(() => {
    const lock = ["overscroll-none", "select-none"];
    document.body.classList.add(...lock);
    return () => {
      document.body.classList.remove(...lock);
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
      if (next.missed.length === 0) {
        celebrateNext.current = true;
        track("deck-complete", { deck: deck.id, rounds: next.round });
      }
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
    // 화면 높이를 꽉 채운다 — 카드가 남는 높이를 다 쓴다
    <div className="flex h-dvh w-full flex-col gap-3 px-4 pt-2.5 pb-3.5 sm:mx-auto sm:max-w-110 sm:gap-4 sm:px-5 sm:py-6">
      <header className="flex min-h-11 items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <a
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-[1.2rem] font-extrabold text-ink no-underline focus-visible:outline-offset-3"
            href="#/"
            aria-label="홈 / Home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </a>
          <h1 className="text-[1.2rem] leading-[1.15] font-bold sm:text-[1.35rem]">
            {deck.title.ko}
            <span className="block text-[0.72rem] font-bold text-muted">{deck.title.en}</span>
          </h1>
        </div>
        <button
          className="inline-flex min-h-10 shrink-0 cursor-pointer flex-col items-center justify-center rounded-full border border-line bg-surface px-3.5 py-1 leading-[1.1] text-muted no-underline focus-visible:outline-offset-3"
          type="button"
          onClick={() => {
            if (confirm("진행 상황을 지우고 처음부터 시작할까요?\nClear your progress and start from the beginning?")) restart();
          }}
        >
          <span className="text-[0.9rem] font-bold text-ink">처음부터</span>
          <span className="text-[0.68rem] font-bold">From the start</span>
        </button>
      </header>

      <div className="flex items-center gap-2.5 text-[0.85rem] font-bold text-muted" aria-live="polite">
        <span className="rounded-full border border-line bg-surface px-2.5 py-0.75 font-bold whitespace-nowrap text-ink">
          {state.round}회차 <span className="ml-0.5 text-[0.72rem] font-bold text-muted">Round {state.round}</span>
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <i
            className="block h-full w-0 rounded-[inherit] bg-primary transition-[width] duration-300 ease-[ease] motion-reduce:transition-none"
            style={{ width: (onCard ? (state.index / n) * 100 : 100) + "%" }} />
        </div>
        <span>
          {onCard ? Math.min(state.index + 1, n) : n} / {n}
        </span>
      </div>

      {/* 끝 화면은 구독 폼까지 들어가서 화면보다 길 수 있다 — 그때는 안에서 굴린다. center-safe: 넘칠 때 위가 잘리지 않게 */}
      <main className={cn("grid min-h-0 flex-1 perspective-[1200px]", onCard ? "place-items-center" : "place-items-center-safe overflow-y-auto")}>
        {onCard ? (
          <FlashCard key={`${state.round}-${state.index}`} deck={deck} state={state} leaving={leaving} onAnswer={answer} flipRef={flipRef} />
        ) : state.missed.length === 0 ? (
          <section className={panel}>
            <div className={mascot}>
              <span className={cn(pop, "block focus-visible:rounded-sm")} role="button" tabIndex={0} aria-label="다시 축하하기 / Celebrate again" onClick={celebrate} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && celebrate()}>
                <Ieung mood="proud" />
              </span>
            </div>
            <h2 className="mb-1 text-[1.8rem] font-bold">모두 외웠어요!</h2>
            <p className="mb-3.5 text-[0.9rem] leading-[1.5] font-bold text-muted">You memorized them all!</p>
            <p className={panelP}>
              {state.round}회차 만에 {deck.unit.ko} {total}개를 다 외웠어요.
              <span className="mt-1 block text-[0.88rem] font-bold opacity-85">
                You memorized all {total} {deck.unit.en} in {state.round} {state.round === 1 ? "round" : "rounds"}.
              </span>
            </p>
            <button className={cn(btn, known, "w-full")} type="button" onClick={restart}>
              <span className={btnKo}>처음부터 다시 하기</span>
              <span className={btnEn}>Start again from the beginning</span>
            </button>
            <a className={cn(btn, "mt-2.5 w-full")} href="#/">
              <span className={btnKo}>다른 카드 보러 가기</span>
              <span className={btnEn}>Try another deck</span>
            </a>
            <Subscribe source="korean-cards" className="mt-6 rounded-none border-t border-line px-0 pt-6 pb-0 shadow-none" />
          </section>
        ) : (
          <section className={panel}>
            <div className={mascot}>
              <Ieung mood="yay" />
            </div>
            <h2 className="mb-1 text-[1.8rem] font-bold">{state.round}회차 끝!</h2>
            <p className="mb-3.5 text-[0.9rem] leading-[1.5] font-bold text-muted">Round {state.round} done!</p>
            <p className={panelP}>
              이번에 {state.learnedThisRound}개를 외웠어요. 아직 {state.missed.length}개가 남았어요.
              <span className="mt-1 block text-[0.88rem] font-bold opacity-85">
                You memorized {state.learnedThisRound} this time. {state.missed.length} still left.
              </span>
            </p>
            <div className="-mt-1.5 mb-5.5 flex flex-wrap justify-center gap-1.5">
              {state.missed.map((id) => {
                const c = cardOf(deck, id);
                return (
                  <span
                    key={id}
                    className={cn(TONE[colorOf(deck, c)], "rounded-full bg-(--g-bg) px-2.5 py-1 text-[0.95rem] font-bold text-(--g-ink)")}
                  >
                    {c.ko}
                  </span>
                );
              })}
            </div>
            <button
              className={cn(btn, known, "w-full")}
              type="button"
              onClick={() =>
                commit({ queue: shuffle(state.missed), index: 0, round: state.round + 1, missed: [], learnedThisRound: 0, phase: "card" })
              }
            >
              <span className={btnKo}>남은 {state.missed.length}개 다시 보기</span>
              <span className={btnEn}>Review the {state.missed.length} left</span>
            </button>
          </section>
        )}
      </main>

      <div className="relative z-2 grid grid-cols-2 gap-2.5" style={{ visibility: onCard ? "visible" : "hidden" }}>
        <Reaction r={reaction} />
        <button className={btn} type="button" disabled={!onCard} onClick={() => answer(false)}>
          <span className={btnKo}>못 외웠어요</span>
          <span className={btnEn}>Not memorized</span>
        </button>
        <button className={cn(btn, known)} type="button" disabled={!onCard} onClick={() => answer(true)}>
          <span className={btnKo}>외웠어요</span>
          <span className={btnEn}>Memorized</span>
        </button>
      </div>
    </div>
  );
}

/* 완료 화면 */
const panel = "w-full rounded-xl bg-surface px-5 py-8 text-center shadow-card";
/* 이응이 sky 바닥 위에 선다. 눌러서 다시 축하하기 */
const mascot = "mx-auto mb-3 grid h-28 w-37 items-end justify-items-center overflow-hidden rounded-xl bg-sky [&_svg]:-mb-1.5 [&_svg]:block [&_svg]:h-26 [&_svg]:w-25";
const panelP = "mb-5.5 text-[1rem] leading-[1.5] text-muted";
const pop = "inline-block cursor-pointer [animation:pop_.7s_cubic-bezier(.2,1.6,.4,1)_both,wiggle_1.2s_ease-in-out_.7s_2] motion-reduce:animate-none";

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
    <div
      ref={box}
      className={cn(
        "pointer-events-none absolute right-3.5 bottom-[calc(100%+4px)] h-21 w-20 opacity-0 [transform:translateY(24px)_scale(.6)] [&_svg]:size-full",
        "[transition:transform_.22s_cubic-bezier(.2,1.4,.4,1),opacity_.18s_ease] [&.show]:transform-none [&.show]:opacity-100",
        "motion-reduce:transform-none motion-reduce:[transition:opacity_.18s_ease]",
        r?.miss && "right-auto left-3.5",
      )}
      aria-hidden="true"
    >
      {r && <Ieung mood={r.mood} />}
    </div>
  );
}

/* 카드 앞·뒷면. 뒤집을 때 뒷면이 비치지 않게 backface-hidden */
const face =
  "absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-xl px-5 pt-6 pb-14 text-center shadow-card backface-hidden";
/* 그림을 못 불러왔을 때 대신 보이는 이모지 */
const emoji = "mb-4 text-[clamp(4.5rem,24vw,7rem)] leading-none";
const swipeTag =
  "pointer-events-none absolute top-4.5 z-2 rounded-sm border-2 border-current bg-surface px-3 py-1.5 text-center text-[1rem] leading-[1.1] font-bold opacity-0";
const swipeSmall = "block text-[0.65rem] font-extrabold";

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

  const art = (cls: string, fallback: string) => <Art src={imgSrc(deck, c)} emoji={c.emoji} className={cls} fallbackClass={fallback} />;

  return (
    <button
      ref={el}
      className={cn(
        "relative h-full min-h-65 w-full cursor-pointer touch-pan-y rounded-xl bg-transparent p-0 text-inherit sm:max-h-130",
        "font-reading tracking-[-0.01em] [font-synthesis:weight]",
        "[transition:transform_.22s_ease,opacity_.22s_ease] focus-visible:outline-offset-4 motion-reduce:transition-none [&.dragging]:transition-none",
        TONE[colorOf(deck, c)],
        leaving === "left" && "[transform:translateX(-110%)_rotate(-12deg)] opacity-0",
        leaving === "right" && "[transform:translateX(110%)_rotate(12deg)] opacity-0",
      )}
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
      {/* 라벨은 미는 방향의 반대편에 붙인다 — 카드가 빠져나가는 쪽에 두면
          엄지에 가리고 화면 밖으로 밀려나서 안 보인다. */}
      <div ref={miss} className={cn(swipeTag, "right-4 rotate-8 text-bad-ink")} aria-hidden="true">
        못 외웠어요<small className={swipeSmall}>Not memorized</small>
      </div>
      <div ref={know} className={cn(swipeTag, "left-4 -rotate-8 text-primary")} aria-hidden="true">
        외웠어요<small className={swipeSmall}>Memorized</small>
      </div>
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(.3,.7,.2,1)] transform-3d motion-reduce:transition-none",
          flipped && "rotate-y-180",
        )}
      >
        <div
          className={cn(face, "bg-(--g-bg) text-(--g-ink)", photo && "justify-start gap-3.5 p-3 pb-14")}
          aria-hidden={flipped}
        >
          {photo
            ? art(
                "max-h-[72%] min-h-0 w-full flex-[1_1_auto] rounded-[20px] bg-surface object-cover [-webkit-user-drag:none]",
                emoji,
              )
            : art("mb-3.5 h-auto w-[clamp(7rem,38vw,10rem)] [-webkit-user-drag:none]", emoji)}
          <div
            className={cn(
              "text-[clamp(2.3rem,12vw,3.1rem)] leading-[1.15] font-extrabold tracking-[-0.03em]",
              photo && "my-auto",
            )}
          >
            {c.ko}
          </div>
          <div className="absolute inset-x-0 bottom-4 text-[0.78rem] leading-[1.4] font-bold opacity-70">
            탭해서 뒤집기, 옆으로 밀어서 넘기기
            <br />
            Tap to flip, swipe to move on
          </div>
        </div>
        <div className={cn(face, "rotate-y-180 border-2 border-(--g-bg) bg-surface text-ink")} aria-hidden={!flipped}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-(--g-bg) py-1 pr-3.5 pl-1 text-[1.05rem] font-bold text-(--g-ink)">
            {art(cn("size-7.5 rounded-full", photo ? "bg-surface object-cover" : "object-contain"), "")}
            {c.ko}
          </div>
          <p className="mb-3 text-[clamp(1.6rem,8vw,2.1rem)] leading-[1.2] font-extrabold">{c.en}</p>
          <p className="max-w-[30ch] text-[1rem] leading-[1.5] text-muted">{c.note}</p>
          {c.ex && (
            <p className="mt-4 max-w-[32ch] rounded-md bg-bg px-3.5 py-2.5 leading-[1.45]">
              <span className="block text-[1.05rem] font-bold">{c.ex.ko}</span>
              <span className="block text-[0.85rem] font-bold text-muted">{c.ex.en}</span>
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
