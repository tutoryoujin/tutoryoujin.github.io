/* ============================================================
   영수증 고치기 — 규칙으로 못 맞추는 이름을 한글로 직접 고친다 (Anne → 안).

   - 고친 표기는 그 기기에 남는다 (hn:fixes). 같은 이름을 다시 넣으면 고친 표기가 먼저 나온다.
   - 서버가 없어서 다른 기기에는 링크로 보낸다: /hangul-name/?name=Anne&ko=안
     링크를 열면 그 영수증이 바로 나온다. 표기가 원래 후보에 없을 때만 고친 표기로 그 기기에 남는다.
   - 공유하기(#90)도 같은 링크 — 고르거나 고친 표기가 받는 사람에게도 그대로 보이게 ko 를 늘 붙인다.
   ============================================================ */
import { clean, type Option } from "./convert";
import { introduce } from "./model";

export const FIX_MAX = 20;

/** 고친 한글 다듬기 — 완성형 한글 글자와 띄어쓰기만 */
export function cleanHangul(input: string): { ok: true; text: string } | { ok: false } {
  const text = input.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!text || text.length > FIX_MAX || !/^[가-힣]+( [가-힣]+)*$/.test(text)) return { ok: false };
  return { ok: true, text };
}

/** 고친 표기를 찾는 열쇠 — 영어 이름(다듬은 것)을 소문자로 */
export const fixKey = (display: string) => display.toLowerCase();

/** 고친 표기가 있으면 맨 앞에 — 원래 후보도 남겨 되돌릴 수 있게 */
export function withFix(opts: Option[], fix: string | undefined): Option[] {
  if (!fix) return opts;
  return [{ text: fix, status: "edited" }, ...opts.filter((o) => o.text !== fix)];
}

/** 영수증 링크 — 공유하기 · 고친 영수증 보내기 */
export function receiptLink(page: string, input: string, text: string): string {
  const q = new URLSearchParams({ name: input, ko: text });
  return `${page}?${q}`;
}

/** 주소에서 영수증 읽기. 둘 다 바르지 않으면 null */
export function readLink(search: string): { input: string; text: string } | null {
  const q = new URLSearchParams(search);
  const name = clean(q.get("name") ?? "");
  const ko = cleanHangul(q.get("ko") ?? "");
  return name.ok && ko.ok ? { input: name.display, text: ko.text } : null;
}

/** 공유 문구 — 한국어 먼저, 영어 바로 아래. 받는 사람이 한국어를 못 읽어도 뜻이 통하게 (#90) */
export function shareText(text: string): string {
  return `제 한국어 이름은 ${text}${introduce(text).ending} 🧾\nMy name in Korean is ${text}. What’s yours?`;
}
