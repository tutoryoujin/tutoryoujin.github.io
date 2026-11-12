import { useEffect, useState } from "react";
import { Box, Btn, cn, ListenBtn, Note, Page, Quiz, Seg, Segments, shuffle, Tabs, speak, useHashTab, type Question, type TabDef } from "@yj/ui";
import { MONTH_EN, holiday, RELATIVE, SPECIAL_NOTE, WEEK, readDay, readMonth, readYear, wrongChoices } from "./reading";
import "./calendar.css";

const TABS: TabDef<"cal" | "year" | "quiz">[] = [
  { key: "cal", ko: "달력", en: "Calendar" },
  { key: "year", ko: "연간", en: "Year" },
  { key: "quiz", ko: "퀴즈", en: "Quiz" },
];

/* 달 머리(‹ 제목 ›) — 달력 탭과 연간 탭이 같이 쓴다 */
const monthHead = "mb-3 flex items-center justify-between gap-2";
const navBtn = "grid size-11 flex-none place-items-center rounded-full border border-line bg-bg text-[1.3rem]";
const monthTitle = "flex-1 text-center";
const titleDigits = "font-display text-[1.5rem] leading-[1.1]";
const titleReading = "mt-0.5 text-[0.95rem] font-bold text-muted";
const section = "flex flex-col gap-3.5";
const week7 = "grid grid-cols-7 gap-1";
const sparkle = "animate-[sparkle_1.6s_ease-in-out_infinite] motion-reduce:animate-none";
const tag = "rounded-full border border-line bg-bg px-3 py-1 text-[0.85rem] font-bold";
const tagWord = "font-display text-[1rem] font-normal";
/* TTS 가 없어서 들어 보기 버튼이 빠지면 남은 버튼이 한 줄을 다 쓴다 */
const pickBtn = "mt-3 min-h-13 only:col-span-full";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** 오늘 날짜. 탭을 열어 둔 채 자정을 넘기면 바뀐다.
    잠든 탭은 타이머가 늦게 울 수 있어서, 다시 볼 때(visibilitychange · focus)도 확인한다 */
function useToday() {
  const [today, setToday] = useState(() => startOfDay(new Date()));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      const now = startOfDay(new Date());
      setToday((prev) => (+prev === +now ? prev : now));
      clearTimeout(timer);
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(check, +tomorrow - Date.now() + 1000);
    };
    check();
    document.addEventListener("visibilitychange", check);
    addEventListener("focus", check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", check);
      removeEventListener("focus", check);
    };
  }, []);
  return today;
}

export function App() {
  const [tab, setTab] = useHashTab(TABS);
  const today = useToday();
  // 달력 탭과 연간 탭이 함께 쓰는 "보고 있는 달"
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 });

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
      {tab === "cal" && <CalendarTab today={today} view={view} setView={setView} />}
      {tab === "year" && (
        <YearTab
          today={today}
          open={(y, m) => {
            setView({ y, m });
            setTab("cal");
            window.scrollTo({ top: 0 });
          }}
        />
      )}
      {tab === "quiz" && <Quiz make={makeQuestion} length={QUIZ_LEN} label={{ ko: "어떻게 읽어요?", en: "How do you read this?" }} />}
    </Page>
  );
}

/* ---------- 달력 ---------- */
type View = { y: number; m: number };

