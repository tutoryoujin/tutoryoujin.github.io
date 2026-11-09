import { useEffect, useRef, useState, type ReactNode } from "react";
import { APPS, appBySlug } from "../apps";
import { cn } from "./cn";

/* ============================================================
   모든 앱의 겉 — 헤더 · 본문 · 꼬리말.

   앱은 <Page app="korean-clock"> 로 감싸기만 한다. 이름·영문·꼬리말·
   메뉴는 shared/apps.ts 에서 온다. 앱마다 따로 적으면 갈라진다
   (실제로 그랬다 — 카드 쪽 메뉴만 안 닫혔고, 푸터 내용이 달라졌다).
   ============================================================ */
/** 본문 기본 레이아웃. 앱이 mainClass 로 통째로 바꿀 때 이걸 기준으로 cn() 한다 */
export const mainClass = "mx-auto flex w-full max-w-(--shell-width) flex-[1_0_auto] flex-col gap-3.5 px-4 pt-4";
/** 헤더·꼬리말 안쪽 — 본문과 같은 선에 놓인다 */
const inner = "mx-auto w-full max-w-(--shell-width) px-4";

type Props = {
  app: string;
  children: ReactNode;
  /** 저작권·면책 문구. 한국어 줄, 영어 줄 */
  legal?: ReactNode;
  /** 워드마크를 <h1> 로 쌀지. 화면에 다른 <h1> 이 없을 때만 */
  h1?: boolean;
  /** 본문 폭(px). 기본 640. CSS 의 :root { --shell-width } 로 정해도 된다 */
  width?: number;
  /** 이 앱 안의 메뉴 항목 (예: 이미지 출처). 형제 앱 목록 뒤에 붙는다 */
  links?: NavLink[];
  /** <main> 의 클래스. 앱이 레이아웃을 통째로 직접 잡을 때만 바꾼다 */
  mainClass?: string;
};
export type NavLink = { href: string; ko: string; en: string; active?: boolean };

/* 브랜드 마크는 마스코트 이응. 정사각 칸 + 정사각 symbol viewBox 라
   preserveAspectRatio 가 손댈 일이 없다. margin 으로 위치를 밀지 않는다. */
const Mark = ({ className }: { className?: string }) => (
  <span
    className={cn("block size-9 shrink-0 overflow-hidden rounded-full bg-sky transition-transform duration-150 [&_svg]:size-full", className)}
    aria-hidden="true"
  >
    <svg>
      <use href="#ieung-mark" />
    </svg>
  </span>
);
const withYoujin = "text-[0.78em] not-italic text-primary";

export function Page({ app, children, legal, h1 = true, width, links = [], mainClass: main = mainClass }: Props) {
  const me = appBySlug(app);
  useEffect(() => {
    if (width) document.documentElement.style.setProperty("--shell-width", width + "px");
  }, [width]);

  return (
    <>
      <Header slug={app} h1={h1} links={links} />
      <main className={main}>{children}</main>
      <Footer legal={legal}>
        <div className="flex items-start gap-2.5">
          <Mark className="size-8" />
          <div>
            <b className="block text-[0.95rem] font-extrabold text-ink">
              {me.ko} <em className={withYoujin}>with Youjin</em>
            </b>
            <span>
              {me.tagline.ko}
              <br />
              {me.tagline.en}
            </span>
          </div>
        </div>
      </Footer>
    </>
  );
}

