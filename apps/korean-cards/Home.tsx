/* ============================================================
   홈 — 덱 더미 + 진행률.
   덱 하나가 카드 한 장. 세로로 겹쳐 쌓아 포개 둔 더미처럼 보이게 한다.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import { Ieung, type Mood } from "@yj/ui";
import { Art } from "./Art";
import { DECKS, folderArtSrc } from "./decks";
import { daysAway, progress } from "./store";

export function Home() {
  // 이응은 보통 손을 흔든다. 사흘 넘게 안 왔으면 졸고 있다 — 매일 오는 학습자에게는 보이지 않는다
  const away = daysAway();
  const rest: Mood = away !== null && away >= 3 ? "sleepy" : "basic";
  const [mood, setMood] = useState<Mood>(rest);
  const tease = useRef(0);
  useEffect(() => () => clearTimeout(tease.current), []);

  return (
    <>
      <section className="home-hero">
        <h1>오늘은 어떤 카드로 공부할까요?</h1>
        <p>What would you like to learn today?</p>
      </section>
      <nav className="deck-stack" aria-label="덱 / Decks">
        {DECKS.map((deck) => {
          const p = progress(deck);
          const pct = Math.round((p.done / p.total) * 100);
          const done = p.started && p.done === p.total;
          const meta = !p.started ? `${p.total}장 · 아직 안 열어봤어요` : done ? `${p.total}장 모두 외웠어요 🎉` : `${p.done} / ${p.total} 외웠어요`;
          return (
            <a key={deck.id} className={`folder c-${deck.color}`} href={`#/deck/${deck.id}`}>
              <span className="folder-label">{deck.title.ko}</span>
              <p className="folder-desc">{deck.blurb}</p>
              <p className="folder-gloss">
                {deck.title.en} · {meta}
              </p>
              {p.started && !done && (
                <div className="folder-bar" aria-hidden="true">
                  <i style={{ width: pct + "%" }} />
                </div>
              )}
              <Art src={folderArtSrc(deck)} emoji={deck.emoji} className="folder-art" fallbackClass="folder-art emoji" />
            </a>
          );
        })}
        <div className="folder soon">
          <span className="folder-label">곧 추가돼요</span>
          <p className="folder-gloss">More decks coming soon</p>
          {/* 숨은 재미 — 이응을 누르면 메롱 하고 돌아온다 */}
          <button
            className="soon-art"
            type="button"
            aria-label="이응 / Ieung"
            onClick={() => {
              clearTimeout(tease.current);
              setMood("tongue");
              tease.current = window.setTimeout(() => setMood(rest), 2800);
            }}
          >
            <Ieung mood={mood} />
          </button>
        </div>
      </nav>
    </>
  );
}
