/* ============================================================
   이름 → 한글. 화면이 쓰는 순수 함수만 (DOM 없음).

   이름 데이터(names.json)는 첫 화면 번들에 넣지 않는다 — loadNames() 가
   입력 칸에 처음 들어가거나 뽑기를 처음 누를 때 따로 받는다.
   ============================================================ */
import { guessWord } from "./guess";

/** names.json 한 줄 — [표기, 상태, 다른 표기…]. s = 용례로 확인한 표준, r = 발음 사전 + 표기 규칙 */
export type Entry = [string, "s" | "r", ...string[]];
export type Names = Record<string, Entry>;

/**
 * 도장.
 * - standard: 국립국어원 용례로 확인한 표기
 * - common: 표준은 아니지만 널리 쓰이는 표기
 * - rule: 발음 사전의 발음에 표기 규칙을 그대로 적용한 것 (용례로는 아직 확인 안 함)
 * - guessed: 사전에 없어서 철자로 추측한 것
 * - edited: 사람이 한글로 직접 고친 것 (fixes.ts)
 */
export type Status = "standard" | "common" | "rule" | "guessed" | "edited";
export type Option = { text: string; status: Status };

let names: Promise<Names> | null = null;
/** 이름 데이터 받기 — 한 번만 받고 그다음은 같은 약속을 돌려준다 */
export const loadNames = () =>
  (names ??= import("./names.json").then((m) => m.default as unknown as Names).catch((e) => {
    names = null; // 다음에 다시 받아 볼 수 있게
    throw e;
  }));

/** 열쇠 — 소문자, 아포스트로피 없이. tools/hangul-name/build.ts 의 keyOf 와 같아야 한다 */
export const keyOf = (s: string) => s.toLowerCase().replace(/'/g, "");

export const MAX_LENGTH = 30;

export type Cleaned = { ok: true; words: string[]; display: string } | { ok: false; reason: "empty" | "letters" | "long" };

/** 입력 다듬기 — 악센트는 떼고(é → e), 영문자 · 공백 · 하이픈 · 아포스트로피만 받는다 */
export function clean(input: string): Cleaned {
  const s = input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return { ok: false, reason: "empty" };
  if (!/^[A-Za-z' -]+$/.test(s)) return { ok: false, reason: "letters" };
  if (s.length > MAX_LENGTH) return { ok: false, reason: "long" };
  const words = s.split(/[ -]+/).map((w) => w.replace(/^'+|'+$/g, "")).filter((w) => /[A-Za-z]/.test(w));
  if (!words.length) return { ok: false, reason: "letters" };
  return { ok: true, words, display: s };
}

const RANK: Record<Status, number> = { standard: 0, edited: 0, common: 1, rule: 2, guessed: 3 };
const worst = (a: Status, b: Status) => (RANK[a] >= RANK[b] ? a : b);

/** 낱말 하나의 표기들. 첫째가 기본 */
export function wordOptions(word: string, data: Names): Option[] {
  const e = data[keyOf(word)];
  if (!e) {
    const text = guessWord(word);
    return text ? [{ text, status: "guessed" }] : [];
  }
  const [first, kind, ...others] = e;
  return [
    { text: first, status: kind === "s" ? "standard" : "rule" },
    ...others.map((text): Option => ({ text, status: kind === "s" ? "common" : "rule" })),
  ];
}

/**
 * 이름 전체의 표기 후보. 낱말이 하나면 그 낱말의 후보 전부,
 * 여럿이면 낱말마다 기본 표기를 띄어 쓴 하나 (도장은 가장 약한 쪽).
 */
export function convert(words: string[], data: Names): Option[] {
  const per = words.map((w) => wordOptions(w, data)).filter((o) => o.length);
  if (!per.length) return [];
  if (per.length === 1) return per[0];
  return [
    {
      text: per.map((o) => o[0].text).join(" "),
      status: per.map((o) => o[0].status).reduce(worst),
    },
  ];
}
