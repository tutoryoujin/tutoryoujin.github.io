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
    "close": ["bottom"] 처럼 잘린 쪽을 적으면 그 가장자리에 테두리 선을 그어 닫고(close_cuts),
    여백을 잘라 256px 틀에 같은 크기로 맞추고 무게중심을 가운데로 옮긴다 (fit)
Also writes apps/korean-cards/credits-data.json (attribution list shown on the Credits screen).
"""
import json, os, sys, time, urllib.request
from io import BytesIO
from PIL import Image, ImageChops

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


def close_cuts(im, sides, line=0.022):
    """그림이 틀에 잘려 일자로 끝난 쪽(사람 상반신 아래, 화면 밖으로 나간 손 …)에는 테두리가 없다.
    images.json 의 "close": ["bottom", "left" …] 에 적은 쪽 가장자리를
    테두리 색·굵기(그림 폭의 line 배)로 칠해 닫는다."""
    if not sides:
        return im
    a = im.getchannel("A")
    lum = im.convert("L").load()
    al = a.load()
    w, h = im.size
    solid = a.point(lambda v: 255 if v > 200 else 0)
    l, t, r, b = solid.getbbox()

    # 테두리 색: 불투명하고 아주 어두운 픽셀의 평균
    dark = [im.getpixel((x, y))[:3] for y in range(t, b) for x in range(l, r)
            if al[x, y] == 255 and lum[x, y] < 70]
    ink = tuple(sum(c[i] for c in dark) // len(dark) for i in range(3)) + (255,) if dark else (40, 34, 30, 255)

    n = max(2, round(max(r - l, b - t) * line))
    band = Image.new("L", (w, h), 0)
    for s in sides:
        box = {"top": (0, t, w, t + n), "bottom": (0, b - n, w, b),
               "left": (l, 0, l + n, h), "right": (r - n, 0, r, h)}[s]
        band.paste(255, box)
    band = ImageChops.multiply(band, solid)
    out = im.copy()
    out.paste(Image.new("RGBA", (w, h), ink), (0, 0), band)
    out.putalpha(a)
    return out


def fit(im, size=256, area=0.84, edge=0.96):
    """직접 만든 그림을 같은 틀에 맞춘다. 원본마다 여백·비율이 달라서
    그대로 줄이면 가로로 긴 그림은 작아 보이고, 반짝이 장식 때문에 본체가 쏠려 보인다.
    - 크기: 그림 영역의 넓이(√(가로×세로))를 틀의 area 배로 — 단, 긴 변은 edge 배까지만
    - 위치: 그림의 무게중심(불투명한 부분의 평균 위치)을 틀 가운데로 — 단, 틀 밖으로 나가지 않게"""
    im = im.convert("RGBA")
    a = im.getchannel("A")
    box = a.point(lambda v: 255 if v > 8 else 0).getbbox()
    im = im.crop(box)
    w, h = im.size
    s = min(size * area / (w * h) ** 0.5, size * edge / max(w, h))
    im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    w, h = im.size

    alpha = im.getchannel("A")
    cols = [0] * w
    rows = [0] * h
    for i, v in enumerate(alpha.tobytes()):
        cols[i % w] += v
        rows[i // w] += v
    total = sum(cols) or 1
    cx = sum(x * v for x, v in enumerate(cols)) / total
    cy = sum(y * v for y, v in enumerate(rows)) / total

    pad = round(size * (1 - edge) / 2)
    x = min(max(round(size / 2 - cx), pad), size - pad - w)
    y = min(max(round(size / 2 - cy), pad), size - pad - h)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(im, (x, y), im)
    return out


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
            if meta["kind"] == "photo":
                im = photo(im)
            elif meta.get("own"):
                im = fit(close_cuts(im, meta.get("close")))
            else:
                im = icon(im)
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
