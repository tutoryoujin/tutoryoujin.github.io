import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { arpabetToHangul } from "./arpabet";
import { clean, convert, type Names } from "./convert";
import { breakdown, buildSteps, introduce, STAMP, STATUS_NOTE } from "./model";
import { cleanHangul, fixLink, readLink, withFix } from "./fixes";

const here = new URL(".", import.meta.url);
const raw = readFileSync(new URL("names.json", here));
const names: Names = JSON.parse(raw.toString("utf8"));
const words = (s: string) => {
  const c = clean(s);
  if (!c.ok) throw new Error(s);
  return c.words;
};

describe("이름 데이터 (완료 조건)", () => {
  it("Sophie → 소피, Michael → 마이클 (표준)", () => {
    expect(convert(["Sophie"], names)).toEqual([{ text: "소피", status: "standard" }]);
    expect(convert(["Michael"], names)).toEqual([{ text: "마이클", status: "standard" }]);
  });

  it("Jasmine → 재스민, 후보 자스민 (흔한 표기)", () => {
    expect(convert(["Jasmine"], names)).toEqual([
      { text: "재스민", status: "standard" },
      { text: "자스민", status: "common" },
    ]);
  });

  it("사전에 없는 이름은 추측 도장", () => {
    expect(names.brakmorvin).toBeUndefined();
    const [o] = convert(["Brakmorvin"], names);
    expect(o.status).toBe("guessed");
    expect(o.text).toMatch(/^[가-힣]+$/);
  });

  it("여러 낱말이면 띄어 쓰고, 도장은 가장 약한 쪽", () => {
    expect(convert(words("Mary-Jane"), names)).toEqual([{ text: "메리 제인", status: "standard" }]);
    expect(convert(words("Sophie Brakmorvin"), names)[0].status).toBe("guessed");
  });

  it("표기는 한글 글자만, 상태는 s · r", () => {
    for (const [k, [first, kind, ...rest]] of Object.entries(names)) {
      expect(k).toMatch(/^[a-z]+$/);
      expect(["s", "r"]).toContain(kind);
      for (const t of [first, ...rest]) expect(t, k).toMatch(/^[가-힣]+$/);
    }
  });

  it("gzip 100KB 이하", () => {
    // 빌드하면 vite 가 JSON 을 JS 로 바꾸며 한글을 \uXXXX 로 적는다 — 그 모양으로 잰다
    const chunk = raw.toString("utf8").replace(/[^\x00-\x7f]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
    expect(gzipSync(chunk).length).toBeLessThanOrEqual(100 * 1024);
  });

  it("첫 화면 번들에 없다 — convert.ts 의 동적 import 로만 받는다", () => {
    for (const f of readdirSync(here).filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts"))) {
      const src = readFileSync(new URL(f, here), "utf8").replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
      const refs = src.match(/.*names\.json.*/g) ?? [];
      if (f === "convert.ts") expect(refs.every((l) => /import\(\s*["']\.\/names\.json["']\s*\)/.test(l)), refs.join("\n")).toBe(true);
      else expect(refs, f).toEqual([]);
    }
  });
});

describe("추측 안내", () => {
  it("유진에게 확인하라고 안내한다", () => {
    expect(STATUS_NOTE.guessed.en).toBe("Spelling guessed — double-check with Youjin.");
  });
});

describe("영수증 고치기 (Anne → 안)", () => {
  it("한글 글자와 띄어쓰기만 받는다", () => {
    expect(cleanHangul("  안 ")).toEqual({ ok: true, text: "안" });
    expect(cleanHangul("메리  제인")).toEqual({ ok: true, text: "메리 제인" });
    expect(cleanHangul("ㅇㅏㄴ")).toEqual({ ok: false }); // 낱자모는 글자가 아니다
    expect(cleanHangul("Anne")).toEqual({ ok: false });
    expect(cleanHangul("")).toEqual({ ok: false });
    expect(cleanHangul("가".repeat(21))).toEqual({ ok: false });
  });
  it("고친 표기가 맨 앞, 원래 후보는 뒤에 남는다", () => {
    const opts = withFix(convert(["Anne"], names), "안");
    expect(opts).toEqual([
      { text: "안", status: "edited" },
      { text: "앤", status: "standard" },
    ]);
    expect(STAMP[opts[0].status]).toEqual({ ko: "직접 고침", en: "Edited" });
    expect(introduce("안").ending).toBe("이에요");
  });
  it("고친 표기가 원래 후보와 같으면 하나만", () => {
    expect(withFix(convert(["Jasmine"], names), "자스민").map((o) => o.text)).toEqual(["자스민", "재스민"]);
  });
  it("링크로 주고받는다", () => {
    const url = fixLink("https://tutoryoujin.github.io/hangul-name/", "Anne", "안");
    expect(readLink(new URL(url).search)).toEqual({ input: "Anne", text: "안" });
    expect(readLink("?name=Anne")).toBeNull();
    expect(readLink("?name=Anne&ko=<script>")).toBeNull();
    expect(readLink("?name=%EC%95%88&ko=%EC%95%88")).toBeNull(); // 이름은 영문자만
  });
});

describe("입력 다듬기", () => {
  it("영문자 · 공백 · 하이픈 · 아포스트로피만", () => {
    expect(clean("  sophie  ")).toMatchObject({ ok: true, words: ["sophie"], display: "sophie" });
    expect(clean("O’Brien")).toMatchObject({ ok: true, words: ["O'Brien"] });
    expect(clean("José")).toMatchObject({ ok: true, words: ["Jose"] }); // 악센트는 뗀다
    expect(clean("소피")).toEqual({ ok: false, reason: "letters" });
    expect(clean("Sophie1")).toEqual({ ok: false, reason: "letters" });
    expect(clean("   ")).toEqual({ ok: false, reason: "empty" });
    expect(clean("a".repeat(31))).toEqual({ ok: false, reason: "long" });
  });
});

describe("자기소개 — 예요 / 이에요 (완료 조건)", () => {
  it("받침이 있으면 이에요, 이유 한 줄", () => {
    const r = introduce("마이클");
    expect(r.sentence).toBe("안녕하세요! 저는 마이클이에요.");
    expect(r.reason.en).toBe("마이클 ends in a final consonant (ㄹ), so it takes 이에요.");
  });
  it("받침이 없으면 예요", () => {
    const r = introduce("소피");
    expect(r.sentence).toBe("안녕하세요! 저는 소피예요.");
    expect(r.reason.en).toBe("소피 ends in a vowel, so it takes 예요.");
  });
  it("띄어 쓴 이름은 마지막 글자로", () => {
    expect(introduce("메리 제인").ending).toBe("이에요");
  });
});

describe("영수증 내역", () => {
  it("글자 · 자모 · 받침 개수", () => {
    expect(breakdown("마이클")).toMatchObject({ letters: 7, finals: 1 });
    expect(breakdown("마이클").blocks.map((b) => b.sound)).toEqual(["ma", "i", "keul"]);
  });
  it("받침 소리 — ㅅ 받침은 ㄷ 소리(t)", () => {
    const j = breakdown("스콧").blocks[1].jamo[2];
    expect(j).toEqual({ kind: "jong", jamo: "ㅅ", sound: "t", like: "ㄷ" });
  });
  it("조립 순서 ㅅ → 소 → 손", () => {
    expect(buildSteps("손")).toEqual([["ㅅ", "소", "손"]]);
  });
});

describe("발음 → 한글 (외래어 표기법)", () => {
  const t = (phones: string, spelling: string) => arpabetToHangul(phones.split(" "), spelling);
  it.each([
    ["S OW1 F IY0", "sophie", "소피"],
    ["K L EH1 R", "claire", "클레어"], // 모음 뒤 r → 어, 자음 뒤 l → ㄹㄹ
    ["S K AA1 T", "scott", "스콧"], // 짧은 모음 뒤 어말 t → 받침 ㅅ, o 로 적힌 [ɑ] → 오
    ["D AE1 N Y AH0 L", "daniel", "대니얼"], // [n] + [jə] → 니어
    ["JH EY1 M Z", "james", "제임스"], // 끝의 -s
    ["EH1 L AH0", "ella", "엘라"], // 모음 사이 l
    ["F IH1 L M", "film", "필름"],
    ["K W IH1 N", "quinn", "퀸"], // [kw] 한 음절
    ["B AA1 R B ER0 AH0", "barbara", "바버라"], // [ɚ] + 모음 → r 이 다음 첫소리로
    ["M AA1 R G ER0 IH0 T", "margaret", "마거릿"],
    ["Z AE1 K ER0 IY0", "zachary", "재커리"],
    ["EY1 V ER0 IY0", "avery", "에이버리"],
    ["T AY1 L ER0", "tyler", "타일러"], // 뒤에 모음이 없으면 '어' 만
    ["M AY1 K AH0 L", "michael", "마이컬"], // 규칙대로면 이렇다 — 그래서 덮어쓰기 표가 있다
  ])("%s (%s) → %s", (phones, spelling, want) => {
    expect(t(phones, spelling)).toBe(want);
  });
});
