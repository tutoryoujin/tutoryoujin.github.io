"""홈 공유 그림 -> public/og.png (1200x630).  (#18)

Usage:
    python3 -m venv .venv
    .venv/bin/pip install playwright==1.49.1
    .venv/bin/playwright install chromium
    .venv/bin/python tools/home/build_og.py

사이트를 그리는 것과 같은 재료로 그린다 — 값을 여기 옮겨 적지 않는다.
  색 · 그림자    shared/tokens/tokens.css  (라이트)
  이응이         shared/ui/ieung-data.ts   (IEUNG_DEFS · MOOD_SVG)
  앱 이름        shared/apps.ts            (slug · ko · en · emoji)
  글꼴           Google Fonts Jua · Nunito (사이트와 같은 주소)
그래서 토큰이나 앱 목록이 바뀌면 이걸 다시 돌리기만 하면 된다. PNG 는 저장소에 올린다.
"""
import html, json, os, re
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "public", "og.png")
W, H = 1200, 630


def read(*p):
    with open(os.path.join(ROOT, *p), encoding="utf-8") as f:
        return f.read()


def ts_string(src, pattern):
    """TS 파일 안의 JSON 문자열 리터럴 하나를 꺼낸다."""
    m = re.search(pattern, src, re.M)
    if not m:
        raise SystemExit(f"못 찾았어요: {pattern}")
    return json.loads(m.group(1))


ieung = read("shared", "ui", "ieung-data.ts")
DEFS = ts_string(ieung, r'^export const IEUNG_DEFS = (".*");$')
YAY = ts_string(ieung, r'^\s*yay: (".*"),?$')

def field(block, name):
    m = re.search(rf'^\s*{name}: "([^"]+)",', block, re.M)
    return m.group(1) if m else None


# 앱 하나 = "slug:" 로 시작하는 덩어리. 필드 순서와 상관없이 읽는다
APPS = [
    (field(b, "slug"), field(b, "ko"), field(b, "en"), field(b, "emoji"))
    for b in re.split(r'(?=^\s*slug: ")', read("shared", "apps.ts"), flags=re.M)[1:]
]
if not APPS or not all(all(a) for a in APPS):
    raise SystemExit("shared/apps.ts 에서 앱을 못 읽었어요")

# 3열로 여섯까지. 더 많으면 다섯 + 「+N」 칸
MAX = 6
shown = APPS if len(APPS) <= MAX else APPS[: MAX - 1]
more = len(APPS) - len(shown)

tokens = "file://" + os.path.join(ROOT, "shared", "tokens", "tokens.css")
ieung_css = "file://" + os.path.join(ROOT, "shared", "ui", "ieung.css")

chips = "\n".join(
    f"""<li><span class="tile">{e}</span><span><b>{html.escape(ko)}</b><small>{html.escape(en)}</small></span></li>"""
    for _, ko, en, e in shown
) + (f"""<li class="more"><b>+{more}</b><small>more apps</small></li>""" if more else "")

