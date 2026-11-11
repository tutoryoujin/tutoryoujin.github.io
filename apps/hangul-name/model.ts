/* ============================================================
   영수증에 찍을 내용 — 화면(Receipt.tsx)과 저장 그림(save.ts)이 같은 데이터로 그린다.
   ============================================================ */
import { compose, decompose, soundOf } from "@yj/korean/hangul";
import { josa } from "@yj/korean/numbers";

/** 첫소리의 소리. ㅇ 은 첫소리에서 소리가 없다 */
const CHO_SOUND: Record<string, string> = {
  ㄱ: "g", ㄲ: "kk", ㄴ: "n", ㄷ: "d", ㄸ: "tt", ㄹ: "r", ㅁ: "m", ㅂ: "b", ㅃ: "pp", ㅅ: "s", ㅆ: "ss",
  ㅇ: "", ㅈ: "j", ㅉ: "jj", ㅊ: "ch", ㅋ: "k", ㅌ: "t", ㅍ: "p", ㅎ: "h",
};
const JUNG_SOUND: Record<string, string> = {
  ㅏ: "a", ㅐ: "ae", ㅑ: "ya", ㅒ: "yae", ㅓ: "eo", ㅔ: "e", ㅕ: "yeo", ㅖ: "ye", ㅗ: "o", ㅘ: "wa", ㅙ: "wae",
  ㅚ: "oe", ㅛ: "yo", ㅜ: "u", ㅝ: "wo", ㅞ: "we", ㅟ: "wi", ㅠ: "yu", ㅡ: "eu", ㅢ: "ui", ㅣ: "i",
};
/** 받침 소리는 일곱 개 — 받침을 혼자 읽을 때 */
const JONG_SOUND: Record<string, string> = { ㄱ: "k", ㄴ: "n", ㄷ: "t", ㄹ: "l", ㅁ: "m", ㅂ: "p", ㅇ: "ng" };

export type Jamo = {
  kind: "cho" | "jung" | "jong";
  jamo: string;
  /** 로마자 소리. 첫소리 ㅇ 은 "" */
  sound: string;
  /** 받침이 다른 자음 소리로 날 때 그 자음 (ㅅ 받침 → ㄷ) */
  like?: string;
};
export type Block = { syl: string; sound: string; jamo: Jamo[] };
export type Breakdown = { blocks: Block[]; letters: number; finals: number };

export function breakdown(text: string): Breakdown {
  const blocks: Block[] = [];
  for (const syl of text) {
    const d = decompose(syl);
    if (!d) continue;
    const jamo: Jamo[] = [
      { kind: "cho", jamo: d.cho, sound: CHO_SOUND[d.cho] },
      { kind: "jung", jamo: d.jung, sound: JUNG_SOUND[d.jung] },
    ];
    if (d.jong) {
      const said = decompose(soundOf(syl))!.jong;
      jamo.push({ kind: "jong", jamo: d.jong, sound: JONG_SOUND[said], ...(said !== d.jong ? { like: said } : {}) });
    }
    blocks.push({ syl, jamo, sound: jamo.map((j) => j.sound).join("") });
  }
  return {
    blocks,
    letters: blocks.reduce((n, b) => n + b.jamo.length, 0),
    finals: blocks.filter((b) => b.jamo.length === 3).length,
  };
}

/** 조립 순서 — 글자마다 ㅅ → 소 → 손 */
export function buildSteps(text: string): string[][] {
  return [...text].map((syl) => {
    const d = decompose(syl);
    if (!d) return [syl];
    const steps = [d.cho, compose(d.cho, d.jung)!];
    if (d.jong) steps.push(syl);
    return steps;
  });
}

/** 자기소개 문장 — 마지막 글자에 받침이 있으면 이에요, 없으면 예요 */
export function introduce(name: string) {
  const sentence = `안녕하세요! 저는 ${josa(name, "이에요", "예요")}.`;
  const lastSyl = [...name.replace(/\s/g, "")].pop() ?? "";
  const jong = decompose(lastSyl)?.jong ?? "";
  const ending = jong ? "이에요" : "예요";
  return {
    sentence,
    ending,
    /** 문장을 이름 · 어미 · 나머지로 — 어미에 색을 입히려고 */
    parts: { before: `안녕하세요! 저는 ${name}`, ending, after: "." },
    reason: jong
      ? { ko: `${name} → 받침 ${jong} → 이에요`, en: `${name} ends in a final consonant (${jong}), so it takes 이에요.` }
      : { ko: `${name} → 받침 없음 → 예요`, en: `${name} ends in a vowel, so it takes 예요.` },
  };
}

/** 바코드 막대 — 장식. 이름과 번호로 정해지니 같은 영수증은 늘 같은 모양 */
export function barcode(text: string, serial: number): { x: number; w: number }[] {
  let seed = [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0x7fffffff, serial + 7) || 7;
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; i < 44; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const w = 1 + ((seed >> 8) % 4);
    bars.push({ x, w });
    x += w + 1 + ((seed >> 12) % 3);
  }
  return bars;
}
export const barcodeWidth = (bars: { x: number; w: number }[]) => {
  const b = bars[bars.length - 1];
  return b ? b.x + b.w : 0;
};

export const pad = (n: number, w: number) => String(n).padStart(w, "0");
export const stamp = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)} ${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}`;

/** 도장 글자 — 색이 아니라 글자로 읽힌다 */
export const STAMP = {
  standard: { ko: "표준", en: "Standard" },
  common: { ko: "흔한 표기", en: "Common" },
  rule: { ko: "규칙 표기", en: "By the rules" },
  guessed: { ko: "추측", en: "Guessed" },
  edited: { ko: "직접 고침", en: "Edited" },
} as const;

/** 도장 아래 설명 한 줄 (영어 먼저 — 학습자가 바로 읽어야 하는 안내) */
export const STATUS_NOTE = {
  standard: { en: "The official Korean spelling for this name.", ko: "국립국어원 표기예요." },
  common: { en: "Not the official spelling, but many people write it this way.", ko: "표준은 아니지만 많이 쓰는 표기예요." },
  rule: { en: "Spelled from a pronunciation dictionary using Korea’s loanword rules.", ko: "발음 사전의 발음을 외래어 표기법대로 옮겼어요." },
  // 「Youjin」은 주인이 정한 예외 — 수업 안내 금지 규칙(site/CLAUDE.md)과 별개로 둔다 (#43)
  guessed: { en: "Spelling guessed — double-check with Youjin.", ko: "철자로 추측했어요. 유진 선생님께 확인해 보세요." },
  edited: { en: "Spelling typed in by hand.", ko: "한글로 직접 고친 표기예요." },
} as const;
