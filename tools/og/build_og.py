"""앱 · 블로그 글 공유 그림 -> public/og/<slug>.png · public/og/notes/<slug>.png (1200x630).  (#95)

홈(tools/home/build_og.py) · 한국어 이름(tools/hangul-name/build_og.py) · 카드(tools/korean-cards/build_og.py)는
각자 도구가 있다. 이 도구는 그 밖의 앱과 블로그 글을 같은 틀로 찍는다.

Usage (홈 공유 그림과 같은 .venv — tools/home/build_og.py 참고):
    .venv/bin/python tools/og/build_og.py                 # 대상 전부
    .venv/bin/python tools/og/build_og.py korean-clock    # 앱 하나
    .venv/bin/python tools/og/build_og.py notes/korean-zodiac-tti

대상: shared/apps.ts 에서 og 가 /og/<slug>.png 인 앱 + 블로그 글 전부.
새 글을 쓰면 한 번 돌린다 (그림이 없으면 테스트가 알려 준다). PNG 는 저장소에 올린다.

재료는 사이트와 같은 것 — 값을 여기 옮겨 적지 않는다.
  앱 · 글 · 이응이  tools/og/data.ts (shared/apps.ts · shared/notes · shared/ui/ieung-data.ts 를 JSON 으로)
  앱 화면           public/home/<slug>.webp (tools/home/build_shots.py — 첫 화면 썸네일과 같은 그림)
  색 · 그림자       shared/tokens/tokens.css (라이트)
  글꼴              Google Fonts Jua · Nunito
"""
import argparse, base64, html, json, os, subprocess
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
W, H = 1200, 630
esc = html.escape

