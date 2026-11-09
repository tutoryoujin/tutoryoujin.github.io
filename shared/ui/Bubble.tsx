import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/* ============================================================
   이응이 말풍선 — 한국어 한 줄, 영어는 바로 아래 작게.
   줄이 바뀔 때 톡 튀어나오게 하려면 부르는 쪽에서 key 를 바꾼다.
   꼬리: bottom = 이응이가 아래 (첫 화면), left = 이응이가 왼쪽 (한국어 카드).
   ============================================================ */
const TAIL = {
  bottom:
    "after:bottom-[-9px] after:left-1/2 after:-ml-2.5 after:border-b-0 after:border-t-sky",
  left: "after:top-1/2 after:left-[-9px] after:-mt-2.5 after:border-l-0 after:border-r-sky",
};

export function Bubble({
  ko,
  en,
  tail = "bottom",
  className,
  ...rest
}: { ko: ReactNode; en: ReactNode; tail?: keyof typeof TAIL } & HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "relative flex flex-col justify-center rounded-lg bg-sky px-4 py-3 font-display text-[1.1rem] leading-[1.35] text-sky-ink",
        "animate-[ieung-bubble_0.35s_cubic-bezier(0.3,1.5,0.5,1)] motion-reduce:animate-none",
        "after:absolute after:border-[10px] after:border-transparent after:content-['']",
        TAIL[tail],
        className,
      )}
      {...rest}
    >
      {ko}
      <em className="mt-0.5 block font-app text-[0.8rem] font-bold not-italic text-sky-ink opacity-80">{en}</em>
    </p>
  );
}

/** 누르면 말랑하게 눌렸다가 튄다. 다시 튀게 하려면 key 를 바꾼다 */
export const pokeClass = "block animate-[ieung-poke_0.45s_ease-out] motion-reduce:animate-none";
