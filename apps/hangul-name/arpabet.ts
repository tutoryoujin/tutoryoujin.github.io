/* ============================================================
   발음(ARPAbet, CMU 발음 사전) → 한글. 외래어 표기법 제3장 제1절(영어).

   빌드 전에 tools/hangul-name/build.ts 가 이름 데이터를 만들 때만 쓴다.
   앱 화면은 이 파일을 불러오지 않는다 — 결과(names.json)만 받는다.

   규칙만으로는 국립국어원 용례와 어긋나는 이름이 꽤 나온다
   (Michael → 마이컬, 용례는 마이클). 그래서 overrides.json 이 뒤에서 덮는다.
   ============================================================ */
import { compose } from "@yj/korean/hangul";

type Syl = { c: string; v: string; j: string; epen?: boolean };
type Unit = { t: "C"; p: string } | { t: "V"; v: string; short: boolean; ah?: boolean };

/** 모음 앞 자음 */
const ONSET: Record<string, string> = {
  P: "ㅍ", B: "ㅂ", T: "ㅌ", D: "ㄷ", K: "ㅋ", G: "ㄱ", F: "ㅍ", V: "ㅂ", TH: "ㅅ", DH: "ㄷ",
  S: "ㅅ", Z: "ㅈ", SH: "ㅅ", ZH: "ㅈ", CH: "ㅊ", JH: "ㅈ", M: "ㅁ", N: "ㄴ", L: "ㄹ", R: "ㄹ", HH: "ㅎ", NG: "ㅇ",
};
/** [j] + 모음 */
const Y_OF: Record<string, string> = { ㅏ: "ㅑ", ㅐ: "ㅒ", ㅓ: "ㅕ", ㅔ: "ㅖ", ㅗ: "ㅛ", ㅜ: "ㅠ", ㅣ: "ㅣ", ㅡ: "ㅣ" };
/** [w] + 모음 — wo · wɔ 는 워 */
const W_OF: Record<string, string> = { ㅏ: "ㅘ", ㅐ: "ㅙ", ㅓ: "ㅝ", ㅔ: "ㅞ", ㅗ: "ㅝ", ㅜ: "ㅜ", ㅣ: "ㅟ", ㅡ: "ㅜ" };
const VOWELS = new Set(["AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY", "OW", "OY", "UH", "UW"]);

/**
 * 철자의 모음 덩어리를 모음 소리와 짝짓는다 — AA 가 o 로 적혔는지 (Tom 톰, Scott 스콧) 같은 것을 보려고.
 * 개수가 다르면 첫 소리와 끝 소리만 짝짓는다 (Joshua: o · ua 둘, 소리는 셋).
 */
function vowelSpelling(spelling: string, count: number): (string | null)[] {
  const s = spelling.toLowerCase().replace(/[^a-z]/g, "");
  let groups = [...s.matchAll(/[aeiou]+y?|y(?![aeiou])/g)].map((m) => m[0]);
  if (groups.length > count && /[^aeiouy]e$/.test(s)) groups = groups.slice(0, -1); // 끝의 소리 없는 e
  if (groups.length === count) return groups;
  const out: (string | null)[] = Array(count).fill(null);
  if (count && groups.length) {
    out[0] = groups[0];
    out[count - 1] = groups[groups.length - 1];
  }
  return out;
}

