/* ============================================================
   입 옆모습 단면도 (#97) — 오른쪽을 보는 얼굴. 공기는 목에서 올라온다.

   길은 세 개: 목(왼쪽 세로) · 코(위 가로) · 입(아래 가로).
   문은 두 개:
   - 여린입천장(lavender) — 들리면 코 길이 닫히고, 내려오면 열린다.
   - 혀 뒤(pink) — 올라가면 입 길이 닫힌다.

     아 [a]  : 여린입천장 ↑ · 혀 ↓  → 공기가 입으로 나간다
     앙 [ng] : 여린입천장 ↓ · 혀 ↑  → 입은 막히고 코로 계속 흐른다
     악 [k]  : 여린입천장 ↑ · 혀 ↑  → 둘 다 막혀 딱 멈춘다

   쉽게 그린 그림이다 — 정확한 해부도가 아니라 공기가 어디로 가는지 보여 주는 것.
   공기 점은 SVG animateMotion (Safari 까지 같은 모양). 움직임 줄이기면 점을 길 위에 멈춰 둔다.
   ============================================================ */
import { cn } from "@yj/ui";
import { useEffect, useState } from "react";

export type MouthMode = "a" | "ng" | "k";

/** 여린입천장 각도 (경첩 100,79 기준) · 혀 내림(px) · 공기 길 · 공기 색 */
const MODE: Record<MouthMode, { velum: number; tongue: number; air: string; tone: string; stop: boolean }> = {
  a: { velum: 0, tongue: 48, air: "M56 210 V123 H318", tone: "ie-vowel", stop: false },
  ng: { velum: -90, tongue: 40, air: "M56 210 V46 H318", tone: "ie-ng", stop: false },
  k: { velum: 0, tongue: 0, air: "M56 210 V100", tone: "ie-g", stop: true },
};

function useReducedMotion() {
  const q = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  const [r, setR] = useState(!!q?.matches);
  useEffect(() => {
    if (!q) return;
    const on = () => setR(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, [q]);
  return r;
}

const label = "fill-(--ink) font-display text-[13px]";
const labelEn = "fill-(--muted) text-[9px] font-extrabold";
const move = "transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

export function Mouth({ mode }: { mode: MouthMode }) {
  const m = MODE[mode];
  const still = useReducedMotion();
  const DOTS = 7;
  const DUR = m.stop ? 1.2 : 2.2;

  return (
    <svg viewBox="0 0 330 236" className="mx-auto block w-full max-w-[380px]" role="img" aria-label={ARIA[mode]}>
      {/* 머리 — 길 바깥은 살 */}
      <rect x="22" y="14" width="262" height="196" rx="26" className="fill-(--bg) stroke-(--line)" strokeWidth="2" />

      {/* 길 — 목 · 코 · 입. 코와 입은 오른쪽 끝에서 밖으로 열린다 */}
      <g className="fill-(--sky)">
        <rect x="40" y="46" width="32" height="164" />
        <path d="M56 30 H284 V62 H40 V46 Q40 30 56 30 Z" />
        <rect x="72" y="96" width="212" height="54" />
      </g>

      {/* 나가는 곳 */}
      {/* 오른쪽 끝 자리가 좁다 (292 → 330) — 영어는 작게, 이모지는 한국어 줄에 */}
      <text x="292" y="45" className={cn(label, "text-[11px]")}>
        nose
      </text>
      <text x="292" y="58" className={labelEn} lang="ko">
        👃 코
      </text>
      <text x="292" y="122" className={cn(label, "text-[11px]")}>
        mouth
      </text>
      <text x="292" y="135" className={labelEn} lang="ko">
        👄 입
      </text>
      <text x="80" y="226" className={label}>
        ↑ throat{" "}
        <tspan className={labelEn} lang="ko">
          목
        </tspan>{" "}
        <tspan className={labelEn}>· air comes up</tspan>
      </text>

      {/* 혀 — 아래로 내려가면 입 길이 열린다 */}
      <clipPath id="ie-jaw">
        <rect x="72" y="60" width="212" height="150" />
      </clipPath>
      <g clipPath="url(#ie-jaw)">
        <g className={move} style={{ transform: `translateY(${m.tongue}px)` }}>
          <path d="M72 230 V150 Q74 96 112 96 Q150 96 196 128 Q226 146 262 150 L262 230 Z" className="fill-(--pink-bg) stroke-(--pink-ink)" strokeWidth="2" />
          <text x="160" y="160" textAnchor="middle" className="fill-(--pink-ink) font-display text-[12px]">
            tongue{" "}
            <tspan className="text-[9px] font-extrabold" lang="ko">
              혀
            </tspan>
          </text>
        </g>
      </g>

      {/* 여린입천장 — 경첩(100,79). 0° 면 왼쪽으로 뻗어 코 길을 닫고, -90° 면 아래로 내려와 연다 */}
      <g className={move} style={{ transformBox: "view-box", transformOrigin: "100px 79px", transform: `rotate(${m.velum}deg)` }}>
        <path d="M104 72 H46 Q40 72 40 79 Q40 86 46 86 H104 Z" className="fill-(--lavender-bg) stroke-(--lavender-ink)" strokeWidth="2" />
      </g>

      {/* 공기 */}
      <g key={mode} className={`fill-(--${m.tone}-ink)`}>
        {Array.from({ length: DOTS }, (_, i) =>
          still ? (
            <circle key={i} r="4.5">
              <animateMotion dur="1s" path={m.air} keyPoints={`${(i + 0.5) / DOTS};${(i + 0.5) / DOTS}`} keyTimes="0;1" calcMode="linear" fill="freeze" />
            </circle>
          ) : (
            <circle key={i} r="4.5" opacity="0">
              <animateMotion dur={`${DUR}s`} begin={`${(i * DUR) / DOTS}s`} repeatCount="indefinite" path={m.air} />
              <animate attributeName="opacity" dur={`${DUR}s`} begin={`${(i * DUR) / DOTS}s`} repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.08;0.85;1" />
            </circle>
          ),
        )}
      </g>

      {/* 막힌 곳 표시 — 색만으로 알리지 않게 글자와 벽 */}
      {m.stop && (
        <g className="fill-(--ie-g-ink)">
          <rect x="44" y="90" width="24" height="5" rx="2" />
          <text x="80" y="52" className="font-display text-[15px]">
            Stop!{" "}
            <tspan className="text-[9px] font-extrabold" lang="ko">
              딱! 멈춤
            </tspan>
          </text>
        </g>
      )}
    </svg>
  );
}

const ARIA: Record<MouthMode, string> = {
  a: "아 [a]: tongue down, air goes out the mouth",
  ng: "앙 [ng]: back of the tongue closes the mouth, air keeps flowing through the nose",
  k: "악 [k]: mouth and nose both closed, the air stops",
};
