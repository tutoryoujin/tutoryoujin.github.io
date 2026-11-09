/* ============================================================
   홈 — 덱 더미 + 진행률.
   덱 하나가 카드 한 장. 세로로 겹쳐 쌓아 포개 둔 더미처럼 보이게 한다.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import { cn, Ieung, type Mood } from "@yj/ui";
import { Art, TONE } from "./Art";
import { DECKS, folderArtSrc } from "./decks";
import { daysAway, progress } from "./store";

/** 화면 맨 위 제목 (홈, 출처) */
export function Hero({ ko, en }: { ko: string; en: string }) {
  return (
    <section className="px-0.5 pt-1">
      <h1 className="text-[1.55rem] leading-[1.25] font-extrabold">{ko}</h1>
      <p className="mt-1 text-[0.92rem] font-bold text-muted">{en}</p>
    </section>
  );
}

/* ---------- 덱 더미 ----------
   덱 하나가 카드 한 장. 음수 마진으로 겹쳐 쌓는다.
   overflow-hidden 이 이 컴포넌트의 핵심 — 겉면 그림이 이 모서리에 잘린다.
   오른쪽 padding 은 겉면 그림 자리. 그림 폭(artClass)과 같이 움직여야
   좁은 화면에서 글자가 그림에 닿지 않는다.
   높이는 전부 같다. 가장 긴 설명(두 줄) + 진행 막대가 들어가는 높이.
   z-2 를 같이 올리지 않으면 아래 카드에 가려 안 올라온 것처럼 보인다.
   hover: 는 포인터가 있는 기기에서만 — 터치에서는 hover 가 눌린 채로 남는다. */
const folder =
  "relative block min-h-44 overflow-hidden rounded-xl p-5 pr-[clamp(136px,42%,168px)] text-ink no-underline shadow-folder not-first:-mt-(--folder-overlap) " +
  "transition-[translate,box-shadow] duration-140 ease-[ease] hover:z-2 hover:-translate-y-1.5 hover:shadow-[var(--shadow-folder),var(--shadow-card)] " +
  "focus-visible:z-2 focus-visible:-translate-y-1.5 active:z-2 active:-translate-y-0.5 motion-reduce:translate-none! motion-reduce:transition-none";
/* 제목은 알약 — 서류철에 붙이는 이름표다. 카드가 -bg 이므로 알약은 -ink 로
   채우고 글자를 -bg 로 뺀다. 흰 알약은 파스텔 위에서 1.3:1 이라 안 보인다.
   위아래 padding 이 다른 건 Jua 의 글자가 기준선보다 위에 쏠려 있어서다. */
const label = "inline-block rounded-full px-4 pt-2.75 pb-2.25 font-display text-[1.2rem] leading-none";
/* 폴더 위에서는 muted 를 쓰지 않는다 — 파스텔 8색 중 넷이 4.5:1 에 못 미친다.
   영문도 ink 로 두고 크기와 굵기로만 눌러 준다. */
const gloss = "mt-1.5 text-[0.76rem] font-semibold";
/* 겉면 그림 — 바탕 타일 없이 투명 PNG 를 그대로. 일부러 밖으로 밀어 내
   카드 모서리가 잘라 주게 둔다. 잘리는 자리가 그림마다 달라서
   같은 틀인데도 덱마다 다르게 보인다. */
const artClass = "pointer-events-none absolute -right-4 -bottom-5.5 h-auto w-[clamp(112px,37%,150px)] [-webkit-user-drag:none]";
/* 이미지를 못 불러왔을 때의 대체 (예전 .folder-art.emoji — mb-4 는 그때 같이 붙던 .emoji 몫) */
const artFallback = "pointer-events-none absolute right-1 -bottom-1.5 mb-4 text-[clamp(3rem,14vw,4.6rem)] leading-none";

export function Home() {
  // 이응은 보통 손을 흔든다. 사흘 넘게 안 왔으면 졸고 있다 — 매일 오는 학습자에게는 보이지 않는다
  const away = daysAway();
  const rest: Mood = away !== null && away >= 3 ? "sleepy" : "basic";
  const [mood, setMood] = useState<Mood>(rest);
  const tease = useRef(0);
  useEffect(() => () => clearTimeout(tease.current), []);

  return (
    <>
      <Hero ko="오늘은 어떤 카드로 공부할까요?" en="What would you like to learn today?" />
      <nav aria-label="덱 / Decks">
        {DECKS.map((deck) => {
          const p = progress(deck);
          const pct = Math.round((p.done / p.total) * 100);
          const done = p.started && p.done === p.total;
          const meta = !p.started ? `${p.total}장 · 아직 안 열어봤어요` : done ? `${p.total}장 모두 외웠어요 🎉` : `${p.done} / ${p.total} 외웠어요`;
          return (
            <a key={deck.id} className={cn(folder, TONE[deck.color], "bg-(--g-bg)")} href={`#/deck/${deck.id}`}>
              <span className={cn(label, "bg-(--g-ink) text-(--g-bg)")}>{deck.title.ko}</span>
              {/* 한글은 font-app 의 두 번째 글꼴인 Jua 로 떨어진다. 둥근 서체라
                  .85rem 에서는 뭉쳐서, 본문보다 한 단계만 작게 둔다. */}
              <p className="mt-3 text-[0.92rem] leading-[1.45] font-bold">{deck.blurb}</p>
              <p className={gloss}>
                {deck.title.en} · {meta}
              </p>
              {p.started && !done && (
                <div className="mt-3 h-1.5 w-[56%] rounded-full bg-[color-mix(in_srgb,var(--g-ink)_22%,transparent)]" aria-hidden="true">
                  <i className="block h-full rounded-[inherit] bg-(--g-ink)" style={{ width: pct + "%" }} />
                </div>
              )}
              <Art src={folderArtSrc(deck)} emoji={deck.emoji} className={artClass} fallbackClass={artFallback} />
            </a>
          );
        })}
        {/* 바탕을 비우면 겹친 자리로 위 카드의 밑동이 비친다 — bg 로 덮는다 */}
        <div className={cn(folder, "border-2 border-dashed border-line bg-bg shadow-none")}>
          <span className={cn(label, "bg-gray-bg text-gray-ink")}>곧 추가돼요</span>
          <p className={cn(gloss, "text-muted")}>More decks coming soon</p>
          {/* 숨은 재미 — 이응을 누르면 메롱 하고 돌아온다.
              빈 자리에서는 이응이 겉면 그림 자리를 대신한다. 입체 이응은 240x250.
              눌러 볼 수 있는 숨은 재미라 버튼이지만 버튼처럼 보이지 않게 둔다. */}
          <button
            className="absolute right-3 bottom-2 h-23 w-22 p-0 focus-visible:rounded-sm [&_svg]:size-full"
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
