/* ============================================================
   영수증 고치기 — 규칙으로 못 맞추는 이름을 한글로 직접 고친다 (Anne → 안).

   - 고친 표기는 그 기기에 남는다 (hn:fixes). 같은 이름을 다시 넣으면 고친 표기가 먼저 나온다.
   - 서버가 없어서 다른 기기에는 링크로 보낸다: /hangul-name/?name=Anne&ko=안
     링크를 열면 고친 영수증이 바로 나오고, 그 기기에도 남는다.
   ============================================================ */
import { clean, type Option } from "./convert";

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

/** 고친 영수증 링크 */
export function fixLink(page: string, input: string, text: string): string {
  const q = new URLSearchParams({ name: input, ko: text });
  return `${page}?${q}`;
}

/** 주소에서 고친 영수증 읽기. 둘 다 바르지 않으면 null */
export function readLink(search: string): { input: string; text: string } | null {
  const q = new URLSearchParams(search);
  const name = clean(q.get("name") ?? "");
  const ko = cleanHangul(q.get("ko") ?? "");
  return name.ok && ko.ok ? { input: name.display, text: ko.text } : null;
}
