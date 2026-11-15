/* 글 /notes/ (#50) — 목록과 글 하나를 이 페이지 하나가 그린다.
   주소를 보고 고른다: /notes/ = 목록, /notes/<slug>/ = 글.
   글마다 HTML 은 빌드가 따로 만든다 (vite.config.ts notesPages) — 메타 · 정적 본문이 글마다 다르다.
   글 원본은 shared/notes/ */
import { appBySlug } from "@yj/apps";
import { docText } from "@yj/doc";
import { noteBySlug, NOTES, NOTES_TITLE, type Note } from "@yj/notes";
import { pageMeta } from "@yj/seo";
import { cn, Doc, mount, SitePage, SiteNavLink, SiteTitle } from "@yj/ui";
import { useMemo, useState, type ReactNode } from "react";
import { TtiFinder } from "./TtiFinder";

/** 글 속 움직이는 부품 — 블록 { t: "widget", id } */
const WIDGETS: Record<string, ReactNode> = { "tti-finder": <TtiFinder /> };

const focus = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary";
const lift = "transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none";

const nav = (current: boolean) => (
  <>
    <SiteNavLink href="/#apps" en="Apps" ko="모든 앱" className="hidden sm:inline-flex" />
    <SiteNavLink href="/notes/" en="Notes" ko="메모" current={current} />
  </>
);

function NoteCard({ n }: { n: Note }) {
  return (
    <a href={`/notes/${n.slug}/`} className={cn("block rounded-xl bg-surface px-5 py-4 text-ink no-underline shadow-card", lift, focus)}>
      <span className="block font-display text-[1.35rem] leading-[1.25]">{n.title.ko}</span>
      <span className="mt-0.5 block text-[0.95rem] font-bold text-muted">{n.title.en}</span>
      <span className="mt-2 block text-[0.95rem] font-semibold">
        {n.summary.ko}
        <span className="block text-[0.85rem] text-muted">{n.summary.en}</span>
      </span>
    </a>
  );
}

function List() {
  const [q, setQ] = useState("");
  // 제목 · 한 줄 · 본문에서 찾는다. 띄어쓰기 · 대소문자는 무시
  const index = useMemo(
    () => NOTES.map((n) => ({ n, text: [n.title.ko, n.title.en, n.summary.ko, n.summary.en, docText(n.blocks)].join(" ").toLowerCase() })),
    [],
  );
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const found = index.filter((x) => words.every((w) => x.text.includes(w))).map((x) => x.n);

  return (
    <SitePage nav={nav(true)}>
      <SiteTitle big={NOTES_TITLE.ko} small={NOTES_TITLE.en}>
        <p className="mt-3 font-bold">
          한국어를 배우다 궁금해지는 것들을 짧게 풀어요.
          <span className="block text-[0.9rem] font-semibold text-muted">Short notes on the Korean you’ll actually run into.</span>
        </p>
      </SiteTitle>
      <label className="mt-6 block">
        <span className="sr-only">글 찾기 / Search notes</span>
        <input
          type="search"
          className="min-h-12 w-full rounded-full border-2 border-line bg-surface px-5 font-bold text-ink placeholder:text-muted focus-visible:border-primary"
          placeholder="찾기 · Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      <ul className="mt-5 flex flex-col gap-3" aria-live="polite">
        {found.map((n) => (
          <li key={n.slug}>
            <NoteCard n={n} />
          </li>
        ))}
      </ul>
      {found.length === 0 && (
        <p className="mt-5 rounded-lg bg-surface px-5 py-4 font-bold">
          찾는 글이 아직 없어요. 다른 말로 찾아보세요.
          <span className="block text-[0.9rem] font-semibold text-muted">No notes match yet. Try another word.</span>
        </p>
      )}
    </SitePage>
  );
}

function Article({ n }: { n: Note }) {
  const apps = n.apps.map(appBySlug);
  return (
    <SitePage nav={nav(false)} title={pageMeta(`notes/${n.slug}`).title}>
      <a href="/notes/" className={cn("mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-full font-bold text-muted no-underline hover:text-ink", focus)}>
        <span aria-hidden="true">←</span> {NOTES_TITLE.ko}
        <span className="text-[0.85rem] font-semibold">{NOTES_TITLE.en}</span>
      </a>
      <article>
        <SiteTitle big={n.title.ko} small={n.title.en}>
          <p className="mt-3 text-[0.9rem] font-bold text-muted">
            <time dateTime={n.added}>{n.added}</time> · Youjin
          </p>
        </SiteTitle>
        <Doc blocks={n.blocks} lead="ko" widgets={WIDGETS} />
      </article>
      {apps.length > 0 && (
        <section className="mt-12" aria-labelledby="practice">
          <h2 id="practice" className="font-display text-[1.45rem] font-normal">
            앱에서 연습하기
            <span className="block font-app text-[0.95rem] font-bold text-muted">Practice in the app</span>
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
                      {a.ko} <span className="font-app text-[0.85rem] font-bold">{a.en}</span>
                    </span>
                    <span className="block text-[0.95rem] font-bold">{a.about.ko}</span>
                    <span className="block text-[0.82rem] font-semibold">{a.about.en}</span>
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
      <SiteTitle big="글을 찾을 수 없어요" small="We couldn’t find that note." />
      <a href="/notes/" className={cn("mt-6 inline-flex min-h-11 items-center font-bold text-primary underline", focus)}>
        {NOTES_TITLE.ko} · {NOTES_TITLE.en}
      </a>
    </SitePage>
  );
}

const slug = location.pathname.match(/^\/notes\/([a-z0-9-]+)\/?$/)?.[1];
const note = slug ? noteBySlug(slug) : undefined;
mount(slug ? note ? <Article n={note} /> : <NotFound /> : <List />);
