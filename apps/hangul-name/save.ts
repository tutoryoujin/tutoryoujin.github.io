/* ============================================================
   영수증 그림 저장 — 화면 영수증과 같은 데이터(receipt.ts)를 <canvas> 에 그린다.
   의존성 없음. 글꼴은 페이지가 이미 받은 웹폰트(Jua · Nunito · Pretendard)를 그대로 쓴다
   (canvas 는 document.fonts 를 본다 — SVG 처럼 글꼴을 따로 넣을 필요가 없다).

   저장 방법
   - 휴대폰에서 파일 공유가 되면 공유 시트 (iPhone: 「이미지 저장」으로 사진에)
   - iPhone 인데 공유가 안 되면 화면에 그림을 띄우고 길게 눌러 저장하라고 안내
   - 데스크톱은 내려받기
   ============================================================ */
import { isIOS } from "@yj/ui";
import { barcode, barcodeWidth, breakdown, introduce, pad, stamp, STAMP, STATUS_NOTE } from "./model";
import type { Issued } from "./Receipt";

const W = 1080;
const P = 84; // 좌우 여백

type Colors = { bg: string; paper: string; ink: string; soft: string; red: string };
type Fonts = { display: string; app: string; reading: string };

function readTheme(): { c: Colors; f: Fonts } {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  return {
    c: { bg: v("--bg"), paper: v("--hn-paper"), ink: v("--hn-paper-ink"), soft: v("--hn-paper-soft"), red: v("--hn-red") },
    f: { display: v("--font-display"), app: v("--font-app"), reading: v("--font-reading") },
  };
}

