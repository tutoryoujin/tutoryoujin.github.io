import { useId, useState, type FormEvent } from "react";
import { track } from "../analytics";
import { SITE, SUBSCRIBE_COPY, subscribeOn, type SiteConfig } from "../site";
import { isEmail, subscribeEmail } from "../subscribe";
import { cn } from "./cn";

/* ============================================================
   이메일 구독 폼 — Kit 폼 id 가 shared/site.ts 에 없으면 그리지 않는다.
   문구는 SUBSCRIBE_COPY (영어). 성공하면 분석 이벤트 "subscribe" 를 보낸다.

     <Subscribe source="home" />
   ============================================================ */
type Status = "idle" | "sending" | "ok" | "invalid" | "error";

export function Subscribe({ source, className, config = SITE }: { source: string; className?: string; config?: SiteConfig }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  if (!subscribeOn(config)) return null;

  const t = SUBSCRIBE_COPY;
  const sending = status === "sending";
  const bad = status === "invalid" || status === "error";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!isEmail(email)) return setStatus("invalid");
    setStatus("sending");
    const ok = await subscribeEmail(email, config);
    setStatus(ok ? "ok" : "error");
    if (ok) track("subscribe", { source }, config);
  };

  return (
    <section
      className={cn("rounded-xl bg-surface px-5 py-6 text-left shadow-card", className)}
      aria-labelledby={`${id}-title`}
      lang="en"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 flex-none place-items-center rounded-md bg-sky text-[1.5rem]" aria-hidden="true">
          🎁
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="font-display text-display-md text-ink">
            {t.title}
          </h2>
          <p className="mt-1 text-[0.92rem] leading-normal text-muted">{t.body}</p>
        </div>
      </div>

      {status === "ok" ? (
        <p className="mt-4 rounded-md bg-ok-bg px-4 py-3 text-body-strong text-ok-ink" role="status">
          <span aria-hidden="true">✓ </span>
          {t.success}
        </p>
      ) : (
        <form className="mt-4" onSubmit={submit} noValidate>
          <label htmlFor={`${id}-email`} className="mb-1.5 block text-label text-ink">
            {t.label}
          </label>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              id={`${id}-email`}
              type="email"
              name="email_address"
              autoComplete="email"
              inputMode="email"
              required
              placeholder={t.placeholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (bad) setStatus("idle");
              }}
              disabled={sending}
              aria-invalid={status === "invalid"}
              aria-describedby={`${id}-msg ${id}-fine`}
              className={cn(
                "min-h-12 w-full min-w-0 flex-1 rounded-full border-2 border-line bg-bg px-4 text-body text-ink placeholder:text-muted",
                "focus-visible:border-primary disabled:opacity-60",
                status === "invalid" && "border-bad-ink",
              )}
            />
            <button
              type="submit"
              disabled={sending}
              aria-busy={sending}
              className={cn(
                "flex min-h-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary px-5 text-body-strong text-primary-ink",
                "motion-safe:active:scale-[0.98] disabled:cursor-default disabled:opacity-70",
              )}
            >
              {sending ? t.sending : t.button}
            </button>
          </div>
          {/* 오류는 색만이 아니라 글자로도 — coral 쌍 위에 ⚠ 와 문장 */}
          <p id={`${id}-msg`} className="empty:hidden" role="alert">
            {bad && (
              <span className="mt-2.5 block rounded-md bg-bad-bg px-3 py-2 text-[0.9rem] font-bold text-bad-ink">
                <span aria-hidden="true">⚠ </span>
                {status === "invalid" ? t.invalid : t.error}
              </span>
            )}
          </p>
        </form>
      )}
      <p id={`${id}-fine`} className="mt-2.5 text-caption text-muted">
        {t.fine}
      </p>
    </section>
  );
}
