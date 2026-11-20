/* 첫 화면(/) — 앱이 계속 늘어나는 허브 (#48). 레트로 리브랜딩 (유진 님 레트로 홈 목업 기준).
   구성: 헤더 → 첫 화면(처음: 소개 · 다시 온 사람: 이어서 하기) + 이응이 무대
        → 무료 앱(이응이 썸네일 카드 · 분류 · 검색 · 새 앱 표시) → 처음이라면(기기 기록이 없을 때만)
        → 표어 · 만든 사람 → From Seoul to your screen(블로그 띠) → 꼬리말
   카드 그림은 public/home/ieung/<slug>.webp (이응이 썸네일). 없는 앱은 화면 캡처(public/home/<slug>.webp)로.
   로그인 · 회원 전용 잠금은 아직 없다 (#49).
   글 순서 (#84): 홈만 설명 글은 영어가 크고 한국어가 아래 작다 — 처음 온 사람은 아직 한글을 못 읽는다.
   레트로의 겉: 남색 잉크 2px 선 · 크림 종이 · 코랄 주색. 새 색 없이 토큰만 쓴다. */
import { APPS, CATEGORIES, type AppInfo, type Category } from "@yj/apps";
import { readRecent, type Recent } from "@yj/recent";
import { NOTES_NAV } from "@yj/notes";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  cn,
  Footer,
  homeWrap,
  Ieung,
  Mark,
  mount,
  pokeClass,
  Products,
  SiteHeader,
  SiteNavLink,
  Subscribe,
  WithYoujin,
  type Mood,
} from "@yj/ui";
import "./home.css";

/** 앱이 하나라도 있는 분류만 — 빈 칩 · 빈 꼬리말 열을 만들지 않는다 */
const USED = CATEGORIES.filter((c) => APPS.some((a) => a.category === c.id));
/** 「새로」 표시 — added 가 가장 최근인 2개 */
const NEW = new Set([...APPS].sort((x, y) => y.added.localeCompare(x.added)).slice(0, 2).map((a) => a.slug));

const wrap = homeWrap;
const focus = "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary";
const ink2 = "border-2 border-ink";
const lift = "transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0.5 motion-reduce:transition-none";
const h2 = "min-w-0 font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-[1.08] break-keep [overflow-wrap:break-word] text-balance";
const h2ko = "mt-2 block font-app text-[1rem] leading-[1.4] font-bold text-muted";
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

