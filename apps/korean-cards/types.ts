import type { Accent } from "@yj/ui";

export type KoEn = { ko: string; en: string };

export type Card = {
  id: string; // 그림 파일 이름 — public/korean-cards/img/<deck>/<id>.webp
  ko: string;
  en: string;
  note: string;
  group: string;
  /** 그림을 못 불러왔을 때 대신 보일 이모지 */
  emoji?: string;
  ex?: KoEn;
};

export type Deck = {
  id: string; // 주소 #/deck/<id>. 학생들에게 나간 링크라 바꾸지 않는다
  title: KoEn;
  emoji: string;
  /** 대표 카드 id */
  cover: string;
  /** 홈 더미에서 이 덱의 색 */
  color: Accent;
  /** 겉면 그림. 없으면 cover. 반드시 투명 배경 */
  folderArt?: string;
  /** 완료 문구: "감정 표현 20개" */
  unit: KoEn;
  art: "icon" | "photo";
  groups: Record<string, KoEn & { color: Accent }>;
  cards: Card[];
};

/**
 * 덱 겉면 — 홈 더미에 보이는 것.
 * 유료 덱은 이것만 저장소에 둔다. 카드 내용은 두지 않는다 — 정적 사이트라 올리면 누구나 받는다.
 */
export type DeckInfo = Pick<Deck, "id" | "title" | "emoji" | "cover" | "color" | "folderArt" | "unit"> & {
  /** 카드 수 */
  count: number;
  access: "free" | "paid";
  /** 유료 덱: shared/site.ts 의 products id. 판매 링크가 있어야 홈에 보인다 */
  product?: string;
};
