/* ============================================================
   한국어 이름 — 이름 데이터 만들기.

     npm run names

   1. 영어 이름 목록과 CMU 발음 사전을 받아 발음이 있는 이름만 남긴다.
   2. 발음을 외래어 표기법(영어)으로 한글로 옮긴다 (apps/hangul-name/arpabet.ts).
   3. overrides.json(국립국어원 용례로 확인한 표기)으로 덮는다.
   4. apps/hangul-name/names.json 에 쓴다 — 생성물이라 손으로 고치지 않는다.

   받은 원본은 tools/hangul-name/.cache/ 에 두고 커밋하지 않는다.
   CI 는 이 스크립트를 돌리지 않는다 — 커밋한 names.json 만 쓴다.

   출처
   - CMU 발음 사전 (BSD 2-Clause, © 1993–2015 Carnegie Mellon University)
     https://github.com/cmusphinx/cmudict
   - 이름 목록: 미국 사회보장국(SSA) 출생 이름 통계. 미국 정부 저작물이라 공공 영역이다.
     https://www.ssa.gov/oact/babynames/
     ssa.gov 를 바로 받을 수 없는 곳이 있어, 같은 SSA 자료(1880~2008, 해마다 상위 1,000개)를
     정리해 둔 hadley/data-baby-names 를 받는다.
   ============================================================ */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { arpabetToHangul } from "../../apps/hangul-name/arpabet";

/** 많아야 이만큼. 지금 원본으로는 발음 있는 이름이 4,300개쯤이라 전부 들어간다 */
const COUNT = 5000;
/** 지금 학습자 나이대(이 해부터)의 인기를 크게, 그 전 인기는 1/4 만 친다 */
const RECENT = 1950;

const here = fileURLToPath(new URL(".", import.meta.url));
const root = fileURLToPath(new URL("../../", import.meta.url));
const cache = here + ".cache/";
const SOURCES = {
  "cmudict.dict": "https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict",
  "cmudict-LICENSE": "https://raw.githubusercontent.com/cmusphinx/cmudict/master/LICENSE",
  "ssa-names.csv": "https://raw.githubusercontent.com/hadley/data-baby-names/master/baby-names.csv",
};

async function source(name: keyof typeof SOURCES): Promise<string> {
  const file = cache + name;
  if (!existsSync(file)) {
    mkdirSync(cache, { recursive: true });
    console.log("받는 중:", SOURCES[name]);
    const res = await fetch(SOURCES[name]);
    if (!res.ok) throw new Error(`${SOURCES[name]} → ${res.status}`);
    writeFileSync(file, await res.text());
  }
  return readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

/** 열쇠 — 소문자, 아포스트로피 없이. 앱의 keyOf 와 같아야 한다 */
const keyOf = (s: string) => s.toLowerCase().replace(/'/g, "");

// 1. 이름 순위
const score = new Map<string, number>();
for (const line of (await source("ssa-names.csv")).split("\n").slice(1)) {
  const [year, name, percent] = line.split(",").map((x) => x.replace(/"/g, ""));
  if (!name) continue;
  const k = keyOf(name);
  score.set(k, (score.get(k) ?? 0) + Number(percent) * (Number(year) >= RECENT ? 1 : 0.25));
}
const ranked = [...score.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

// 2. 발음 — 한 단어에 발음이 여럿이면 순서대로 (jasmine, jasmine(2))
const prons = new Map<string, string[][]>();
for (const line of (await source("cmudict.dict")).split("\n")) {
  const [head, ...phones] = line.split("#")[0].trim().split(/\s+/);
  if (!head || !phones.length) continue;
  const word = head.replace(/\(\d+\)$/, "");
  if (!/^[a-z']+$/.test(word)) continue;
  const k = keyOf(word);
  prons.set(k, [...(prons.get(k) ?? []), phones]);
}

// 3. 덮어쓰기
const overrides: Record<string, string[]> = JSON.parse(readFileSync(here + "overrides.json", "utf8")).names;

type Entry = [hangul: string, status: "s" | "r", ...others: string[]];
const out: Record<string, Entry> = {};
let n = 0;
for (const k of ranked) {
  if (n >= COUNT) break;
  const p = prons.get(k);
  if (!p) continue;
  n++;
  if (overrides[k]) continue;
  // 발음이 둘이면 둘째 표기를 후보로 (규칙 표기끼리)
  const spellings = [...new Set(p.slice(0, 2).map((ph) => arpabetToHangul(ph, k)))].filter(Boolean);
  out[k] = [spellings[0], "r", ...spellings.slice(1)];
}
for (const [k, [first, ...rest]] of Object.entries(overrides)) out[k] = [first, "s", ...rest];

// 4. 쓰기 — 한 줄에 하나 (diff 를 읽을 수 있게)
const keys = Object.keys(out).sort();
const body = keys.map((k) => `${JSON.stringify(k)}:${JSON.stringify(out[k])}`).join(",\n");
writeFileSync(root + "apps/hangul-name/names.json", `{\n${body}\n}\n`);

const license = await source("cmudict-LICENSE");
writeFileSync(
  root + "apps/hangul-name/LICENSE-cmudict.txt",
  "names.json 의 발음 데이터는 CMU 발음 사전(The CMU Pronouncing Dictionary)에서 왔습니다.\n" +
    "names.json's pronunciations come from the CMU Pronouncing Dictionary.\n" +
    "https://github.com/cmusphinx/cmudict\n\n" +
    license.trimEnd() +
    "\n",
);

const std = keys.filter((k) => out[k][1] === "s").length;
console.log(`names.json: ${keys.length}개 (표준 ${std} · 규칙 ${keys.length - std})`);
