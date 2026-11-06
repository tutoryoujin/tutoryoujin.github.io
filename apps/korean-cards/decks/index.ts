/* 덱 목록. 새 덱 파일을 만들면 여기 한 줄 추가 (홈 화면 순서 = 이 순서). */
import type { Card, Deck } from "../types";
import emotions from "./emotions";
import family from "./family";
import food from "./food";
import places from "./places";
import weather from "./weather";

export const DECKS: Deck[] = [emotions, food, family, places, weather];

const byId = new Map(DECKS.map((d) => [d.id, d]));
export const deckById = (id: string) => byId.get(id);

const cardMaps = new Map(DECKS.map((d) => [d.id, new Map(d.cards.map((c) => [c.id, c]))]));
export const cardOf = (deck: Deck, id: string) => cardMaps.get(deck.id)!.get(id) as Card;
export const hasCard = (deck: Deck, id: string) => cardMaps.get(deck.id)!.has(id);

export const imgSrc = (deck: Deck, card: Card) => `img/${deck.id}/${card.id}.webp`;
/** 홈 더미 겉면 그림. 사진은 잘라 내면 그냥 잘린 사진으로 보이므로 투명 아이콘만 쓴다 */
export const folderArtSrc = (deck: Deck) => `img/${deck.id}/${deck.folderArt || deck.cover}.webp`;
export const colorOf = (deck: Deck, card: Card) => deck.groups[card.group]?.color ?? "gray";
