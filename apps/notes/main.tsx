/* 블로그 /notes/ (#50 · #94) — 목록과 글 하나를 이 페이지 하나가 그린다. 영어가 크고 한국어가 아래.
   주소를 보고 고른다: /notes/ = 목록(?page=N), /notes/<slug>/ = 글.
   글마다 HTML 은 빌드가 따로 만든다 (vite.config.ts notesPages) — 메타 · 정적 본문이 글마다 다르다.
   글 원본은 shared/notes/ */
import { appBySlug } from "@yj/apps";
import { docText } from "@yj/doc";
import { noteBySlug, NOTES, NOTES_NAV, NOTES_TITLE, pageList, paginate, type Note } from "@yj/notes";
import { pageMeta } from "@yj/seo";
import { cn, Doc, Ieung, mount, SitePage, SiteNavLink, SiteTitle } from "@yj/ui";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { TtiFinder } from "./TtiFinder";

/** 글 속 움직이는 부품 — 블록 { t: "widget", id } */
const WIDGETS: Record<string, ReactNode> = { "tti-finder": <TtiFinder /> };

const focus = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary";
const lift = "transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none";

const nav = (current: boolean) => (
  <>
    <SiteNavLink href="/#apps" en="Apps" ko="모든 앱" className="hidden sm:inline-flex" />
    <SiteNavLink href="/notes/" en={NOTES_NAV.en} ko={NOTES_NAV.ko} current={current} />
  </>
);

/** 게시판 한 줄 — 제목 · 한 줄 · 날짜. 영어가 크고 한국어가 아래 (#94) */
function Row({ n }: { n: Note }) {
  return (
    <li className="border-b border-line">
      <a
        href={`/notes/${n.slug}/`}
        className={cn("flex flex-col gap-1 px-2 py-4 text-ink no-underline hover:bg-surface sm:flex-row sm:items-start sm:gap-4", focus)}
      >
        <span className="min-w-0 flex-1 break-keep">
          <span className="block text-[1.12rem] leading-[1.3] font-extrabold">{n.title.en}</span>
          <span className="block font-display text-[1.02rem] text-muted" lang="ko">
            {n.title.ko}
          </span>
          <span className="mt-1.5 block text-[0.92rem] font-semibold">{n.summary.en}</span>
          <span className="block text-[0.85rem] font-semibold text-muted" lang="ko">
            {n.summary.ko}
          </span>
        </span>
        <time dateTime={n.added} className="shrink-0 text-[0.85rem] font-bold text-muted tabular-nums">
          {n.added}
        </time>
      </a>
    </li>
  );
}

const readPage = () => Number(new URLSearchParams(location.search).get("page")) || 1;
const pageHref = (p: number) => (p > 1 ? `?page=${p}` : location.pathname);

/** 쪽 번호. 진짜 링크(?page=N)라 새 탭 · 공유도 된다 */
function Pager({ page, pages, go }: { page: number; pages: number; go: (p: number) => void }) {
  const box = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 font-bold no-underline";
  const to = (p: number, label: ReactNode, aria: string) => (
    <a
      href={pageHref(p)}
      aria-label={aria}
      className={cn(box, "text-ink hover:bg-surface", focus)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // 새 탭은 그대로
        e.preventDefault();
        go(p);
      }}
    >
      {label}
    </a>
  );
  const off = (label: ReactNode) => (
    <span className={cn(box, "text-muted opacity-50")} aria-disabled="true">
      {label}
    </span>
  );
  const prev = (
    <>
      <span aria-hidden="true">←</span>&nbsp;Prev<span className="ml-1 text-[0.78rem] font-semibold text-muted">이전</span>
    </>
  );
  const next = (
    <>
      Next<span className="ml-1 text-[0.78rem] font-semibold text-muted">다음</span>&nbsp;<span aria-hidden="true">→</span>
    </>
  );
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1" aria-label="Pages / 쪽">
      {page > 1 ? to(page - 1, prev, "Previous page / 이전 쪽") : off(prev)}
      {pageList(page, pages).map((p, i) =>
        p === null ? (
          <span key={`gap${i}`} className="px-1 text-muted" aria-hidden="true">
            …
          </span>
        ) : p === page ? (
          // 지금 쪽 — 색에 더해 밑줄 · aria-current 로도 알린다
          <span key={p} className={cn(box, "bg-primary text-primary-ink underline underline-offset-4")} aria-current="page">
            {p}
          </span>
        ) : (
          <span key={p}>{to(p, p, `Page ${p} / ${p}쪽`)}</span>
        ),
      )}
      {page < pages ? to(page + 1, next, "Next page / 다음 쪽") : off(next)}
    </nav>
  );
}

