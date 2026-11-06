import { useState } from "react";

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
