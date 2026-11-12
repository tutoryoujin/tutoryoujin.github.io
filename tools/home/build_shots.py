"""첫 화면 앱 썸네일 -> public/home/<slug>.webp (780x1040).  (#48)

앱을 폰 폭(390px)으로 띄워 헤더 아래 첫 화면을 2배로 찍는다. 밝은 테마.

Usage:
    npm run build && npx vite preview --port 4173      (다른 터미널)
    .venv/bin/python tools/home/build_shots.py            # 모든 앱
    .venv/bin/python tools/home/build_shots.py korean-clock   # 하나만
    옵션: --url http://localhost:4173  --out public/home

준비: .venv/bin/pip install playwright==1.49.1 Pillow && .venv/bin/playwright install chromium
앱 목록은 shared/apps.ts 에서 읽는다. 새 앱을 더하면 그 slug 로 한 번 돌린다. webp 는 저장소에 올린다.
"""
import argparse, io, os, re
from PIL import Image
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
W, H, SCALE = 390, 520, 2

with open(os.path.join(ROOT, "shared", "apps.ts"), encoding="utf-8") as f:
    SLUGS = re.findall(r'^\s*slug: "([^"]+)",', f.read(), re.M)

ap = argparse.ArgumentParser()
ap.add_argument("slugs", nargs="*", help="찍을 앱 (비우면 전부)")
ap.add_argument("--url", default="http://localhost:4173")
ap.add_argument("--out", default=os.path.join(ROOT, "public", "home"))
args = ap.parse_args()
targets = args.slugs or SLUGS
unknown = [s for s in targets if s not in SLUGS]
if unknown:
    raise SystemExit(f"shared/apps.ts 에 없는 앱이에요: {', '.join(unknown)}")
os.makedirs(args.out, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    for slug in targets:
        page = browser.new_page(viewport={"width": W, "height": 900}, device_scale_factor=SCALE, color_scheme="light")
        # 밝은 테마 고정 · 첫 방문 안내(소리 · 쓰는 법)가 화면을 가리지 않게
        page.add_init_script("try { localStorage.setItem('yj:theme', 'light') } catch (e) {}")
        page.goto(f"{args.url}/{slug}/", wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(600)  # 첫 애니메이션
        top = page.evaluate("Math.ceil(document.querySelector('header').getBoundingClientRect().bottom)")
        png = page.screenshot(clip={"x": 0, "y": top, "width": W, "height": H}, animations="disabled")
        out = os.path.join(args.out, f"{slug}.webp")
        Image.open(io.BytesIO(png)).convert("RGB").save(out, "WEBP", quality=82, method=6)
        print("wrote", os.path.relpath(out, ROOT))
        page.close()
    browser.close()
