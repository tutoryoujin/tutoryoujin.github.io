/* 내 띠 찾기 — 태어난 해를 넣으면 띠와 「저는 ○띠예요」. 계산은 shared/korean/tti.ts */
import { ttiName, ttiOf } from "@yj/korean/tti";
import { canSpeak, speak } from "@yj/ui";
import { useId, useState } from "react";

const MIN = 1900;
const MAX = 2100;

export function TtiFinder() {
  const id = useId();
  const [raw, setRaw] = useState("");
  const year = Number(raw);
  const ok = raw.length === 4 && Number.isInteger(year) && year >= MIN && year <= MAX;
  const t = ok ? ttiOf(year) : null;
  const prev = ok ? ttiOf(year - 1) : null;
  const say = t ? `저는 ${ttiName(t)}예요.` : "";

  return (
    <div className="mt-4 rounded-xl bg-surface p-4 shadow-card">
      <label htmlFor={id} className="block font-display text-[1.15rem]">
        태어난 해
        <span className="ml-1.5 font-app text-[0.85rem] font-bold text-muted">Year you were born</span>
      </label>
      <input
        id={id}
        className="mt-2 min-h-12 w-full rounded-md border-2 border-line bg-bg px-4 text-[1.3rem] font-bold text-ink tabular-nums placeholder:text-muted focus-visible:border-primary"
        inputMode="numeric"
        autoComplete="bday-year"
        maxLength={4}
        placeholder="1995"
        value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/\D/g, "").slice(0, 4))}
        aria-describedby={`${id}-out`}
      />
      <div id={`${id}-out`} aria-live="polite" className="mt-4">
        {t && prev ? (
          <div className="flex items-center gap-4 rounded-lg bg-sky px-4 py-3 text-sky-ink">
            <span className="text-[2.6rem] leading-none" aria-hidden="true">
              {t.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[1.6rem] leading-[1.2]">{say}</span>
              <span className="block text-[0.9rem] font-bold">
                {year} · Year of the {t.en}
              </span>
              <span className="mt-1 block text-[0.8rem] font-semibold">
                1·2월 설날 전에 태어났다면 {ttiName(prev)}예요.
                <br />
                Born before Seollal in Jan/Feb? Then you’re a {prev.en}.
              </span>
            </span>
            {canSpeak && (
              <button
                type="button"
                className="grid size-11 flex-none place-items-center rounded-full border border-line bg-surface text-[1.1rem]"
                aria-label={`들어 보기 / Listen: ${say}`}
                onClick={() => speak(say)}
              >
                <span aria-hidden="true">🔊</span>
              </button>
            )}
          </div>
        ) : (
          <p className="text-[0.9rem] font-bold text-muted">
            네 자리로 넣어 보세요.
            <span className="block font-semibold">Type a four-digit year, like 1995.</span>
          </p>
        )}
      </div>
    </div>
  );
}
