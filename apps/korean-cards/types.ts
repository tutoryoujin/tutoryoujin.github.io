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
  /** 홈 더미 설명. 두 줄을 넘기지 않는다 */
  blurb: string;
  /** 겉면 그림. 없으면 cover. 반드시 투명 배경 */
  folderArt?: string;
  /** 완료 문구: "감정 표현 20개" */
  unit: KoEn;
  art: "icon" | "photo";
  groups: Record<string, KoEn & { color: Accent }>;
  cards: Card[];
};
