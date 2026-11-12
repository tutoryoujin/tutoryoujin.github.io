import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ieung, type Mood } from "./Ieung";
import { canSpeak, speak } from "./speech";
import { Btn, boxClass } from "./parts";
import { cn } from "./cn";
import { shuffle } from "./shuffle";

/* ============================================================
   보기 넷 중 하나 고르는 퀴즈 — 판 진행 · 채점 · 피드백 · 결과.

   앱은 문제 하나를 만드는 함수만 넘긴다. 오답은 학생들이 실제로
   하는 실수로 만들고, 그 실수에 맞는 설명(why)을 붙인다.
   고른 오답의 why 가 피드백으로 나간다.
   ============================================================ */
export type Choice = { text: string; why?: { ko: string; en: string } };
export type Question = {
  /** 같은 판에서 같은 문제가 두 번 나오지 않게 비교하는 열쇠 */
  id: string;
  /** 문제 화면 (날짜, 시계 그림 …) */
  prompt: ReactNode;
  answer: string;
  wrong: Choice[];
  /** 결과 화면의 "틀린 문제 다시 보기" 왼쪽 칸 */
  review: string;
  /** 맞혔을 때 덧붙일 말 */
  right?: ReactNode;
};

type Props = {
  /** 몇 번째 문제인지(0부터)와 이미 나온 id 들을 받아 새 문제를 만든다 */
  make: (index: number, seen: string[]) => Question;
  length?: number;
  label: { ko: string; en: string };
};

type Round = { q: Question; choices: Choice[]; picked: Choice | null };

const scoreNum = "font-display text-[1rem] font-normal text-ink";
const enLine = "block text-[0.85rem] font-bold text-muted";

/** 문제·결과 위의 작은 제목. 한국어 한 줄, 영어 한 줄 */
const QLabel = ({ ko, en }: { ko: string; en: string }) => (
  <div className="text-center text-[0.85rem] font-bold text-muted">
    <span className="block font-display text-[1rem] text-ink">{ko}</span>
    {en}
  </div>
);

