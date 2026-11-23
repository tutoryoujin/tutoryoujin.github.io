import { useState } from "react";
import { track } from "../analytics";
import type { Bi, Lead } from "../doc";
import { cn } from "./cn";
import { Btn } from "./parts";

/* ============================================================
   공유하기 (#118) — 블로그 글 끝 · 퀴즈 결과.
   브라우저 공유 시트(폰: 카카오톡 · 인스타 DM · 왓츠앱 …) → 없으면 링크 복사 → 복사도 막히면 링크를 보여 준다.
   SNS SDK · 위젯 스크립트는 쓰지 않는다 (추적 쿠키).
   한국어 이름 앱은 영수증 그림까지 보내는 자기 공유(apps/hangul-name/save.ts)를 따로 쓴다.
   ============================================================ */

export type ShareHow = "sheet" | "copied" | "manual" | "cancelled";

/** 이 페이지의 대표 주소 — canonical 이 있으면 그것 (주소 뒤 ?·# 는 빼고) */
export const pageUrl = () =>
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.origin + location.pathname;

export async function shareLink(data: { title: string; text: string; url: string }): Promise<ShareHow> {
  if ("share" in navigator) {
    try {
      await navigator.share(data);
      return "sheet";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
      // 공유가 막히면 복사로
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    return "manual";
  }
}

const LABEL = { sheet: { ko: "공유하기", en: "Share" }, copy: { ko: "링크 복사", en: "Copy link" } };

/**
 * 공유 버튼 + 결과 한 줄. lead = 어느 말이 크게 (앱은 "ko", 블로그 같은 앱 밖 페이지는 "en")
 * where = 분석 이벤트에 붙는 자리 이름 (분석이 꺼져 있으면 아무 일도 안 한다)
 */
export function Share({
  title,
  text,
  url,
  lead = "ko",
  where,
  className,
}: {
  title: string;
  text: string;
  url?: string;
  lead?: Lead;
  where: string;
  className?: string;
}) {
  const [note, setNote] = useState<Bi | null>(null);
  const label = "share" in navigator ? LABEL.sheet : LABEL.copy;
  const go = async () => {
    setNote(null);
    const u = url ?? pageUrl();
    const how = await shareLink({ title, text, url: u });
    if (how === "cancelled") return;
    track("share", { where, how });
    if (how === "copied") setNote({ ko: "링크를 복사했어요.", en: "Link copied." });
    else if (how === "manual") setNote({ ko: "링크를 길게 눌러 복사해 주세요.", en: `Copy this link: ${u}` });
  };
  const [big, small] = lead === "en" ? [label.en, label.ko] : [label.ko, label.en];
  const [nBig, nSmall] = note ? (lead === "en" ? [note.en, note.ko] : [note.ko, note.en]) : [];
  return (
    <div className={className}>
      <Btn variant="ghost" ko={`🔗 ${big}`} en={small} onClick={go} />
      <p className={cn("mt-2 min-h-[1.5em] text-center text-[0.9rem] font-bold break-all", !note && "sr-only")} aria-live="polite">
        {note && (
          <>
            {nBig} <span className="font-semibold text-muted">{nSmall}</span>
          </>
        )}
      </p>
    </div>
  );
}
