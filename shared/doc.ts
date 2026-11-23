/* ============================================================
   글 블록 — 앱이 아닌 페이지(개인정보 처리방침 · 글 /notes/)의 본문.

   본문을 데이터로 적어 두면 같은 글이 두 곳에 나간다.
   - 화면: shared/ui/Doc.tsx 가 React 로 그린다
   - 정적 본문: docHtml() 이 빌드 때 #root 안에 넣는다 (shared/seo.ts)
   그래서 크롤러가 읽는 글과 사람이 보는 글이 갈라지지 않는다.

   설명 블록(h · p · tip · list · link)의 ko 는 선택이다. 블로그 글은 설명을 영어로만 적는다 (#122)
   — 같은 말을 두 언어로 적으면 검색에는 번역문이 섞인 페이지로 보인다.
   배우는 한국어(ex 예문 · cards 낱말 · ieung 말풍선)는 늘 한국어 + 영어.

   한 블록은 늘 한국어(ko)와 영어(en)를 따로 받는다. 어느 쪽을 크게 둘지는 lead 로.
   - "ko" — 한국어가 크고 영어가 아래 muted (글 /notes/ · 앱과 같은 규칙)
   - "en" — 영어가 크고 한국어가 아래 muted (처방침처럼 학습자가 내용을 읽어야 하는 페이지, #84 · #57)
   ============================================================ */

import type { Mood, Scene } from "./ui/ieung-data";

export type Bi = { ko: string; en: string };
/** 설명 글 — 영어만 적어도 된다 (#122). 둘 다 있으면 lead 쪽이 크게 */
export type Prose = { ko?: string; en: string };
/** 예문 한 줄. clock = 옆에 그릴 시계(자정부터 센 분, 0~1439) · also = 같은 뜻의 다른 말(「= …」로 아래에) */
export type Example = Bi & { clock?: number; also?: string };
/** 글 안 퀴즈 문제 하나 (#120). q = 묻는 말, clock = 문제 그림 시계(자정부터 센 분), answer = 정답(한국어),
 *  wrong = 학생들이 실제로 하는 실수 + 고르면 보여 줄 이유 */
export type QuizItem = { q: Prose; clock?: number; answer: string; wrong: { text: string; why?: Bi }[] };
export type Lead = "ko" | "en";

export type Block =
  /** 소제목 (h2) */
  /** 소제목 (h2). id = 목차 · 바로가기 주소(#…). 없으면 영어 제목에서 만든다 — 한번 나간 뒤 제목을 고치면 옛 id 를 적어 둔다 */
  | ({ t: "h"; id?: string } & Prose)
  /** 문단 */
  | ({ t: "p" } & Prose)
  /** 점 목록 */
  | { t: "list"; items: Prose[] }
  /** 한국어 예문. ko = 예문, en = 뜻. 🔊 로 들을 수 있다 */
  | { t: "ex"; items: Example[] }
  /** ✨ 알아 두기 */
  | ({ t: "tip" } & Prose)
  /** 작은 카드 격자 — mark(그림 글자) · ko · en · sub(한 줄 더) */
  | { t: "cards"; items: (Bi & { mark: string; sub?: string })[] }
  /** 바깥 링크 (새 탭) — 공식 자료처럼 글이 가리키는 곳. href 는 https */
  | ({ t: "link"; href: string; mark?: string } & Prose)
  /** 화면에서만 움직이는 부품 (예: 내 띠 찾기). 정적 본문에는 안 나간다 */
  | { t: "widget"; id: string }
  /** 이응이 말풍선 — 배우는 한국어 한 줄(크게) + 영어, 🔊 없음. mood 표정 또는 scene 장면 (shared/ui/ieung-data.ts) */
  | ({ t: "ieung"; mood?: Mood; scene?: Scene } & Bi)
  /** 보기 넷 퀴즈 (#120) — 화면은 공통 Quiz, 정적 본문에는 문제와 정답만 */
  | { t: "quiz"; label: Bi; items: QuizItem[] };

