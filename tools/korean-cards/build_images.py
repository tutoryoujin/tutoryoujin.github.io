"""Download + optimize card images listed in tools/korean-cards/images.json.

Usage:
    python3 -m venv .venv && .venv/bin/pip install Pillow
    .venv/bin/python tools/korean-cards/build_images.py            # only missing files
    .venv/bin/python tools/korean-cards/build_images.py --force    # rebuild all

Manifest key = "<deck>/<cardId>" -> public/korean-cards/img/<deck>/<cardId>.webp
  "file": "art/x.png" 가 있으면 url 대신 그 파일을 쓴다 — 직접 손본
  그림(원본 SVG 는 같은 폴더)에 쓴다. url 은 출처 표기용으로 남는다.
  kind "photo": center-crop 4:3, 800x600 webp
  kind "icon" : keep alpha, max 256px webp
  "own": true 면 직접 만든 그림 — 출처 화면(credits-data.json)에 넣지 않는다.
    원본 PNG(투명 배경)는 tools/korean-cards/art/<deck>/<id>.png
Also writes apps/korean-cards/credits-data.json (attribution list shown on the Credits screen).
"""
import json, os, sys, time, urllib.request
from io import BytesIO
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))           # site/
MANIFEST = os.path.join(HERE, "images.json")
IMG = os.path.join(ROOT, "public", "korean-cards", "img")
UA = {"User-Agent": "korean-cards-image-builder/1.0"}


def fetch(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception as e:
            if attempt == 2:
                raise
            time.sleep(2 + attempt * 3)


def photo(im):
    im = im.convert("RGB")
    w, h = im.size
    target = 4 / 3
    if w / h > target:
        nw = int(h * target); x = (w - nw) // 2
        im = im.crop((x, 0, x + nw, h))
    else:
        nh = int(w / target); y = (h - nh) // 2
        im = im.crop((0, y, w, y + nh))
    return im.resize((800, 600), Image.LANCZOS) if im.width > 800 else im


def icon(im):
    im = im.convert("RGBA")
    im.thumbnail((256, 256), Image.LANCZOS)
    return im


def main():
    force = "--force" in sys.argv
    items = json.load(open(MANIFEST, encoding="utf-8"))
    failed = []
    for key, meta in items.items():
        out = os.path.join(IMG, key + ".webp")
        if os.path.exists(out) and not force:
            continue
        os.makedirs(os.path.dirname(out), exist_ok=True)
        try:
            if meta.get("file"):
                im = Image.open(os.path.join(HERE, meta["file"]))  # "art/x.png" — 이 폴더 기준
            else:
                im = Image.open(BytesIO(fetch(meta["url"])))
            im = photo(im) if meta["kind"] == "photo" else icon(im)
            im.save(out, "WEBP", quality=78, method=6)
            print("ok  ", key, os.path.getsize(out) // 1024, "KB")
        except Exception as e:
            failed.append(key)
            print("FAIL", key, e)

    credits = [{"key": k, **{f: v[f] for f in ("title", "author", "license", "licenseUrl", "source")}}
               for k, v in items.items() if not v.get("own")]
    out_json = os.path.join(ROOT, "apps", "korean-cards", "credits-data.json")
    with open(out_json, "w", encoding="utf-8", newline="\n") as f:  # Windows에서도 LF 고정
        f.write(json.dumps(credits, ensure_ascii=False, indent=1) + "\n")
    if failed:
        print("\nfailed:", failed); sys.exit(1)


main()
