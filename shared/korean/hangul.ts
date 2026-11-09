/* ============================================================
   한글 글자 합치기 · 나누기.

   유니코드 완성형은 공식 하나로 만든다.
     0xAC00 + (첫소리 × 21 + 모음) × 28 + 받침
   ============================================================ */

export const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] as const;
export const JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"] as const;
/** 0번은 받침 없음 */
export const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] as const;

const BASE = 0xac00;
const LAST = 0xd7a3;

/** 글자 하나로 합친다. 없는 자모면 null */
export function compose(cho: string, jung: string, jong = ""): string | null {
  const c = CHO.indexOf(cho as (typeof CHO)[number]);
  const v = JUNG.indexOf(jung as (typeof JUNG)[number]);
  const j = JONG.indexOf(jong as (typeof JONG)[number]);
  if (c < 0 || v < 0 || j < 0) return null;
  return String.fromCharCode(BASE + (c * 21 + v) * 28 + j);
}

/** 완성형 글자 하나를 첫소리 · 모음 · 받침으로. 한글 글자가 아니면 null */
export function decompose(syllable: string): { cho: string; jung: string; jong: string } | null {
  const code = syllable.charCodeAt(0) - BASE;
  if (syllable.length !== 1 || code < 0 || code > LAST - BASE) return null;
  return { cho: CHO[Math.floor(code / 588)], jung: JUNG[Math.floor(code / 28) % 21], jong: JONG[code % 28] };
}

/* ---------- 모양 ---------- */

/** tall = 세로 모음(옆에 붙음) · flat = 가로 모음(아래에 붙음) · mixed = 둘을 섞은 모음 */
export type Shape = "tall" | "flat" | "mixed";

const TALL = new Set(["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅣ"]);
const FLAT = new Set(["ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ"]);

/** 섞인 모음 = 가로 모음 + 세로 모음 */
export const MIXED_PARTS: Record<string, [flat: string, tall: string]> = {
  ㅘ: ["ㅗ", "ㅏ"],
  ㅙ: ["ㅗ", "ㅐ"],
  ㅚ: ["ㅗ", "ㅣ"],
  ㅝ: ["ㅜ", "ㅓ"],
  ㅞ: ["ㅜ", "ㅔ"],
  ㅟ: ["ㅜ", "ㅣ"],
  ㅢ: ["ㅡ", "ㅣ"],
};

export function shapeOf(jung: string): Shape {
  if (TALL.has(jung)) return "tall";
  if (FLAT.has(jung)) return "flat";
  if (jung in MIXED_PARTS) return "mixed";
  throw new Error(`모음이 아니에요: ${jung}`);
}

/* ---------- 받침 ---------- */

/** 받침이 될 수 있는 자음 하나(겹받침 제외). ㄸ · ㅃ · ㅉ 는 받침이 안 된다 */
export const canBeJong = (c: string) => c !== "" && JONG.includes(c as (typeof JONG)[number]) && CHO.includes(c as (typeof CHO)[number]);

/** 받침 소리는 일곱 개뿐이다 — ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ */
const JONG_SOUND: Record<string, string> = {
  ㄱ: "ㄱ", ㄲ: "ㄱ", ㅋ: "ㄱ", ㄳ: "ㄱ", ㄺ: "ㄱ",
  ㄴ: "ㄴ", ㄵ: "ㄴ", ㄶ: "ㄴ",
  ㄷ: "ㄷ", ㅅ: "ㄷ", ㅆ: "ㄷ", ㅈ: "ㄷ", ㅊ: "ㄷ", ㅌ: "ㄷ", ㅎ: "ㄷ",
  ㄹ: "ㄹ", ㄼ: "ㄹ", ㄽ: "ㄹ", ㄾ: "ㄹ", ㅀ: "ㄹ",
  ㅁ: "ㅁ", ㄻ: "ㅁ",
  ㅂ: "ㅂ", ㅍ: "ㅂ", ㅄ: "ㅂ", ㄿ: "ㅂ",
  ㅇ: "ㅇ",
};

/* ---------- 겹받침 ---------- */

/** 겹받침 = 앞 자음 + 뒤 자음. 11개 */
export const DOUBLE_JONG: Record<string, [front: string, back: string]> = {
  ㄳ: ["ㄱ", "ㅅ"],
  ㄵ: ["ㄴ", "ㅈ"],
  ㄶ: ["ㄴ", "ㅎ"],
  ㄺ: ["ㄹ", "ㄱ"],
  ㄻ: ["ㄹ", "ㅁ"],
  ㄼ: ["ㄹ", "ㅂ"],
  ㄽ: ["ㄹ", "ㅅ"],
  ㄾ: ["ㄹ", "ㅌ"],
  ㄿ: ["ㄹ", "ㅍ"],
  ㅀ: ["ㄹ", "ㅎ"],
  ㅄ: ["ㅂ", "ㅅ"],
};

/** 받침 둘을 겹받침 하나로. 짝이 없으면 null — ㄹ + ㄱ → ㄺ */
export function joinJong(front: string, back: string): string | null {
  for (const [j, [f, b]] of Object.entries(DOUBLE_JONG)) if (f === front && b === back) return j;
  return null;
}

/**
 * 겹받침에서 혼자 읽을 때 소리 나는 자음.
 * 앞을 읽는 것이 보통이고, ㄺ · ㄻ · ㄿ 은 뒤를 읽는다 (닭 [닥] · 삶 [삼] · 읊 [읍]).
 * 밟 은 ㄼ 인데 뒤를 읽는다 [밥] — 넓 [널] 과 다르다.
 */
export function readJong(syllable: string): string | null {
  const d = decompose(syllable);
  if (!d || !(d.jong in DOUBLE_JONG)) return null;
  const [f, b] = DOUBLE_JONG[d.jong];
  const back = d.jong === "ㄺ" || d.jong === "ㄻ" || d.jong === "ㄿ" || syllable === "밟";
  return back ? b : f;
}

/** 글자 하나를 혼자 읽을 때의 소리. 낮 → 낟, 부엌 → (엌 →) 억, 닭 → 닥. 받침이 없거나 그대로면 같은 글자 */
export function soundOf(syllable: string): string {
  const d = decompose(syllable);
  if (!d || !d.jong) return syllable;
  const j = readJong(syllable) ?? d.jong;
  return compose(d.cho, d.jung, JONG_SOUND[j])!;
}

/* ---------- 자주 쓰는 글자 ---------- */

let common: Set<string> | null = null;

/**
 * 자주 쓰는 글자 2,350자(KS X 1001)에 드는지.
 * 목록을 따로 싣지 않고 EUC-KR 표를 브라우저의 TextDecoder 로 풀어 만든다 —
 * 한글 영역은 0xB0A1 ~ 0xC8FE, 한 줄에 94자씩 25줄.
 */
export function isCommon(syllable: string): boolean {
  if (!common) {
    const bytes: number[] = [];
    for (let hi = 0xb0; hi <= 0xc8; hi++) for (let lo = 0xa1; lo <= 0xfe; lo++) bytes.push(hi, lo);
    common = new Set(new TextDecoder("euc-kr").decode(new Uint8Array(bytes)));
  }
  return common.has(syllable);
}

/** 테스트용 — 2,350자 전부 */
export function commonSyllables(): string[] {
  isCommon("가");
  return [...common!];
}
