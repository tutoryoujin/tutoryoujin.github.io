/* ============================================================
   주소 — #/            홈 (덱 더미)
          #/deck/<id>   학습
          #/credits     이미지 출처
   학생들에게 #/deck/<id> 링크가 나가 있어서 해시 주소를 그대로 둔다.
   ============================================================ */
import { useEffect, useState } from "react";
import { Page } from "@yj/ui";
import { Credits } from "./Credits";
import { deckById } from "./decks";
import { Home } from "./Home";
import { Study } from "./Study";
import "./cards.css";

const LEGAL = (
  <>
    Illustrations by Microsoft Fluent Emoji (MIT). Photos by Openverse contributors, used under CC BY / CC BY-SA. Images remain
    the property of their respective owners.
  </>
);

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

export function App() {
  const route = useRoute();
  const m = route.match(/^\/deck\/([\w-]+)$/);
  const deck = m ? deckById(m[1]) : undefined;
  const credits = route === "/credits";

  useEffect(() => {
    document.title = deck
      ? `${deck.title.ko} · 한국어 카드 with Youjin`
      : credits
        ? "이미지 출처 · 한국어 카드 with Youjin"
        : "한국어 카드 with Youjin";
    if (!deck && !credits && route !== "/") history.replaceState(null, "", "#/");
    window.scrollTo(0, 0);
  }, [route, deck, credits]);

  // 학습 화면은 카드에 집중하도록 헤더·꼬리말 없이 자체 상단바만 쓴다
  if (deck) return <Study key={deck.id} deck={deck} />;

  return (
    <Page
      app="korean-cards"
      h1={false} // 화면마다 자기 <h1> 이 따로 있다
      legal={LEGAL}
      mainClass={credits ? "app credits" : "app home"}
      links={[{ href: "#/credits", ko: "이미지 출처", en: "Image credits", active: credits }]}
    >
      {credits ? <Credits /> : <Home />}
    </Page>
  );
}
