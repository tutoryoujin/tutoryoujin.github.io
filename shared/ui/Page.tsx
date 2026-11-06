import { useEffect, useRef, useState, type ReactNode } from "react";
import { APPS, appBySlug } from "../apps";

/* ============================================================
   모든 앱의 겉 — 헤더 · 본문 · 꼬리말.

   앱은 <Page app="korean-clock"> 로 감싸기만 한다. 이름·영문·꼬리말·
   메뉴는 shared/apps.ts 에서 온다. 앱마다 따로 적으면 갈라진다
   (실제로 그랬다 — 카드 쪽 메뉴만 안 닫혔고, 푸터 내용이 달라졌다).
   ============================================================ */
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

const MARK = (
  <svg>
    <use href="#ieung-mark" />
  </svg>
);

export function Page({ app, children, legal, h1 = true, width, links = [], mainClass = "yj-main" }: Props) {
  const me = appBySlug(app);
  useEffect(() => {
    if (width) document.documentElement.style.setProperty("--shell-width", width + "px");
  }, [width]);

  return (
    <>
      <Header slug={app} h1={h1} links={links} />
      <main className={mainClass}>{children}</main>
      <footer className="site-footer">
        <div className="site-inner">
          <div className="foot-brand">
            <span className="brand-mark sm" aria-hidden="true">
              {MARK}
            </span>
            <div>
              <b>
                {me.ko} <em>with Youjin</em>
              </b>
              <span>
                {me.tagline.ko}
                <br />
                {me.tagline.en}
              </span>
            </div>
          </div>
          {legal && <p className="foot-legal">{legal}</p>}
          <p className="foot-copy">© {new Date().getFullYear()} Made by Youjin. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

function Header({ slug, h1, links }: { slug: string; h1: boolean; links: NavLink[] }) {
  const inner = links.some((l) => l.active);
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

  return (
    <header className="site-header">
      <div className="site-inner">
        <a className="brand" href={`/${slug}/`} aria-label={`${me.ko} with Youjin 홈 / Home`}>
          <span className="brand-mark" aria-hidden="true">
            {MARK}
          </span>
          <Tag className="brand-text">
            {me.ko} <em>with Youjin</em>
            <small>{me.en}</small>
          </Tag>
        </a>
        <div className="menu">
          <button
            ref={btn}
            className="menu-btn"
            type="button"
            aria-label={open ? "메뉴 닫기 / Close menu" : "메뉴 열기 / Open menu"}
            aria-expanded={open}
            aria-controls="siteNav"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="bars" aria-hidden="true"></span>
          </button>
          <nav className="site-nav" id="siteNav" aria-label="메뉴 / Menu" hidden={!open}>
            {/* 형제 앱을 모두 건다. 한쪽만 걸려 있으면 묶음이 아니라 외딴 페이지로 보인다 */}
            {APPS.map((a) => (
              <a
                key={a.slug}
                href={`/${a.slug}/`}
                {...(a.slug === slug && !inner ? { className: "active", "aria-current": "page" as const } : {})}
              >
                {a.ko}
                <small>{a.en}</small>
              </a>
            ))}
            {links.map((l) => (
              <a key={l.href} href={l.href} {...(l.active ? { className: "active", "aria-current": "page" as const } : {})}>
                {l.ko}
                <small>{l.en}</small>
              </a>
            ))}
            <a href="/">
              모든 앱<small>All apps</small>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}