function CalendarTab({ today, view, setView }: { today: Date; view: View; setView: (v: View) => void }) {
  const [selected, setSelected] = useState(today);
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
  for (let i = 0; i < first; i++) cells.push(<div key={"e" + i} className="aspect-square" />);
  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m - 1, d);
    const wd = date.getDay();
    const hol = !!holiday(y, m, d);
    const isSel = +date === +selected;
    const cls = cn(
      "relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-sm text-[1rem] font-extrabold",
      (wd === 0 || hol) && "text-sun",
      wd === 6 && "text-sat",
      +date === +today &&
        "shadow-[inset_0_0_0_2px_var(--primary)] after:mt-px after:font-display after:text-[0.58rem] after:leading-none after:text-primary after:content-['오늘']",
      hol && "before:absolute before:top-1.5 before:right-[7px] before:size-[5px] before:rounded-full before:bg-sun before:content-['']",
      isSel ? "bg-primary text-primary-ink before:bg-primary-ink after:text-primary-ink" : "hover:bg-bg",
    );
    cells.push(
      <button key={d} className={cls} type="button" aria-label={`${readMonth(m)} ${readDay(d)} ${WEEK[wd][0]}요일`} onClick={() => setSelected(date)}>
        {d}
      </button>,
    );
  }

  return (
    <section className={section}>
      <Box>
        <div className={monthHead}>
          <button className={navBtn} type="button" aria-label="이전 달 / Previous month" onClick={() => shift(-1)}>
            ‹
          </button>
          <div className={monthTitle}>
            <div className={titleDigits}>
              {y}년 {m}월
            </div>
            <div className={titleReading}>
              {readYear(y)} {readMonth(m)}
            </div>
          </div>
          <button className={navBtn} type="button" aria-label="다음 달 / Next month" onClick={() => shift(1)}>
            ›
          </button>
        </div>
        <div className={cn(week7, "mb-1.5")}>
          {WEEK.map((w, i) => (
            <div key={w[0]} className="py-0.5 text-center leading-[1.1]">
              <span className={cn("block font-display text-[1rem]", i === 0 && "text-sun", i === 6 && "text-sat")}>{w[0]}</span>
              <span className="text-[0.6rem] font-bold text-muted">{w[1]}</span>
            </div>
          ))}
        </div>
        <div className={week7}>{cells}</div>
        <button
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-bg"
          type="button"
          onClick={() => {
            setView({ y: today.getFullYear(), m: today.getMonth() + 1 });
            setSelected(today);
          }}
        >
          <span className="font-display">오늘로 가기</span>
          <span className="text-[0.75rem] font-bold text-muted">Go to today</span>
        </button>
      </Box>
      <DayPanel today={today} date={selected} />
    </section>
  );
}

function DayPanel({ today, date }: { today: Date; date: Date }) {
  const y = date.getFullYear(),
    m = date.getMonth() + 1,
    d = date.getDate(),
    wd = date.getDay();
  const weekKo = WEEK[wd][0] + "요일";
  const special = SPECIAL_NOTE[m];
  const hol = holiday(y, m, d);
  const rel = RELATIVE[Math.round((+date - +today) / 86400000)];
  const en = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <Box aria-live="polite">
      <div className="mt-0.5 mb-3 text-center font-display text-[1.6rem]">
        {y}년 {m}월 {d}일 {weekKo}
      </div>
      <Segments>
        <Seg tone="cal-year" caption={`${y}년`}>
          {readYear(y)}
        </Seg>
        <Seg tone="cal-month" caption={`${m}월`} className={cn(special && cn("shadow-[0_0_0_3px_var(--special)]", sparkle))}>
          {readMonth(m)}
        </Seg>
        <Seg tone="cal-day" caption={`${d}일`}>
          {readDay(d)}
        </Seg>
        <Seg tone="cal-week" caption={WEEK[wd][2]}>
          {weekKo}
        </Seg>
      </Segments>
      <p className="mt-3 text-center font-bold text-muted">{en}</p>
      {(rel || hol) && (
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          {rel && (
            <span className={tag}>
              <b className={tagWord}>{rel[0]}</b> {rel[1]}
            </span>
          )}
          {hol && (
            <span className={cn(tag, "border-current text-sun")}>
              <b className={tagWord}>{hol[0]}</b> {hol[1]}
            </span>
          )}
        </div>
      )}
      {/* 6월·10월 메모 — special 은 악센트 쌍이 아니라 달력 전용 색이다 */}
      {special && <Note accent="--special" ko={special[0]} en={special[1]} />}
      <ListenBtn text={`${readYear(y)} ${readMonth(m)} ${readDay(d)} ${weekKo}`} />
    </Box>
  );
}