PAGE = f"""<!doctype html>
<html lang="ko" data-theme="light"><head><meta charset="utf-8">
<link rel="stylesheet" href="{tokens}">
<link rel="stylesheet" href="{ieung_css}">
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Nunito:wght@600;800&display=block" rel="stylesheet">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; animation: none !important; }}
  html, body {{ width: {W}px; height: {H}px; overflow: hidden; }}
  body {{
    font-family: "Nunito", "Jua", sans-serif; color: var(--ink); font-synthesis: none;
    /* 모서리에만 파스텔이 번진다 — 한국어 카드 공유 그림과 같은 바탕 */
    background:
      radial-gradient(300px 300px at 84% -10%, color-mix(in srgb, var(--yellow-bg) 70%, transparent), transparent 70%),
      radial-gradient(320px 320px at 108% 96%, color-mix(in srgb, var(--pink-bg) 80%, transparent), transparent 70%),
      radial-gradient(300px 300px at -8% 108%, color-mix(in srgb, var(--mint-bg) 70%, transparent), transparent 70%),
      radial-gradient(300px 300px at -8% -12%, color-mix(in srgb, var(--lavender-bg) 75%, transparent), transparent 70%),
      var(--bg);
    display: grid; grid-template-columns: 1fr 420px; align-items: center; padding: 0 56px 0 76px; gap: 24px;
  }}
  h1 {{ font-weight: 400; line-height: 1; }}
  h1 .ko {{ font-family: "Jua"; font-size: 116px; }}
  h1 em {{ font-style: normal; font-weight: 800; font-size: 54px; margin-left: 8px; }}
  /* 이름 속 You — shared/ui/Page.tsx 의 WithYoujin 과 같은 모양 (#83) */
  h1 u {{ text-decoration: none; color: var(--primary); }}
  .en {{ margin-top: 18px; font-size: 34px; font-weight: 800; }}
  .ko-sub {{ margin-top: 8px; font-family: "Jua"; font-size: 28px; color: var(--muted); }}
  ul {{ list-style: none; margin-top: 30px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }}
  li {{ display: flex; align-items: center; gap: 10px; background: var(--surface); border-radius: 20px; padding: 10px 12px; box-shadow: var(--shadow-card); }}
  .tile {{ display: grid; place-items: center; width: 44px; height: 44px; flex: none; border-radius: 12px; background: var(--sky); font-size: 26px; }}
  li b {{ display: block; font-family: "Jua"; font-weight: 400; font-size: 22px; line-height: 1.1; white-space: nowrap; }}
  li small {{ display: block; font-size: 13px; font-weight: 800; line-height: 1.2; color: var(--muted); }}
  li.more {{ flex-direction: column; justify-content: center; }}
  .stage {{ position: relative; height: 520px; }}
  /* 이응이가 서는 sky 바닥 */
  .floor {{ position: absolute; left: 30px; right: 10px; bottom: 30px; height: 380px; border-radius: 50%; background: var(--sky); }}
  .ieung {{ position: absolute; left: 50px; bottom: 44px; width: 340px; height: 354px; }}
  .bubble {{ position: absolute; left: 6px; top: 0; background: var(--surface); border-radius: 22px; padding: 14px 22px; box-shadow: var(--shadow-card); text-align: center; }}
  .bubble::after {{ content: ""; position: absolute; left: 120px; bottom: -14px; border: 14px solid transparent; border-bottom: 0; border-top-color: var(--surface); }}
  .bubble b {{ display: block; font-family: "Jua"; font-weight: 400; font-size: 34px; }}
  .bubble small {{ display: block; font-size: 17px; font-weight: 800; color: var(--muted); }}
</style></head>
<body>
  {DEFS}
  <main>
    <h1><span class="ko">한국어</span><em>with <u>You</u>jin</em></h1>
    <p class="en">Small apps for learning Korean</p>
    <p class="ko-sub">한국어를 배우는 사람을 위한 작은 앱 모음</p>
    <ul>{chips}</ul>
  </main>
  <div class="stage">
    <div class="floor"></div>
    <svg class="ieung mv ex-yay" viewBox="0 0 240 250" aria-hidden="true">{YAY}</svg>
    <div class="bubble"><b>매일 조금씩!</b><small>A little every day</small></div>
  </div>
</body></html>"""


def main():
    cache = os.path.join(HERE, ".cache")
    os.makedirs(cache, exist_ok=True)
    page_path = os.path.join(cache, "og.html")
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(PAGE)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": W, "height": H}, color_scheme="light")
        pg.goto("file://" + page_path, wait_until="networkidle")
        pg.evaluate("document.fonts.ready")
        # 글자가 넘치면 알린다 — 작은 미리보기에서 잘리면 안 된다
        over = pg.evaluate("[...document.querySelectorAll('main *')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim().slice(0, 30))")
        if over:
            print("  warn: 넘친 글자", over)
        pg.screenshot(path=OUT)
        b.close()
    print("wrote", os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()