function List() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(readPage);
  useEffect(() => {
    const on = () => setPage(readPage()); // 뒤로 가기
    addEventListener("popstate", on);
    return () => removeEventListener("popstate", on);
  }, []);
  // 제목 · 한 줄 · 본문에서 찾는다. 띄어쓰기 · 대소문자는 무시
  const index = useMemo(
    () => NOTES.map((n) => ({ n, text: [n.title.ko, n.title.en, n.summary.ko, n.summary.en, docText(n.blocks)].join(" ").toLowerCase() })),
    [],
  );
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const found = index.filter((x) => words.every((w) => x.text.includes(w))).map((x) => x.n);
  const view = paginate(found, page);
  // 없는 쪽(?page=99)으로 오면 주소도 보이는 쪽으로
  useEffect(() => {
    if (view.page !== page) {
      history.replaceState(null, "", pageHref(view.page));
      setPage(view.page);
    }
  }, [view.page, page]);

  const go = (p: number) => {
    history.pushState(null, "", pageHref(p));
    setPage(p);
    scrollTo({ top: 0 });
  };
  const search = (v: string) => {
    setQ(v);
    if (page !== 1) {
      history.replaceState(null, "", location.pathname); // 찾으면 1쪽부터
      setPage(1);
    }
  };

  return (
    <SitePage nav={nav(true)}>
      {/* 노트북 앞 이응이 — 서울에서 여러분 화면으로 (#111) */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <SiteTitle big={NOTES_TITLE.en} small={NOTES_TITLE.ko} lead="en">
            <p className="mt-3 font-bold">
              Short posts on the Korean you’ll actually run into.
              <span className="block text-[0.9rem] font-semibold text-muted" lang="ko">
                한국어를 배우다 궁금해지는 것들을 짧게 풀어요.
              </span>
            </p>
          </SiteTitle>
        </div>
        <div className="w-24 shrink-0 min-[440px]:w-36 [&_svg]:h-auto [&_svg]:w-full">
          <Ieung scene="laptop" />
        </div>
      </div>
      <label className="mt-6 block">
        <span className="sr-only">Search posts / 글 찾기</span>
        <input
          type="search"
          className="min-h-12 w-full rounded-full border-2 border-ink bg-surface px-5 font-bold text-ink placeholder:text-muted focus-visible:border-primary"
          placeholder="Search · 찾기"
          value={q}
          onChange={(e) => search(e.target.value)}
        />
      </label>
      <p className="mt-5 px-2 text-[0.85rem] font-bold text-muted" aria-live="polite">
        {found.length} {found.length === 1 ? "post" : "posts"} · 글 {found.length}개
      </p>
      {found.length > 0 ? (
        <ul className="mt-2 border-t-2 border-ink">
          {view.items.map((n) => (
            <Row key={n.slug} n={n} />
          ))}
        </ul>
      ) : (
        <div className="mt-2 flex items-center gap-3 rounded-lg border-2 border-ink bg-surface px-5 py-4 font-bold">
          {/* 붕어빵 먹으며 기다리는 이응이 — 꾸밈 (#111) */}
          <div className="w-20 shrink-0 [&_svg]:h-auto [&_svg]:w-full">
            <Ieung scene="bungeoppang" />
          </div>
          <p>
            No posts match yet. Try another word.
            <span className="block text-[0.9rem] font-semibold text-muted" lang="ko">
              찾는 글이 아직 없어요. 다른 말로 찾아보세요.
            </span>
          </p>
        </div>
      )}
      {found.length > 0 && <Pager page={view.page} pages={view.pages} go={go} />}
    </SitePage>
  );
}

function Article({ n }: { n: Note }) {
  const apps = n.apps.map(appBySlug);
  return (
    <SitePage nav={nav(false)} title={pageMeta(`notes/${n.slug}`).title}>
      <a href="/notes/" className={cn("mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-full font-bold text-muted no-underline hover:text-ink", focus)}>
        <span aria-hidden="true">←</span> {NOTES_TITLE.en}
        <span className="text-[0.85rem] font-semibold" lang="ko">
          {NOTES_TITLE.ko}
        </span>
      </a>
      <article>
        <SiteTitle big={n.title.en} small={n.title.ko} lead="en">
          <p className="mt-3 text-[0.9rem] font-bold text-muted">
            <time dateTime={n.added}>{n.added}</time> · Youjin
          </p>
        </SiteTitle>
        <Doc blocks={n.blocks} lead="en" widgets={WIDGETS} />
      </article>
      {apps.length > 0 && (
        <section className="mt-12" aria-labelledby="practice">
          <h2 id="practice" className="font-display text-[1.45rem] font-extrabold">
            Practice in the app
            <span className="block font-app text-[0.95rem] font-bold text-muted" lang="ko">
              앱에서 연습하기
            </span>
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {apps.map((a) => (
              <li key={a.slug}>
                <a
                  href={`/${a.slug}/`}
                  className={cn("flex items-center gap-4 rounded-xl px-5 py-4 no-underline", lift, focus)}
                  style={{ background: `var(--${a.tone}-bg)`, color: `var(--${a.tone}-ink)` }}
                >
                  <span className="text-[2rem]" aria-hidden="true">
                    {a.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[1.3rem]">
                      {a.en}{" "}
                      <span className="font-app text-[0.85rem] font-bold" lang="ko">
                        {a.ko}
                      </span>
                    </span>
                    <span className="block text-[0.95rem] font-bold">{a.about.en}</span>
                    <span className="block text-[0.82rem] font-semibold" lang="ko">
                      {a.about.ko}
                    </span>
                  </span>
                  <span aria-hidden="true" className="font-bold">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </SitePage>
  );
}

function NotFound() {
  return (
    <SitePage nav={nav(false)}>
      <SiteTitle big="We couldn’t find that post." small="글을 찾을 수 없어요" lead="en" />
      <a href="/notes/" className={cn("mt-6 inline-flex min-h-11 items-center font-bold text-primary underline", focus)}>
        {NOTES_TITLE.en} · {NOTES_TITLE.ko}
      </a>
    </SitePage>
  );
}

const slug = location.pathname.match(/^\/notes\/([a-z0-9-]+)\/?$/)?.[1];
const note = slug ? noteBySlug(slug) : undefined;
mount(slug ? note ? <Article n={note} /> : <NotFound /> : <List />);