function units(phones: string[], spelling: string): Unit[] {
  const vowelCount = phones.filter((p) => VOWELS.has(p)).length;
  const letters = vowelSpelling(spelling, vowelCount);
  const out: Unit[] = [];
  let vi = 0;
  phones.forEach((p, i) => {
    if (!VOWELS.has(p)) return void out.push({ t: "C", p });
    const letter = letters[vi++];
    const last = i === phones.length - 1;
    const next = phones[i + 1];
    const v = (v: string, short = false) => out.push({ t: "V", v, short });
    switch (p) {
      case "AA":
        // 미국 발음의 [ɑ] 가운데 o 로 적힌 것은 영국 발음 [ɒ] — 표기법은 '오'
        if (letter ? letter[0] === "o" : /o/.test(spelling) && !/a/.test(spelling)) v("ㅗ", true);
        else v("ㅏ");
        break;
      case "AE": v("ㅐ", true); break;
      case "AH":
        // 이름 끝의 [ə] 는 a 로 적혀 '아' 로 굳은 것이 대부분이다 (Emma 에마, Sophia 소피아)
        if (last) out.push({ t: "V", v: "ㅏ", short: true, ah: true });
        else if (letter && /^[iy]$/.test(letter) && phones[i - 1] !== "Y") v("ㅣ", true); // Jennifer 제니퍼
        else if (next === "N" && i === phones.length - 2 && ["S", "Z", "V"].includes(phones[i - 1]) && /[oe]n$/.test(spelling))
          v("ㅡ", true); // -son · -ven 은 '슨' · '븐' 으로 굳었다 (Madison 매디슨, Stephen 스티븐)
        else out.push({ t: "V", v: "ㅓ", short: true, ah: true });
        break;
      case "AO": v("ㅗ"); break;
      case "AW": v("ㅏ"); v("ㅜ"); break;
      case "AY": v("ㅏ"); v("ㅣ"); break;
      case "EH": v("ㅔ", true); break;
      case "ER":
        v("ㅓ");
        // [ɚ] 는 r 을 품은 모음 — 뒤에 모음이 오면 그 r 이 첫소리 ㄹ 이 된다 (Barbara 바버라, Avery 에이버리)
        if (VOWELS.has(next ?? "")) out.push({ t: "C", p: "R" });
        break;
      case "EY": v("ㅔ"); v("ㅣ"); break;
      case "IH": v("ㅣ", true); break;
      case "IY": v("ㅣ"); break;
      case "OW": v("ㅗ"); break;
      case "OY": v("ㅗ"); v("ㅣ"); break;
      case "UH": v("ㅜ", true); break;
      case "UW": v("ㅜ"); break;
    }
    // [ɛə] [ɪə] [ʊə] — 뒤에 모음 없는 r 이 오면 '어' 를 더한다 (Claire 클레어, Pierce 피어스)
    if (next === "R" && ["EH", "IH", "UH", "AY"].includes(p) && !VOWELS.has(phones[i + 2] ?? "")) v("ㅓ");
  });
  return out;
}

/**
 * ARPAbet 발음 하나를 한글로. phones 는 강세 숫자를 떼지 않아도 된다.
 * spelling 은 철자 — AA 를 '오' 로 읽을지, 끝의 z 를 '스' 로 적을지 보는 데만 쓴다.
 */
