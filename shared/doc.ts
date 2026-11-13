/* ============================================================
   글 블록 — 앱이 아닌 페이지(개인정보 처리방침 · 글 /notes/)의 본문.

   본문을 데이터로 적어 두면 같은 글이 두 곳에 나간다.
   - 화면: shared/ui/Doc.tsx 가 React 로 그린다
   - 정적 본문: docHtml() 이 빌드 때 #root 안에 넣는다 (shared/seo.ts)
   그래서 크롤러가 읽는 글과 사람이 보는 글이 갈라지지 않는다.

   한 블록은 늘 한국어(ko)와 영어(en)를 따로 받는다. 어느 쪽을 크게 둘지는 lead 로.
   - "ko" — 한국어가 크고 영어가 아래 muted (글 /notes/ · 앱과 같은 규칙)
   - "en" — 영어가 크고 한국어가 아래 muted (처방침처럼 학습자가 내용을 읽어야 하는 페이지, #84 · #57)
   ============================================================ */

export type Bi = { ko: string; en: string };
export type Lead = "ko" | "en";

export type Block =
  /** 소제목 (h2) */
  | ({ t: "h" } & Bi)
  /** 문단 */
  | ({ t: "p" } & Bi)
  /** 점 목록 */
  | { t: "list"; items: Bi[] }
  /** 한국어 예문. ko = 예문, en = 뜻. 🔊 로 들을 수 있다 */
  | { t: "ex"; items: Bi[] }
  /** ✨ 알아 두기 */
  | ({ t: "tip" } & Bi)
  /** 작은 카드 격자 — mark(그림 글자) · ko · en · sub(한 줄 더) */
  | { t: "cards"; items: (Bi & { mark: string; sub?: string })[] }
  /** 화면에서만 움직이는 부품 (예: 내 띠 찾기). 정적 본문에는 안 나간다 */
  | { t: "widget"; id: string };

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 큰 줄 · 작은 줄 순서 */
export const ordered = (b: Bi, lead: Lead): [string, string] => (lead === "ko" ? [b.ko, b.en] : [b.en, b.ko]);

/** 블록에서 검색에 쓸 글자 — 제목 · 본문 찾기 */
export function docText(blocks: Block[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.t === "widget") continue;
    if ("items" in b) for (const i of b.items) out.push(i.ko, i.en, "sub" in i && i.sub ? i.sub : "");
    else out.push(b.ko, b.en);
  }
  return out.filter(Boolean).join(" ");
}

/** 정적 본문용 HTML. 화면의 글과 같은 내용 — 크롤러에만 보이는 말은 없다 */
export function docHtml(blocks: Block[], lead: Lead): string {
  const two = (b: Bi) => {
    const [big, small] = ordered(b, lead);
    return `${esc(big)} <span class="text-muted">${esc(small)}</span>`;
  };
  return blocks
    .map((b) => {
      switch (b.t) {
        case "h":
          return `<h2 class="mt-8 mb-2 font-display text-[1.35rem] font-normal">${two(b)}</h2>`;
        case "p":
          return `<p class="mt-3">${two(b)}</p>`;
        case "tip":
          return `<p class="mt-3">✨ ${two(b)}</p>`;
        case "list":
        case "ex":
          return `<ul class="mt-3">${b.items.map((i) => `<li class="mt-1.5">${two(i)}</li>`).join("")}</ul>`;
        case "cards":
          return `<ul class="mt-3">${b.items
            .map((i) => `<li class="mt-1.5">${esc(i.mark)} ${two(i)}${i.sub ? ` — ${esc(i.sub)}` : ""}</li>`)
            .join("")}</ul>`;
        case "widget":
          return "";
      }
    })
    .join("");
}
