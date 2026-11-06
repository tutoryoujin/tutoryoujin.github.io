import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ieung, type Mood } from "./Ieung";
import { canSpeak, speak } from "./speech";
import { Btn } from "./parts";

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

const shuffle = <T,>(a: T[]) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

type Round = { q: Question; choices: Choice[]; picked: Choice | null };

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
    if (round?.picked) nextRef.current?.querySelector<HTMLButtonElement>(".yj-btn:last-child")?.focus();
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
    <div className="yj-box">
      <div className="yj-score">
        <span>
          문제 Question <b>{done + (picked ? 0 : 1)} / {length}</b>
        </span>
        <span>
          맞힌 개수 Score <b>{score}</b>
        </span>
      </div>
      <div className="yj-qlabel">
        <span className="ko">{label.ko}</span>
        {label.en}
      </div>
      {q.prompt}
      <div className="yj-opts">
        {choices.map((c) => {
          const isAnswer = c.text === q.answer;
          const cls = picked ? (isAnswer ? "is-right" : c === picked ? "is-wrong" : "") : "";
          return (
            <button key={c.text} className={`yj-opt ${cls}`} type="button" disabled={!!picked} onClick={() => pick(c)}>
              {/* 색만으로 알리지 않는다 */}
              {cls === "is-right" && <span aria-hidden="true">✓ </span>}
              {cls === "is-wrong" && <span aria-hidden="true">✗ </span>}
              {c.text}
            </button>
          );
        })}
      </div>
      <div className="yj-feedback" aria-live="polite">
        {picked &&
          (ok ? (
            <>
              <span className="ko">맞아요! 🎉 {q.right}</span>
              <span className="en">Correct!</span>
            </>
          ) : (
            <>
              <span className="ko">아쉬워요! 정답은 ‘{q.answer}’예요.</span>
              <span className="en">Not quite — the answer is ‘{q.answer}’.</span>
              {picked.why && (
                <>
                  <span className="yj-why">{picked.why.ko}</span>
                  <span className="en">{picked.why.en}</span>
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
    <div className="yj-box yj-result" aria-live="polite">
      <div className="yj-qlabel">
        <span className="ko">결과</span>Result
      </div>
      <div className="yj-result-mascot">
        <Ieung mood={mood} />
      </div>
      <div className="yj-result-score">
        {score} / {length}
      </div>
      <div className="yj-result-msg">
        <span className="ko">{ko}</span>
        <span className="en">{en}</span>
      </div>
      {missed.length > 0 && (
        <>
          <p className="yj-missed-title">틀린 문제 다시 보기 · Review</p>
          <ul className="yj-missed">
            {missed.map((q) => (
              <li key={q.id}>
                <span>{q.review}</span>
                <b>{q.answer}</b>
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
