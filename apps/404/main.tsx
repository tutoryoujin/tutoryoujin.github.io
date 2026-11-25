/* 404 (#95). GitHub Pages 는 없는 주소마다 dist/404.html 을 보여 준다 (vite.config.ts 가 옮긴다).
   글은 shared/pages.ts 의 NOT_FOUND — 정적 본문(shared/seo.ts)과 같은 글.
   앱 밖 페이지라 영어가 크고 한국어가 아래 작다 */
import { APPS } from "@yj/apps";
import { NOTES_TITLE } from "@yj/notes";
import { NOT_FOUND } from "@yj/pages";
import { cn, Ieung, mount, SitePage, SiteTitle } from "@yj/ui";

const focus = "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary";
const row = cn(
  "flex min-h-11 flex-col justify-center rounded-lg border-2 border-ink bg-surface px-4 py-2.5 text-ink no-underline break-keep hover:border-primary",
  focus,
);

function Link({ href, en, ko }: { href: string; en: string; ko: string }) {
  return (
    <li>
      <a className={row} href={href}>
        <b className="font-bold">{en}</b>
        <span className="text-[0.85rem] font-semibold text-muted" lang="ko">
          {ko}
        </span>
      </a>
    </li>
  );
}

mount(
  <SitePage>
    {/* 여행 가방 끌고 손 흔드는 이응이 — 길을 잘못 들어도 같이 돌아가요 (#111) */}
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <SiteTitle big={NOT_FOUND.en} small={NOT_FOUND.ko} lead="en">
          <p className="mt-3 font-bold">{NOT_FOUND.lead}</p>
        </SiteTitle>
      </div>
      <div className="w-24 shrink-0 min-[440px]:w-36 [&_svg]:h-auto [&_svg]:w-full">
        <Ieung scene="travel" />
      </div>
    </div>
    <ul className="mt-6 grid gap-2.5">
      <Link href="/" en="Home — Korean with Youjin" ko="첫 화면" />
      <Link href="/notes/" en={NOTES_TITLE.en} ko={NOTES_TITLE.ko} />
    </ul>
    <h2 className="mt-8 font-display text-[1.3rem] font-extrabold">
      All apps <span className="text-[0.9rem] font-app font-bold text-muted" lang="ko">모든 앱</span>
    </h2>
    <ul className="mt-3 grid gap-2.5 min-[440px]:grid-cols-2">
      {APPS.map((a) => (
        <Link key={a.slug} href={`/${a.slug}/`} en={`${a.emoji} ${a.en}`} ko={a.ko} />
      ))}
    </ul>
  </SitePage>,
);