export function arpabetToHangul(phones: string[], spelling: string): string {
  const ph = phones.map((p) => p.replace(/\d/g, ""));
  const u = units(ph, spelling);
  const S: Syl[] = [];
  const last = () => S[S.length - 1];
  const push = (c: string, v: string, epen = false) => S.push({ c, v, j: "", epen });

  for (let i = 0; i < u.length; i++) {
    const x = u[i];
    if (x.t === "V") {
      push("ㅇ", x.v);
      continue;
    }
    const p = x.p;
    const n1 = u[i + 1];
    const n2 = u[i + 2];

    // 반모음 [j] [w] 가 앞 자음 없이
    if (p === "Y" || p === "W") {
      const of = p === "Y" ? Y_OF : W_OF;
      if (n1?.t === "V") {
        push("ㅇ", of[n1.v] ?? n1.v);
        i++;
      } else push("ㅇ", p === "Y" ? "ㅣ" : "ㅜ");
      continue;
    }

    // 자음 + 모음 → 첫소리
    let vowel: string | null = null;
    let used = 0;
    if (n1?.t === "V") {
      vowel = n1.v;
      used = 1;
    } else if (n1?.t === "C" && n1.p === "Y" && n2?.t === "V") {
      if (["D", "L", "N"].includes(p) && n2.ah) {
        // [d] [l] [n] + [jə] 는 디어 · 리어 · 니어 (Daniel 대니얼)
        onset(p, "ㅣ");
        push("ㅇ", n2.v);
        i += 2;
        continue;
      }
      vowel = ["CH", "JH", "ZH"].includes(p) ? n2.v : (Y_OF[n2.v] ?? n2.v);
      used = 2;
    } else if (n1?.t === "C" && n1.p === "W" && n2?.t === "V" && ["G", "K", "HH"].includes(p)) {
      // [gw] [kw] [hw] 는 한 음절로 (Quinn 퀸)
      vowel = W_OF[n2.v] ?? n2.v;
      used = 2;
    }
    if (vowel) {
      // ʃ 는 모음 앞에서 샤 · 섀 · 셔 · 셰 · 쇼 · 슈 · 시
      onset(p, p === "SH" ? (Y_OF[vowel] ?? vowel) : vowel);
      i += used;
      continue;
    }

    // 모음이 따르지 않는 자음 → 받침이거나 '으' 를 붙인다
    const prev = last();
    const prevUnit = u[i - 1];
    const open = !!prev && !prev.j;
    switch (p) {
      case "R":
      case "HH":
        break; // 모음 앞이 아니면 적지 않는다
      case "M":
      case "N":
      case "NG":
        if (open) prev!.j = p === "M" ? "ㅁ" : p === "N" ? "ㄴ" : "ㅇ";
        else if (p !== "NG") push(ONSET[p], "ㅡ", true); // Film 필름
        break;
      case "L":
        if (open && n1?.t === "C" && (n1.p === "M" || n1.p === "N") && n2?.t !== "V") {
          // 모음이 따르지 않는 비음 앞의 [l] 은 'ㄹㄹ' (Film 필름)
          prev!.j = "ㄹ";
          S.push({ c: "ㄹ", v: "ㅡ", j: n1.p === "M" ? "ㅁ" : "ㄴ", epen: true });
          i++;
        } else if (open) prev!.j = "ㄹ";
        else push("ㄹ", "ㅡ", true);
        break;
      case "P":
      case "T":
      case "K": {
        if (p === "T" && n1?.t === "C" && n1.p === "S" && n2?.t !== "V") {
          push("ㅊ", "ㅡ", true); // [ts] 츠
          i++;
          break;
        }
        // 제1항: 짧은 모음 다음 어말, 또는 짧은 모음과 유음·비음 아닌 자음 사이 → 받침
        const shortBefore = prevUnit?.t === "V" && prevUnit.short && open;
        const nextOk = !n1 || (n1.t === "C" && !["L", "R", "M", "N"].includes(n1.p));
        if (shortBefore && nextOk) prev!.j = p === "P" ? "ㅂ" : p === "T" ? "ㅅ" : "ㄱ";
        else push(ONSET[p], "ㅡ", true);
        break;
      }
      case "D":
        if (n1?.t === "C" && n1.p === "Z" && n2?.t !== "V") {
          push("ㅈ", "ㅡ", true); // [dz] 즈
          i++;
        } else push("ㄷ", "ㅡ", true);
        break;
      case "Z":
        // 이름 끝의 -s 는 [z] 여도 '스' 로 굳었다 (James 제임스, Charles 찰스)
        push(!n1 && /s$/i.test(spelling) ? "ㅅ" : "ㅈ", "ㅡ", true);
        break;
      case "SH":
        push("ㅅ", n1 ? "ㅠ" : "ㅣ", true); // 자음 앞 '슈', 어말 '시'
        break;
      case "ZH":
      case "JH":
        push("ㅈ", "ㅣ", true);
        break;
      case "CH":
        push("ㅊ", "ㅣ", true);
        break;
      default:
        push(ONSET[p], "ㅡ", true);
    }
  }
  return S.map((s) => compose(s.c, s.v, s.j) ?? "").join("");

  /** 첫소리 하나. 모음 사이 [l] 은 'ㄹㄹ' (Ella 엘라, Claire 클레어) — 비음 뒤에서는 아니다 */
  function onset(p: string, vowel: string) {
    const prev = last();
    if (p === "L" && prev && !prev.j) prev.j = "ㄹ";
    if (p === "NG") {
      if (prev && !prev.j) prev.j = "ㅇ";
      push("ㅇ", vowel);
      return;
    }
    push(ONSET[p], vowel);
  }
}
