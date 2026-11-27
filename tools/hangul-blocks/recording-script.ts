/* ============================================================
   한국어 블록 녹음 대본 만들기 (#39).

     npm run audio:hangul:script

   apps/hangul-blocks/recording.ts 의 목록으로 tools/hangul-blocks/recording-script.md 를 쓴다.
   생성물이라 손으로 고치지 않는다 — 안내 문구도 여기서 고친다.
   ============================================================ */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIRST_FILES, recordingFiles } from "../../apps/hangul-blocks/recording";

const OUT = fileURLToPath(new URL("./recording-script.md", import.meta.url));
const files = recordingFiles();
const total = files.reduce((n, f) => n + f.takes.length, 0);
const titleOf = (name: string) => files.find((f) => f.name === name)!.title;

const md: string[] = [
  "# 한국어 블록 녹음 대본",
  "",
  "> 생성물 — `npm run audio:hangul:script` 가 `apps/hangul-blocks/recording.ts` 로 만든다. 손으로 고치지 않는다.",
  "",
  `파일 ${files.length}개 · 글자 ${total}개. 파일 하나가 1분 남짓이에요.`,
  "",
  "## 녹음하는 법",
  "",
  "**폰은 녹음기, 대본은 다른 화면(노트북 · 태블릿)에 띄워요.**",
  "",
  "1. 녹음 앱 음질을 **가장 높게** 해요. mp3 · m4a · wav 모두 괜찮아요. 잡음 줄이기 같은 효과가 있으면 꺼요.",
  "2. 폰은 입에서 **15–25cm**, 정면보다 살짝 옆에 둬요 (ㅍ · ㅌ 바람 소리를 막아요). 녹음 중에는 폰을 만지지 않아요.",
  "3. 녹음을 켜고 **2초 쉬고** 시작해요.",
  "4. **한 글자 읽고 2초 쉬기.** 이어 읽지 않아요. 높이 · 빠르기 · 크기를 처음부터 끝까지 같게, 끝은 살짝 내려 단정하게.",
  "5. **틀리면 그 파일을 처음부터 다시.** 중간에 한 글자만 다시 읽으면 개수가 어긋나요 (스크립트가 잡아 줘요).",
  "6. 파일 이름은 각 제목의 이름 그대로 — `n.mp3`, `c01.mp3` … 원본은 저장소 밖 `../yj-recordings/hangul/` 에 두고 드라이브에 백업해요.",
  "",
  "**발음 규칙**",
  "",
  "- **표준 발음으로 읽어요.** `→ [ ]` 가 붙은 글자는 `[ ]` 안의 소리로.",
  "- 자음 + ㅢ (긔 · 늬 · 희 …) 는 **[ㅣ]** — 늬 [니] · 희 [히] (표준 발음법 제5항). ㅇ 줄의 「의」만 [의].",
  "- 받침 단어는 혼자 읽는 소리로 — 값 [갑] · 닭 [닥] · 낮 [낟].",
  "- 가 · 까 · 카 처럼 예사소리 · 된소리 · 거센소리 차이를 또렷하게 (듣기 구별 연습 #128 에 쓰여요).",
  "",
  "## 순서",
  "",
  "**먼저 이것만** (10분 남짓 — 자모표 · 획 하나 더 소리가 다 바뀌어요). 처음엔 `c01` 하나만 녹음해서 잘 잘리는지 확인하고 시작해요.",
  "",
  ...FIRST_FILES.map((n) => `- [ ] \`${n}\` · ${titleOf(n)}`),
  "",
  "**그다음** — 된소리 줄 `c02` ㄲ · `c05` ㄸ · `c09` ㅃ · `c11` ㅆ · `c14` ㅉ (가 · 카 · 까 듣기 #128), 나머지 줄, 받침 단어 `w1`~.",
  "",
];

for (const f of files) {
  md.push(`## \`${f.name}\` · ${f.title} (${f.takes.length}개)`, "");
  f.takes.forEach((t, i) => md.push(`${i + 1}. ${t.text}${t.say ? ` → [${t.say}]` : ""}`));
  md.push("");
}

writeFileSync(OUT, md.join("\n"));
console.log(`recording-script.md — 파일 ${files.length}개 · 글자 ${total}개`);
