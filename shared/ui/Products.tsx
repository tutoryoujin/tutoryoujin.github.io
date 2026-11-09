import { useId } from "react";
import { track } from "../analytics";
import { PRODUCTS_COPY, productsOn, SITE, visibleProducts, type SiteConfig } from "../site";
import { cn } from "./cn";

/* ============================================================
   상품 — shared/site.ts 의 products 배열. 비었거나 판매 링크가 없으면 그리지 않는다.
   유료 덱 판매 링크(Payhip 등)를 넣을 자리.

     <Products source="home" />
   ============================================================ */
export function Products({ source, className, config = SITE }: { source: string; className?: string; config?: SiteConfig }) {
  const id = useId();
  if (!productsOn(config)) return null;
  const t = PRODUCTS_COPY;

  return (
    <section className={cn("text-left", className)} aria-labelledby={`${id}-title`} lang="en">
      <h2 id={`${id}-title`} className="font-display text-display-md text-ink">
        {t.title}
      </h2>
      <p className="mt-0.5 mb-3 text-[0.9rem] font-bold text-muted">{t.body}</p>
      <ul className="grid gap-2.5">
        {visibleProducts(config).map((p) => (
          <li key={p.id}>
            <a
              className="flex min-h-11 items-center gap-3.5 rounded-lg bg-surface px-4 py-3.5 text-ink no-underline shadow-card"
              href={p.href}
              target="_blank"
              rel="noopener"
              onClick={() => track("product-click", { product: p.id, source }, config)}
            >
              {p.image ? (
                <img className="size-13 flex-none rounded-md bg-sky object-cover" src={p.image} alt="" loading="lazy" />
              ) : (
                <span className="grid size-13 flex-none place-items-center rounded-md bg-sky text-[2rem]" aria-hidden="true">
                  {p.emoji ?? "🃏"}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <b className="block text-body-strong">{p.title}</b>
                <span className="block text-[0.85rem] text-muted">{p.description}</span>
              </span>
              <span className="flex-none text-right">
                {p.price && <b className="block text-body-strong">{p.price}</b>}
                <span className="text-label text-primary">
                  {p.cta ?? t.cta} <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
