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
      </main>
      <footer className="site-footer">
        <div className="site-inner">
          <p className="foot-copy">© {new Date().getFullYear()} Made by Youjin. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

mount(<Home />);
