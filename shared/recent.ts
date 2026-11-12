/* ============================================================
   이 기기에서 마지막으로 연 앱 (#48) — 첫 화면 「이어서 하기」.

   - <Page> 가 앱을 열 때마다 markApp(slug) 를 부른다. 앱 코드는 안 고친다
   - 진도가 있는 앱만 setStep() 으로 단계 · 진도를 더한다 (지금은 한국어 카드).
     없는 앱은 이름과 버튼만 보인다 — 숫자를 지어내지 않는다
   - 로그인이 생기면 이 기록을 계정으로 옮긴다 (#49 · #13)

   열쇠는 학생 기록이라 한번 나가면 바꾸지 않는다.
   ============================================================ */
export const RECENT_KEY = "yj:last-app";

type KoEn = { ko: string; en: string };
export type Recent = { slug: string; step?: KoEn; done?: number; total?: number };
type Store = Pick<Storage, "getItem" | "setItem">;
const store = (): Store | undefined => (typeof localStorage === "undefined" ? undefined : localStorage);

/** 기록이 없거나 깨졌으면 null */
export function readRecent(s: Store | undefined = store()): Recent | null {
  try {
    const v = JSON.parse(s?.getItem(RECENT_KEY) ?? "null");
    return v && typeof v.slug === "string" ? v : null;
  } catch {
    return null;
  }
}

function write(r: Recent, s: Store | undefined) {
  try {
    s?.setItem(RECENT_KEY, JSON.stringify(r));
  } catch {
    /* 사생활 보호 모드 등 — 기록 없이 계속 */
  }
}

/** 앱을 열었다. 같은 앱이면 남겨 둔 단계 · 진도는 그대로 */
export function markApp(slug: string, s: Store | undefined = store()) {
  const prev = readRecent(s);
  write(prev?.slug === slug ? prev : { slug }, s);
}

/** 이 앱의 지금 단계 · 진도 (진도가 진짜로 있을 때만 부른다) */
export function setStep(slug: string, step: KoEn, done: number, total: number, s: Store | undefined = store()) {
  write({ slug, step, done, total }, s);
}