/** 그리기. ctx 의 높이를 모를 때는 한 번 재고(draw=false) 다시 그린다. 끝난 y 를 돌려준다 */
function paint(ctx: CanvasRenderingContext2D, it: Issued, c: Colors, f: Fonts, draw: boolean): number {
  const text = it.option.text;
  const { blocks, letters, finals } = breakdown(text);
  const intro = introduce(text);
  let y = 96;

  const font = (px: number, fam: string, weight = 400) => (ctx.font = `${weight} ${px}px ${fam}`);
  const put = (s: string, x: number, yy: number, align: CanvasTextAlign = "left", color = c.ink) => {
    ctx.textAlign = align;
    ctx.fillStyle = color;
    if (draw) ctx.fillText(s, x, yy);
  };
  const width = (s: string) => ctx.measureText(s).width;
  const rule = (double = false) => {
    y += 20;
    if (draw) {
      ctx.strokeStyle = c.ink;
      ctx.lineWidth = 3;
      ctx.setLineDash(double ? [] : [12, 9]);
      ctx.beginPath();
      ctx.moveTo(P, y);
      ctx.lineTo(W - P, y);
      if (double) {
        ctx.moveTo(P, y + 9);
        ctx.lineTo(W - P, y + 9);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    y += double ? 30 : 22;
  };
  /** 한국어 라벨 + 작은 영어. 끝난 x 를 돌려준다 */
  const label = (k: string, e: string, x: number, yy: number, px = 36) => {
    font(px, f.display);
    put(k, x, yy);
    x += width(k) + 12;
    font(Math.round(px * 0.62), f.app, 700);
    put(e, x, yy, "left", c.soft);
    return x + width(e);
  };
  const dots = (x1: number, x2: number, yy: number) => {
    if (!draw || x2 - x1 < 20) return;
    ctx.strokeStyle = c.soft;
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 7]);
    ctx.beginPath();
    ctx.moveTo(x1 + 10, yy - 6);
    ctx.lineTo(x2 - 10, yy - 6);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  /** 오른쪽 값 — 숫자 글꼴. 시작 x 를 돌려준다 */
  const right = (s: string, yy: number, px = 34, fam = f.reading, weight = 600, color = c.ink) => {
    font(px, fam, weight);
    put(s, W - P, yy, "right", color);
    return W - P - width(s);
  };
  /** 너비에 맞게 줄을 나눈다 (단어 단위) */
  const wrap = (s: string, max: number) => {
    const lines: string[] = [];
    let cur = "";
    for (const w of s.split(" ")) {
      const next = cur ? cur + " " + w : w;
      if (cur && width(next) > max) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  // 머리
  font(76, f.display);
  put("한글 이름 영수증", W / 2, y + 40, "center");
  y += 82;
  font(26, f.app, 700);
  put("H A N G U L   N A M E   R E C E I P T", W / 2, y, "center", c.soft);
  rule();

  y += 40;
  const x1 = label("번호", "No.", P, y);
  font(34, f.reading, 600);
  put(" " + pad(it.serial, 4), x1, y);
  right(stamp(it.at), y, 30);
  y += 58;
  label("이름", "Name", P, y);
  right(it.input.toUpperCase(), y, 36, f.app, 800);
  rule(true);

  // 큰 이름 — 넘치면 줄인다
  let big = 210;
  font(big, f.display);
  while (width(text) > W - 2 * P && big > 80) font((big -= 10), f.display);
  y += big * 0.95;
  put(text, W / 2, y, "center");
  y += 30;

  // 도장
  const st = STAMP[it.option.status];
  font(44, f.display);
  const sw = Math.max(width(st.ko), (font(22, f.app, 800), width(st.en.toUpperCase()))) + 48;
  const sh = 104;
  if (draw) {
    ctx.save();
    ctx.translate(W - P - sw / 2 - 8, y + sh / 2);
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.strokeStyle = c.red;
    ctx.lineWidth = 5;
    ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
    font(44, f.display);
    put(st.ko, 0, -2, "center", c.red);
    font(22, f.app, 800);
    put(st.en.toUpperCase(), 0, 34, "center", c.red);
    ctx.restore();
  }
  y += sh + 4;
  rule();

  y += 34;
  font(26, f.app, 700);
  put("글자 · BLOCK", P, y, "left", c.soft);
  put("소리 · SOUND", W - P, y, "right", c.soft);
  y += 22;
  for (const b of blocks) {
    y += 58;
    font(50, f.display);
    put(b.syl, P, y);
    const sx = right(b.sound, y, 38, f.reading, 700);
    font(50, f.display);
    dots(P + width(b.syl), sx, y);
    for (const j of b.jamo) {
      y += 52;
      const x = P + 36;
      font(40, f.display);
      const jw = Math.max(width(j.jamo), 44) + 12;
      if (j.kind === "jong" && draw) {
        ctx.fillStyle = c.ink;
        ctx.fillRect(x, y - 38, jw, 48);
      }
      put(j.jamo, x + jw / 2, y, "center", j.kind === "jung" ? c.red : j.kind === "jong" ? c.paper : c.ink);
      const [k, e] =
        j.kind === "cho"
          ? j.sound
            ? ["첫소리", "first sound"]
            : ["빈자리", "silent placeholder"]
          : j.kind === "jung"
            ? ["모음", "vowel"]
            : ["받침", j.like ? `final, sounds like ${j.like}` : "final"];
      const lx = label(k, e, x + jw + 16, y, 32);
      dots(lx, right(j.sound || "—", y, 32), y);
    }
  }
  rule();

  for (const [k, e, n] of [
    ["글자", "blocks", blocks.length],
    ["자모", "letters", letters],
    ["받침", "finals", finals],
  ] as const) {
    y += 50;
    dots(label(k, e, P, y), right(String(n), y), y);
  }
  rule(true);
  y += 54;
  label("합계", "TOTAL", P, y, 40);
  right(text, y + 6, 64, f.display, 400);
  y += 6;
  rule();

  // 자기소개 — 어미만 빨강
  y += 60;
  let px = 50;
  font(px, f.display);
  while (width(intro.sentence) > W - 2 * P && px > 26) font((px -= 2), f.display);
  let x = P;
  for (const [s, col] of [
    [intro.parts.before, c.ink],
    [intro.parts.ending, c.red],
    [intro.parts.after, c.ink],
  ] as const) {
    put(s, x, y, "left", col);
    x += width(s);
  }
  y += 48;
  font(30, f.app, 700);
  for (const line of wrap(`Hello! I’m ${it.input}.`, W - 2 * P)) {
    put(line, P, y, "left", c.soft);
    y += 40;
  }
  y += 14;
  const note = STATUS_NOTE[it.option.status];
  font(30, f.app, 700);
  for (const line of wrap(`* ${note.en}`, W - 2 * P)) {
    put(line, P, y);
    y += 40;
  }
  font(28, f.display);
  for (const line of wrap(note.ko, W - 2 * P)) {
    put(line, P, y, "left", c.soft);
    y += 38;
  }

  // 바코드
  y += 24;
  const bars = barcode(text, it.serial);
  const scale = 3;
  const bx = (W - barcodeWidth(bars) * scale) / 2;
  if (draw) {
    ctx.fillStyle = c.ink;
    for (const b of bars) ctx.fillRect(bx + b.x * scale, y, b.w * scale, 120);
  }
  y += 120 + 52;
  font(26, f.app, 700);
  put("감사합니다 · THANK YOU", W / 2, y, "center");
  return y + 70;
}

/** 영수증 그림(PNG) 만들기 */
export async function renderPng(it: Issued): Promise<Blob> {
  const { c, f } = readTheme();
  // 그리기 전에 글꼴이 와 있어야 한다 — 안 그러면 기본 글꼴로 찍힌다
  const sample = it.option.text + "한글이름영수증번호첫소리모음받침빈자리글자자모합계안녕하세요저는이에요예요감사합니다표준흔한표기규칙추측철자로추측했어요한국어화자에게확인해보세요";
  await Promise.all([
    document.fonts.load(`400 40px ${f.display}`, sample),
    document.fonts.load(`700 40px ${f.app}`, "ABCabc0123"),
    document.fonts.load(`600 40px ${f.reading}`, "0123456789"),
  ]).catch(() => {});

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = 100;
  const measure = canvas.getContext("2d")!;
  const H = Math.ceil(paint(measure, it, c, f, false));
  const M = 48; // 종이 밖 바탕
  canvas.width = W + 2 * M;
  canvas.height = H + 2 * M;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(M, M);
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";
  paint(ctx, it, c, f, true);
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("toBlob"))), "image/png"));
}

export type SaveResult = { how: "shared" | "downloaded" | "cancelled" } | { how: "preview"; url: string };

const isMobile = () => isIOS() || /Android/i.test(navigator.userAgent);

/**
 * 저장하기. 공유 시트 → (iPhone) 화면에 띄우기 → 내려받기.
 * 공유 시트는 누른 직후에만 열린다 — 그림을 미리 만들어 ready 로 넘기면 기다리지 않고 바로 연다.
 */
export async function saveReceipt(it: Issued, ready?: Blob): Promise<SaveResult> {
  const blob = ready ?? (await renderPng(it));
  const name = `hangul-name-${it.input.replace(/[^A-Za-z0-9-]+/g, "-").toLowerCase() || "receipt"}.png`;
  const file = new File([blob], name, { type: "image/png" });
  if (isMobile() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: it.option.text });
      return { how: "shared" };
    } catch (e) {
      if ((e as Error).name === "AbortError") return { how: "cancelled" };
      // 공유가 막히면 아래 방법으로
    }
  }
  const url = URL.createObjectURL(blob);
  if (isIOS()) return { how: "preview", url }; // iOS Safari 는 <a download> 가 불안정하다
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return { how: "downloaded" };
}
