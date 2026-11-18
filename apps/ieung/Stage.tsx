/* ============================================================
   스위치 무대 — 이응이가 곧 ㅇ 이다 (#97).
   첫자리에서는 눈 감고 조용히 자리만 지키고(🤫), 받침으로 폴짝 뛰어내리면
   코로 「ng~」 울린다. 첫자리는 비울 수 없어서 흐린 ㅇ 이 자리를 지킨다.

   칸은 좌표로 놓는다 — 이응이가 칸 사이를 미끄러져 가야 해서 (left/top 트랜지션).
   뛰는 곡선은 안쪽 wrapper 의 ie-hop 키프레임. 옮길 때마다 key 를 바꿔 다시 돈다.
   ============================================================ */
import { useState } from "react";
import { cn, Ieung } from "@yj/ui";
import { shapeOf } from "@yj/korean/hangul";
import type { Seat } from "./data";

const W = 248;
const H = 286;
const GAP = 8;
type Rect = { x: number; y: number; w: number; h: number };

/** 세로 모음은 오른쪽, 가로 모음은 아래, 받침은 맨 아래 (교재 순서) */
function layout(tall: boolean): { cho: Rect; jung: Rect; jong: Rect } {
  const jongH = 104;
  const topH = H - jongH - GAP;
  if (tall) {
    const choW = 150;
    return {
      cho: { x: 0, y: 0, w: choW, h: topH },
      jung: { x: choW + GAP, y: 0, w: W - choW - GAP, h: topH },
      jong: { x: 0, y: topH + GAP, w: W, h: jongH },
    };
  }
  const jungH = 56;
  const choH = topH - jungH - GAP;
  return {
    cho: { x: 0, y: 0, w: W, h: choH },
    jung: { x: 0, y: choH + GAP, w: W, h: jungH },
    jong: { x: 0, y: topH + GAP, w: W, h: jongH },
  };
}

const at = (r: Rect) => ({ left: r.x, top: r.y, width: r.w, height: r.h });
const cell = "absolute flex flex-col items-center justify-center rounded-lg transition-[left,top,width,height,background-color,opacity] duration-300 motion-reduce:transition-none";

export function Stage({ vowel, rom, seat, onMove }: { vowel: string; rom: string; seat: Seat; onMove: (s: Seat) => void }) {
  const L = layout(shapeOf(vowel) === "tall");
  const top = seat === "cho";
  // 옮길 때마다 늘려 hop 애니메이션을 다시 돌린다
  const [hops, setHops] = useState(0);
  const move = (s: Seat) => {
    if (s !== seat) setHops((n) => n + 1);
    onMove(s);
  };

  const MASCOT = 92;
  const home = top ? L.cho : L.jong;
  const mx = top ? home.x + (home.w - MASCOT) / 2 : home.x + 14; // 받침에서는 왼쪽으로 — 오른쪽에 음파 자리
  const my = home.y + (home.h - MASCOT) / 2 - (top ? 10 : 2);

  return (
    <div className="relative mx-auto select-none" style={{ width: W, height: H }}>
      {/* 첫자리 — 이응이가 없으면 흐린 ㅇ 이 자리를 지킨다 */}
      <button
        type="button"
        className={cn(cell, top ? "bg-(--ie-silent-bg) text-(--ie-silent-ink)" : "border-2 border-dashed border-line bg-bg text-muted")}
        style={at(L.cho)}
        onClick={() => move("cho")}
        aria-label="ㅇ을 첫자리로 / Move ㅇ to the top"
      >
        <span className={cn("font-display text-[3rem] leading-none transition-opacity duration-300", top ? "opacity-0" : "opacity-40")} aria-hidden="true">
          ㅇ
        </span>
        <span className="absolute bottom-2 text-[0.68rem] font-extrabold">{top ? "🤫 silent" : "자리만 · seat only"}</span>
      </button>

      {/* 모음 */}
      <div className={cn(cell, "bg-(--ie-vowel-bg) text-(--ie-vowel-ink)")} style={at(L.jung)}>
        <span className="font-display text-[2.6rem] leading-none">{vowel}</span>
        <span className="mt-1 text-[0.68rem] font-extrabold">{rom}</span>
      </div>

      {/* 받침 자리 */}
      <button
        type="button"
        className={cn(cell, top ? "border-2 border-dashed border-line bg-bg text-muted" : "bg-(--ie-ng-bg) text-(--ie-ng-ink)")}
        style={at(L.jong)}
        onClick={() => move("jong")}
        aria-label="ㅇ을 받침으로 / Move ㅇ to the bottom"
      >
        {top && (
          <span className="leading-[1.2]">
            <span className="block font-display text-[1rem]">⬇ 받침 자리</span>
            <span className="text-[0.68rem] font-extrabold">tap to drop ㅇ here</span>
          </span>
        )}
        {!top && <span className="absolute right-3 bottom-2 font-display text-[1.2rem] leading-none motion-safe:animate-[ie-hum_1.2s_ease-in-out_infinite]">👃 ng~</span>}
      </button>

      {/* 음파 — 받침에서만. 이응이 오른쪽에서 퍼진다 */}
      {!top && (
        <div className="pointer-events-none absolute flex items-center text-(--ie-ng-ink)" style={{ left: mx + MASCOT - 4, top: my + MASCOT / 2 - 26, height: 52 }} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="-ml-3 block size-[52px] rounded-full border-r-[4px] border-current opacity-0 motion-safe:animate-[ie-ring_1.4s_ease-out_infinite] motion-reduce:opacity-60"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
        </div>
      )}

      {/* 이응이 = ㅇ. 눌러도 자리가 바뀐다 */}
      <button
        type="button"
        className="absolute transition-[left,top] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        style={{ left: mx, top: my, width: MASCOT, height: MASCOT }}
        onClick={() => move(top ? "jong" : "cho")}
        aria-label={top ? "이응이를 받침으로 / Drop ㅇ to the bottom" : "이응이를 첫자리로 / Jump ㅇ back to the top"}
      >
        <span key={hops} className="block size-full motion-safe:animate-[ie-hop_0.5s_cubic-bezier(0.3,0.7,0.4,1)] [&_svg]:h-auto [&_svg]:w-full">
          <Ieung mood={top ? "sleepy" : "yay"} />
        </span>
      </button>
    </div>
  );
}
