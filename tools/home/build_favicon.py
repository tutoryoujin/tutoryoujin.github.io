"""파비콘 -> public/favicon.svg · favicon.ico · apple-touch-icon.png  (#110)

로고 마크(public/mascot/mark.webp — 유진 님이 준 이응이 그림)를 그대로 줄여 굽는다. 다시 그리지 않는다.

Usage (홈 공유 그림과 같은 .venv — Pillow 만 있으면 된다):
    .venv/bin/python tools/home/build_favicon.py

  favicon.svg          그림을 품은 SVG (투명 바탕) — 최신 브라우저
  favicon.ico          16 · 32 · 48 (투명 바탕) — 옛 브라우저 · 검색 결과
  apple-touch-icon.png 180, 크림 종이 바탕 — iOS 는 투명을 검게 칠한다. 바탕색은 tokens.css 의 --bg (라이트)
마크 그림이 바뀌면 다시 돌린다. 결과는 저장소에 올린다.
다시 구웠으면 shared/seo.ts 의 FAVICON_V 를 하나 올린다 — 안 그러면 브라우저가 옛 그림을 계속 보여 준다.
"""
import base64, io, os, re
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PUB = os.path.join(ROOT, "public")


def bg():
    with open(os.path.join(ROOT, "shared", "tokens", "tokens.css"), encoding="utf-8") as f:
        v = re.search(r"--bg:\s*#([0-9a-fA-F]{6});", f.read()).group(1)  # 첫 값 = 라이트
    return tuple(int(v[i : i + 2], 16) for i in (0, 2, 4))


def fit(mark, size, pad):
    """정사각 size 칸 가운데에 pad 만큼 띄워 넣는다"""
    inner = size - 2 * pad
    m = mark.resize((inner, inner), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.alpha_composite(m, (pad, pad))
    return out


def main():
    mark = Image.open(os.path.join(PUB, "mascot", "mark.webp")).convert("RGBA")
    mark = mark.crop(mark.getbbox())  # 둘레 투명을 걷어 작은 칸에서 최대한 크게
    side = max(mark.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.alpha_composite(mark, ((side - mark.width) // 2, (side - mark.height) // 2))

    # favicon.svg — 64px PNG 를 품는다 (탭 아이콘은 커도 32px 라 이 정도면 충분하고 가볍다)
    buf = io.BytesIO()
    fit(sq, 64, 1).save(buf, "PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        "<!-- 이응이 로고 마크 — public/mascot/mark.webp 를 tools/home/build_favicon.py 가 구운 것 -->"
        f'<image width="64" height="64" href="data:image/png;base64,{b64}"/></svg>\n'
    )
    with open(os.path.join(PUB, "favicon.svg"), "w", encoding="utf-8", newline="\n") as f:
        f.write(svg)

    # favicon.ico — 크기마다 따로 줄여야 작은 칸에서 덜 뭉개진다
    icons = [fit(sq, s, 0) for s in (48, 32, 16)]
    icons[0].save(os.path.join(PUB, "favicon.ico"), format="ICO", sizes=[(48, 48), (32, 32), (16, 16)], append_images=icons[1:])

    # apple-touch-icon.png — 크림 바탕 + 둘레 여백
    touch = Image.new("RGBA", (180, 180), bg() + (255,))
    touch.alpha_composite(fit(sq, 180, 18))
    touch.convert("RGB").save(os.path.join(PUB, "apple-touch-icon.png"), optimize=True)

    for n in ("favicon.svg", "favicon.ico", "apple-touch-icon.png"):
        print("wrote", "public/" + n, os.path.getsize(os.path.join(PUB, n)) // 1024, "KB")


if __name__ == "__main__":
    main()
