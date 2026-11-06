import { IEUNG_DEFS, MOOD_SVG, type Mood } from "./ieung-data";

/** 평면 이응 symbol 과 입체 이응 그라데이션. <Page> 가 한 번만 둔다. */
export function IeungDefs() {
  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: IEUNG_DEFS }} />;
}

/**
 * 움직이는 입체 이응. 48px 넘는 자리(완료 화면, 빈 화면, 스플래시)에 쓴다.
 * 그보다 작으면 헤더 마크처럼 평면 이응(#ieung-mark)을 쓴다.
 *
 * label 을 주면 그림으로 읽히고, 없으면 장식으로 숨긴다.
 */
export function Ieung({ mood = "basic", label }: { mood?: Mood; label?: string }) {
  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true as const, focusable: "false" as const };
  return (
    <svg
      className={`mv ex-${mood}`}
      viewBox="0 0 240 250"
      {...a11y}
      dangerouslySetInnerHTML={{ __html: MOOD_SVG[mood] }}
    />
  );
}

export type { Mood };
