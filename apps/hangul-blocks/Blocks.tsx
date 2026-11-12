/* ============================================================
   블록 그리기. 칸 하나 = <span> 하나.

   - 같은 key 의 칸은 자리가 바뀌면 미끄러져 간다 (left/top 트랜지션).
     가 → 고 로 바꾸면 ㄱ 의 칸들이 옆에서 위로 올라간다.
   - 새 key 의 칸은 위에서 떨어진다 (blk-drop 애니메이션).
   ============================================================ */
import type { CSSProperties, MouseEvent } from "react";
import { cn } from "@yj/ui";

/* 입체 칸 — 새 색을 만들지 않고 흰색·검은색을 반투명하게 겹친다 (세기는 --blk-hi · --blk-lo) */
export const bevel =
  "[box-shadow:inset_var(--bevel)_var(--bevel)_0_rgb(255_255_255/var(--blk-hi)),inset_calc(var(--bevel)*-1)_calc(var(--bevel)*-1)_0_rgb(0_0_0/var(--blk-lo)),inset_0_0_0_1px_rgb(0_0_0/var(--blk-lo))]";
const cellClass = cn(
  "absolute box-border",
  bevel,
  "transition-[left,top,width,height,opacity] duration-300 ease-[ease]",
  // 키프레임 blk-drop 은 hangul-blocks.css. 지연 --d 는 줄마다 조금씩
  "animate-[blk-drop_0.38s_cubic-bezier(0.3,1.3,0.5,1)_var(--d,0ms)_both]",
  "motion-reduce:transition-none motion-reduce:animate-none",
);

export type BlockCell = {
  key: string;
  x: number;
  y: number;
  /** 색 별칭 앞부분 — "blk-cho" → --blk-cho-bg */
  tone: string;
  /** 빈자리 ㅇ 처럼 흐리게 */
  ghost?: boolean;
  /** 떨어진 뒤 한 번 진하게 깜빡 (모음의 긴 획). 새로 생긴 칸에서만 돈다 */
  flash?: boolean;
  /** 다른 조각을 고르고 있어서 뒤로 물러난 칸 */
  dim?: boolean;
};

/** 누른 자리에서 가장 가까운 칸 — 칸 사이 빈 곳을 눌러도 무언가 잡히게 */
function nearest(cells: BlockCell[], x: number, y: number) {
  let best: BlockCell | undefined;
  let bd = Infinity;
  for (const c of cells) {
    const d = (c.x + 0.5 - x) ** 2 + (c.y + 0.5 - y) ** 2;
    if (d < bd) [best, bd] = [c, d];
  }
  return best;
}

/* 떨어지기(blk-drop)가 끝날 즈음 진하게 두 번 (blk-flash · 키프레임은 hangul-blocks.css) */
const flashClass =
  "animate-[blk-drop_0.38s_cubic-bezier(0.3,1.3,0.5,1)_var(--d,0ms)_both,blk-flash_1.1s_ease-in-out_0.4s] motion-reduce:animate-none";

/**
 * onPick 이 있으면 블록을 누를 수 있다 — 누른 곳에서 가장 가까운 칸을 넘긴다.
 * 손가락·마우스용 지름길이다. 키보드·읽기 프로그램은 같은 일을 하는 버튼을 따로 둔다 (그래서 그림은 role="img" 그대로)
 */
export function Blocks({
  cells,
  w,
  h,
  size,
  label,
  onPick,
}: {
  cells: BlockCell[];
  w: number;
  h: number;
  size: number;
  label: string;
  onPick?: (cell: BlockCell) => void;
}) {
  const pick =
    onPick &&
    ((e: MouseEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const c = nearest(cells, (e.clientX - r.left) / size, (e.clientY - r.top) / size);
      if (c) onPick(c);
    });
  return (
    <div
      className={cn("relative mx-auto transition-[width,height] duration-300 ease-[ease] motion-reduce:transition-none", pick && "cursor-pointer")}
      role="img"
      aria-label={label}
      style={{ width: w * size, height: h * size }}
      onClick={pick}
    >
      {cells.map((c) => (
        <span
          key={c.key}
          className={cn(cellClass, c.ghost && "opacity-45", c.dim && "opacity-50", c.flash && flashClass)}
          style={
            {
              left: c.x * size,
              top: c.y * size,
              width: size,
              height: size,
              background: `var(--${c.tone}-bg)`,
              "--bevel": `${Math.max(2, Math.round(size * 0.13))}px`,
              "--d": `${c.y * 25}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** 긴 쪽이 box px 에 들어가는 칸 크기. 너무 커지지 않게 max 로 막는다 */
export const fitSize = (w: number, h: number, box: number, max: number) => Math.min(max, Math.floor(box / Math.max(w, h)));