/* ---------- 연간 ---------- */
function YearTab({ today, open }: { today: Date; open: (y: number, m: number) => void }) {
  const [year, setYear] = useState(today.getFullYear());
  const [picked, setPicked] = useState(today.getMonth() + 1);
  const special = SPECIAL_NOTE[picked];
  const isThisYear = year === today.getFullYear();

  return (
    <section className={section}>
      <Box>
        <div className={monthHead}>
          <button className={navBtn} type="button" aria-label="이전 해 / Previous year" onClick={() => setYear(year - 1)}>
            ‹
          </button>
          <div className={monthTitle}>
            <div className={titleDigits}>{year}년</div>
            <div className={titleReading}>{readYear(year)}</div>
          </div>
          <button className={navBtn} type="button" aria-label="다음 해 / Next year" onClick={() => setYear(year + 1)}>
            ›
          </button>
        </div>
        <div className="text-center" id="yearPick" aria-live="polite">
          <div className="font-bold text-muted">
            {picked}월 · {MONTH_EN[picked - 1]}
          </div>
          <div className={cn("my-1 font-display text-[2.6rem] leading-[1.1]", special && "text-cal-month-ink")}>{readMonth(picked)}</div>
          {special && <Note accent="--special" className="text-left" ko={special[0]} en={special[1]} />}
          <div className="grid grid-cols-2 gap-2">
            <ListenBtn text={readMonth(picked)} className={pickBtn} />
            <Btn className={pickBtn} variant="ghost" ko="이 달 달력 보기" en="Open this month" onClick={() => open(year, picked)} />
          </div>
        </div>
      </Box>

      {/* 위 상자와의 간격은 section 의 gap 이 준다 */}
      <div className="grid grid-cols-2 gap-2.5 min-[440px]:grid-cols-3">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((mm) => {
          const first = new Date(year, mm - 1, 1).getDay();
          const days = new Date(year, mm, 0).getDate();
          const isNow = isThisYear && mm === today.getMonth() + 1;
          const mini = [
            ...WEEK.map((w) => (
              <span key={"h" + w[0]} className="font-display font-normal text-muted">
                {w[0]}
              </span>
            )),
            ...Array.from({ length: first }, (_, k) => <span key={"e" + k} />),
            ...Array.from({ length: days }, (_, k) => {
              const d = k + 1;
              const wd = (first + d - 1) % 7;
              const cls = cn(
                (wd === 0 || holiday(year, mm, d)) && "text-sun",
                wd === 6 && "text-sat",
                isNow && d === today.getDate() && "rounded-full bg-primary text-primary-ink",
              );
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
              className={cn("rounded-[18px] border-2 border-transparent bg-surface px-2 pt-2.5 pb-2 text-center shadow-card", mm === picked && "border-primary")}
              type="button"
              aria-label={`${mm}월, ${readMonth(mm)}`}
              onClick={() => {
                setPicked(mm);
                speak(readMonth(mm));
                document.getElementById("yearPick")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              <div
                className={cn(
                  "font-display text-[1.3rem] leading-[1.1]",
                  SPECIAL_NOTE[mm] && cn("inline-block rounded-full px-2 shadow-[0_0_0_2px_var(--special)]", sparkle),
                  isNow && "after:font-app after:text-[0.62rem] after:font-extrabold after:text-primary after:content-['_·_이번_달']",
                )}
              >{readMonth(mm)}</div>
              <div className="mt-0.5 mb-1.5 text-[0.7rem] font-bold text-muted">
                {mm}월 · {MONTH_EN[mm - 1]}
              </div>
              <div className="grid grid-cols-7 gap-px text-[0.6rem] leading-[1.7] font-bold" aria-hidden="true">
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
    const months = [6, 10];
    while (months.length < QUIZ_LEN) months.push(Math.random() < 0.3 ? (Math.random() < 0.5 ? 6 : 10) : rand(12) + 1);
    plan = shuffle(months);
  }
  const m = plan[index];
  // 평년(2023) 기준이라 2월은 28일까지만 나와요 (2/29 제외)
  const d = rand(new Date(2023, m, 0).getDate()) + 1;
  return {
    id: `${m}-${d}`,
    prompt: (
      <div className="mt-2.5 mb-4 text-center font-display text-[clamp(2.6rem,14vw,3.4rem)]">
        {m}월 {d}일
      </div>
    ),
    answer: `${readMonth(m)} ${readDay(d)}`,
    wrong: wrongChoices(m, d),
    review: `${m}월 ${d}일`,
  };
}
