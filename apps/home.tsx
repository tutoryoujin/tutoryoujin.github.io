/* 첫 화면(/) — 앱이 계속 늘어나는 허브 (#48).
   구성: 첫 화면(처음: 소개 · 다시 온 사람: 이어서 하기) + 이응이 무대
        → 처음이라면(기기 기록이 없을 때만) → 새로 나온 앱 → 모든 앱(분류 · 검색) → 만든 사람 → 꼬리말
   앱은 shared/apps.ts 한 줄 + public/home/<slug>.webp(tools/home/build_shots.py) 로 모든 칸에 들어간다.
   로그인 · 회원 전용 잠금은 아직 없다 (#49). */
import {
  APPS,
  CATEGORIES,
  type AppInfo,
  type Category,
  type Tone,
} from "@yj/apps";
import { readRecent, type Recent } from "@yj/recent";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Bubble,
  cn,
  Footer,
  Ieung,
  mount,
  pokeClass,
  Products,
  Subscribe,
  ThemeToggle,
  type Mood,
} from "@yj/ui";
import "./home.css";

/** 앱이 하나라도 있는 분류만 — 빈 칩 · 빈 꼬리말 열을 만들지 않는다 */
const USED = CATEGORIES.filter((c) => APPS.some((a) => a.category === c.id));

const wrap = "mx-auto w-full max-w-[1440px] px-4 sm:px-10 min-[1200px]:px-16";
const section = "py-20 min-[960px]:py-28";
const h2 =
  "min-w-0 font-display text-[clamp(2.25rem,3.8vw,3.25rem)] leading-[1.1] font-normal break-keep [overflow-wrap:break-word]";
const toneVars = (t: Tone) =>
  ({ background: `var(--${t}-bg)`, color: `var(--${t}-ink)` }) as CSSProperties;
const focus =
  "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary";
const lift =
  "transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none";
const hrefOf = (a: AppInfo) => `/${a.slug}/`;

/** 이 기기에서 마지막으로 연 앱 (없는 앱이면 무시) */
function useRecent(): { app: AppInfo; r: Recent } | null {
  const [v] = useState(() => {
    const r = readRecent();
    const app = r && APPS.find((a) => a.slug === r.slug);
    return app && r ? { app, r } : null;
  });
  return v;
}

