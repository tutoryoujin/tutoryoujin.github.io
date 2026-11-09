/* ============================================================
   이메일 구독 — Kit(ConvertKit) 폼으로 보낸다.

   폼 id 는 shared/site.ts 의 subscribe.formId. 비어 있으면 꺼진다.
   Kit 의 공개 폼 주소에 email_address 하나만 보낸다 (Kit 이 직접 주는 임베드 폼과 같은 요청).
   ============================================================ */
import { SITE, subscribeOn, type SiteConfig } from "./site";

export const subscribeEndpoint = (c: SiteConfig = SITE) =>
  subscribeOn(c) ? `https://app.kit.com/forms/${encodeURIComponent(c.subscribe.formId.trim())}/subscriptions` : null;

/** 브라우저의 type="email" 과 같은 정도로만 본다. 진짜 확인은 Kit 이 메일로 한다 */
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export async function subscribeEmail(email: string, c: SiteConfig = SITE, f: typeof fetch = fetch): Promise<boolean> {
  const url = subscribeEndpoint(c);
  if (!url || !isEmail(email)) return false;
  try {
    const res = await f(url, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({ email_address: email.trim() }),
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => ({}))) as { status?: string };
    return data.status === "success";
  } catch {
    return false;
  }
}
