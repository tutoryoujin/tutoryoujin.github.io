/* ============================================================
   시각 읽기 — 시계 앱 · 블로그 글이 같이 쓴다 (#114)
   - 시는 고유어. 시 앞에서 짧아진다 (하나 → 한, 열둘 → 열두)
   - 분은 한자어
   - 30분은 ‘반’이라고도 한다
   ============================================================ */
import { nativeCounter, sino } from "./numbers";

export const readHour = (h: number) => nativeCounter(h) + " 시";
export const readMin = (m: number) => sino(m) + " 분";
export const readTime = (h: number, m: number) => (m ? `${readHour(h)} ${readMin(m)}` : readHour(h));
/** 시각은 자정부터 센 분(0~1439) 하나로 들고 있다 — 하루를 넘으면 감는다 */
export const wrapDay = (n: number) => ((n % 1440) + 1440) % 1440;
/** 30분을 ‘반’으로 */
export const readHalf = (h: number) => `${readHour(h)} 반`;
