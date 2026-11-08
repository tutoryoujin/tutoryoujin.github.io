/* 첫 화면(/) — shared/apps.ts 의 앱을 모두 보여 준다. 여기는 손댈 일이 거의 없다. */
import { APPS } from "@yj/apps";
import { Ieung, mount } from "@yj/ui";
import "./home.css";

function Home() {
  return (
    <>
      <main className="yj-main home">
        <div className="home-hero">
          <div className="home-mascot">
            <Ieung mood="yay" />
          </div>
          <h1>
            <span className="ko">한국어 with Youjin</span>
            <span className="en">Small apps for learning Korean</span>
          </h1>
        </div>
        <ul className="home-list">
          {APPS.map((a) => (
            <li key={a.slug}>
              <a className="home-card" href={`/${a.slug}/`}>
                <span className="home-emoji" aria-hidden="true">
                  {a.emoji}
                </span>
                <span>
                  <b>{a.ko}</b>
                  <small>{a.en}</small>
                  <span className="home-about">
                    {a.about.ko}
                    <em>{a.about.en}</em>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <IeungStory />
      </main>
      <footer className="site-footer">
        <div className="site-inner">
          <p className="foot-copy">© {new Date().getFullYear()} Made by Youjin. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

/* 이응이 이야기 — 디자인 시스템 「마스코트 · 이야기」에서 고른다. 새 설정을 여기서 지어내지 않는다.
   한 화면에 움직이는 이응은 하나라서(위의 hero) 여기서는 평면 이응을 쓴다. */
const STORY = [
  {
    ko: "소리 없는 자리",
    en: "A seat with no sound",
    body: "‘아’를 읽어 보세요. 이응 소리는 안 나요. 첫소리 ㅇ은 모음이 앉을 자리를 비워 두고 조용히 기다려요. 받침에 가서야 ‘ng’ 소리를 내요.",
    bodyEn: "Say 아 — you don't hear ㅇ at all. At the start of a block, ㅇ is silent and just keeps the seat for the vowel. Only at the bottom does it say “ng”.",
  },
  {
    ko: "뭐든 담는 그릇",
    en: "A bowl for anything",
    body: "비어 있으니까 뭐든 담을 수 있어요. 여러분이 외운 낱말도 하나씩 이응이 안에 담겨요.",
    bodyEn: "Because it's empty, it can hold anything. Every word you learn goes inside Ieung‑i, one by one.",
  },
  {
    ko: "포도알 하나",
    en: "One grape",
    body: "동그란 몸은 포도알, 머리 위 T는 포도 꼭지예요. 그 꼭지, ㅎ의 윗획이랑 닮았지요?",
    bodyEn: "The round body is a grape, and the T on top is its stem — which looks just like the top stroke of ㅎ.",
  },
];

function IeungStory() {
  return (
    <section className="home-ieung" aria-labelledby="ieung-title">
      <div className="home-ieung-head">
        <span className="brand-mark home-ieung-mark" aria-hidden="true">
          <svg>
            <use href="#ieung-mark" />
          </svg>
        </span>
        <h2 id="ieung-title">
          <span className="ko">이응이를 소개해요</span>
          <span className="en">Meet Ieung‑i</span>
        </h2>
      </div>
      <p className="home-ieung-lead">
        한글 ㅇ에서 태어난 공부 친구예요. 앱 옆자리에서 같이 외워요.
        <em>A study buddy born from the Hangul letter ㅇ. It sits beside you and learns along.</em>
      </p>
      <ol className="home-ieung-story">
        {STORY.map((c) => (
          <li key={c.ko}>
            <b>
              {c.ko}
              <small>{c.en}</small>
            </b>
            <p>
              {c.body}
              <em>{c.bodyEn}</em>
            </p>
          </li>
        ))}
      </ol>
      <p className="home-ieung-motto">
        빈자리에 하나씩, 매일 조금씩.
        <em>One seat at a time, a little every day.</em>
      </p>
    </section>
  );
}

mount(<Home />);
