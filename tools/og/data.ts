/* 공유 그림 도구(build_og.py)가 읽는 데이터 — 앱 · 글 목록을 JSON 으로 내보낸다.
   python 에서 TS 를 정규식으로 긁지 않으려고 둔다. 실행: npx vite-node tools/og/data.ts */
import { APPS } from "../../shared/apps";
import { NOTES, NOTES_TITLE } from "../../shared/notes";
import { IEUNG_DEFS, MOOD_SVG } from "../../shared/ui/ieung-data";

const out = {
  apps: APPS.map(({ slug, ko, en, tone, about, og }) => ({ slug, ko, en, tone, about, og: og ?? null })),
  notes: NOTES.map(({ slug, title, summary }) => ({ slug, title, summary })),
  notesTitle: NOTES_TITLE,
  ieung: { defs: IEUNG_DEFS, moods: MOOD_SVG },
};
process.stdout.write(JSON.stringify(out));