/** 시계 그림을 글자로 — 정적 본문용 (12시간, 3:05) */
export const clockText = (t: number) => `${Math.floor(t / 60) % 12 || 12}:${String(t % 60).padStart(2, "0")}`;

/** 소제목 id — 영어 제목을 소문자 낱말로 (AM, PM, and “around” → am-pm-and-around) */
export const headingId = (b: { id?: string; en: string }) =>
  b.id ??
  b.en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
/** 목차 — 소제목 차례대로 */
export const headings = (blocks: Block[]) => blocks.flatMap((b) => (b.t === "h" ? [{ id: headingId(b), en: b.en, ko: b.ko }] : []));

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 큰 줄 · 작은 줄 순서. 한 언어뿐이면 그 줄이 크고 작은 줄은 없다 */
export const ordered = (b: Prose, lead: Lead): [string, string | undefined] => {
  const [a, c] = lead === "ko" ? [b.ko, b.en] : [b.en, b.ko];
  return a ? [a, c] : [c ?? "", undefined];
};

/** 블록에서 검색에 쓸 글자 — 제목 · 본문 찾기 */
export function docText(blocks: Block[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.t === "widget") continue;
    if (b.t === "quiz") {
      for (const i of b.items) out.push(i.q.en, i.q.ko ?? "", i.answer);
      continue;
    }
    if ("items" in b) for (const i of b.items) out.push(i.ko ?? "", i.en, "sub" in i && i.sub ? i.sub : "", "also" in i && i.also ? i.also : "");
    else out.push(b.ko ?? "", b.en);
  }
  return out.filter(Boolean).join(" ");
}

/** 정적 본문용 HTML. 화면의 글과 같은 내용 — 크롤러에만 보이는 말은 없다 */
export function docHtml(blocks: Block[], lead: Lead): string {
  const two = (b: Prose) => {
    const [big, small] = ordered(b, lead);
    return small ? `${esc(big)} <span class="text-muted">${esc(small)}</span>` : esc(big);
  };
  /** 배우는 한국어 — lead 와 상관없이 한국어가 크게 */
  const learn = (i: Bi & { also?: string }) => `${esc(i.ko)}${i.also ? ` (= ${esc(i.also)})` : ""} <span class="text-muted">${esc(i.en)}</span>`;
  return blocks
    .map((b) => {
      switch (b.t) {
        case "h":
          return `<h2 id="${esc(headingId(b))}" class="mt-8 mb-2 font-display text-[1.35rem] font-semibold">${two(b)}</h2>`;
        case "p":
          return `<p class="mt-3">${two(b)}</p>`;
        case "tip":
          return `<p class="mt-3">✨ ${two(b)}</p>`;
        case "list":
          return `<ul class="mt-3">${b.items.map((i) => `<li class="mt-1.5">${two(i)}</li>`).join("")}</ul>`;
        case "ex":
          return `<ul class="mt-3">${b.items.map((i) => `<li class="mt-1.5">${learn(i)}</li>`).join("")}</ul>`;
        case "ieung":
          return `<p class="mt-4">${learn(b)}</p>`;
        case "quiz":
          return `<h3 class="mt-6">${learn(b.label)}</h3><ol class="mt-3">${b.items
            .map((i) => `<li class="mt-1.5">${two(i.q)}${i.clock === undefined ? "" : ` (${clockText(i.clock)})`} — ${esc(i.answer)}</li>`)
            .join("")}</ol>`;
        case "cards":
          return `<ul class="mt-3">${b.items
            .map((i) => `<li class="mt-1.5">${esc(i.mark)} ${learn(i)}${i.sub ? ` — ${esc(i.sub)}` : ""}</li>`)
            .join("")}</ul>`;
        case "link":
          return `<p class="mt-4"><a href="${esc(b.href)}" rel="noopener">${b.mark ? `${esc(b.mark)} ` : ""}${two(b)}</a></p>`;
        case "widget":
          return "";
      }
    })
    .join("");
}