function Home() {
  const recent = useRecent();
  return (
    <>
      <Nav />
      <main className="flex-[1_0_auto]">
        {recent ? <HeroBack {...recent} /> : <HeroNew />}
        {!recent && <FirstSteps />}
        <NewApps />
        <AllApps />
        <Maker />
        <div className={cn(wrap, "max-w-[760px]")}>
          {/* 설정(shared/site.ts)이 비어 있으면 둘 다 아무것도 그리지 않는다 */}
          <Products source="home" className="mt-6" />
          <Subscribe source="home" className="mt-6" />
        </div>
      </main>
      <Footer>
        <div className="grid gap-8 min-[720px]:grid-cols-[minmax(0,3fr)_minmax(0,9fr)]">
          <div className="flex items-center gap-2.5 self-start">
            <MarkDot className="size-9" />
            <b className="font-display text-[1.25rem] font-normal text-ink">
              한국어 with Youjin
            </b>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 min-[960px]:grid-cols-4">
            {USED.map((c) => (
              <div key={c.id}>
                <h3 className="text-[0.85rem] font-bold text-muted">
                  {c.ko} <span className="font-semibold">{c.en}</span>
                </h3>
                <ul className="mt-1">
                  {APPS.filter((a) => a.category === c.id).map((a) => (
                    <li key={a.slug}>
                      <a
                        className={cn(
                          "inline-flex min-h-11 items-center rounded-sm font-bold text-ink no-underline hover:text-primary",
                          focus,
                        )}
                        href={hrefOf(a)}
                      >
                        {a.ko}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Footer>
    </>
  );
}

function MarkDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "block shrink-0 overflow-hidden rounded-full bg-sky [&_svg]:size-full",
        className,
      )}
      aria-hidden="true"
    >
      <svg>
        <use href="#ieung-mark" />
      </svg>
    </span>
  );
}

/* 상단 메뉴. 오른쪽 끝은 로그인 · 「내 학습」 자리 (#49) */
function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur-[14px]">
      <div
        className={cn(wrap, "flex min-h-16 items-center justify-between gap-3")}
      >
        <a
          className={cn(
            "flex items-center gap-2.5 rounded-full text-ink no-underline",
            focus,
          )}
          href="/"
        >
          <MarkDot className="size-9" />
          <span className="font-display text-[1.15rem] whitespace-nowrap">
            한국어 with Youjin
          </span>
        </a>
        <nav className="flex items-center gap-1.5" aria-label="메뉴 / Menu">
          {/* 폰에서는 숨긴다 — 첫 화면의 「앱 N개 모두 보기」가 같은 곳으로 간다 */}
          <a
            className={cn(
              "hidden min-h-11 items-center rounded-full px-4 font-bold text-ink no-underline hover:bg-surface sm:inline-flex",
              focus,
            )}
            href="#apps"
          >
            모든 앱
            <span className="ml-1.5 text-[0.8rem] font-semibold text-muted">
              Apps
            </span>
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

const heroGrid =
  "grid items-center gap-10 py-10 min-[960px]:min-h-[min(calc(100dvh-64px),860px)] min-[960px]:grid-cols-[5fr_7fr] min-[960px]:gap-16";

/* ── 첫 화면 · 처음 온 사람 ── */
function HeroNew() {
  return (
    <section className={cn(wrap, heroGrid)}>
      <div className="break-keep">
        <h1 className="min-w-0 font-display text-[clamp(3.25rem,6.2vw,5.5rem)] leading-[1.02] font-normal [overflow-wrap:break-word]">
          <span className="block">한국어</span>
          <span className="block">with Youjin</span>
        </h1>
        <p className="mt-6 text-[1.3rem] leading-[1.45] font-bold">
          한국어를 배우는 작은 앱, 매일 조금씩.
          <span className="mt-1 block text-[1rem] font-semibold text-muted">
            Small apps for learning Korean, a little every day.
          </span>
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <BigLink
            href="/hangul-blocks/"
            ko="한글부터 시작하기"
            en="Start with Hangul"
            primary
          />
          <BigLink
            href="#apps"
            ko={`앱 ${APPS.length}개 모두 보기`}
            en="See all apps"
          />
        </div>
      </div>
      <IeungStage />
    </section>
  );
}

/* ── 첫 화면 · 다시 온 사람: 이 기기에서 하던 데서 이어서 (shared/recent.ts) ── */
function HeroBack({ app, r }: { app: AppInfo; r: Recent }) {
  const hasProgress =
    typeof r.done === "number" && typeof r.total === "number" && r.total > 0;
  const pct = hasProgress ? Math.round((r.done! / r.total!) * 100) : 0;
  return (
    <section className={cn(wrap, heroGrid)}>
      <div className="break-keep">
        <h1 className="font-display text-[clamp(2.75rem,5vw,4.5rem)] leading-[1.05] font-normal">
          다시 오셨네요!
          <span className="mt-2 block font-app text-[1.1rem] font-bold text-muted">
            Welcome back! Pick up where you left off.
          </span>
        </h1>
        <a
          href={hrefOf(app)}
          className={cn(
            "mt-9 grid grid-cols-[96px_minmax(0,1fr)] items-center gap-5 rounded-xl border-2 border-line bg-surface p-4 pr-6 text-ink no-underline shadow-card",
            lift,
            focus,
          )}
        >
          <span
            className="block h-28 overflow-hidden rounded-lg"
            style={toneVars(app.tone)}
          >
            <Shot a={app} className="translate-y-3 scale-110" decorative />
          </span>
          <span className="block min-w-0">
            <span className="block text-[0.85rem] font-bold text-muted">
              이어서 하기 <span className="font-semibold">Continue</span>
            </span>
            <b className="mt-0.5 block font-display text-[1.6rem] leading-[1.15] font-normal">
              {app.ko}
            </b>
            <span className="mt-0.5 block text-[0.9rem] font-semibold text-muted">
              {r.step ? `${r.step.ko} ${r.step.en}` : app.about.ko}
            </span>
            {hasProgress && (
              <span className="mt-3 flex items-center gap-3">
                <span
                  className="block h-2.5 flex-1 overflow-hidden rounded-full bg-line"
                  role="progressbar"
                  aria-valuenow={r.done}
                  aria-valuemin={0}
                  aria-valuemax={r.total}
                  aria-label="진도 / Progress"
                >
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <b className="text-[0.9rem]">
                  {r.done} / {r.total}
                </b>
              </span>
            )}
          </span>
        </a>
        <div className="mt-6 flex flex-wrap gap-3">
          <BigLink href={hrefOf(app)} ko="이어서 하기" en="Continue" primary />
          <BigLink href="#apps" ko="다른 앱 고르기" en="Pick another app" />
        </div>
      </div>
      <IeungStage />
    </section>
  );
}

function BigLink({
  href,
  ko,
  en,
  primary,
}: {
  href: string;
  ko: ReactNode;
  en: ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      className={cn(
        "inline-flex min-h-14 flex-col justify-center rounded-[18px] leading-[1.2] no-underline",
        primary
          ? "bg-primary px-7 text-primary-ink shadow-card"
          : "border-2 border-line bg-surface px-6 text-ink",
        lift,
        focus,
      )}
      href={href}
    >
      <b
        className={cn(
          "font-display font-normal",
          primary ? "text-[1.2rem]" : "text-[1.1rem]",
        )}
      >
        {ko}
      </b>
      <span
        className={cn(
          "text-[0.8rem] font-bold",
          primary ? "opacity-85" : "text-muted",
        )}
      >
        {en}
      </span>
    </a>
  );
}

/* 이응이 — 누를 때마다 한 줄씩 말하고 표정이 바뀐다.
   이야기는 디자인 시스템 「마스코트 · 이야기」(빈자리 · 포도알)에서 고른다. 새 설정을 지어내지 않는다. */
type Line = { mood: Mood; ko: string; en: string; fx?: "in" };
const HELLO: Line = {
  mood: "basic",
  ko: "안녕하세요! 저를 눌러 보세요.",
  en: "Hi! Tap me.",
};
const SLEEP: Line = {
  mood: "sleepy",
  ko: "쿨쿨… 눌러서 깨워 주세요.",
  en: "Zzz… tap to wake me up.",
};
const LINES: Line[] = [
  { mood: "yay", ko: "저는 이응이예요!", en: "I'm Ieung‑i!" },
  {
    mood: "wink",
    ko: "한글 ㅇ에서 따서 만들었어요.",
    en: "I'm made from the Hangul letter ㅇ.",
  },
  {
    mood: "huh",
    ko: "‘아’ 하고 읽어 보세요. 제 소리는 안 나요.",
    en: "Say 아 — you can't hear me at all.",
  },
  {
    mood: "focus",
    ko: "첫소리 ㅇ은 소리 없는 빈자리예요.",
    en: "At the start, ㅇ is a silent, empty seat.",
  },
  {
    mood: "sparkle",
    ko: "비어 있으니까 뭐든 담을 수 있어요!",
    en: "Empty means I can hold anything!",
    fx: "in",
  },
  {
    mood: "love",
    ko: "여러분이 외운 단어도 제 안에 담겨요.",
    en: "Every word you learn goes inside me.",
    fx: "in",
  },
  {
    mood: "wow",
    ko: "받침에 가면 ‘ng’ 소리가 나요!",
    en: "At the bottom, I say “ng”!",
  },
  {
    mood: "tongue",
    ko: "동그란 몸은 포도알이에요.",
    en: "My round body is a grape.",
  },
  {
    mood: "proud",
    ko: "머리 위는 포도 꼭지! ㅎ의 윗획이랑 닮았지요?",
    en: "The T on top is the stem — just like the top of ㅎ!",
  },
  {
    mood: "moved",
    ko: "빈자리에 하나씩, 매일 조금씩.",
    en: "One seat at a time, a little every day.",
  },
];
// 튀어나오는 글자는 모두 ㅇ 이 든 글자. 담기는 줄에서는 단어가 이응이 안으로 떨어진다
const POP = ["ㅇ", "아", "오", "우", "이", "응", "앙", "영"];
const WORDS = ["사과", "하늘", "친구", "학교", "사랑", "바다"];
const TONES = ["blue", "pink", "yellow", "mint", "lavender", "coral", "orange"];
const SLEEP_MS = 15000;

type Bit = {
  id: number;
  text: string;
  tone: string;
  x: number;
  r: number;
  fx: "out" | "in";
};

function IeungStage() {
  const [n, setN] = useState(-1); // -1 = 아직 안 누름
  const [asleep, setAsleep] = useState(false);
  const [bits, setBits] = useState<Bit[]>([]);
  const seq = useRef(0);

  // 가만히 두면 잠든다
  useEffect(() => {
    if (asleep) return;
    const t = setTimeout(() => setAsleep(true), SLEEP_MS);
    return () => clearTimeout(t);
  }, [n, asleep]);

  const line = asleep ? SLEEP : n < 0 ? HELLO : LINES[n];

  const poke = () => {
    // 자다 깨면 하던 말을 다시 한다
    const next = asleep && n >= 0 ? n : (n + 1) % LINES.length;
    setAsleep(false);
    setN(next);
    const fx = LINES[next].fx ?? "out";
    const pool = fx === "in" ? WORDS : POP;
    const fresh: Bit[] = Array.from(
      { length: fx === "in" ? 3 : 5 },
      (_, i) => ({
        id: ++seq.current,
        text: pool[Math.floor(Math.random() * pool.length)],
        tone: TONES[(seq.current + i) % TONES.length],
        x: fx === "in" ? (i - 1) * 75 : (i - 2) * 46 + (Math.random() * 16 - 8),
        r: Math.random() * 30 - 15,
        fx,
      }),
    );
    setBits((b) => [...b.slice(-12), ...fresh]);
    const ids = new Set(fresh.map((f) => f.id));
    setTimeout(() => setBits((b) => b.filter((x) => !ids.has(x.id))), 1600);
  };

  return (
    <div
      className="relative flex min-h-[460px] flex-col items-center justify-center overflow-hidden rounded-xl bg-sky px-4 py-10 text-center break-keep min-[960px]:min-h-[min(660px,calc(100dvh-160px))]"
      role="group"
      aria-labelledby="ieung-title"
    >
      <h2 id="ieung-title" className="sr-only">
        <span className="block">이응이를 소개해요</span>
        <span>Meet Ieung{"‑"}i</span>
      </h2>
      {/* 말풍선 — 무대 위에서는 흰 면. 높이를 잡아 둬서 이응이가 들썩이지 않는다. z-2: 튀는 글자가 글을 가리지 않게 */}
      <Bubble
        className="z-2 min-h-21 max-w-90 bg-surface text-[1.3rem] text-ink after:border-t-surface [&_em]:text-muted"
        key={`${asleep}-${n}`}
        aria-live="polite"
        ko={line.ko}
        en={line.en}
      />
      <button
        type="button"
        className="relative mt-3 w-[clamp(200px,24vw,320px)] cursor-pointer rounded-full bg-transparent p-0 [-webkit-tap-highlight-color:transparent] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary"
        onClick={poke}
        aria-label="이응이 누르기 / Tap Ieung-i"
      >
        {/* 누르면 말랑하게 눌렸다가 튄다 */}
        <span className={pokeClass} key={`${n}-${asleep}`}>
          <Ieung mood={line.mood} />
        </span>
        {/* 튀어나오는 글자 (out) · 안으로 담기는 단어 (in). 색은 -bg/-ink 쌍, 글자가 같이 있다 */}
        {bits.map((b) => (
          <span
            key={b.id}
            className={cn(
              "pointer-events-none absolute top-[55%] left-1/2 rounded-full px-3 py-1 font-display text-[1.15rem] whitespace-nowrap opacity-0 motion-reduce:hidden",
              b.fx === "out"
                ? "animate-[ieung-out_1.4s_ease-out_forwards]"
                : "animate-[ieung-in_1.3s_ease-in_forwards]",
            )}
            style={
              {
                "--x": `${b.x}px`,
                "--r": `${b.r}deg`,
                background: `var(--${b.tone}-bg)`,
                color: `var(--${b.tone}-ink)`,
              } as CSSProperties
            }
            aria-hidden="true"
          >
            {b.text}
          </span>
        ))}
      </button>
      <p
        className="mt-4 text-[0.85rem] font-bold text-sky-ink"
        aria-hidden="true"
      >
        {n < 0
          ? "이응이를 눌러 보세요 / Tap Ieung‑i"
          : `${n + 1} / ${LINES.length}`}
      </p>
    </div>
  );
}

/* ── 처음이라면: 이 순서로 (기기 기록이 없을 때만) ── */
const PATH = ["hangul-blocks", "hangul-name", "korean-cards"];
function FirstSteps() {
  const steps = PATH.flatMap((s) => APPS.filter((a) => a.slug === s));
  return (
    <section className={cn(wrap, section)} aria-labelledby="first-title">
      <h2 id="first-title" className={h2}>
        처음이라면 이 순서로
        <span className="mt-2 block font-app text-[1rem] font-bold text-muted">
          New here? Try them in this order
        </span>
      </h2>
      <ol className="mt-12 grid gap-4 min-[860px]:grid-cols-3">
        {steps.map((a, i) => (
          <li key={a.slug}>
            <a
              href={hrefOf(a)}
              className={cn(
                "flex h-full items-center gap-5 rounded-xl border-2 border-line bg-surface p-5 text-ink no-underline break-keep",
                lift,
                focus,
              )}
            >
              <span
                className="grid size-14 shrink-0 place-items-center rounded-full font-display text-[1.6rem]"
                style={toneVars(a.tone)}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="block min-w-0">
                <b className="block font-display text-[1.35rem] leading-[1.2] font-normal">
                  {a.ko}
                </b>
                <span className="mt-0.5 block text-[0.9rem] font-semibold text-muted">
                  {a.about.ko}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ── 새로 나온 앱: added 가 최근인 2개를 크게 ── */
function NewApps() {
  const [lead, next] = [...APPS].sort((x, y) => y.added.localeCompare(x.added));
  return (
    <section
      className={cn(wrap, "pb-20 min-[960px]:pb-28")}
      aria-labelledby="new-title"
    >
      <h2 id="new-title" className={h2}>
        새로 나온 앱
        <span className="mt-2 block font-app text-[1rem] font-bold text-muted">
          New apps
        </span>
      </h2>
      <div className="mt-12 grid gap-6 min-[1100px]:grid-cols-12">
        <FeatureTile a={lead} className="min-[1100px]:col-span-7" wide />
        {next && <FeatureTile a={next} className="min-[1100px]:col-span-5" />}
      </div>
    </section>
  );
}

function FeatureTile({
  a,
  wide,
  className,
}: {
  a: AppInfo;
  wide?: boolean;
  className?: string;
}) {
  return (
    <a
      href={hrefOf(a)}
      style={toneVars(a.tone)}
      className={cn(
        "group flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-xl no-underline break-keep",
        "transition-transform duration-200 hover:-translate-y-1 active:translate-y-0 motion-reduce:transition-none",
        focus,
        wide &&
          "min-[1100px]:grid min-[1100px]:min-h-[500px] min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
        className,
      )}
    >
      <span
        className={cn(
          "block px-7 pt-7",
          wide &&
            "min-[1100px]:self-center min-[1100px]:px-10 min-[1100px]:pt-0",
        )}
      >
        <b
          className={cn(
            "block font-display font-normal",
            wide
              ? "text-[clamp(2rem,3vw,2.75rem)] leading-[1.1]"
              : "text-[1.9rem] leading-[1.15]",
          )}
        >
          {a.ko}
        </b>
        <small className="mt-1 block text-[0.85rem] font-bold opacity-80">
          {a.en}
        </small>
        <span className="mt-4 block text-[1.05rem] font-bold">
          {a.about.ko}
          <em className="mt-0.5 block text-[0.85rem] font-semibold not-italic opacity-80">
            {a.about.en}
          </em>
        </span>
      </span>
      <span
        className={cn(
          "mt-7 flex flex-1 items-end justify-center px-7",
          wide && "min-[1100px]:mt-10 min-[1100px]:pr-10 min-[1100px]:pl-0",
        )}
      >
        <Shot
          a={a}
          className={cn(
            "rounded-t-lg shadow-card transition-transform duration-200 group-hover:-translate-y-1.5 motion-reduce:transition-none",
            wide ? "max-w-[340px]" : "max-w-[300px]",
          )}
        />
      </span>
    </a>
  );
}

/** 앱 화면 캡처 (public/home/<slug>.webp). 아직 없으면 앱 이모지를 크게 */
function Shot({
  a,
  className,
  decorative,
}: {
  a: AppInfo;
  className?: string;
  decorative?: boolean;
}) {
  const [missing, setMissing] = useState(false);
  if (missing)
    return (
      <span
        className={cn(
          "grid aspect-[3/4] w-full place-items-center bg-surface text-[4rem] leading-none",
          className,
        )}
        aria-hidden="true"
      >
        {a.emoji}
      </span>
    );
  return (
    <img
      src={`/home/${a.slug}.webp`}
      alt={decorative ? "" : `${a.ko} 화면 / ${a.en} screen`}
      width={390}
      height={520}
      loading="lazy"
      onError={() => setMissing(true)}
      className={cn("block h-auto w-full bg-surface", className)}
    />
  );
}

/* ── 모든 앱: 분류 · 검색 · 같은 모양 카드 ── */
function AllApps() {
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return APPS.filter(
      (a) =>
        (cat === "all" || a.category === cat) &&
        (!k ||
          `${a.ko} ${a.en} ${a.about.ko} ${a.about.en}`
            .toLowerCase()
            .includes(k)),
    );
  }, [cat, q]);
  const chips: { id: Category | "all"; ko: string; en: string }[] = [
    { id: "all", ko: "전체", en: "All" },
    ...USED,
  ];
  return (
    <section
      id="apps"
      className={cn("scroll-mt-16 bg-surface", section)}
      aria-labelledby="apps-title"
    >
      <div className={wrap}>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 min-[960px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[960px]:items-end">
          <h2 id="apps-title" className={h2}>
            모든 앱
            <span className="mt-2 block font-app text-[1rem] font-bold text-muted">
              All apps, {APPS.length} so far
            </span>
          </h2>
          <label className="flex min-h-13 items-center gap-3 rounded-full border-2 border-muted bg-bg px-5 focus-within:border-primary min-[960px]:ml-auto min-[960px]:w-[min(100%,420px)]">
            <svg
              className="size-5 shrink-0 text-muted"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="9" cy="9" r="6" />
              <path d="m14 14 4 4" strokeLinecap="round" />
            </svg>
            <span className="sr-only">앱 찾기 / Search apps</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="앱 찾기 / Search apps"
              className="min-w-0 flex-1 bg-transparent py-3 font-bold text-ink outline-none placeholder:text-muted"
            />
          </label>
        </div>

        <div
          className="mt-8 flex flex-wrap gap-2"
          role="group"
          aria-label="분류 / Category"
        >
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "min-h-11 cursor-pointer rounded-full border-2 px-4 font-bold transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none",
                cat === c.id
                  ? "border-ink bg-ink text-bg"
                  : "border-line bg-bg text-ink hover:-translate-y-0.5",
                focus,
              )}
            >
              {c.ko}{" "}
              <span
                className={cn(
                  "text-[0.8rem] font-semibold",
                  cat === c.id ? "opacity-80" : "text-muted",
                )}
              >
                {c.en}
              </span>
            </button>
          ))}
        </div>

        {list.length ? (
          <ul className="mt-10 grid gap-6 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4">
            {list.map((a) => (
              <li key={a.slug} className="min-w-0">
                <AppCard a={a} />
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="mt-10 rounded-xl border-2 border-dashed border-line px-6 py-12 text-center font-bold"
            role="status"
          >
            찾는 앱이 없어요.
            <span className="mt-1 block text-[0.9rem] font-semibold text-muted">
              No apps match. Try another word.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}

function AppCard({ a }: { a: AppInfo }) {
  return (
    <a
      href={hrefOf(a)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border-2 border-line bg-bg text-ink no-underline break-keep",
        "transition-transform duration-200 hover:-translate-y-1 active:translate-y-0 motion-reduce:transition-none",
        focus,
      )}
    >
      <span
        className="flex h-48 items-end overflow-hidden px-8 pt-6"
        style={toneVars(a.tone)}
      >
        <Shot
          a={a}
          className="rounded-t-lg shadow-card transition-transform duration-200 group-hover:-translate-y-1.5 motion-reduce:transition-none"
          decorative
        />
      </span>
      <span className="flex flex-1 flex-col p-5">
        <b className="block font-display text-[1.4rem] leading-[1.2] font-normal">
          {a.ko}
        </b>
        <small className="block text-[0.8rem] font-bold text-muted">
          {a.en}
        </small>
        <span className="mt-3 block text-[0.95rem] font-semibold">
          {a.about.ko}
          <em className="mt-0.5 block text-[0.8rem] font-semibold not-italic text-muted">
            {a.about.en}
          </em>
        </span>
      </span>
    </a>
  );
}

/* ── 만든 사람 — 한 문장을 크게. 사진 자리는 유진 사진으로 바꾼다 ── */
function Maker() {
  return (
    <section className="py-20 min-[960px]:py-28" aria-labelledby="maker-title">
      <div
        className={cn(
          wrap,
          "grid items-center gap-10 min-[960px]:grid-cols-[minmax(0,9fr)_minmax(0,3fr)]",
        )}
      >
        <div className="break-keep">
          <h2
            id="maker-title"
            className="font-display text-[clamp(2.4rem,5vw,4.25rem)] leading-[1.12] font-normal"
          >
            빈자리에 하나씩, 매일 조금씩.
          </h2>
          <p className="mt-3 text-[1.2rem] font-bold text-muted">
            One seat at a time, a little every day.
          </p>
          <p className="mt-10 text-[1.05rem] font-bold">
            만든 사람: <br /> 유진, 서울의 한국어 선생님
            <span className="mt-0.5 block text-[0.9rem] font-semibold text-muted">
              Made by Youjin, a Korean teacher in Seoul
            </span>
          </p>
        </div>
        {/* 사진 자리 (data-slot) — 정사각 사진을 public/home/youjin.webp 로 넣으면 이응이 대신 보인다 */}
        <div
          data-slot="youjin-photo"
          className="mx-auto aspect-square w-[min(100%,240px)]"
        >
          <MarkDot className="size-full" />
        </div>
      </div>
    </section>
  );
}

mount(<Home />);
