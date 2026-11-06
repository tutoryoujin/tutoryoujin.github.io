/* ============================================================
   Confetti — 한 번에 하나만 돈다. celebrate() 는 멈추는 함수를 돌려준다.

   물리는 프레임 수가 아니라 경과 시간으로 움직인다. 프레임당 += 로
   짜면 프레임이 밀릴 때 버벅이는 데서 끝나지 않고 입자가 실제로
   느리게 간다. DURATION 은 실제 시간이라 공중에서 잘리기도 한다.
   (예전 앱의 study.js 에서 그대로 옮겼다.)
   ============================================================ */
let current: { cv: HTMLCanvasElement; raf: number } | null = null;

export function stopConfetti() {
  if (!current) return;
  cancelAnimationFrame(current.raf);
  current.cv.remove();
  current = null;
}

/** 이모지를 미리 한 번만 래스터라이즈해 둔다.
    매 프레임 ctx.font 를 세팅하면 문자열 파싱이 반복되고, 크기가
    입자마다 소수점이라 글리프 캐시가 전부 빗나간다. */
function emojiSprite(ch: string, px: number) {
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const g = c.getContext("2d")!;
  g.font = Math.round(px * 0.78) + "px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(ch, px / 2, px / 2);
  return c;
}

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  sprite: HTMLCanvasElement | null;
  size: number;
  rot: number;
  vr: number;
  wob: number;
};

export function celebrate() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    navigator.vibrate?.([40, 60, 40]);
  } catch {
    /* 진동 없는 기기 */
  }
  stopConfetti(); // 다시 누르면 앞의 것을 치우고 새로 시작한다

  const cv = document.createElement("canvas");
  cv.className = "confetti";
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth,
    H = window.innerHeight;
  cv.width = W * dpr;
  cv.height = H * dpr;

  // 색종이 색은 캔버스 안의 장식이라 토큰이 아니다 (테마와 무관하게 같은 색)
  const colors = ["#FFC93C", "#FF7AA8", "#5ED3A8", "#6FA8FF", "#FF8A65", "#A98BFF"];
  const sprites = ["🎉", "💖", "⭐", "🥰", "🦋", "🌸"].map((ch) => emojiSprite(ch, Math.round(44 * dpr)));

  const parts: P[] = [];
  const make = (x: number, y: number, vx: number, vy: number) => {
    const isEmoji = Math.random() < 0.14;
    parts.push({
      x,
      y,
      vx,
      vy,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      color: colors[(Math.random() * colors.length) | 0],
      sprite: isEmoji ? sprites[(Math.random() * sprites.length) | 0] : null,
      size: 20 + Math.random() * 10,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      wob: Math.random() * Math.PI * 2,
    });
  };
  // VMAX 는 낙하 종단속도. 너무 낮으면 내려올 때 시럽 속처럼 느리다.
  const G = 0.25,
    VMAX = 9.5,
    base = Math.sqrt(2 * G * H);
  for (const [x, dir] of [
    [0, 1],
    [W, -1],
  ]) {
    for (let i = 0; i < 70; i++) {
      const a = -Math.PI / 2 + dir * (0.12 + Math.random() * 0.55);
      const sp = base * (0.7 + Math.random() * 0.4);
      make(x, H + 10, Math.cos(a) * sp, Math.sin(a) * sp);
    }
  }
  for (let i = 0; i < 40; i++) make(Math.random() * W, -20 - Math.random() * H * 0.5, (Math.random() - 0.5) * 2, 1 + Math.random() * 2);

  const DURATION = 3600,
    FADE = 800;
  const t0 = performance.now();
  let last = t0;

  const me = { cv, raf: 0 };
  function tick(now: number) {
    const t = now - t0;
    // 60fps 한 프레임을 1 로 본 경과 시간. 탭을 다시 열었을 때 순간이동하지 않도록 세 프레임으로 끊는다
    const dt = Math.min((now - last) / 16.667, 3);
    last = now;
    const drag = Math.pow(0.985, dt);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.globalAlpha = t > DURATION - FADE ? Math.max(0, (DURATION - t) / FADE) : 1;

    let n = 0;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.vy = Math.min(p.vy + G * dt, VMAX);
      p.vx *= drag;
      p.wob += 0.08 * dt;
      p.x += (p.vx + Math.sin(p.wob) * 0.6) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;

      // 화면 밖으로 나간 입자는 버린다. 위쪽은 자르지 않는다 — 천장 입자가 아직 내려오는 중이다
      if (p.y > H + 60 || p.x < -90 || p.x > W + 90) continue;
      parts[n++] = p;

      const c = Math.cos(p.rot) * dpr,
        s = Math.sin(p.rot) * dpr;
      ctx.setTransform(c, s, -s, c, p.x * dpr, p.y * dpr);
      if (p.sprite) {
        ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        const squash = Math.abs(Math.cos(p.wob));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, (-p.h / 2) * squash, p.w, p.h * squash + 1);
      }
    }
    parts.length = n;

    if (t < DURATION && n > 0) me.raf = requestAnimationFrame(tick);
    else stopConfetti(); // 다 빠져나가면 시간이 남아도 끝낸다
  }

  current = me;
  me.raf = requestAnimationFrame(tick);
  return stopConfetti;
}
