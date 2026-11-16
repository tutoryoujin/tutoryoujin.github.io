/* 개인정보 처리방침 /privacy/ (#79). 글은 shared/privacy.ts — 정적 본문과 같은 글 */
import { pageBySlug } from "@yj/pages";
import { Doc, mount, SitePage, SiteTitle } from "@yj/ui";

const page = pageBySlug("privacy")!;

mount(
  <SitePage>
    <SiteTitle big={page.en} small={page.ko} lead={page.lead}>
      <p className="mt-3 text-[0.9rem] font-bold text-muted">
        Updated {page.updated}{" "}
        <span className="font-semibold" lang="ko">
          · 고친 날
        </span>
      </p>
    </SiteTitle>
    <Doc blocks={page.blocks()} lead={page.lead} />
  </SitePage>,
);
