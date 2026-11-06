/* ============================================================
   시각 읽기 규칙
   - 시는 고유어. 시 앞에서 짧아진다 (하나 → 한, 열둘 → 열두)
   - 분은 한자어
   - 30분은 ‘반’이라고도 한다
   ============================================================ */
import { josa, native, nativeCounter, sino } from "@yj/korean/numbers";
import type { Choice } from "@yj/ui";

export const readHour = (h: number) => nativeCounter(h) + " 시";
export const readMin = (m: number) => sino(m) + " 분";
export const readTime = (h: number, m: number) => (m ? `${readHour(h)} ${readMin(m)}` : readHour(h));
/** 하나 → 한 처럼 시 앞에서 꼴이 바뀌는지 */
export const contracted = (h: number) => nativeCounter(h) !== native(h);

/** 시각은 자정부터 센 분(0~1439) 하나로 들고 있다 */
export const parts = (t: number) => {
  const h24 = Math.floor(t / 60);
  return { h: h24 % 12 || 12, m: t % 60, pm: h24 >= 12 };
};
export const wrapDay = (n: number) => ((n % 1440) + 1440) % 1440;

/** 학생들이 실제로 하는 실수로 오답을 만든다 */
export function wrongChoices(h: number, m: number, pickExtra = (xs: Choice[]) => xs[Math.floor(Math.random() * xs.length)]): Choice[] {
  const min = readMin(m);
  // 핵심 두 가지는 매번: 시를 한자어로, 분을 고유어로
  const core: Choice[] = [
    {
      text: `${sino(h)} 시 ${min}`,
      why: { ko: `시는 고유어로 읽어요. ${sino(h)} 시가 아니라 ${readHour(h)}!`, en: "Hours use native Korean numbers: 한, 두, 세…" },
    },
    {
      text: `${readHour(h)} ${native(m)} 분`,
      why: { ko: `분은 한자어로 읽어요. ${native(m)} 분이 아니라 ${min}!`, en: "Minutes use Sino-Korean numbers: 일, 이, 삼…" },
    },
  ];
  const extra: Choice[] = [];
  if (contracted(h))
    extra.push({
      text: `${native(h)} 시 ${min}`,
      why: {
        ko: `${josa(native(h), "은", "는")} 시 앞에서 ${josa(nativeCounter(h), "이", "가")} 돼요.`,
        en: `${native(h)} becomes ${nativeCounter(h)} before 시.`,
      },
    });
  // 바늘을 바꿔 읽음: 긴 바늘을 시로, 짧은 바늘을 분으로
  const sh = m / 5 || 12,
    sm = (h % 12) * 5;
  if (Number.isInteger(sh) && !(sh === h && sm === m))
    extra.push({
      text: readTime(sh, sm),
      why: { ko: "짧은 바늘이 시, 긴 바늘이 분이에요.", en: "The short hand is the hour, the long hand is the minutes." },
    });
  // 40분이 넘으면 시침이 다음 숫자에 가까워서 한 시간 앞서 읽기 쉽다
  const next = (h % 12) + 1;
  if (m >= 40)
    extra.push({
      text: `${readHour(next)} ${min}`,
      why: { ko: `짧은 바늘이 아직 ${next}에 닿지 않았어요.`, en: `The hour hand hasn't reached ${next} yet.` },
    });
  return extra.length ? [...core, pickExtra(extra)] : core;
}
