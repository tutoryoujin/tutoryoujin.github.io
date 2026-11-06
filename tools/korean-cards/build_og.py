"""Render the Open Graph share image -> public/korean-cards/img/og.png (1200x630).

Usage:
    python3 -m venv .venv && .venv/bin/pip install Pillow
    .venv/bin/python tools/korean-cards/build_og.py

A stack of labelled deck cards — the same thing the home screen shows —
next to the title. Deck colours, blurbs and art come from the DECKS table below (keep in step with apps/korean-cards/decks), so
this file and the app stay in step. Fonts (Jua, Nunito) are downloaded once
into tools/korean-cards/.fontcache/ — that folder is gitignored, the PNG is committed.
"""
import os, urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))           # site/
IMG = os.path.join(ROOT, "public", "korean-cards", "img")
CACHE = os.path.join(HERE, ".fontcache")
OUT = os.path.join(IMG, "og.png")

W, H = 1200, 630
S = 2  # supersample factor — render 2x, downscale at the end

FONTS = {
    "Jua-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/jua/Jua-Regular.ttf",
    "Nunito.ttf": "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito%5Bwght%5D.ttf",
}

# css/app.css tokens (light theme) — 디자인 시스템 v2
BG = (245, 248, 255)
INK = (30, 39, 66)
MUTED = (86, 97, 138)
PRIMARY = (67, 86, 207)
LINE = (201, 213, 242)
GRAY_BG = (221, 228, 243)
ACCENT = {                       # -bg, -ink
    "blue": ((156, 178, 235), (23, 38, 94)),
    "pink": ((255, 208, 210), (138, 37, 53)),
    "yellow": ((244, 226, 113), (95, 83, 0)),
    "mint": ((189, 234, 206), (20, 84, 58)),
    "lavender": ((221, 212, 251), (65, 43, 140)),
}

# 홈 더미와 같은 순서·같은 내용. (덱 폴더, 겉면 그림, 라벨, 한 줄 소개, 색)
DECKS = [
    ("emotions", "haengbokhaeyo", "감정", "Emotions", "기쁘고 설레고 속상한 마음을 한국어로", "blue"),
    ("food", "bowl", "한국 음식", "Korean Food", "비빔밥부터 빙수까지, 먹고 싶은 것부터", "pink"),
    ("family", "gajok", "가족", "Family Words", "형과 오빠는 왜 다를까요", "yellow"),
]

CARD_W, CARD_H, RADIUS = 520, 180, 34
STACK_X, STACK_Y, STEP, SKEW = 640, 92, 152, 9   # 겹침 = CARD_H - STEP = 28
PAD, ART = 30, 148


def font(name, size):
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        req = urllib.request.Request(FONTS[name], headers={"User-Agent": "korean-cards/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            open(path, "wb").write(r.read())
    f = ImageFont.truetype(path, size)
    if name == "Nunito.ttf":  # variable font — pin the weight
        try:
            f.set_variation_by_axes([800])
        except Exception:
            pass
    return f


def backdrop(size):
    """Near-white vertical wash + a few airy pastel glows."""
    w, h = size
    img = Image.new("RGBA", size, (255, 255, 255, 255))
    grad = Image.new("L", (1, h))
    for y in range(h):
        grad.putpixel((0, y), int(255 - 26 * (y / h)))  # subtle top->bottom cool-down
    img.paste(Image.new("RGBA", size, BG + (255,)), (0, 0), ImageOps.invert(grad.resize(size)))

    # anchored just outside the corners, so only the edges tint and the
    # middle stays near-white (overlapping pastels turn gray fast)
    glows = [  # (cx%, cy%, r, rgb, alpha)
        (.80, -.16, 300, ACCENT["yellow"][0], 150),
        (1.10, .92, 300, ACCENT["pink"][0], 200),
        (-.16, 1.06, 290, ACCENT["mint"][0], 150),
        (-.15, -.14, 280, ACCENT["lavender"][0], 160),
    ]
    for fx, fy, r, rgb, a in glows:
        r *= S
        cx, cy = int(w * fx), int(h * fy)
        layer = Image.new("RGBA", size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse((cx - r, cy - r, cx + r, cy + r), fill=rgb + (a,))
        img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(r * 0.32)))
    return img


def sparkles(img):
    """Tiny confetti dots — just enough to feel playful."""
    d = ImageDraw.Draw(img, "RGBA")
    dots = [(126, 486, 9, (255, 196, 218)), (196, 540, 6, (255, 214, 120)),
            (64, 436, 5, (150, 188, 250)), (560, 172, 7, (255, 200, 140)),
            (614, 104, 5, (150, 220, 196)), (96, 142, 6, (255, 214, 120))]
    for x, y, r, rgb in dots:
        x, y, r = x * S, y * S, r * S
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgb + (205,))


def rounded(size, radius, fill, outline=None, width=0):
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius,
                                         fill=fill, outline=outline, width=width)
    return im


