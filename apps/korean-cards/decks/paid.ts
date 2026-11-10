/* 유료 덱 — 겉면 정보만. 카드 내용은 여기 두지 않는다.
   정적 사이트라 저장소·번들에 들어간 것은 누구나 받을 수 있다.
   내용은 계정·서버가 생기면 loadDeck() 이 받아 온다 (#12).

   판매 링크(shared/site.ts 의 products 에 같은 id, href 있음)가 있을 때만 홈에 잠긴 카드로 보인다.
   겉면 그림은 public/korean-cards/img/<id>/<cover>.webp — 맛보기라 공개돼도 된다.

   예)
   {
     id: "cafe-plus", title: { ko: "카페", en: "At the café" }, emoji: "☕", cover: "americano",
     color: "orange", unit: { ko: "카페 표현", en: "café phrases" }, count: 30,
     access: "paid", product: "cafe-pack",
   },
*/
import type { DeckInfo } from "../types";

export const PAID: DeckInfo[] = [];
