/* ============================================================
   철자로 추측하기 — 이름 데이터에 없는 낱말만.
   발음을 모르니 영어 철자의 흔한 소리로 어림한다. 화면에는 늘 「추측」 도장과
   "한국어 화자에게 확인해 보세요" 안내가 같이 나간다.
   ============================================================ */
import { compose } from "@yj/korean/hangul";

type Tok = { t: "V"; v: string[]; short: boolean } | { t: "C"; k: string };

/** 모음 앞 자음. S = sh, C = ch, N = ng */
const ON: Record<string, string> = {
  b: "ㅂ", d: "ㄷ", f: "ㅍ", g: "ㄱ", h: "ㅎ", j: "ㅈ", k: "ㅋ", l: "ㄹ", m: "ㅁ", n: "ㄴ", p: "ㅍ",
  r: "ㄹ", s: "ㅅ", t: "ㅌ", v: "ㅂ", z: "ㅈ", S: "ㅅ", C: "ㅊ", N: "ㅇ",
};
/** 대문자 = 끝의 e 때문에 긴 모음 (Kate, Mike, Rose, Luke) */
const VOW: Record<string, string[]> = {
  a: ["ㅏ"], e: ["ㅔ"], i: ["ㅣ"], o: ["ㅗ"], u: ["ㅜ"], A: ["ㅔ", "ㅣ"], I: ["ㅏ", "ㅣ"], O: ["ㅗ"], U: ["ㅠ"],
};
const DIG: Record<string, string[]> = {
  ee: ["ㅣ"], ea: ["ㅣ"], oo: ["ㅜ"], ou: ["ㅏ", "ㅜ"], ai: ["ㅔ", "ㅣ"], ay: ["ㅔ", "ㅣ"], ei: ["ㅔ", "ㅣ"], ey: ["ㅔ", "ㅣ"],
  oa: ["ㅗ"], au: ["ㅗ"], aw: ["ㅗ"], oi: ["ㅗ", "ㅣ"], oy: ["ㅗ", "ㅣ"], eu: ["ㅠ"],
};
const RV: Record<string, string[]> = { er: ["ㅓ"], ar: ["ㅏ"], ir: ["ㅓ"], ur: ["ㅓ"], or: ["ㅗ"] };
const WG: Record<string, string> = { ㅏ: "ㅘ", ㅓ: "ㅝ", ㅔ: "ㅞ", ㅣ: "ㅟ", ㅗ: "ㅝ" };
const YG: Record<string, string> = { ㅏ: "ㅑ", ㅓ: "ㅕ", ㅗ: "ㅛ", ㅜ: "ㅠ", ㅔ: "ㅖ" };
const isV = (ch: string | undefined) => !!ch && "aeiouAIOU".includes(ch);

function tokenize(word: string): Tok[] {
  const s = word
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/ck/g, "k")
    .replace(/ph/g, "f")
    .replace(/qu?/g, "kw")
    .replace(/x/g, "ks")
    .replace(/th/g, "s")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/sh/g, "S")
    .replace(/ch/g, "C")
    .replace(/c/g, "k")
    .replace(/([b-df-hj-np-tv-z])\1/g, "$1")
    .replace(/ng(?=[aeiouy])/g, "Ng")
    .replace(/ng/g, "N")
    .replace(/([aiou])([b-df-hj-np-tv-zSC])e$/, (_, v: string, c: string) => ({ a: "A", i: "I", o: "O", u: "U" })[v as "a"] + c);

  const out: Tok[] = [];
  let glide: "w" | "y" | null = null;
  const pushV = (v: string[], short = false) => {
    v = v.slice();
    if (glide) {
      v[0] = (glide === "w" ? WG : YG)[v[0]] ?? v[0];
      glide = null;
    }
    out.push({ t: "V", v, short });
  };
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    const n2 = s.slice(i, i + 2);
    const after2 = s[i + 2];
    const prev = out[out.length - 1];
    if (isV(ch)) {
      if (RV[n2] && !isV(after2) && after2 !== "y") {
        pushV(n2 === "or" && after2 === undefined ? ["ㅓ"] : RV[n2]);
        i += 2;
        continue;
      }
      if (DIG[n2] && !(n2[1] === "y" && isV(after2))) {
        pushV(n2 === "ey" && after2 === undefined ? ["ㅣ"] : DIG[n2]);
        i += 2;
        continue;
      }
      if (n2 === "ow" && !isV(after2)) {
        pushV(after2 === undefined ? ["ㅗ"] : ["ㅏ", "ㅜ"]);
        i += 2;
        continue;
      }
      if ((n2 === "ie" || n2 === "ue") && after2 === undefined) {
        pushV(n2 === "ie" ? ["ㅣ"] : ["ㅜ"]);
        i += 2;
        continue;
      }
      // 끝의 소리 없는 e
      if (ch === "e" && i === s.length - 1 && prev?.t === "C" && out.some((t) => t.t === "V")) {
        i++;
        continue;
      }
      pushV(VOW[ch], "aeiou".includes(ch));
      i++;
      continue;
    }
    if (ch === "y") {
      if (isV(s[i + 1]) && (!prev || prev.t === "V")) glide = "y";
      else pushV(["ㅣ"], true);
      i++;
      continue;
    }
    if (ch === "w") {
      if (isV(s[i + 1])) glide = "w";
      i++;
      continue;
    }
    out.push({ t: "C", k: ch });
    i++;
  }
  return out;
}

/** 철자로 어림한 한글. 만들 수 없으면 빈 문자열 */
export function guessWord(word: string): string {
  const tk = tokenize(word);
  const syl: { c: string; v: string; f: string }[] = [];
  const last = () => syl[syl.length - 1];
  for (let i = 0; i < tk.length; i++) {
    const t = tk[i];
    const nx = tk[i + 1];
    const pv = tk[i - 1];
    if (t.t === "V") {
      t.v.forEach((v) => syl.push({ c: "ㅇ", v, f: "" }));
      continue;
    }
    const k = t.k;
    const L = last();
    if (nx?.t === "V") {
      // 모음 사이 l 은 ㄹㄹ
      if (k === "l" && L && !L.f && (pv?.t === "V" || L.v === "ㅡ")) L.f = "ㄹ";
      if (k === "N" && L && !L.f) {
        L.f = "ㅇ";
        continue;
      }
      const vs = nx.v.slice();
      if (k === "S") vs[0] = YG[vs[0]] ?? vs[0];
      syl.push({ c: ON[k], v: vs[0], f: "" });
      vs.slice(1).forEach((v) => syl.push({ c: "ㅇ", v, f: "" }));
      i++;
      continue;
    }
    if (k === "r" || k === "h") continue;
    if (pv?.t === "V" && L && !L.f) {
      const coda = ({ n: "ㄴ", m: "ㅁ", N: "ㅇ", l: "ㄹ" } as Record<string, string>)[k];
      if (coda) {
        L.f = coda;
        continue;
      }
      if (pv.short && "ptk".includes(k) && !(nx?.t === "C" && "lrmn".includes(nx.k))) {
        L.f = ({ p: "ㅂ", t: "ㅅ", k: "ㄱ" } as Record<string, string>)[k];
        continue;
      }
    }
    if (k === "N") {
      if (L && !L.f) L.f = "ㅇ";
      continue;
    }
    if (!ON[k]) continue;
    syl.push({ c: ON[k], v: !nx && "SCj".includes(k) ? "ㅣ" : "ㅡ", f: "" });
  }
  return syl.map((s) => compose(s.c, s.v, s.f) ?? "").join("");
}
