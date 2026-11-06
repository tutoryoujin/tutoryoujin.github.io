import { useState } from "react";
import { Box, Btn, ListenBtn, Note, Page, Quiz, Seg, Segments, Tabs, speak, useHashTab, type Question, type TabDef } from "@yj/ui";
import { HOLIDAYS, MONTH_EN, RELATIVE, SPECIAL_NOTE, WEEK, readDay, readMonth, readYear, wrongChoices } from "./reading";
import "./calendar.css";

const TABS: TabDef<"cal" | "year" | "quiz">[] = [
  { key: "cal", ko: "달력", en: "Calendar" },
  { key: "year", ko: "연간", en: "Year" },
  { key: "quiz", ko: "퀴즈", en: "Quiz" },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const TODAY = startOfDay(new Date());

export function App() {
  const [tab, setTab] = useHashTab(TABS);
  // 달력 탭과 연간 탭이 함께 쓰는 "보고 있는 달"
  const [view, setView] = useState({ y: TODAY.getFullYear(), m: TODAY.getMonth() + 1 });

  return (
    <Page
      app="calendar-practice"
      legal={
        <>
          공휴일은 양력 고정 공휴일만 표시해요. 설날·추석·부처님오신날 같은 음력 공휴일과 대체공휴일은 빠져 있어요.
          <br />
          Only fixed solar-calendar holidays are shown. Lunar holidays (Seollal, Chuseok, Buddha’s Birthday) and substitute holidays
          are not included.
        </>
      }
    >
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "cal" && <CalendarTab view={view} setView={setView} />}
      {tab === "year" && (
        <YearTab
          open={(y, m) => {
            setView({ y, m });
            setTab("cal");
            window.scrollTo({ top: 0 });
          }}
        />
      )}
      {tab === "quiz" && <Quiz make={makeQuestion} label={{ ko: "어떻게 읽어요?", en: "How do you read this?" }} />}
    </Page>
  );
}

/* ---------- 달력 ---------- */
type View = { y: number; m: number };

function CalendarTab({ view, setView }: { view: View; setView: (v: View) => void }) {
  const [selected, setSelected] = useState(TODAY);
  const { y, m } = view;
  const shift = (delta: number) => {
    let nm = m + delta,
      ny = y;
    if (nm < 1) [nm, ny] = [12, y - 1];
    if (nm > 12) [nm, ny] = [1, y + 1];
    setView({ y: ny, m: nm });
  };

  const first = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(<div key={"e" + i} className="empty" />);
  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m - 1, d);
    const wd = date.getDay();
    const cls = ["cell"];
    if (wd === 0) cls.push("sun");
    if (wd === 6) cls.push("sat");
    if (HOLIDAYS[`${m}-${d}`]) cls.push("holiday");
    if (+date === +TODAY) cls.push("today");
    if (+date === +selected) cls.push("selected");
    cells.push(
      <button key={d} className={cls.join(" ")} type="button" aria-label={`${readMonth(m)} ${readDay(d)} ${WEEK[wd][0]}요일`} onClick={() => setSelected(date)}>
        {d}
      </button>,
    );
  }

  return (
    <section>
      <Box>
        <div className="month-head">
          <button className="nav" type="button" aria-label="이전 달 / Previous month" onClick={() => shift(-1)}>
            ‹
          </button>
          <div className="month-title">
            <div className="digits">
              {y}년 {m}월
            </div>
            <div className="reading">
              {readYear(y)} {readMonth(m)}
            </div>
          </div>
          <button className="nav" type="button" aria-label="다음 달 / Next month" onClick={() => shift(1)}>
            ›
          </button>
        </div>
        <div className="weekdays">
          {WEEK.map((w, i) => (
            <div key={w[0]} className={`wd ${i === 0 ? "sun" : i === 6 ? "sat" : ""}`}>
              <span className="ko">{w[0]}</span>
              <span className="en">{w[1]}</span>
            </div>
          ))}
        </div>
        <div className="grid">{cells}</div>
        <button
          className="today-btn"
          type="button"
          onClick={() => {
            setView({ y: TODAY.getFullYear(), m: TODAY.getMonth() + 1 });
            setSelected(TODAY);
          }}
        >
          <span className="ko">오늘로 가기</span>
          <span className="en">Go to today</span>
        </button>
      </Box>
      <DayPanel date={selected} />
    </section>
  );
}

