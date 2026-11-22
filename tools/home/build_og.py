"""홈 공유 그림 -> public/og.png (1200x630).  (#18 · 레트로 #110)

Usage:
    python3 -m venv .venv
    .venv/bin/pip install playwright==1.49.1
    .venv/bin/playwright install chromium
    .venv/bin/python tools/home/build_og.py

사이트를 그리는 것과 같은 재료로 그린다 — 값을 여기 옮겨 적지 않는다 (tools/og/retro.py).
  색 · 글꼴      shared/tokens/tokens.css (라이트) · Caprasimo · Nunito · Pretendard
  이응이         public/mascot/laughing.webp · 앱 썸네일 public/home/ieung/<slug>.webp
  앱 이름        shared/apps.ts            (slug · ko · en)
그래서 토큰이나 앱 목록이 바뀌면 이걸 다시 돌리기만 하면 된다. PNG 는 저장소에 올린다.
홈은 영어가 크고 한국어가 아래 (#84). 설명(alt)은 shared/seo.ts 의 ogAlt — 이응이와 앱 이름.
"""
import html, os, re, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, "tools", "og"))
import retro  # noqa: E402

OUT = os.path.join(ROOT, "public", "og.png")
W, H = 1200, 630


def read(*p):
    with open(os.path.join(ROOT, *p), encoding="utf-8") as f:
        return f.read()


def field(block, name):
    m = re.search(rf'^\s*{name}: "([^"]+)",', block, re.M)
    return m.group(1) if m else None


# 앱 하나 = "slug:" 로 시작하는 덩어리. 필드 순서와 상관없이 읽는다
APPS = [
    (field(b, "slug"), field(b, "ko"), field(b, "en"))
    for b in re.split(r'(?=^\s*slug: ")', read("shared", "apps.ts"), flags=re.M)[1:]
]
if not APPS or not all(all(a) for a in APPS):
    raise SystemExit("shared/apps.ts 에서 앱을 못 읽었어요")

# 3열로 여섯까지. 더 많으면 다섯 + 「+N」 칸 (shared/seo.ts 의 ogAlt 와 같은 규칙)
MAX = 6
shown = APPS if len(APPS) <= MAX else APPS[: MAX - 1]
more = len(APPS) - len(shown)


def thumb(slug):
    for p in (("public", "home", "ieung", f"{slug}.webp"), ("public", "home", f"{slug}.webp")):
        if os.path.exists(os.path.join(ROOT, *p)):
            return retro.data_uri(*p)
    raise SystemExit(f"썸네일이 없어요: public/home/ieung/{slug}.webp")


chips = "\n".join(
    f"""<li class="ink"><img src="{thumb(slug)}" alt=""><span><b>{html.escape(en)}</b><small lang="ko">{html.escape(ko)}</small></span></li>"""
    for slug, ko, en in shown
) + (f"""<li class="ink more"><b>+{more}</b><small>more apps</small></li>""" if more else "")

PAGE = f"""<!doctype html>
<html lang="en" data-theme="light"><head>{retro.head(W, H)}
<style>
  body {{ display: grid; grid-template-columns: minmax(0, 1fr) 360px; align-items: center; padding: 0 40px 0 64px; gap: 16px; }}
  h1 {{ font-size: 92px; line-height: 0.98; letter-spacing: -0.01em; }}
  .en {{ margin-top: 18px; font-size: 27px; font-weight: 800; }}
  .ko-sub {{ margin-top: 4px; font-size: 21px; color: var(--muted); }}
  ul {{ list-style: none; margin-top: 26px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 12px; }}
  li {{ display: flex; align-items: center; gap: 10px; background: var(--surface); border-radius: 18px; padding: 6px 10px 6px 6px; border-width: 2.5px; box-shadow: 0 4px 0 var(--ink); }}
  li img {{ width: 52px; height: 52px; flex: none; border-radius: 12px; object-fit: cover; }}
  li b {{ display: block; font-size: 15.5px; font-weight: 800; line-height: 1.1; white-space: nowrap; }}
  li small {{ display: block; margin-top: 2px; font-family: "Pretendard Variable", Pretendard, sans-serif; font-size: 13px; font-weight: 700; line-height: 1.2; color: var(--muted); }}
  li.more {{ flex-direction: column; justify-content: center; }}
  .stage {{ position: relative; height: 560px; }}
  /* 이응이가 서는 하늘 동그라미 — 홈 첫 화면 구름 자리의 sky */
  .floor {{ position: absolute; left: 0; right: 0; bottom: 40px; height: 340px; border-radius: 50%; background: var(--sky); border: 3px solid var(--ink); }}
  .ieung {{ position: absolute; left: 20px; bottom: 56px; width: 320px; height: 325px; object-fit: contain; object-position: bottom; }}
  .bubble {{ position: absolute; right: 8px; top: 40px; background: var(--surface); border-radius: 24px; padding: 14px 24px; text-align: center; }}
  .bubble::after {{ content: ""; position: absolute; left: 70px; bottom: -14px; width: 22px; height: 22px; background: var(--surface); border-right: 3px solid var(--ink); border-bottom: 3px solid var(--ink); border-bottom-right-radius: 5px; transform: rotate(45deg); }}
  .bubble b {{ display: block; font-size: 32px; }}
  .bubble small {{ display: block; font-size: 17px; font-weight: 800; color: var(--muted); }}
</style></head>
<body class="paper">
  <main>
    <h1 class="d">Korean<br>with <u>You</u>jin</h1>
    <p class="en">Small apps for learning Korean, a little every day.</p>
    <p class="ko-sub ko" lang="ko">한국어를 배우는 작은 앱, 매일 조금씩.</p>
    <ul>{chips}</ul>
  </main>
  <div class="stage">
    <div class="floor"></div>
    <img class="ieung" src="{retro.mascot('laughing')}" alt="">
    <div class="bubble ink"><b class="ko" lang="ko">매일 조금씩!</b><small>A little every day</small></div>
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
        pg.goto(retro.file_url(page_path), wait_until="networkidle")
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