/** 목업의 「///」 — 코랄 세 줄. 꾸밈이라 읽히지 않게 숨긴다 */
function Spark({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg className={cn("pointer-events-none text-primary", flip && "-scale-x-100", className)} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M8 30 L2 22 M16 24 L13 12 M26 23 L28 10" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}
const Arrow = ({ className }: { className?: string }) => (
  <svg className={cn("size-5 shrink-0", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function Home() {
  const recent = useRecent();
  return (
    <>
      <Nav />
      <main className="flex-[1_0_auto]">
        {recent ? <HeroBack {...recent} /> : <HeroNew />}
        <AllApps />
        {!recent && <FirstSteps />}
        <Maker />
        <BlogBand />
        <div className={cn(wrap, "max-w-[760px]")}>
          {/* 설정(shared/site.ts)이 비어 있으면 둘 다 아무것도 그리지 않는다 */}
          <Products source="home" className="mt-6" />
          <Subscribe source="home" className="mt-6" />
        </div>
      </main>
      <Footer>
        <div className="grid gap-8 min-[720px]:grid-cols-[minmax(0,3fr)_minmax(0,9fr)]">
          <div className="flex items-center gap-2.5 self-start">
            <Mark className="size-10" />
            <b className="font-display text-[1.25rem] text-ink">
              Korean <WithYoujin />
            </b>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 min-[960px]:grid-cols-4">
            {USED.map((c) => (
              <div key={c.id}>
                <h3 className="text-[0.85rem] font-bold text-muted">
                  {c.en} <span className="font-semibold" lang="ko">{c.ko}</span>
                </h3>
                <ul className="mt-1">
                  {APPS.filter((a) => a.category === c.id).map((a) => (
                    <li key={a.slug}>
                      <a className={cn("inline-flex min-h-11 items-center rounded-sm font-bold whitespace-nowrap text-ink no-underline hover:text-primary", focus)} href={hrefOf(a)}>
                        {a.en}
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

/* 상단 메뉴. 오른쪽 끝은 로그인 · 「내 학습」 자리 (#49) */
function Nav() {
  return (
    <SiteHeader wide>
      {/* 폰에서는 숨긴다 — 첫 화면의 「앱 모두 보기」가 같은 곳으로 간다 */}
      <SiteNavLink href="#apps" en="Free apps" ko="무료 앱" className="hidden sm:inline-flex" />
      <SiteNavLink href="/notes/" en={NOTES_NAV.en} ko={NOTES_NAV.ko} />
      <a
        href="/hangul-blocks/"
        className={cn("mx-1.5 hidden min-h-11 items-center gap-2 rounded-full border-2 border-primary px-4 font-extrabold whitespace-nowrap text-primary no-underline hover:bg-primary hover:text-primary-ink min-[860px]:inline-flex", focus)}
      >
        Start learning <Arrow className="size-4" />
      </a>
    </SiteHeader>
  );
}

/* 첫 화면 — 글 5칸, 이응이 무대 7칸 */
const heroGrid =
  "grid items-center gap-8 py-10 min-[960px]:min-h-[min(calc(100dvh-74px),760px)] min-[960px]:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] min-[960px]:gap-6 min-[960px]:py-6";

function HeroNew() {
  return (
    <section className="border-b-2 border-ink">
      <div className={cn(wrap, heroGrid)}>
        <div className="relative min-w-0 break-keep">
          <Spark className="absolute -top-8 -left-3 size-10 -rotate-12 max-[600px]:hidden" />
          <h1 className="min-w-0 font-display text-[clamp(3.2rem,6.4vw,6rem)] leading-[0.98] tracking-[-0.02em] [overflow-wrap:break-word]">
            <span className="block">Korean</span>
            <WithYoujin className="block min-[420px]:whitespace-nowrap" />
          </h1>
          <p className="mt-6 max-w-[28ch] text-[1.35rem] leading-[1.4] font-bold">
            Small apps for learning Korean, a little every day.
            <span className="mt-1.5 block text-[1rem] font-semibold text-muted" lang="ko">
              한국어를 배우는 작은 앱, 매일 조금씩.
            </span>
          </p>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            <Chip icon="gift" en="100% free" ko="전부 무료" />
            <Chip icon="pin" en="Made in Seoul" ko="서울에서 만들어요" />
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href="/hangul-blocks/"
              className={cn(
                "inline-flex min-h-15 items-center gap-3 rounded-full bg-primary px-7 text-primary-ink no-underline shadow-[0_5px_0_var(--ink)]",
                ink2,
                lift,
                focus,
              )}
            >
              <span className="flex flex-col leading-[1.15]">
                <b className="font-display text-[1.3rem]">Start with Hangul</b>
                <span className="text-[0.8rem] font-bold opacity-90" lang="ko">한글부터 시작하기</span>
              </span>
              <Arrow />
            </a>
            <a href="#apps" className={cn("inline-flex min-h-11 flex-col justify-center rounded-md font-extrabold text-ink no-underline", focus)}>
              <span className="underline decoration-primary decoration-2 underline-offset-4">See all {APPS.length} apps</span>
              <span className="text-[0.8rem] font-bold text-muted" lang="ko">앱 {APPS.length}개 모두 보기</span>
            </a>
          </div>
        </div>
        <IeungStage />
      </div>
    </section>
  );
}

function Chip({ icon, en, ko }: { icon: "gift" | "pin"; en: string; ko: string }) {
  return (
    <li className={cn("inline-flex min-h-10 items-center gap-2 rounded-full bg-surface px-4 font-extrabold", ink2)}>
      <svg className="size-[18px] shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon === "gift" ? (
          <path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13M7.5 8a2.5 2.5 0 1 1 4.5-1.5A2.5 2.5 0 1 1 16.5 8" />
        ) : (
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
        )}
      </svg>
      {en}
      <span className="text-[0.8rem] font-bold text-muted" lang="ko">{ko}</span>
    </li>
  );
}

/* 다시 온 사람: 이 기기에서 하던 데서 이어서 (shared/recent.ts) */
function HeroBack({ app, r }: { app: AppInfo; r: Recent }) {
  const hasProgress = typeof r.done === "number" && typeof r.total === "number" && r.total > 0;
  const pct = hasProgress ? Math.round((r.done! / r.total!) * 100) : 0;
  return (
    <section className="border-b-2 border-ink">
      <div className={cn(wrap, heroGrid)}>
        <div className="min-w-0 break-keep">
          <h1 className="font-display text-[clamp(3rem,5.6vw,5rem)] leading-[1.02] tracking-[-0.02em]">
            Welcome back!
            <span className="mt-3 block font-app text-[1.1rem] leading-[1.4] font-bold tracking-normal text-muted" lang="ko">
              다시 오셨네요! 하던 데서 이어서 해요.
            </span>
          </h1>
          <a href={hrefOf(app)} className={cn("mt-8 grid grid-cols-[104px_minmax(0,1fr)] items-center gap-5 rounded-[20px] bg-surface p-3 pr-6 text-ink no-underline", ink2, lift, focus)}>
            <Thumb a={app} className="rounded-[14px]" />
            <span className="block min-w-0">
              <b className="block font-display text-[1.5rem] leading-[1.15]">{app.en}</b>
              <span className="mt-0.5 block text-[0.9rem] font-bold text-muted" lang="ko">{app.ko}</span>
              <span className="mt-0.5 block text-[0.9rem] font-semibold text-muted">{r.step ? `${r.step.en} ${r.step.ko}` : app.about.en}</span>
              {hasProgress && (
                <span className="mt-3 flex items-center gap-3">
                  <span className="block h-2.5 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={r.done} aria-valuemin={0} aria-valuemax={r.total} aria-label="진도 / Progress">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </span>
                  <b className="text-[0.9rem]">{r.done} / {r.total}</b>
                </span>
              )}
            </span>
          </a>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a href={hrefOf(app)} className={cn("inline-flex min-h-14 items-center gap-3 rounded-full bg-primary px-7 text-primary-ink no-underline shadow-[0_5px_0_var(--ink)]", ink2, lift, focus)}>
              <span className="flex flex-col leading-[1.15]">
                <b className="font-display text-[1.2rem]">Continue</b>
                <span className="text-[0.8rem] font-bold opacity-90" lang="ko">이어서 하기</span>
              </span>
              <Arrow />
            </a>
            <a href="#apps" className={cn("inline-flex min-h-11 flex-col justify-center rounded-md font-extrabold text-ink no-underline", focus)}>
              <span className="underline decoration-primary decoration-2 underline-offset-4">Pick another app</span>
              <span className="text-[0.8rem] font-bold text-muted" lang="ko">다른 앱 고르기</span>
            </a>
          </div>
        </div>
        <IeungStage />
      </div>
    </section>
  );
}

/* 이응이 — 누를 때마다 한 줄씩 말하고 표정이 바뀐다 */
type Line = { mood: Mood; ko: string; en: string; fx?: "in" };
const HELLO: Line = { mood: "basic", ko: "안녕! 저를 눌러 보세요.", en: "Hi! Tap me." };
const SLEEP: Line = { mood: "sleepy", ko: "쿨쿨… 눌러서 깨워 주세요.", en: "Zzz… tap to wake me up." };
const LINES: Line[] = [
  { mood: "yay", ko: "저는 이응이예요!", en: "I'm Ieung‑i!" },
  { mood: "wink", ko: "한글 ㅇ에서 따서 만들었어요.", en: "I'm made from the Hangul letter ㅇ." },
  { mood: "huh", ko: "‘아’ 하고 읽어 보세요. 제 소리는 안 나요.", en: "Say 아. You can't hear me at all." },
  { mood: "focus", ko: "첫소리 ㅇ은 소리 없는 빈자리예요.", en: "At the start, ㅇ is a silent, empty seat." },
  { mood: "sparkle", ko: "비어 있으니까 뭐든 담을 수 있어요!", en: "Empty means I can hold anything!", fx: "in" },
  { mood: "love", ko: "여러분이 외운 단어도 제 안에 담겨요.", en: "Every word you learn goes inside me.", fx: "in" },
  { mood: "wow", ko: "받침에 가면 ‘ng’ 소리가 나요!", en: "At the bottom, I say “ng”!" },
  { mood: "tongue", ko: "동그란 몸은 포도알이에요.", en: "My round body is a grape." },
  { mood: "proud", ko: "머리 위는 포도 꼭지! ㅎ의 윗획이랑 닮았지요?", en: "The T on top is the stem, just like the top of ㅎ!" },
  { mood: "yay", ko: "빈자리에 하나씩, 매일 조금씩.", en: "One seat at a time, a little every day." },
];
const POP = ["ㅇ", "아", "오", "우", "이", "응", "앙", "영"];
const WORDS = ["사과", "하늘", "친구", "학교", "사랑", "바다"];
const TONES = ["blue", "pink", "yellow", "mint", "lavender", "coral", "orange"];
const SLEEP_MS = 15000;
type Bit = { id: number; text: string; tone: string; x: number; r: number; fx: "out" | "in" };

function IeungStage() {
  const [n, setN] = useState(-1);
  const [asleep, setAsleep] = useState(false);
  const [bits, setBits] = useState<Bit[]>([]);
  const seq = useRef(0);
  useEffect(() => {
    if (asleep) return;
    const t = setTimeout(() => setAsleep(true), SLEEP_MS);
    return () => clearTimeout(t);
  }, [n, asleep]);
  const line = asleep ? SLEEP : n < 0 ? HELLO : LINES[n];
  const poke = () => {
    const next = asleep && n >= 0 ? n : (n + 1) % LINES.length;
    setAsleep(false);
    setN(next);
    const fx = LINES[next].fx ?? "out";
    const pool = fx === "in" ? WORDS : POP;
    const fresh: Bit[] = Array.from({ length: fx === "in" ? 3 : 5 }, (_, i) => ({
      id: ++seq.current,
      text: pool[Math.floor(Math.random() * pool.length)],
      tone: TONES[(seq.current + i) % TONES.length],
      x: fx === "in" ? (i - 1) * 75 : (i - 2) * 46 + (Math.random() * 16 - 8),
      r: Math.random() * 30 - 15,
      fx,
    }));
    setBits((b) => [...b.slice(-12), ...fresh]);
    const ids = new Set(fresh.map((f) => f.id));
    setTimeout(() => setBits((b) => b.filter((x) => !ids.has(x.id))), 1600);
  };

  return (
    <div className="relative grid min-h-[420px] place-items-center break-keep min-[960px]:min-h-[620px]" role="group" aria-labelledby="ieung-title">
      <h2 id="ieung-title" className="sr-only">
        <span lang="ko">이응이를 소개해요</span> Meet Ieung{"‑"}i
      </h2>
      {/* 하늘 구름 · 서울 · 떠 있는 자모 — 꾸밈 */}
      <span className="home-cloud absolute inset-x-[2%] top-[8%] bottom-[10%] bg-sky" aria-hidden="true" />
      <Skyline className="absolute right-0 bottom-[10%] w-[62%] max-w-[440px] max-[600px]:w-[60%]" />
      <span className="home-jamo top-[6%] right-[16%] -rotate-6 text-lavender-bg max-[600px]:hidden" aria-hidden="true">ㄱ</span>
      <span className="home-jamo top-[16%] right-[3%] rotate-6 text-primary max-[600px]:hidden" aria-hidden="true">ㅏ</span>
      <Spark className="absolute top-[30%] left-[6%] size-9 -rotate-[30deg]" />
      <svg className="absolute top-[54%] left-[12%] size-6 text-primary" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 0 Q11.5 8.5 20 10 Q11.5 11.5 10 20 Q8.5 11.5 0 10 Q8.5 8.5 10 0Z" fill="currentColor" />
      </svg>

      <div className="relative z-2 flex w-full flex-col items-center">
        {/* 말풍선 — 이응이 머리 위 왼쪽, 꼬리는 이응이 쪽 */}
        <p
          key={`${asleep}-${n}`}
          aria-live="polite"
          className={cn(
            "home-bubble relative mb-2 flex min-h-[88px] max-w-[min(92%,380px)] -translate-x-[18%] flex-col justify-center rounded-[26px] bg-surface px-6 py-3 text-center font-display text-[clamp(1.15rem,2.1vw,1.55rem)] leading-[1.25] text-balance text-ink max-[600px]:translate-x-0",
            ink2,
          )}
          lang="ko"
        >
          {line.ko}
          <em className="mt-1 block font-app text-[0.8rem] font-bold not-italic text-muted" lang="en">{line.en}</em>
        </p>
        <button
          type="button"
          onClick={poke}
          aria-label="이응이 누르기 / Tap Ieung-i"
          className="relative w-[min(78%,340px)] cursor-pointer rounded-full bg-transparent p-0 [-webkit-tap-highlight-color:transparent] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary min-[960px]:w-[min(80%,400px)]"
        >
          {/* 발밑 점묘 그림자 — 목업처럼 땅에 선 느낌 */}
          <svg className="absolute -bottom-[2%] left-1/2 h-[7%] w-[62%] -translate-x-1/2" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <pattern id="ieung-ground" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <circle cx="1.2" cy="1.2" r=".95" fill="var(--ink)" />
              </pattern>
              <radialGradient id="ieung-ground-f">
                <stop offset=".35" stopColor="#fff" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <mask id="ieung-ground-m">
                <ellipse cx="100" cy="10" rx="100" ry="10" fill="url(#ieung-ground-f)" />
              </mask>
            </defs>
            <ellipse cx="100" cy="10" rx="100" ry="10" fill="url(#ieung-ground)" mask="url(#ieung-ground-m)" />
          </svg>
          <span className={pokeClass} key={`${n}-${asleep}`}>
            <Ieung mood={line.mood} />
          </span>
          {bits.map((b) => (
            <span
              key={b.id}
              className={cn(
                "pointer-events-none absolute top-[55%] left-1/2 rounded-full px-3 py-1 font-display text-[1.15rem] whitespace-nowrap opacity-0 motion-reduce:hidden",
                b.fx === "out" ? "animate-[ieung-out_1.4s_ease-out_forwards]" : "animate-[ieung-in_1.3s_ease-in_forwards]",
              )}
              style={{ "--x": `${b.x}px`, "--r": `${b.r}deg`, background: `var(--${b.tone}-bg)`, color: `var(--${b.tone}-ink)` } as CSSProperties}
              aria-hidden="true"
            >
              {b.text}
            </span>
          ))}
        </button>
        <p className="mt-1 text-[0.85rem] font-bold text-sky-ink" aria-hidden="true">
          {n < 0 ? (
            <>
              Tap Ieung{"‑"}i <span lang="ko">· 이응이를 눌러 보세요</span>
            </>
          ) : (
            `${n + 1} / ${LINES.length}`
          )}
        </p>
      </div>
    </div>
  );
}

/** 서울 — 점묘 남산 위 타워, 외곽선 건물, 앞을 덮는 뭉게구름. 목업의 판화 느낌 */
function Skyline({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const ink = "var(--ink)";
  const out = { fill: "var(--lavender-bg)", stroke: ink, strokeWidth: 2.5, strokeLinejoin: "round" as const };
  // 건물: x, 위쪽 y, 너비, 창문 열 수
  const blocks: [number, number, number, number][] = [
    [96, 150, 22, 2],
    [122, 132, 26, 2],
    [152, 146, 22, 2],
    [178, 124, 26, 2],
    [208, 142, 24, 2],
  ];
  return (
    <svg className={cn("pointer-events-none", className)} viewBox="0 0 360 190" aria-hidden="true">
      <defs>
        <pattern id={`${id}d`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="1.4" cy="1.4" r="1.25" fill={ink} />
        </pattern>
        <pattern id={`${id}s`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
          <circle cx="2" cy="2" r=".8" fill="var(--sky-ink)" opacity=".55" />
        </pattern>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}m`}>
          <rect width="360" height="190" fill={`url(#${id}f)`} />
        </mask>
      </defs>

      {/* 남산 — 점묘, 꼭대기가 더 촘촘 */}
      <path d="M190 190 C220 138 248 96 288 90 C322 86 346 116 360 160 V190Z" fill="var(--lavender-bg)" opacity=".9" />
      <path d="M190 190 C220 138 248 96 288 90 C322 86 346 116 360 160 V190Z" fill={`url(#${id}d)`} mask={`url(#${id}m)`} />

      {/* N서울타워 */}
      <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round" fill="var(--surface)">
        <path d="M283 92 L286 40 H294 L297 92Z" />
        <rect x="279" y="26" width="22" height="14" rx="5" />
        <rect x="283" y="17" width="14" height="9" rx="3" />
      </g>
      <path d="M290 17 V2" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M287 9 H293" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M282 33 H298" stroke={ink} strokeWidth="1.5" />

      {/* 건물 — 라벤더 면 + 잉크 외곽선 + 잉크 창문 */}
      {blocks.map(([x, y, w, cols]) => {
        const rows = Math.floor((182 - y - 10) / 12);
        const gap = (w - cols * 5) / (cols + 1);
        return (
          <g key={x}>
            <rect x={x} y={y} width={w} height={190 - y} rx="1.5" {...out} />
            {Array.from({ length: rows * cols }, (_, i) => (
              <rect
                key={i}
                x={x + gap + (i % cols) * (5 + gap)}
                y={y + 7 + Math.floor(i / cols) * 12}
                width="5"
                height="6"
                rx=".8"
                fill={ink}
              />
            ))}
          </g>
        );
      })}

      {/* 앞 구름 — 밝은 면 + 옅은 점묘, 남산 아랫자락을 덮음 */}
      <path
        d="M212 190 C210 176 224 168 238 174 C242 158 264 152 276 166 C286 152 310 150 318 164 C330 150 356 150 360 158 V190Z"
        fill="var(--surface)"
      />
      <path
        d="M212 190 C210 176 224 168 238 174 C242 158 264 152 276 166 C286 152 310 150 318 164 C330 150 356 150 360 158 V190Z"
        fill={`url(#${id}s)`}
      />
    </svg>
  );
}

/* ── 무료 앱 — 이응이 썸네일 카드. 분류 · 검색은 그대로 ── */
function AllApps() {
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return APPS.filter(
      (a) => (cat === "all" || a.category === cat) && (!k || `${a.ko} ${a.en} ${a.about.ko} ${a.about.en}`.toLowerCase().includes(k)),
    );
  }, [cat, q]);
  const chips: { id: Category | "all"; ko: string; en: string }[] = [{ id: "all", ko: "전체", en: "All" }, ...USED];
  return (
    <section id="apps" className={cn(wrap, "scroll-mt-20 py-16 min-[960px]:py-20")} aria-labelledby="apps-title">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h2 id="apps-title" className={cn(h2, "relative")}>
          <Spark className="absolute top-0 -left-11 size-9 -rotate-12 max-[700px]:hidden" />
          Free Korean learning apps
          <span className={h2ko} lang="ko">무료 한국어 학습 앱</span>
        </h2>
        <p className="font-bold text-muted">
          Little tools to learn and practice Korean, all free.
          <span className="block text-[0.85rem]" lang="ko">직접 눌러 보며 배우는 무료 도구예요.</span>
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="분류 / Category">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "min-h-11 cursor-pointer rounded-full px-4 font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
                ink2,
                cat === c.id ? "bg-ink text-bg" : "bg-surface text-ink hover:bg-sky",
                focus,
              )}
            >
              {c.en}{" "}
              <span className={cn("text-[0.8rem] font-semibold", cat === c.id ? "opacity-80" : "text-muted")} lang="ko">{c.ko}</span>
            </button>
          ))}
        </div>
        <label className={cn("flex min-h-12 w-full items-center gap-3 rounded-full bg-surface px-5 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-primary sm:w-[min(100%,340px)]", ink2)}>
          <svg className="size-5 shrink-0 text-muted" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" strokeLinecap="round" />
          </svg>
          <span className="sr-only">Search apps / 앱 찾기</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search apps / 앱 찾기" className="min-w-0 flex-1 bg-transparent py-2.5 font-bold text-ink outline-none placeholder:text-muted" />
        </label>
      </div>

      {list.length ? (
        <ul className="mt-8 grid gap-5 min-[700px]:grid-cols-[repeat(2,minmax(0,1fr))] min-[1100px]:grid-cols-[repeat(3,minmax(0,1fr))]">
          {list.map((a) => (
            <li key={a.slug} className="min-w-0">
              <AppCard a={a} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-[20px] border-2 border-dashed border-muted px-6 py-12 text-center font-bold" role="status">
          No apps match. Try another word.
          <span className="mt-1 block text-[0.9rem] font-semibold text-muted" lang="ko">찾는 앱이 없어요.</span>
        </p>
      )}
    </section>
  );
}

function AppCard({ a }: { a: AppInfo }) {
  return (
    <a
      href={hrefOf(a)}
      className={cn("group relative grid h-full grid-cols-[minmax(0,42%)_minmax(0,1fr)] items-center gap-4 rounded-[22px] bg-surface p-3 pr-5 text-ink no-underline break-keep", ink2, lift, focus)}
    >
      <Thumb a={a} className="rounded-[16px]" />
      <span className="block min-w-0 py-2 pr-6">
        {NEW.has(a.slug) && (
          <span className="mb-1.5 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[0.75rem] font-extrabold text-primary-ink">
            New <span lang="ko">새 앱</span>
          </span>
        )}
        <b className="block font-display text-[1.35rem] leading-[1.12] text-balance">{a.en}</b>
        <span className="mt-0.5 block text-[0.88rem] font-bold text-muted" lang="ko">{a.ko}</span>
        <span className="mt-2 block text-[0.92rem] leading-[1.4] font-semibold">{a.about.en}</span>
      </span>
      <span className="absolute right-3.5 bottom-3.5 grid size-9 place-items-center rounded-full bg-lavender-bg text-lavender-ink transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true">
        <Arrow className="size-[18px]" />
      </span>
    </a>
  );
}

/** 카드 그림 — 이응이 썸네일, 없으면 화면 캡처, 그것도 없으면 앱 이모지 */
function Thumb({ a, className }: { a: AppInfo; className?: string }) {
  const [step, setStep] = useState(0);
  const srcs = [`/home/ieung/${a.slug}.webp`, `/home/${a.slug}.webp`];
  if (step >= srcs.length)
    return (
      <span className={cn("grid aspect-square w-full place-items-center bg-sky text-[3rem]", className)} aria-hidden="true">
        {a.emoji}
      </span>
    );
  return (
    <img
      src={srcs[step]}
      alt=""
      width={480}
      height={480}
      loading="lazy"
      onError={() => setStep((s) => s + 1)}
      className={cn("block aspect-square h-auto w-full bg-bg object-cover", className)}
    />
  );
}

/* ── 처음이라면: 이 순서로 (기기 기록이 없을 때만) ── */
const PATH = ["hangul-blocks", "hangul-name", "korean-cards"];
function FirstSteps() {
  const steps = PATH.flatMap((s) => APPS.filter((a) => a.slug === s));
  return (
    <section className={cn(wrap, "pb-16 min-[960px]:pb-20")} aria-labelledby="first-title">
      <div className={cn("grid items-center gap-5 rounded-[26px] bg-sky p-5 min-[960px]:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] min-[960px]:p-6", ink2)}>
        <h2 id="first-title" className="font-display text-[1.6rem] leading-[1.1] text-sky-ink break-keep">
          New here? Try them in this order
          <span className="mt-1 block font-app text-[0.9rem] font-bold" lang="ko">처음이라면 이 순서로</span>
        </h2>
        <ol className="grid gap-3 min-[700px]:grid-cols-3">
          {steps.map((a, i) => (
            <li key={a.slug} className="min-w-0">
              <a href={hrefOf(a)} className={cn("flex h-full items-center gap-3 rounded-[18px] bg-surface p-2.5 pr-4 text-ink no-underline", ink2, lift, focus)}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-display text-[1.3rem] text-primary-ink" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="min-w-0 break-keep">
                  <b className="block font-display text-[1.1rem] leading-[1.15]">{a.en}</b>
                  <span className="block text-[0.82rem] font-bold text-muted" lang="ko">{a.ko}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── 표어 · 만든 사람. 사진 자리(data-slot)는 유진 사진으로 바꾼다 ── */
function Maker() {
  return (
    <section className={cn(wrap, "pb-6 min-[960px]:pb-8")} aria-labelledby="maker-title">
      <div className="grid items-center gap-8 min-[960px]:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="min-w-0 break-keep">
          <h2 id="maker-title" className="font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.06] text-balance" lang="ko">
            빈자리에 하나씩, 매일 조금씩.
          </h2>
          <p className="mt-3 text-[1.2rem] font-bold text-muted">One seat at a time, a little every day.</p>
          <div className="mt-8 grid gap-5 min-[720px]:grid-cols-[repeat(2,minmax(0,1fr))] min-[720px]:gap-10">
            <p className="leading-[1.5] font-bold">
              Made by Youjin, a Korean teacher in Seoul
              <span className="mt-1 block text-[0.9rem] font-semibold text-muted" lang="ko">만든 사람: 유진, 서울의 한국어 선생님</span>
            </p>
            {/* 워드마크의 You 를 여기서 한 번 말로 풀어 준다 (#83) */}
            <p className="leading-[1.5] font-bold">
              Spot the “You” in <span className="text-primary">You</span>jin? It’s Korean with Youjin, and Korean with you.
              <span className="mt-1 block text-[0.9rem] font-semibold text-muted" lang="ko">Youjin 안에 You 가 있어요. 유진이랑, 그리고 여러분이랑 같이 배워요.</span>
            </p>
          </div>
        </div>
        {/* 사진 자리 — 정사각 사진을 public/home/youjin.webp 로 넣으면 이응이 대신 보인다 */}
        <div data-slot="youjin-photo" className="mx-auto w-[min(100%,280px)]">
          <Ieung mood="proud" />
        </div>
      </div>
    </section>
  );
}

/* ── From Seoul to your screen — 블로그 띠. 이응이가 위로 고개를 내민다 ── */
function BlogBand() {
  return (
    <section className={cn(wrap, "pt-10 pb-16")} aria-labelledby="band-title">
      <div className={cn("relative grid items-center gap-5 rounded-[40px] bg-lavender-bg px-6 py-6 text-lavender-ink min-[900px]:grid-cols-[150px_minmax(0,1.3fr)_minmax(0,1fr)_auto] min-[900px]:rounded-full min-[900px]:py-4 min-[900px]:pr-5 min-[900px]:pl-6", ink2)}>
        <img src="/mascot/winking.webp" alt="" width={160} height={162} className="-mt-16 w-[120px] min-[900px]:-mt-14 min-[900px]:w-[150px]" />
        <h2 id="band-title" className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.1] break-keep">
          From <span className="underline decoration-primary decoration-[0.09em] underline-offset-[0.14em]">Seoul</span> to your screen
          <span className="mt-1 block font-app text-[0.9rem] font-bold" lang="ko">서울에서 여러분 화면으로</span>
        </h2>
        <p className="font-bold leading-[1.4] min-[900px]:border-l-2 min-[900px]:border-lavender-ink/40 min-[900px]:pl-5">
          Study tips and Korean life on the blog.
          <span className="block text-[0.85rem]" lang="ko">블로그에 공부 팁과 한국 생활 이야기를 써요.</span>
        </p>
        <a href="/notes/" className={cn("inline-flex min-h-12 items-center gap-2.5 justify-self-start rounded-full bg-surface px-5 font-extrabold whitespace-nowrap text-ink no-underline", ink2, lift, focus)}>
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 5.5C6 4 9 4 12 6c3-2 6-2 9-.5V19c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z M12 6v13.5" />
          </svg>
          Visit the blog <span className="text-[0.8rem] font-bold text-muted" lang="ko">블로그</span>
        </a>
      </div>
    </section>
  );
}

mount(<Home />);