function DayPanel({ date }: { date: Date }) {
  const y = date.getFullYear(),
    m = date.getMonth() + 1,
    d = date.getDate(),
    wd = date.getDay();
  const weekKo = WEEK[wd][0] + "요일";
  const special = SPECIAL_NOTE[m];
  const hol = HOLIDAYS[`${m}-${d}`];
  const rel = RELATIVE[Math.round((+date - +TODAY) / 86400000)];
  const en = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <Box aria-live="polite">
      <div className="panel-digits">
        {y}년 {m}월 {d}일 {weekKo}
      </div>
      <Segments>
        <Seg tone="cal-year" caption={`${y}년`}>
          {readYear(y)}
        </Seg>
        <Seg tone="cal-month" caption={`${m}월`} className={special ? "special" : ""}>
          {readMonth(m)}
        </Seg>
        <Seg tone="cal-day" caption={`${d}일`}>
          {readDay(d)}
        </Seg>
        <Seg tone="cal-week" caption={WEEK[wd][2]}>
          {weekKo}
        </Seg>
      </Segments>
      <p className="yj-en-line">{en}</p>
      {(rel || hol) && (
        <div className="tags">
          {rel && (
            <span className="tag">
              <b>{rel[0]}</b> {rel[1]}
            </span>
          )}
          {hol && (
            <span className="tag hol">
              <b>{hol[0]}</b> {hol[1]}
            </span>
          )}
        </div>
      )}
      {special && <Note className="note-special" ko={special[0]} en={special[1]} />}
      <ListenBtn text={`${readYear(y)} ${readMonth(m)} ${readDay(d)} ${weekKo}`} />
    </Box>
  );
}

/* ---------- 연간 ---------- */
function YearTab({ open }: { open: (y: number, m: number) => void }) {
  const [year, setYear] = useState(TODAY.getFullYear());
  const [picked, setPicked] = useState(TODAY.getMonth() + 1);
  const special = SPECIAL_NOTE[picked];
  const isThisYear = year === TODAY.getFullYear();

  return (
    <section>
      <Box>
        <div className="month-head">
          <button className="nav" type="button" aria-label="이전 해 / Previous year" onClick={() => setYear(year - 1)}>
            ‹
          </button>
          <div className="month-title">
            <div className="digits">{year}년</div>
            <div className="reading">{readYear(year)}</div>
          </div>
          <button className="nav" type="button" aria-label="다음 해 / Next year" onClick={() => setYear(year + 1)}>
            ›
          </button>
        </div>
        <div className="year-pick" id="yearPick" aria-live="polite">
          <div className="sub">
            {picked}월 · {MONTH_EN[picked - 1]}
          </div>
          <div className={`big ${special ? "special-text" : ""}`}>{readMonth(picked)}</div>
          {special && <Note className="note-special" ko={special[0]} en={special[1]} />}
          <div className="btn-row">
            <ListenBtn text={readMonth(picked)} />
            <Btn variant="ghost" ko="이 달 달력 보기" en="Open this month" onClick={() => open(year, picked)} />
          </div>
        </div>
      </Box>

      <div className="months">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((mm) => {
          const first = new Date(year, mm - 1, 1).getDay();
          const days = new Date(year, mm, 0).getDate();
          const isNow = isThisYear && mm === TODAY.getMonth() + 1;
          const mini = [
            ...WEEK.map((w) => (
              <span key={"h" + w[0]} className="h">
                {w[0]}
              </span>
            )),
            ...Array.from({ length: first }, (_, k) => <span key={"e" + k} />),
            ...Array.from({ length: days }, (_, k) => {
              const d = k + 1;
              const wd = (first + d - 1) % 7;
              const cls = [wd === 0 && "s", wd === 6 && "t", HOLIDAYS[`${mm}-${d}`] && "hd", isNow && d === TODAY.getDate() && "td"].filter(Boolean).join(" ");
              return (
                <span key={d} className={cls}>
                  {d}
                </span>
              );
            }),
          ];
          return (
            <button
              key={mm}
              className={`mcard ${mm === picked ? "picked" : ""} ${isNow ? "now" : ""}`}
              type="button"
              aria-label={`${mm}월, ${readMonth(mm)}`}
              onClick={() => {
                setPicked(mm);
                speak(readMonth(mm));
                document.getElementById("yearPick")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              <div className={`mname ${SPECIAL_NOTE[mm] ? "special-name" : ""}`}>{readMonth(mm)}</div>
              <div className="msub">
                {mm}월 · {MONTH_EN[mm - 1]}
              </div>
              <div className="mini" aria-hidden="true">
                {mini}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- 퀴즈 ----------
   한 판의 달 순서를 미리 정해요: 6월·10월은 꼭 한 번씩 넣고,
   나머지는 무작위 (유월·시월이 조금 더 자주 나오게 약 30%) */
const QUIZ_LEN = 10;
const rand = (n: number) => Math.floor(Math.random() * n);
let plan: number[] = [];

function makeQuestion(index: number): Question {
  if (index === 0 || plan.length !== QUIZ_LEN) {
    plan = [6, 10];
    while (plan.length < QUIZ_LEN) plan.push(Math.random() < 0.3 ? (Math.random() < 0.5 ? 6 : 10) : rand(12) + 1);
    plan.sort(() => Math.random() - 0.5);
  }
  const m = plan[index];
  // 평년(2023) 기준이라 2월은 28일까지만 나와요 (2/29 제외)
  const d = rand(new Date(2023, m, 0).getDate()) + 1;
  return {
    id: `${m}-${d}`,
    prompt: (
      <div className="q-date">
        {m}월 {d}일
      </div>
    ),
    answer: `${readMonth(m)} ${readDay(d)}`,
    wrong: wrongChoices(m, d),
    review: `${m}월 ${d}일`,
  };
}
