/* ============================================================
   블록 그리기. 칸 하나 = <span> 하나.

   - 같은 key 의 칸은 자리가 바뀌면 미끄러져 간다 (left/top 트랜지션).
     가 → 고 로 바꾸면 ㄱ 의 칸들이 옆에서 위로 올라간다.
   - 새 key 의 칸은 위에서 떨어진다 (blk-drop 애니메이션).
   ============================================================ */
import type { CSSProperties } from "react";

export type BlockCell = {
  key: string;
  x: number;
  y: number;
  /** 색 별칭 앞부분 — "blk-cho" → --blk-cho-bg */
  tone: string;
  /** 빈자리 ㅇ 처럼 흐리게 */
  ghost?: boolean;
};

export function Blocks({ cells, w, h, size, label }: { cells: BlockCell[]; w: number; h: number; size: number; label: string }) {
  return (
    <div className="blk" role="img" aria-label={label} style={{ width: w * size, height: h * size }}>
      {cells.map((c) => (
        <span
          key={c.key}
          className={`blk-cell${c.ghost ? " is-ghost" : ""}`}
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
