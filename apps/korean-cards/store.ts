/* ============================================================
   학습 진행 저장 — localStorage.

   열쇠와 모양은 예전 앱과 같다 ("kcards:<deckId>", "kcards:last").
   주소(tutoryoujin.github.io)도 같아서, 이사한 뒤에도 학생들의
   진행 상황이 그대로 이어진다. 바꾸면 모두의 기록이 날아간다.
   ============================================================ */
import { hasCard } from "./decks";
import type { Deck } from "./types";

export type StudyState = {
  queue: string[];
  index: number;
  round: number;
  missed: string[];
  learnedThisRound: number;
  phase: "card" | "end";
};

const key = (id: string) => "kcards:" + id;

export function load(deckId: string): unknown {
  try {
    const raw = localStorage.getItem(key(deckId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function save(deckId: string, s: StudyState) {
  try {
    localStorage.setItem(key(deckId), JSON.stringify(s));
  } catch {
    /* 사생활 보호 모드 등 — 저장 없이 계속 */
  }
}

/** 마지막으로 카드를 넘긴 시각. 졸린 이응을 언제 보일지 정한다 */
export function touch() {
  try {
    localStorage.setItem("kcards:last", String(Date.now()));
  } catch {
    /* 무시 */
  }
}

/** 마지막으로 연 덱. 홈의 책갈피를 정한다.
    나중에 더한 열쇠라 예전 학생들에게는 없다 — 덱을 한 번 열면 생긴다 */
export function markOpened(deckId: string) {
  try {
    localStorage.setItem("kcards:lastDeck", deckId);
  } catch {
    /* 무시 */
  }
}

/** 마지막으로 연 덱 id. 기록이 없으면 null */
export function lastDeck(): string | null {
  try {
    return localStorage.getItem("kcards:lastDeck");
  } catch {
    return null;
  }
}

/** 마지막 학습 뒤 지난 날 수. 기록이 없으면 null */
export function daysAway(): number | null {
  try {
    const t = Number(localStorage.getItem("kcards:last"));
    return t ? (Date.now() - t) / 864e5 : null;
  } catch {
    return null;
  }
}

/** 저장된 상태가 지금 덱과 맞는지 (카드가 지워지거나 이름이 바뀌면 무효) */
export function validState(deck: Deck, s: unknown): s is StudyState {
  const x = s as StudyState | null;
  return (
    !!x &&
    Array.isArray(x.queue) &&
    Array.isArray(x.missed) &&
    x.queue.every((id) => hasCard(deck, id)) &&
    x.missed.every((id) => hasCard(deck, id))
  );
}

export function progress(deck: Deck) {
  const total = deck.cards.length;
  const s = load(deck.id);
  if (!validState(deck, s)) return { done: 0, total, started: false };
  const remaining = s.phase === "card" ? s.missed.length + (s.queue.length - s.index) : s.missed.length;
  return { done: total - remaining, total, started: true, round: s.round };
}

/** 쓰는 법을 끝까지 봤는지. 다 본 학생에게는 다시 안 보인다 */
const HOWTO = "kcards:howto";
export function howtoSeen(): boolean {
  try {
    return localStorage.getItem(HOWTO) === "1";
  } catch {
    return false;
  }
}
export function markHowtoSeen() {
  try {
    localStorage.setItem(HOWTO, "1");
  } catch {
    /* 무시 — 다음에 또 보일 뿐 */
  }
}
