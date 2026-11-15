"""한국어 이름 공유 그림 -> public/hangul-name/og.png (1200x630).  (#90)

Usage (홈 공유 그림과 같은 .venv — tools/home/build_og.py 참고):
    npm run build && npx vite preview          # 다른 창에서
    .venv/bin/python tools/hangul-name/build_og.py [--url http://localhost:4173] [--name Sophie --ko 소피]

영수증은 그리지 않고 **앱에서 찍는다** — 영수증 모양이 바뀌면 다시 돌리기만 하면 된다.
링크 미리보기는 사람마다 다른 그림을 못 보여 줘서(크롤러는 자바스크립트를 안 돌린다) 견본 하나를 쓴다.
사람마다 다른 그림은 서버를 띄운 뒤 #91.

나머지 재료도 사이트와 같은 것:
  색       shared/tokens/tokens.css (라이트)
  글자     shared/apps.ts 의 hangul-name (ko · en · about)
  글꼴     Google Fonts Jua · Nunito
"""
import argparse, base64, html, os, re
from urllib.parse import quote
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "public", "hangul-name", "og.png")
W, H = 1200, 630


def read(*p):
    with open(os.path.join(ROOT, *p), encoding="utf-8") as f:
        return f.read()


def app_field(block, pattern):
    m = re.search(pattern, block, re.M)
    if not m:
        raise SystemExit(f"shared/apps.ts 에서 못 찾았어요: {pattern}")
    return m.group(1)


apps = read("shared", "apps.ts")
block = apps[apps.index('slug: "hangul-name"'):]
block = block[: block.index("learn:")]
KO = app_field(block, r'^\s*ko: "([^"]+)",')
EN = app_field(block, r'^\s*en: "([^"]+)",')
ABOUT_KO = app_field(block, r'about: \{ ko: "([^"]+)"')
ABOUT_EN = app_field(block, r'about: \{ ko: "[^"]+", en: "([^"]+)"')


def receipt_png(url, name, ko):
    """앱에서 견본 영수증을 찍는다 — 움직임 없이 다 나온 상태로"""
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 430, "height": 1600}, device_scale_factor=2, color_scheme="light", reduced_motion="reduce")
        pg.goto(f"{url}/hangul-name/?name={quote(name)}&ko={quote(ko)}", wait_until="networkidle")
        el = pg.locator('article[aria-label^="한글 이름 영수증"]')
        el.wait_for()
        pg.evaluate("document.fonts.ready")
        pg.wait_for_timeout(300)
        png = el.screenshot()
        b.close()
    return png


def page(receipt, name, ko):
    tokens = "file://" + os.path.join(ROOT, "shared", "tokens", "tokens.css")
    src = "data:image/png;base64," + base64.b64encode(receipt).decode()
    return f"""<!doctype html>
<html lang="ko" data-theme="light"><head><meta charset="utf-8">
<link rel="stylesheet" href="{tokens}">
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Nunito:wght@600;800&display=block" rel="stylesheet">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: {W}px; height: {H}px; overflow: hidden; }}
  body {{
    font-family: "Nunito", "Jua", sans-serif; color: var(--ink); font-synthesis: none;
    background:
      radial-gradient(320px 320px at 96% -8%, color-mix(in srgb, var(--pink-bg) 85%, transparent), transparent 70%),
      radial-gradient(300px 300px at 104% 104%, color-mix(in srgb, var(--yellow-bg) 70%, transparent), transparent 70%),
      radial-gradient(300px 300px at -8% 108%, color-mix(in srgb, var(--mint-bg) 70%, transparent), transparent 70%),
      radial-gradient(300px 300px at -8% -12%, color-mix(in srgb, var(--lavender-bg) 75%, transparent), transparent 70%),
      var(--bg);
    display: grid; grid-template-columns: 1fr 440px; align-items: center; padding: 0 64px 0 80px; gap: 32px;
  }}
  h1 {{ font-family: "Jua"; font-weight: 400; font-size: 108px; line-height: 1.05; }}
  .en {{ margin-top: 12px; font-size: 34px; font-weight: 800; color: var(--primary); white-space: nowrap; }}
  .about {{ margin-top: 30px; font-family: "Jua"; font-size: 30px; }}
  .about-en {{ margin-top: 6px; font-size: 22px; font-weight: 800; color: var(--muted); }}
  .demo {{ margin-top: 34px; display: inline-flex; align-items: center; gap: 16px; background: var(--surface); border-radius: 999px; padding: 10px 28px; box-shadow: var(--shadow-card); }}
  .demo b {{ font-size: 28px; font-weight: 800; letter-spacing: 0.06em; }}
  .demo span {{ font-size: 26px; color: var(--muted); }}
  .demo strong {{ font-family: "Jua"; font-weight: 400; font-size: 40px; }}
  /* 영수증 — 위가 보이게 비스듬히, 아래는 바탕으로 사라진다 */
  .stage {{ position: relative; height: {H}px; overflow: hidden; }}
  .stage img {{
    position: absolute; left: 30px; top: 46px; width: 380px; transform: rotate(-3deg);
    box-shadow: var(--shadow-card), 0 18px 40px rgb(0 0 0 / 0.12);
    -webkit-mask-image: linear-gradient(to bottom, #000 64%, transparent 94%);
    mask-image: linear-gradient(to bottom, #000 64%, transparent 94%);
  }}
</style></head>
<body>
  <main>
    <h1>{html.escape(KO)}</h1>
    <p class="en">{html.escape(EN)} with Youjin</p>
    <p class="about">{html.escape(ABOUT_KO)}</p>
    <p class="about-en">{html.escape(ABOUT_EN)}</p>
    <p class="demo"><b>{html.escape(name.upper())}</b><span>→</span><strong>{html.escape(ko)}</strong></p>
  </main>
  <div class="stage"><img src="{src}" alt=""></div>
</body></html>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:4173")
    ap.add_argument("--name", default="Sophie")
    ap.add_argument("--ko", default="소피")
    a = ap.parse_args()

    receipt = receipt_png(a.url.rstrip("/"), a.name, a.ko)
    cache = os.path.join(HERE, ".cache")
    os.makedirs(cache, exist_ok=True)
    page_path = os.path.join(cache, "og.html")
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(page(receipt, a.name, a.ko))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": W, "height": H}, color_scheme="light")
        pg.goto("file://" + page_path, wait_until="networkidle")
        pg.evaluate("document.fonts.ready")
        over = pg.evaluate("[...document.querySelectorAll('main *')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim().slice(0, 30))")
        if over:
            print("  warn: 넘친 글자", over)
        pg.screenshot(path=OUT)
        b.close()
    print("wrote", os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()