export function Quiz({ make, length = 10, label }: Props) {
  const [seen, setSeen] = useState<string[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(0);
  const [missed, setMissed] = useState<Question[]>([]);
  const [finished, setFinished] = useState(false);
  const nextRef = useRef<HTMLDivElement>(null);

  const newRound = (index: number, seenIds: string[]) => {
    let q = make(index, seenIds);
    for (let tries = 0; seenIds.includes(q.id) && tries < 50; tries++) q = make(index, seenIds);
    // 오답끼리, 혹은 정답과 글자가 같아지면 하나만 남긴다
    const uniq = new Map<string, Choice>([[q.answer, { text: q.answer }]]);
    for (const w of q.wrong) if (!uniq.has(w.text) && uniq.size < 4) uniq.set(w.text, w);
    setSeen([...seenIds, q.id]);
    setRound({ q, choices: shuffle([...uniq.values()]), picked: null });
  };

  const start = () => {
    setScore(0);
    setDone(0);
    setMissed([]);
    setFinished(false);
    newRound(0, []);
  };
  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (round?.picked) nextRef.current?.querySelector<HTMLButtonElement>("button:last-child")?.focus();
  }, [round?.picked]);

  if (!round) return null;
  const { q, choices, picked } = round;

  const pick = (c: Choice) => {
    if (picked) return;
    const ok = c.text === q.answer;
    setRound({ ...round, picked: c });
    setDone(done + 1);
    if (ok) setScore(score + 1);
    else setMissed([...missed, q]);
  };

  if (finished) return <Result score={score} length={length} missed={missed} onRestart={start} />;

  const ok = picked?.text === q.answer;
  return (
    <div className={boxClass}>
      <div className="mb-2.5 flex items-center justify-between text-[0.85rem] font-bold text-muted">
        <span>
          문제 Question <b className={scoreNum}>{done + (picked ? 0 : 1)} / {length}</b>
        </span>
        <span>
          맞힌 개수 Score <b className={scoreNum}>{score}</b>
        </span>
      </div>
      <QLabel ko={label.ko} en={label.en} />
      {q.prompt}
      <div className="grid gap-2">
        {choices.map((c) => {
          const isAnswer = c.text === q.answer;
          const state = picked ? (isAnswer ? "right" : c === picked ? "wrong" : null) : null;
          return (
            <button
              key={c.text}
              type="button"
              disabled={!!picked}
              onClick={() => pick(c)}
              className={cn(
                "min-h-14 rounded-[16px] border-2 border-line bg-surface p-2 font-display text-[1.25rem]",
                state === "right" && "border-ok-ink bg-ok-bg text-ok-ink",
                state === "wrong" && "border-bad-ink bg-bad-bg text-bad-ink",
              )}
            >
              {/* 색만으로 알리지 않는다 */}
              {state === "right" && <span aria-hidden="true">✓ </span>}
              {state === "wrong" && <span aria-hidden="true">✗ </span>}
              {c.text}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-center leading-[1.4]" aria-live="polite">
        {picked &&
          (ok ? (
            <>
              <span className="block font-display text-[1.2rem]">맞아요! 🎉 {q.right}</span>
              <span className={enLine}>Correct!</span>
            </>
          ) : (
            <>
              <span className="block font-display text-[1.2rem]">아쉬워요! 정답은 ‘{q.answer}’예요.</span>
              <span className={enLine}>Not quite — the answer is ‘{q.answer}’.</span>
              {picked.why && (
                <>
                  {/* 퀴즈 피드백 — 왜 틀렸는지 */}
                  <span className="mt-1 block font-display">{picked.why.ko}</span>
                  <span className={enLine}>{picked.why.en}</span>
                </>
              )}
            </>
          ))}
      </div>
      {picked && (
        <div ref={nextRef}>
          {canSpeak && <Btn variant="ghost" ko="🔊 들어 보기" en="Listen" onClick={() => speak(q.answer)} />}
          {done >= length ? (
            <Btn ko="결과 보기" en="See results" onClick={() => setFinished(true)} />
          ) : (
            <Btn ko="다음 문제" en="Next question" onClick={() => newRound(done, seen)} />
          )}
        </div>
      )}
    </div>
  );
}

function Result({ score, length, missed, onRestart }: { score: number; length: number; missed: Question[]; onRestart: () => void }) {
  const r = score / length;
  const [mood, ko, en]: [Mood, string, string] =
    r === 1
      ? ["yay", "완벽해요! 🎉", "Perfect score!"]
      : r >= 0.7
        ? ["proud", "잘했어요! 👏", "Great job!"]
        : r >= 0.4
          ? ["focus", "좋아요, 조금만 더! 💪", "Good, keep practicing!"]
          : ["huh", "다시 한번 해 봐요! 🌱", "Let’s try again!"];
  const again = useRef<HTMLDivElement>(null);
  useEffect(() => again.current?.querySelector("button")?.focus(), []);
  return (
    <div className={cn(boxClass, "text-center")} aria-live="polite">
      <QLabel ko="결과" en="Result" />
      <div className="mx-auto mt-2 w-30 [&_svg]:h-auto [&_svg]:w-full">
        <Ieung mood={mood} />
      </div>
      <div className="mt-2 mb-1 font-display text-[3rem] leading-[1.1]">
        {score} / {length}
      </div>
      <div>
        <span className="block font-display text-[1.3rem]">{ko}</span>
        <span className="text-[0.85rem] font-bold text-muted">{en}</span>
      </div>
      {missed.length > 0 && (
        <>
          <p className="mt-4 text-[0.85rem] font-bold text-muted">틀린 문제 다시 보기 · Review</p>
          <ul className="mt-4 grid gap-1.5 text-left">
            {missed.map((q) => (
              <li key={q.id} className="flex justify-between gap-2 rounded-sm bg-bg px-3 py-2 font-bold">
                <span>{q.review}</span>
                <b className="font-display font-normal text-ok-ink">{q.answer}</b>
              </li>
            ))}
          </ul>
        </>
      )}
      <div ref={again}>
        <Btn ko="다시 하기" en="Play again" onClick={onRestart} />
      </div>
    </div>
  );
}