/** 꼬리말. children 은 위쪽 브랜드 칸 (첫 화면은 비운다) */
export function Footer({ children, legal }: { children?: ReactNode; legal?: ReactNode }) {
  return (
    <footer className="mt-9 border-t border-line bg-surface pt-7 pb-[calc(--spacing(7)+env(safe-area-inset-bottom,0px))] text-[0.8rem] leading-[1.55] text-muted">
      <div className={cn(inner, "flex flex-col gap-4 sm:grid sm:grid-cols-[1fr_auto] sm:items-start")}>
        {children}
        {legal && <p className="text-[0.74rem] sm:col-span-full">{legal}</p>}
        <p className="border-t border-line pt-3.5 text-[0.74rem] font-bold sm:col-span-full">
          © {new Date().getFullYear()} Made by Youjin. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function Header({ slug, h1, links }: { slug: string; h1: boolean; links: NavLink[] }) {
  const inner_ = links.some((l) => l.active);
  const me = appBySlug(slug);
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const Tag = h1 ? "h1" : "span";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    // 메뉴 밖을 누르면 닫는다. 메뉴 안의 링크를 눌러도 닫는다 (해시 이동은 새로고침이 없다)
    const onClick = (e: MouseEvent) => {
      if (!btn.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  const navLink = (active?: boolean) =>
    cn(
      "flex min-h-11 items-baseline justify-between gap-3 rounded-sm px-3 py-2.5 text-[0.95rem] font-bold text-ink no-underline hover:bg-bg",
      active && "bg-bg text-primary",
    );
  const navSmall = "text-[0.7rem] font-semibold text-muted";
  const bar = "block h-0.5 w-4.5 rounded-[2px] bg-ink transition-[transform,background] duration-200";

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/82 backdrop-blur-[14px] backdrop-saturate-[1.4]">
      <div className={cn(inner, "flex min-h-15 items-center justify-between gap-3")}>
        <div className="flex min-w-0 items-center gap-2.5 text-ink">
          {/* 이응 = 모든 앱 첫 화면, 이름 = 이 앱 첫 화면. 앱 사이를 오가는 길이 메뉴 안에만 있으면 못 찾는다 */}
          {/* 이응 마크는 36px 라 누를 자리를 44px 로 넓힌다 (바깥으로만 — 줄 높이는 그대로) */}
          <a className="group -m-1 flex min-w-0 shrink-0 items-center rounded-full p-1" href="/" aria-label="모든 앱 / All apps">
            <Mark className="group-hover:scale-108" />
          </a>
          <a
            className="flex min-w-0 items-center rounded-sm text-inherit no-underline"
            href={`/${slug}/`}
            aria-label={`${me.ko} with Youjin 처음으로 / ${me.en} start`}
          >
            <Tag className="text-[1.05rem] leading-[1.1] font-extrabold whitespace-nowrap">
              {me.ko} <em className={withYoujin}>with Youjin</em>
              <small className="block text-[0.7rem] font-semibold text-muted">{me.en}</small>
            </Tag>
          </a>
        </div>
        <div className="relative shrink-0">
          <button
            ref={btn}
            className="group grid size-11 place-items-center rounded-sm border border-line bg-surface p-0"
            type="button"
            aria-label={open ? "메뉴 닫기 / Close menu" : "메뉴 열기 / Open menu"}
            aria-expanded={open}
            aria-controls="siteNav"
            onClick={() => setOpen((o) => !o)}
          >
            {/* 열리면 그 자리에서 X 가 된다. 아이콘을 두 벌 두지 않는다 */}
            <span className="relative block w-4.5" aria-hidden="true">
              <span className={cn(bar, "absolute -top-1.5 left-0 group-aria-expanded:translate-y-1.5 group-aria-expanded:rotate-45")} />
              <span className={cn(bar, "group-aria-expanded:bg-transparent")} />
              <span className={cn(bar, "absolute top-1.5 left-0 group-aria-expanded:-translate-y-1.5 group-aria-expanded:-rotate-45")} />
            </span>
          </button>
          <nav
            className="absolute top-[calc(100%+8px)] right-0 z-1 flex min-w-53 flex-col gap-0.5 rounded-md border border-line bg-surface p-1.5 shadow-card"
            id="siteNav"
            aria-label="메뉴 / Menu"
            hidden={!open}
          >
            {/* 형제 앱을 모두 건다. 한쪽만 걸려 있으면 묶음이 아니라 외딴 페이지로 보인다 */}
            {APPS.map((a) => {
              const active = a.slug === slug && !inner_;
              return (
                <a key={a.slug} href={`/${a.slug}/`} className={navLink(active)} {...(active ? { "aria-current": "page" as const } : {})}>
                  {a.ko}
                  <small className={navSmall}>{a.en}</small>
                </a>
              );
            })}
            {links.map((l) => (
              <a key={l.href} href={l.href} className={navLink(l.active)} {...(l.active ? { "aria-current": "page" as const } : {})}>
                {l.ko}
                <small className={navSmall}>{l.en}</small>
              </a>
            ))}
            <a href="/" className={navLink()}>
              모든 앱<small className={navSmall}>All apps</small>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
