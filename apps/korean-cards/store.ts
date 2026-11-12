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
  /** 이 기록이 아는 덱 카드 id. 나중에 더한 필드라 예전 기록에는 없다 (#53).
      2회차부터는 queue 에 틀린 카드만 있어서, 이게 없으면 「외운 카드」와
      「덱에 새로 더한 카드」를 가릴 수 없다 */
  cards?: string[];
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

/**
 * 저장된 상태를 지금 덱에 맞춘다. 맞지 않으면 null.
 * 덱에 카드가 늘었으면 새 카드를 남은 카드에 넣는다 — 회차 중이면 queue 뒤(이번 회차),
 * 회차가 끝났으면 missed(다음 회차). 그래야 새 카드가 「외움」으로 세어지지 않는다.
 *
 * cards 가 없는 예전 기록: 1회차는 queue 가 덱 전체였으니 queue 로 안다.
 * 2회차부터는 알 길이 없어 지금 덱을 다 안다고 본다 — 이 필드가 들어간 뒤로
 * 덱에 카드를 더한 적이 없으니 맞다. 홈이 열릴 때 progress() 가 cards 를 적어 둔다.
 */
export function restore(deck: Deck, raw: unknown): StudyState | null {
  if (!validState(deck, raw)) return null;
  const ids = deck.cards.map((c) => c.id);
  const known = new Set(
    Array.isArray(raw.cards) ? raw.cards : raw.round === 1 || raw.round === undefined ? [...raw.queue, ...raw.missed] : ids,
  );
  const added = ids.filter((id) => !known.has(id));
  const s: StudyState = { ...raw, cards: ids };
  if (!added.length) return s;
  if (s.phase === "card") s.queue = [...s.queue, ...added];
  else s.missed = [...s.missed, ...added];
  return s;
}

export function progress(deck: Deck) {
  const total = deck.cards.length;
  const raw = load(deck.id);
  const s = restore(deck, raw);
  if (!s) return { done: 0, total, started: false };
  // 예전 기록이거나 덱이 바뀌었으면 맞춘 상태를 적어 둔다 — 다음에 카드가 늘어도 가릴 수 있게
  if (JSON.stringify(s) !== JSON.stringify(raw)) save(deck.id, s);
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

/**
 * 이 기기의 카드 기록 전부 (kcards:* 열쇠와 값 그대로).
 * 나중에 로그인이 생기면 처음 한 번 이걸 서버로 올려 기기 사이를 잇는다 (#13).
 * 열쇠는 바꾸지 않는다 — 로그인 안 한 학생은 지금처럼 이 기기에서만 쓴다.
 */
export function exportProgress(storage: Pick<Storage, "length" | "key" | "getItem"> | undefined = globalThis.localStorage): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    if (!storage) return out;
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      const v = k?.startsWith("kcards:") ? storage.getItem(k) : null;
      if (k && v !== null) out[k] = v;
    }
  } catch {
    /* 사생활 보호 모드 등 */
  }
  return out;
}
