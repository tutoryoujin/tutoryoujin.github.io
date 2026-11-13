import { useEffect, type ReactNode } from "react";
import { cn } from "./cn";
import { Footer, Mark, ThemeToggle, WithYoujin } from "./Page";

/* ============================================================
   앱이 아닌 페이지의 겉 — 첫 화면(/) · 개인정보 처리방침 · 글(/notes/).
   앱은 <Page> 를 쓴다 (헤더에 앱 이름 · 형제 앱 메뉴).

   헤더 = 이응 + 「Korean with Youjin」(첫 화면으로) + 오른쪽 링크 + 테마.
   ============================================================ */
const focus = "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary";
/** 본문 폭 — 앱과 같은 640px. 첫 화면은 wide 로 넓게 */
export const siteWrap = "mx-auto w-full max-w-(--shell-width) px-4";
export const homeWrap = "mx-auto w-full max-w-[1440px] px-4 sm:px-10 min-[1200px]:px-16";

/** 헤더 오른쪽의 글자 링크. 영어가 크고 한국어가 옆에 작게 (첫 화면 규칙, #84) */
export function SiteNavLink({ href, en, ko, className, current }: { href: string; en: string; ko: string; className?: string; current?: boolean }) {
  return (
    <a
      className={cn("inline-flex min-h-11 items-center rounded-full px-4 font-bold text-ink no-underline hover:bg-surface", current && "bg-surface", focus, className)}
      href={href}
      {...(current ? { "aria-current": "page" as const } : {})}
    >
      {en}
      <span className="ml-1.5 text-[0.8rem] font-semibold text-muted">{ko}</span>
    </a>
  );
}

export function SiteHeader({ wide, children }: { wide?: boolean; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur-[14px]">
      <div className={cn(wide ? homeWrap : siteWrap, "flex min-h-16 items-center justify-between gap-3")}>
        <a className={cn("flex min-w-0 items-center gap-2.5 rounded-full text-ink no-underline", focus)} href="/">
          <Mark />
          <span className="font-display text-[1.15rem] whitespace-nowrap">
            Korean <WithYoujin />
          </span>
        </a>
        <nav className="flex shrink-0 items-center gap-1.5" aria-label="메뉴 / Menu">
          {children}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

/**
 * 앱이 아닌 페이지 한 장. 헤더 · 본문 · 꼬리말.
 * title 은 브라우저 탭 제목 — 빌드가 넣은 검색 제목을 화면 안에서 바꿀 때만 (글 목록 ↔ 글)
 */
export function SitePage({ children, title, nav }: { children: ReactNode; title?: string; nav?: ReactNode }) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
  return (
    <>
      <SiteHeader>
        {nav ?? (
          <>
            <SiteNavLink href="/#apps" en="Apps" ko="모든 앱" className="hidden sm:inline-flex" />
            <SiteNavLink href="/notes/" en="Notes" ko="메모" />
          </>
        )}
      </SiteHeader>
      <main className={cn(siteWrap, "flex-[1_0_auto] pt-8")}>{children}</main>
      <Footer>
        <div className="flex items-start gap-2.5">
          <Mark className="size-8" />
          <div>
            <b className="block font-display text-[1.1rem] font-normal text-ink">
              Korean <WithYoujin />
            </b>
            <span>
              Small apps for learning Korean, a little every day.
              <br />
              한국어를 배우는 작은 앱, 매일 조금씩.
            </span>
          </div>
        </div>
      </Footer>
    </>
  );
}

/** 페이지 제목 (h1). lead 쪽이 크고 다른 말이 아래 작게 */
export function SiteTitle({ big, small, children }: { big: string; small: string; children?: ReactNode }) {
  return (
    <header className="break-keep">
      <h1 className="font-display text-[clamp(2.1rem,7vw,2.8rem)] leading-[1.15] font-normal text-balance">
        {big}
        <span className="mt-1.5 block font-app text-[1.05rem] font-bold text-muted">{small}</span>
      </h1>
      {children}
    </header>
  );
}
