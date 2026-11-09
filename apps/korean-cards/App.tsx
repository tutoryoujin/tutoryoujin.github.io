/* ============================================================
   주소 — #/            홈 (덱 더미)
          #/deck/<id>   학습
          #/credits     이미지 출처
   학생들에게 #/deck/<id> 링크가 나가 있어서 해시 주소를 그대로 둔다.
   ============================================================ */
import { useEffect, useState } from "react";
import { cn, Page } from "@yj/ui";
import { Credits } from "./Credits";
import { loadDeck, peekDeck } from "./decks";
import { Home } from "./Home";
import { Study } from "./Study";
import type { Deck } from "./types";
import "./cards.css";

const LEGAL = (
  <>
    Illustrations by Microsoft Fluent Emoji (MIT). Photos by Openverse contributors, used under CC BY / CC BY-SA. Images remain
    the property of their respective owners.
  </>
);

/* <Page> 가 그리는 main — body 의 flex 안에서 남는 높이를 채운다.
   좁은 화면은 폭 전부, 600px 부터 640px 가운데 */
const main = "flex w-full flex-[1_0_auto] flex-col px-4 pt-5 pb-3.5 sm:mx-auto sm:max-w-160 sm:gap-4 sm:px-5 sm:py-6";

function useRoute() {
  const read = () => location.hash.replace(/^#/, "") || "/";
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

/** 주소의 덱. 받아 둔 덱은 바로, 아니면 loadDeck() 으로 받는다 (decks/index.ts) */
function useDeck(id: string | undefined): { deck?: Deck; pending: boolean } {
  const [got, setGot] = useState<Record<string, Deck | null>>({});
  const ready = id ? peekDeck(id) : undefined;
  const asked = !!id && id in got;
  useEffect(() => {
    if (!id || ready || asked) return;
    let live = true;
    loadDeck(id).then((d) => live && setGot((g) => ({ ...g, [id]: d ?? null })));
    return () => {
      live = false;
    };
  }, [id, ready, asked]);
  if (!id) return { pending: false };
  if (ready) return { deck: ready, pending: false };
  return asked ? { deck: got[id] ?? undefined, pending: false } : { pending: true };
}

export function App() {
  const route = useRoute();
  const m = route.match(/^\/deck\/([\w-]+)$/);
  const { deck, pending } = useDeck(m?.[1]);
  const credits = route === "/credits";

  useEffect(() => {
    document.title = deck
      ? `${deck.title.ko} · 한국어 카드 with Youjin`
      : credits
        ? "이미지 출처 · 한국어 카드 with Youjin"
        : "한국어 카드 with Youjin";
    if (pending) return;
    if (!deck && !credits && route !== "/") history.replaceState(null, "", "#/");
    window.scrollTo(0, 0);
  }, [route, deck, credits, pending]);

  // 덱을 받는 동안 (유료 덱 · 서버) 홈이 한 번 번쩍이지 않게 비워 둔다. 무료 덱은 기다림이 없다
  if (pending) return null;

  // 학습 화면은 카드에 집중하도록 헤더·꼬리말 없이 자체 상단바만 쓴다
  if (deck) return <Study key={deck.id} deck={deck} />;

  return (
    <Page
      app="korean-cards"
      h1={false} // 화면마다 자기 <h1> 이 따로 있다
      legal={LEGAL}
      mainClass={cn(main, credits ? "gap-3" : "gap-5")}
      links={[{ href: "#/credits", ko: "이미지 출처", en: "Image credits", active: credits }]}
    >
      {credits ? <Credits /> : <Home />}
    </Page>
  );
}
