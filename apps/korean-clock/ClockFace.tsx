import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { readHour, readMin, wrapDay } from "./reading";

/* ============================================================
   시계판. viewBox 300×300, 가운데 (150,150).

   바늘(줄기)은 통째로 돌리고, 손잡이는 끝자리로 옮기기만 한다.
   손잡이까지 돌리면 "분" 글자가 거꾸로 서서 "곰"처럼 보인다.
   ============================================================ */
const C = 150;
const HOUR_LEN = 64;
const MIN_LEN = 104;
const polar = (r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

type Hand = "hour" | "min";
type Props = { t: number; onChange?: (t: number) => void; label?: string };

export function ClockFace({ t, onChange, label }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Hand | null>(null);
  const live = !!onChange;
  const h12 = Math.floor(t / 60) % 12;
  const m = t % 60;
  const hourDeg = (h12 + m / 60) * 30;
  const minDeg = m * 6;

  const angleOf = (e: PointerEvent) => {
    const el = svg.current!;
    const pt = el.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(el.getScreenCTM()!.inverse());
    const deg = (Math.atan2(p.x - C, -(p.y - C)) * 180) / Math.PI;
    return { deg: (deg + 360) % 360, dist: Math.hypot(p.x - C, p.y - C) };
  };

  // 분침: 바뀐 만큼만 더한다. 12를 넘을 때 시가 따라 넘어가도록
  // 시침: 분은 그대로 두고 시만. 11 ↔ 12 를 넘으면 오전·오후가 뒤집힌다
  const moveTo = (hand: Hand, e: PointerEvent) => {
    const { deg } = angleOf(e);
    if (hand === "min") {
      let d = (Math.round(deg / 6) % 60) - m;
      if (d > 30) d -= 60;
      if (d < -30) d += 60;
      onChange!(wrapDay(t + d));
    } else {
      let d = ((Math.round(deg / 30 - m / 60) + 12) % 12) - h12;
      if (d > 6) d -= 12;
      if (d < -6) d += 12;
      onChange!(wrapDay(t + d * 60));
    }
  };

  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (!live) return;
    const target = (e.target as Element).closest("[data-hand]") as SVGElement | null;
    // 바늘을 정확히 못 잡아도, 가운데 가까우면 시침·바깥이면 분침
    const hand = (target?.dataset.hand as Hand) ?? (angleOf(e).dist < 78 ? "hour" : "min");
    svg.current!.setPointerCapture(e.pointerId);
    setDrag(hand);
    moveTo(hand, e);
    e.preventDefault();
  };

  // 화살표로 바늘 하나씩. Shift 를 누르면 5분씩
  const key = (hand: Hand) => (e: KeyboardEvent) => {
    const dir = ({ ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 } as Record<string, number>)[e.key];
    if (!dir || !onChange) return;
    e.preventDefault();
    onChange(wrapDay(t + dir * (hand === "hour" ? 60 : e.shiftKey ? 5 : 1)));
  };

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const big = i % 5 === 0;
    const [x1, y1] = polar(big ? 128 : 133, i * 6);
    const [x2, y2] = polar(139, i * 6);
    return <line key={i} className={big ? "tick big" : "tick"} x1={x1} y1={y1} x2={x2} y2={y2} />;
  });
  const nums = Array.from({ length: 12 }, (_, k) => {
    const i = k + 1;
    const [mx, my] = polar(116, i * 30);
    const [hx, hy] = polar(90, i * 30);
    return (
      <g key={i}>
        {/* 분 숫자는 바깥쪽에 작게, 시 숫자는 안쪽에 크게 */}
        <text className="min-num" x={mx} y={my}>
          {String((i * 5) % 60).padStart(2, "0")}
        </text>
        <text className="hour-num" x={hx} y={hy}>
          {i}
        </text>
      </g>
    );
  });

  const stem = (hand: Hand, len: number, deg: number) => (
    <g className={`hand hand-${hand}`} data-hand={hand} transform={`rotate(${deg} ${C} ${C})`}>
      <line className="hit" x1={C} y1={C} x2={C} y2={C - len} />
      <line className="stem" x1={C} y1={C + 14} x2={C} y2={C - len} />
    </g>
  );
  const knob = (hand: Hand, len: number, deg: number, text: string, aria: string, value: string) => {
    const [x, y] = polar(len, deg);
    return (
      <g
        className={`knob-g knob-${hand} ${drag === hand ? "active" : ""}`}
        data-hand={hand}
        transform={`translate(${x} ${y})`}
        tabIndex={0}
        role="slider"
        aria-label={aria}
        aria-valuetext={value}
        onKeyDown={key(hand)}
      >
        <circle className="knob" cx={0} cy={0} r={15} />
        <text className="knob-text" x={0} y={0}>
          {text}
        </text>
      </g>
    );
  };

  const h = h12 || 12;
  return (
    <svg
      ref={svg}
      className={`face ${live ? "live" : ""} ${drag ? "dragging" : ""}`}
      viewBox="0 0 300 300"
      role={live ? "group" : "img"}
      aria-label={label ?? (live ? "시계 — 바늘을 끌어서 돌려요 / Drag the hands" : "시계 / Clock")}
      onPointerDown={down}
      onPointerMove={(e) => drag && moveTo(drag, e)}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
    >
      <circle className="rim" cx={C} cy={C} r={142} />
      {ticks}
      {nums}
      {stem("hour", HOUR_LEN, hourDeg)}
      {stem("min", MIN_LEN, minDeg)}
      <circle className="cap" cx={C} cy={C} r={7} />
      {/* 퀴즈 시계에는 손잡이 글자를 두지 않는다 — 어느 바늘이 시인지 읽는 것도 연습이다 */}
      {live && knob("hour", HOUR_LEN, hourDeg, "시", "시침 / Hour hand", readHour(h))}
      {live && knob("min", MIN_LEN, minDeg, "분", "분침 / Minute hand", m ? readMin(m) : "정각")}
    </svg>
  );
}
