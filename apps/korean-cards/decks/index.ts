/* 덱 목록. 새 무료 덱 파일을 만들면 여기 한 줄 추가 (홈 화면 순서 = 이 순서).
   유료 덱은 paid.ts 에 겉면만. */
import { SITE, visibleProducts, type Product, type SiteConfig } from "@yj/site";
import type { Card, Deck, DeckInfo } from "../types";
import emotions from "./emotions";
import family from "./family";
import food from "./food";
import { PAID } from "./paid";
import places from "./places";
import weather from "./weather";

/** 무료 덱 — 카드까지 번들에 들어 있다 */
export const DECKS: Deck[] = [emotions, food, family, places, weather];

export const infoOf = (d: Deck): DeckInfo => ({
  id: d.id,
  title: d.title,
  emoji: d.emoji,
  cover: d.cover,
  color: d.color,
  folderArt: d.folderArt,
  unit: d.unit,
  count: d.cards.length,
  access: "free",
});

/** 모든 덱의 겉면 — 무료 다음 유료 */
export const CATALOG: DeckInfo[] = [...DECKS.map(infoOf), ...PAID];

export type ShelfItem = { info: DeckInfo; product?: Product };

/** 홈 더미에 놓을 덱. 무료 덱 전부 + 판매 링크가 있는 유료 덱 (잠긴 카드로) */
export function shelf(c: SiteConfig = SITE, catalog: DeckInfo[] = CATALOG): ShelfItem[] {
  const links = new Map(visibleProducts(c).map((p) => [p.id, p]));
  return catalog.flatMap((info): ShelfItem[] => {
    if (info.access === "free") return [{ info }];
    const product = info.product ? links.get(info.product) : undefined;
    return product ? [{ info, product }] : [];
  });
}

/* ---------- 덱 내용 받기 ----------
   앱은 loadDeck() 만 부른다. 무료 덱은 번들에서 바로.
   유료 덱은 아직 받을 곳이 없다 — 계정·서버(#12)가 생기면 fetchPaidDeck 에서
   로그인 확인 뒤 서버에서 받는다. 그때 앱 화면은 바뀌지 않는다. */
const cache = new Map<string, Deck>(DECKS.map((d) => [d.id, d]));

/** 이미 받아 둔 덱 (무료 덱은 처음부터 있다). 없으면 undefined */
export const peekDeck = (id: string) => cache.get(id);

export async function loadDeck(id: string): Promise<Deck | undefined> {
  const hit = cache.get(id);
  if (hit) return hit;
  const d = await fetchPaidDeck(id);
  if (d) cache.set(id, d);
  return d;
}

async function fetchPaidDeck(_id: string): Promise<Deck | undefined> {
  return undefined;
}

/* ---------- 카드 찾기 — 나중에 받은 덱도 같이 ---------- */
const cardMaps = new WeakMap<Deck, Map<string, Card>>();
const cardsOf = (deck: Deck) => {
  let m = cardMaps.get(deck);
  if (!m) cardMaps.set(deck, (m = new Map(deck.cards.map((c) => [c.id, c]))));
  return m;
};
export const cardOf = (deck: Deck, id: string) => cardsOf(deck).get(id) as Card;
export const hasCard = (deck: Deck, id: string) => cardsOf(deck).has(id);

export const imgSrc = (deck: Deck, card: Card) => `img/${deck.id}/${card.id}.webp`;
/** 홈 더미 겉면 그림. 사진은 잘라 내면 그냥 잘린 사진으로 보이므로 투명 아이콘만 쓴다 */
export const folderArtSrc = (deck: Pick<DeckInfo, "id" | "folderArt" | "cover">) => `img/${deck.id}/${deck.folderArt || deck.cover}.webp`;
export const colorOf = (deck: Deck, card: Card) => deck.groups[card.group]?.color ?? "gray";
