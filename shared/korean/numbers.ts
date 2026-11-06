/* ============================================================
   한국어 숫자 읽기 — 모든 앱이 같이 쓴다.

   한자어(sino)  일 이 삼 …  — 연·월·일, 분, 전화번호, 가격
   고유어(native) 하나 둘 셋 … — 개수, 나이, 시
   고유어는 단위 앞에서 짧아진다: 하나 → 한, 둘 → 두, 셋 → 세, 넷 → 네, 스물 → 스무
   ============================================================ */
const SINO_DIGIT = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const NATIVE_ONES = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
const NATIVE_TENS = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"];
const COUNTER_ONES = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"];

/** 한자어 숫자. 0 ~ 9999. 1십·1백·1천의 '일'은 읽지 않는다 (십, 백, 천). */
export function sino(n: number): string {
  check(n, 0, 9999);
  if (n === 0) return "영";
  let s = "";
  for (const [unit, name] of [
    [1000, "천"],
    [100, "백"],
    [10, "십"],
  ] as const) {
    const q = Math.floor(n / unit);
    if (q) s += (q === 1 ? "" : SINO_DIGIT[q]) + name;
    n %= unit;
  }
  return s + SINO_DIGIT[n];
}

/** 고유어 숫자. 1 ~ 99. 단독으로 셀 때의 꼴 (하나, 둘, 스물) */
export function native(n: number): string {
  check(n, 1, 99);
  return NATIVE_TENS[Math.floor(n / 10)] + NATIVE_ONES[n % 10];
}

/** 단위(개·시·살·명) 앞의 고유어. 1 ~ 99. 한, 두, 세, 네, 스무 */
export function nativeCounter(n: number): string {
  check(n, 1, 99);
  const tens = Math.floor(n / 10),
    ones = n % 10;
  if (n === 20) return "스무";
  return NATIVE_TENS[tens] + COUNTER_ONES[ones];
}

/** 받침이 있으면 a(은·이·을·과), 없으면 b(는·가·를·와) 를 붙인다 */
export function josa(word: string, a: string, b: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const has = code >= 0 && code <= 11171 ? code % 28 !== 0 : false;
  return word + (has ? a : b);
}

function check(n: number, lo: number, hi: number) {
  if (!Number.isInteger(n) || n < lo || n > hi) throw new RangeError(`${n} 은(는) ${lo}~${hi} 범위가 아니에요`);
}
