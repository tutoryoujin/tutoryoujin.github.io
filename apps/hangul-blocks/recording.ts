/* ============================================================
   녹음 목록 (#39) — 한국어 블록에서 소리 나는 것 전부를 녹음 파일 단위로 나눈다.

   대본(tools/hangul-blocks/recording-script.md) · 녹음 자르기 · 재생이 모두 이 목록 하나를 쓴다.
   파일 안 순서 = 녹음 순서 = 자른 조각 순서. 순서를 바꾸면 이미 한 녹음이 다른 글자에 붙는다
   → 녹음을 시작한 뒤에는 순서를 바꾸지 않는다. 더할 것은 새 파일로.
   ============================================================ */
import { CHO, compose, decompose, JUNG, soundOf } from "../../shared/korean/hangul";
import { CONSONANTS } from "./glyphs";
import { WORDS } from "./words";

export type Take = {
  /** 앱이 읽는 글 — 재생 열쇠는 이것으로 만든다 */
  text: string;
  /** 대본에 같이 적는 발음 (글과 다를 때만) — 값 [갑] · 늬 [니] */
  say?: string;
};
export type RecFile = { name: string; title: string; takes: Take[] };

/** 한 파일에 받침 단어 몇 개씩 — 1분 남짓이 되게 */
const WORDS_PER_FILE = 23;

/**
 * 소리가 글자와 다르면 표준 발음을 같이 적는다 — 화면 안내 · 🔊 · 녹음이 모두 표준 발음을 따른다.
 *  - 받침: 혼자 읽는 소리 (값 [갑] · 낮 [낟])
 *  - 자음 + ㅢ: [ㅣ] (늬 [니] · 희 [히], 표준 발음법 제5항). ㅇ 줄의 「의」는 그대로 [의]
 */
const take = (text: string): Take => {
  if ([...text].length !== 1) return { text };
  const d = decompose(text);
  if (d && d.jung === "ㅢ" && d.cho !== "ㅇ") return { text, say: compose(d.cho, "ㅣ", d.jong)! };
  const s = soundOf(text);
  return s === text ? { text } : { text, say: s };
};

export function recordingFiles(): RecFile[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const words = Object.keys(WORDS);
  return [
    // 자음 이름 — 교재 순서 (자모표와 같다)
    {
      name: "n",
      title: "자음 이름",
      takes: Object.values(CONSONANTS).map((c) => take(c.ko)),
    },
    // 받침 없는 글자 — 첫 자음 한 줄씩. ㅇ 줄(c12)이 모음 이름이다 (아 · 와 · 의 …)
    ...CHO.map((c, i) => ({
      name: `c${pad(i + 1)}`,
      title: `${c} 줄`,
      takes: JUNG.map((v) => take(compose(c, v)!)),
    })),
    // 획 하나 더의 두 글자 낱말 (비 · 피는 ㅂ · ㅍ 줄에 이미 있다)
    { name: "p", title: "두 글자 낱말", takes: [take("자다"), take("차다")] },
    // 받침 있는 한 글자 단어 — words.ts 에 적힌 순서
    ...Array.from({ length: Math.ceil(words.length / WORDS_PER_FILE) }, (_, i) => ({
      name: `w${i + 1}`,
      title: `받침 단어 ${i + 1}`,
      takes: words.slice(i * WORDS_PER_FILE, (i + 1) * WORDS_PER_FILE).map(take),
    })),
  ];
}

/** 소리 파일 이름 — 글자마다 유니코드 hex 를 - 로 잇는다. 가 → ac00, 기역 → ae30-c5ed */
export const audioKey = (text: string) => [...text].map((c) => c.codePointAt(0)!.toString(16)).join("-");

/** 먼저 녹음할 파일 — 자모표 · 획 하나 더가 이것만으로 다 바뀐다 */
export const FIRST_FILES = ["n", "c12", "c01", "c16", "c04", "c17", "c08", "c18", "c13", "c15", "p"];
