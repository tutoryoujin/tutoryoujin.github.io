import { useState } from "react";
import type { Accent } from "@yj/ui";

/** 덱·카드 색. --g-bg / --g-ink 를 깔아 두면 안쪽은 bg-(--g-bg) text-(--g-ink) 로 쓴다.
    Tailwind 가 읽을 수 있게 문자열을 통째로 적는다 */
export const TONE: Record<Accent, string> = {
  yellow: "[--g-bg:var(--yellow-bg)] [--g-ink:var(--yellow-ink)]",
  pink: "[--g-bg:var(--pink-bg)] [--g-ink:var(--pink-ink)]",
  mint: "[--g-bg:var(--mint-bg)] [--g-ink:var(--mint-ink)]",
  blue: "[--g-bg:var(--blue-bg)] [--g-ink:var(--blue-ink)]",
  coral: "[--g-bg:var(--coral-bg)] [--g-ink:var(--coral-ink)]",
  lavender: "[--g-bg:var(--lavender-bg)] [--g-ink:var(--lavender-ink)]",
  orange: "[--g-bg:var(--orange-bg)] [--g-ink:var(--orange-ink)]",
  gray: "[--g-bg:var(--gray-bg)] [--g-ink:var(--gray-ink)]",
};

/** 카드 그림. 불러오지 못하면 이모지로 바꾼다 (이모지도 없으면 아무것도 안 그린다). */
export function Art({ src, emoji, className, fallbackClass }: { src: string; emoji?: string; className: string; fallbackClass: string }) {
  const [broken, setBroken] = useState(false);
  if (broken)
    return emoji ? (
      <span className={fallbackClass} aria-hidden="true">
        {emoji}
      </span>
    ) : null;
  return <img className={className} src={src} alt="" draggable={false} decoding="async" onError={() => setBroken(true)} />;
}
