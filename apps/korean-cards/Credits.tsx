/* ============================================================
   이미지 출처 — CC BY / BY-SA 요구사항(제목·저작자·출처·라이선스).
   데이터는 credits-data.json (tools/korean-cards/build_images.py 가 생성).
   ============================================================ */
import { Fragment } from "react";
import credits from "./credits-data.json";
import { DECKS, hasCard, cardOf } from "./decks";

type Credit = { key: string; title: string; author: string; license: string; licenseUrl: string; source: string };
const ALL = credits as Credit[];

const Ext = ({ href, children }: { href: string; children: string }) => (
  <a href={href} target="_blank" rel="noopener">
    {children}
  </a>
);

export function Credits() {
  return (
    <>
      <section className="home-hero">
        <h1>이미지 출처</h1>
        <p>Image credits</p>
      </section>
      <p className="lead">
        Photos are cropped and resized from the originals. Each image keeps its original license. Illustrations: Microsoft Fluent
        Emoji (MIT).
      </p>
      {DECKS.map((deck) => {
        const items = ALL.filter((c) => c.key.startsWith(deck.id + "/"));
        if (!items.length) return null;
        const head = (
          <h2>
            {deck.title.ko} <small>{deck.title.en}</small>
          </h2>
        );
        // 덱 전체가 한 출처(예: Fluent Emoji)면 한 줄로 요약
        const one = items.every((c) => c.author === items[0].author && c.license === items[0].license);
        if (one) {
          const c = items[0];
          return (
            <Fragment key={deck.id}>
              {head}
              <p className="credit-summary">
                All {items.length} illustrations: <Ext href={c.source.replace(/\/tree\/main\/assets\/.*$/, "")}>{c.author}</Ext> ·{" "}
                <Ext href={c.licenseUrl}>{c.license}</Ext>
              </p>
            </Fragment>
          );
        }
        // 사진은 장마다 한 줄
        return (
          <Fragment key={deck.id}>
            {head}
            <ul className="credit-list">
              {items.map((c) => {
                const id = c.key.slice(deck.id.length + 1);
                return (
                  <li key={c.key}>
                    <b>{hasCard(deck, id) ? cardOf(deck, id).ko : id}</b> <Ext href={c.source}>{c.title}</Ext> by{" "}
                    {c.author.replace(/^by\s+/i, "")}, <Ext href={c.licenseUrl}>{c.license}</Ext>
                  </li>
                );
              })}
            </ul>
          </Fragment>
        );
      })}
    </>
  );
}
