"""Render the Open Graph share image -> public/korean-cards/img/og.png (1200x630).

Usage:
    python3 -m venv .venv && .venv/bin/pip install Pillow
    .venv/bin/python tools/korean-cards/build_og.py

A stack of labelled deck cards — the same thing the home screen shows —
next to the title. Deck colours, blurbs and art come from the DECKS table below (keep in step with apps/korean-cards/decks), so
this file and the app stay in step. Colours come from shared/tokens/tokens.css (light).
Retro look (#110): cream paper, navy ink outlines and hard ink shadows, like the home cards.
Fonts (Pretendard for Korean, Caprasimo for the English title, Nunito) are downloaded once
into tools/korean-cards/.fontcache/ — that folder is gitignored, the PNG is committed.
"""
import os, re, urllib.request
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))           # site/
IMG = os.path.join(ROOT, "public", "korean-cards", "img")
CACHE = os.path.join(HERE, ".fontcache")
OUT = os.path.join(IMG, "og.png")

W, H = 1200, 630
S = 2  # supersample factor — render 2x, downscale at the end

FONTS = {
    "Pretendard-ExtraBold.otf": "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-ExtraBold.otf",
    "Caprasimo-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/caprasimo/Caprasimo-Regular.ttf",
    "Nunito.ttf": "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito%5Bwght%5D.ttf",
}
KO_FONT, TITLE_FONT = "Pretendard-ExtraBold.otf", "Caprasimo-Regular.ttf"


def _tokens():
    """shared/tokens/tokens.css 의 첫 :root (라이트) 값을 읽는다 — 값을 여기 옮겨 적지 않는다"""
    with open(os.path.join(ROOT, "shared", "tokens", "tokens.css"), encoding="utf-8") as f:
        css = f.read()
    light = css[css.index(":root"):]
    light = light[: light.index("}")]
    hexes = dict(re.findall(r"--([a-z-]+):\s*#([0-9a-fA-F]{6});", light))
    return {k: tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)) for k, v in hexes.items()}


T = _tokens()
BG, SURFACE, INK, MUTED, PRIMARY, LINE, GRAY_BG = (T[k] for k in ("bg", "surface", "ink", "muted", "primary", "line", "gray-bg"))
ACCENT = {c: (T[f"{c}-bg"], T[f"{c}-ink"]) for c in ("blue", "pink", "yellow", "mint", "lavender")}  # -bg, -ink
OUTLINE, HARD = 3, 6   # 잉크 테 굵기 · 딱딱한 그림자 깊이 (홈 카드와 같은 결)

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
    """크림 종이 + 잉크 점 — 홈 남산 점묘의 결"""
    w, h = size
    img = Image.new("RGBA", size, BG + (255,))
    d = ImageDraw.Draw(img)
    # RGBA 그림 위에서는 반투명이 섞이지 않아서 섞은 색을 직접 쓴다 — 잉크 9%
    dot = tuple(round(b + (i - b) * 0.09) for b, i in zip(BG, INK))
    step, r = 18 * S, 1.5 * S
    for y in range(step // 2, h, step):
        for x in range(step // 2, w, step):
            d.ellipse((x - r, y - r, x + r, y + r), fill=dot)
    return img


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
    card = rounded((w, h), RADIUS * S, bg, INK, OUTLINE * S)
    mask = rounded((w, h), RADIUS * S, (255, 255, 255, 255)).getchannel("A")

    # 겉면 그림 — 오른쪽 아래로 밀어 내고 카드 모서리가 잘라 준다
    im = Image.open(os.path.join(IMG, deck, art_id + ".webp")).convert("RGBA")
    im = im.resize((ART * S, ART * S), Image.LANCZOS)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer.alpha_composite(im, ((CARD_W - ART + 18) * S, (CARD_H - ART + 26) * S))
    card.alpha_composite(Image.composite(layer, Image.new("RGBA", (w, h), (0, 0, 0, 0)), mask))
    # 그림이 덮은 테를 다시 긋는다
    ImageDraw.Draw(card).rounded_rectangle((0, 0, w - 1, h - 1), RADIUS * S, outline=INK, width=OUTLINE * S)

    d = ImageDraw.Draw(card)
    # 라벨 알약 — -ink 바탕에 -bg 글자
    fj = font(KO_FONT, 30 * S)
    tw = d.textlength(label, font=fj)
    ph = 52 * S
    d.rounded_rectangle((PAD * S, 26 * S, PAD * S + tw + 44 * S, 26 * S + ph), 999, fill=ink)
    d.text((PAD * S + 22 * S, 26 * S + ph / 2 + 2 * S), label, font=fj, fill=bg, anchor="lm")

    # 한 줄 소개와 장수. 폴더 위에서는 muted 를 쓰지 않는다 — ink 로 두고 크기로만 눌러 준다
    fb = font(KO_FONT, 22 * S)
    y = 100 * S
    for line in wrap(d, blurb, fb, (CARD_W - PAD - ART + 10) * S)[:2]:
        d.text((PAD * S, y), line, font=fb, fill=INK, anchor="lt")
        y += 31 * S
    fn, fk = font("Nunito.ttf", 18 * S), font(KO_FONT, 18 * S)
    runs(d, PAD * S, y + 5 * S, [(en + " · ", fn, INK), ("20장", fk, INK)])
    return card


def drop(canvas, shape, x, y):
    """딱딱한 잉크 그림자 — 흐리지 않고 아래로 HARD 만큼"""
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sh.paste(Image.new("RGBA", shape.size, INK + (255,)), (x, y + HARD * S), shape)
    canvas.alpha_composite(sh)


def brand(img, x, y):
    """로고 마크 + 「Korean with Youjin」 — You 만 primary (#83)"""
    mark = Image.open(os.path.join(ROOT, "public", "mascot", "mark.webp")).convert("RGBA").resize((52 * S, 52 * S), Image.LANCZOS)
    img.alpha_composite(mark, (x, y - 40 * S))
    d = ImageDraw.Draw(img)
    runs(d, x + 64 * S, y - 28 * S, [(t, font(TITLE_FONT, 30 * S), c) for t, c in (("Korean with ", INK), ("You", PRIMARY), ("jin", INK))])


def main():
    w, h = W * S, H * S
    img = backdrop((w, h))

    # ---- text block -------------------------------------------------
    d = ImageDraw.Draw(img)
    x = 78 * S
    lines = [
        (232, "한국어 카드", KO_FONT, 98, INK),
        (292, "Korean Word Cards", TITLE_FONT, 40, PRIMARY),
        (360, "뒤집으며 외우는 한국어 단어", KO_FONT, 31, INK),
        (400, "Flip, guess, repeat.", "Nunito.ttf", 26, MUTED),
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
                        GRAY_BG if i % 2 == 0 else SURFACE, INK, OUTLINE * S)
        img.alpha_composite(quiet, ((STACK_X - 14 + 6 * i) * S, (STACK_Y - 48 + 11 * i) * S))

    # ---- 덱 더미 ------------------------------------------------------
    for i, (deck, art_id, label, en, blurb, color) in enumerate(DECKS):
        card = deck_card(deck, art_id, label, en, blurb, color)
        cx, cy = (STACK_X + SKEW * i) * S, (STACK_Y + STEP * i) * S
        drop(img, card.getchannel("A"), cx, cy)
        img.alpha_composite(card, (cx, cy))

    brand(img, x, 500 * S)

    img.convert("RGB").resize((W, H), Image.LANCZOS).save(OUT, optimize=True)
    print("wrote", os.path.relpath(OUT, ROOT), os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