def runs(d, x, y, parts):
    """Nunito 에는 한글 글자가 없다. 영문과 한글을 글꼴을 바꿔 가며 이어 그린다."""
    for text, f, fill in parts:
        d.text((x, y), text, font=f, fill=fill, anchor="lt")
        x += d.textlength(text, font=f)


def wrap(d, text, f, maxw):
    out, cur = [], ""
    for word in text.split(" "):
        probe = (cur + " " + word).strip()
        if d.textlength(probe, font=f) <= maxw:
            cur = probe
        else:
            out.append(cur); cur = word
    if cur:
        out.append(cur)
    return out


def deck_card(deck, art_id, label, en, blurb, color):
    """홈 화면의 폴더 한 장 — 라벨 알약 + 한 줄 소개 + 모서리에 잘리는 겉면 그림."""
    bg, ink = ACCENT[color]
    w, h = CARD_W * S, CARD_H * S
    card = rounded((w, h), RADIUS * S, bg, LINE, 2 * S)
    mask = rounded((w, h), RADIUS * S, (255, 255, 255, 255)).getchannel("A")

    # 겉면 그림 — 오른쪽 아래로 밀어 내고 카드 모서리가 잘라 준다
    im = Image.open(os.path.join(IMG, deck, art_id + ".webp")).convert("RGBA")
    im = im.resize((ART * S, ART * S), Image.LANCZOS)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer.alpha_composite(im, ((CARD_W - ART + 18) * S, (CARD_H - ART + 26) * S))
    card.alpha_composite(Image.composite(layer, Image.new("RGBA", (w, h), (0, 0, 0, 0)), mask))

    d = ImageDraw.Draw(card)
    # 라벨 알약 — -ink 바탕에 -bg 글자
    fj = font("Jua-Regular.ttf", 30 * S)
    tw = d.textlength(label, font=fj)
    ph = 52 * S
    d.rounded_rectangle((PAD * S, 26 * S, PAD * S + tw + 44 * S, 26 * S + ph), 999, fill=ink)
    d.text((PAD * S + 22 * S, 26 * S + ph / 2 + 2 * S), label, font=fj, fill=bg, anchor="lm")

    # 한 줄 소개와 장수. 폴더 위에서는 muted 를 쓰지 않는다 — ink 로 두고 크기로만 눌러 준다
    fb = font("Jua-Regular.ttf", 23 * S)
    y = 100 * S
    for line in wrap(d, blurb, fb, (CARD_W - PAD - ART + 10) * S)[:2]:
        d.text((PAD * S, y), line, font=fb, fill=INK, anchor="lt")
        y += 31 * S
    fn, fk = font("Nunito.ttf", 18 * S), font("Jua-Regular.ttf", 19 * S)
    runs(d, PAD * S, y + 5 * S, [(en + " · ", fn, INK), ("20장", fk, INK)])
    return card


def drop(canvas, shape, x, y, blur, dy, alpha):
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    solid = Image.new("RGBA", shape.size, (31, 40, 63, alpha))
    sh.paste(solid, (x, y + dy), shape)
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))


def main():
    w, h = W * S, H * S
    img = backdrop((w, h))
    sparkles(img)

    # ---- text block -------------------------------------------------
    d = ImageDraw.Draw(img)
    x = 78 * S
    lines = [
        (232, "한국어 카드", "Jua-Regular.ttf", 98, INK),
        (288, "Korean Cards with Youjin", "Nunito.ttf", 38, PRIMARY),
        (356, "뒤집으며 외우는 한국어 단어", "Jua-Regular.ttf", 31, MUTED),
        (398, "Flip, guess, repeat.", "Nunito.ttf", 26, MUTED),
    ]
    for y, text, fam, size, fill in lines:
        f = font(fam, size * S)
        d.text((x, y * S), text, font=f, fill=fill, anchor="ls")
        right = x / S + d.textlength(text, font=f) / S
        if right > STACK_X - 20:
            print(f"  warn: '{text}' reaches x={right:.0f} (stack starts {STACK_X})")

    # ---- 가라앉은 뒤 카드들 -------------------------------------------
    for i in range(5):
        quiet = rounded((CARD_W * S, CARD_H * S), RADIUS * S,
                        GRAY_BG if i % 2 == 0 else LINE)
        img.alpha_composite(quiet, ((STACK_X - 14 + 6 * i) * S, (STACK_Y - 48 + 11 * i) * S))

    # ---- 덱 더미 ------------------------------------------------------
    for i, (deck, art_id, label, en, blurb, color) in enumerate(DECKS):
        card = deck_card(deck, art_id, label, en, blurb, color)
        cx, cy = (STACK_X + SKEW * i) * S, (STACK_Y + STEP * i) * S
        drop(img, card.getchannel("A"), cx, cy, 22 * S, 10 * S, 70)
        img.alpha_composite(card, (cx, cy))

    img.convert("RGB").resize((W, H), Image.LANCZOS).save(OUT, optimize=True)
    print("wrote", os.path.relpath(OUT, ROOT), os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