DATA = json.loads(subprocess.run(["npx", "vite-node", "tools/og/data.ts"], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
TOKENS = "file://" + os.path.join(ROOT, "shared", "tokens", "tokens.css")
IEUNG_CSS = "file://" + os.path.join(ROOT, "shared", "ui", "ieung.css")

HEAD = f"""<!doctype html>
<html data-theme="light"><head><meta charset="utf-8">
<link rel="stylesheet" href="{TOKENS}">
<link rel="stylesheet" href="{IEUNG_CSS}">
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Nunito:wght@600;800&display=block" rel="stylesheet">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; animation: none !important; }}
  html, body {{ width: {W}px; height: {H}px; overflow: hidden; }}
  body {{ font-family: "Nunito", "Jua", sans-serif; color: var(--ink); font-synthesis: none; }}
  .ko {{ font-family: "Jua"; font-weight: 400; }}
  .brand {{ font-size: 26px; font-weight: 800; }}
  .brand u {{ text-decoration: none; color: var(--primary); }}  /* 워드마크 You (#83) */
</style>"""


def bg(tone):
    """모서리에만 파스텔이 번지는 바탕 — 다른 공유 그림과 같은 틀. 오른쪽 위는 앱 고유색"""
    return f"""background:
      radial-gradient(340px 340px at 96% -8%, color-mix(in srgb, var(--{tone}-bg) 90%, transparent), transparent 70%),
      radial-gradient(300px 300px at 104% 104%, color-mix(in srgb, var(--yellow-bg) 70%, transparent), transparent 70%),
      radial-gradient(300px 300px at -8% 108%, color-mix(in srgb, var(--mint-bg) 70%, transparent), transparent 70%),
      radial-gradient(300px 300px at -8% -12%, color-mix(in srgb, var(--lavender-bg) 75%, transparent), transparent 70%),
      var(--bg);"""


def app_page(a):
    shot = os.path.join(ROOT, "public", "home", f"{a['slug']}.webp")
    if not os.path.exists(shot):
        raise SystemExit(f"앱 화면이 없어요: {os.path.relpath(shot, ROOT)} — tools/home/build_shots.py {a['slug']} 를 먼저")
    with open(shot, "rb") as f:
        src = "data:image/webp;base64," + base64.b64encode(f.read()).decode()
    t = a["tone"]
    return f"""{HEAD}<style>
  body {{ {bg(t)} display: grid; grid-template-columns: 1fr 440px; align-items: center; padding: 0 64px 0 80px; gap: 32px; }}
  h1 {{ font-size: 112px; line-height: 1.05; white-space: nowrap; }}
  .en {{ margin-top: 12px; font-size: 36px; font-weight: 800; color: var(--primary); white-space: nowrap; }}
  .about {{ margin-top: 30px; font-size: 32px; }}
  .about-en {{ margin-top: 6px; font-size: 23px; font-weight: 800; color: var(--muted); }}
  .stage {{ position: relative; height: {H}px; overflow: hidden; }}
  /* 앱 화면 — 폰 화면처럼 위가 보이게 비스듬히, 아래는 바탕으로 사라진다 */
  .stage img {{
    position: absolute; left: 34px; top: 48px; width: 372px; border-radius: 28px; border: 6px solid var(--surface); transform: rotate(-3deg);
    box-shadow: var(--shadow-card), 0 18px 40px rgb(0 0 0 / 0.12);
    -webkit-mask-image: linear-gradient(to bottom, #000 66%, transparent 96%);
    mask-image: linear-gradient(to bottom, #000 66%, transparent 96%);
  }}
</style></head>
<body>
  <main>
    <h1 class="ko">{esc(a['ko'])}</h1>
    <p class="en">{esc(a['en'])} with Youjin</p>
    <p class="about ko">{esc(a['about']['ko'])}</p>
    <p class="about-en">{esc(a['about']['en'])}</p>
  </main>
  <div class="stage"><img src="{src}" alt=""></div>
</body></html>"""


# 글 그림의 이응이 — 디자인 시스템 표정 그대로. 글마다 고르지 않고 하나로 (설정을 지어내지 않는다)
NOTE_MOOD = "wow"


def note_page(n):
    nt = DATA["notesTitle"]
    mood = DATA["ieung"]["moods"][NOTE_MOOD]
    # 블로그는 영어가 크고 한국어가 아래 (#94)
    return f"""{HEAD}<style>
  body {{ {bg("blue")} display: grid; grid-template-columns: 1fr 360px; align-items: center; padding: 0 48px 0 80px; gap: 24px; }}
  .tag {{ display: inline-flex; gap: 10px; align-items: baseline; background: var(--surface); border-radius: 999px; padding: 10px 22px; box-shadow: var(--shadow-card); font-size: 24px; font-weight: 800; }}
  .tag span {{ font-size: 20px; color: var(--muted); }}
  h1 {{ margin-top: 30px; font-size: 64px; line-height: 1.12; font-weight: 800; text-wrap: balance; }}
  .ko-title {{ margin-top: 14px; font-size: 40px; color: var(--muted); line-height: 1.2; }}
  .brand {{ margin-top: 40px; }}
  .stage {{ position: relative; height: 420px; }}
  .floor {{ position: absolute; inset: 40px 0 10px; border-radius: 50%; background: var(--sky); }}
  .ieung {{ position: absolute; left: 20px; bottom: 20px; width: 320px; height: 333px; }}
</style></head>
<body>
  {DATA["ieung"]["defs"]}
  <main>
    <p class="tag">{esc(nt['en'])} <span class="ko">{esc(nt['ko'])}</span></p>
    <h1>{esc(n['title']['en'])}</h1>
    <p class="ko-title ko">{esc(n['title']['ko'])}</p>
    <p class="brand">Korean with <u>You</u>jin</p>
  </main>
  <div class="stage"><div class="floor"></div><svg class="ieung mv ex-{NOTE_MOOD}" viewBox="0 0 240 250" aria-hidden="true">{mood}</svg></div>
</body></html>"""


def targets(want):
    apps = {a["slug"]: a for a in DATA["apps"] if a["og"] and a["og"]["image"] == f"/og/{a['slug']}.png"}
    notes = {f"notes/{n['slug']}": n for n in DATA["notes"]}
    keys = want or [*apps, *notes]
    out = []
    for k in keys:
        if k in apps:
            out.append((k, app_page(apps[k])))
        elif k in notes:
            out.append((k, note_page(notes[k])))
        else:
            raise SystemExit(f"대상이 아니에요: {k} — shared/apps.ts 의 og 를 /og/{k}.png 로 적었는지 보세요")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("only", nargs="*", help="앱 slug 또는 notes/<글 slug> (비우면 전부)")
    jobs = targets(ap.parse_args().only)
    cache = os.path.join(HERE, ".cache")
    os.makedirs(cache, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": W, "height": H}, color_scheme="light")
        for key, page in jobs:
            path = os.path.join(cache, key.replace("/", "_") + ".html")
            with open(path, "w", encoding="utf-8") as f:
                f.write(page)
            pg.goto("file://" + path, wait_until="networkidle")
            pg.evaluate("document.fonts.ready")
            # 글자가 넘치면 멈춘다 — 작은 미리보기에서 잘리면 안 된다
            over = pg.evaluate("[...document.querySelectorAll('main *')].filter(e => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().bottom > innerHeight).map(e => e.textContent.trim().slice(0, 30))")
            if over:
                raise SystemExit(f"{key}: 글자가 넘쳤어요 {over}")
            out = os.path.join(ROOT, "public", "og", key + ".png")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            pg.screenshot(path=out)
            print("wrote", os.path.relpath(out, ROOT))
        b.close()


if __name__ == "__main__":
    main()
