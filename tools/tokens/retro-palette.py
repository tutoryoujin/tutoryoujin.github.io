"""레트로 팔레트 — shared/tokens/tokens.json 의 색을 바꾸고 대비를 검사한다.

    python3 tools/tokens/retro-palette.py          # 검사만
    python3 tools/tokens/retro-palette.py --write  # tokens.json 에 쓰기 (그다음 npm run tokens)

기준: 레트로 이응이 (크림 종이 · 남색 잉크 · 라벤더 몸 · 남보라 · 코랄 표시).
토큰 이름은 그대로 — 바뀌는 것은 값과 usage 설명뿐이다.
"""
import json
import sys

# name: (light, dark, usage | None=기존 설명 유지)
P = {
    "bg": ("#fbf5ec", "#15172b", "페이지 바탕 — 크림색 종이. 다크는 남색 밤. body 에 반드시 명시한다."),
    "surface": ("#fffcf7", "#1f2238", "bg 위에 올라가는 면 — 검색창, 바텀바, 카드. 종이보다 한 장 더 밝다."),
    "ink": ("#1b1f45", "#f3ece1", "본문 글자 — 이응이 외곽선과 같은 남색 잉크. 모든 악센트 바탕 위에서도 4.5:1 을 넘긴다."),
    "muted": ("#5c5f80", "#a9a8c2", "보조 글자 — 영문 병기, 캡션. bg · surface · sky 위에서 4.5:1."),
    "line": ("#e3d8c5", "#363a5c", "1px 테두리와 구분선. 종이 결에 맞춘 따뜻한 베이지."),
    "primary": ("#c9432a", "#ff8466", "브랜드 코랄 — 이응이 둘레의 표시와 같은 색. 현재 위치, 포커스 링, 주 버튼, 워드마크의 You."),
    "primary-ink": ("#ffffff", "#1b1d38", None),
    "sky": ("#e4e7f8", "#272b4f", "넓게 까는 연한 라벤더 하늘 — 이응이가 서 있는 바닥, 빈 화면. 글자는 sky-ink 만."),
    "sky-ink": ("#2b3379", "#d3d6f7", None),
    "blue-bg": ("#b4c2ee", "#24305c", None),
    "blue-ink": ("#1c2a6a", "#bfcbf7", None),
    "pink-bg": ("#f6cfd0", "#4a2531", None),
    "pink-ink": ("#842a38", "#f8c2c8", None),
    "yellow-bg": ("#f2da86", "#433812", "폴더 3 — 레트로 머스터드. 더 밝으면 bg 와 구분되지 않는다."),
    "yellow-ink": ("#584405", "#f1dd96", None),
    "mint-bg": ("#cbe5cd", "#1c3e2d", None),
    "mint-ink": ("#1b5533", "#b7e3c3", None),
    "lavender-bg": ("#d8d5f6", "#2c2959", "폴더 5 — 이응이 몸 색 계열."),
    "lavender-ink": ("#3a3488", "#d6d2fb", None),
    "coral-bg": ("#f7c8b4", "#4d2619", None),
    "coral-ink": ("#88301a", "#ffc3ab", None),
    "orange-bg": ("#f6dbab", "#46310f", None),
    "orange-ink": ("#683d08", "#f8d3a0", None),
    "gray-bg": ("#e6dfd2", "#2e2d3c", "폴더 8 — 그룹이 없을 때의 기본값. 종이 회색."),
    "gray-ink": ("#46403a", "#d9d3c8", None),
    "ieung-body": ("#bfc0ef", "#bfc0ef", "마스코트 이응의 몸 (레트로 시트). 다크에서도 같은 아이."),
    "ieung-limb": ("#3e4aa0", "#3e4aa0", "이응의 발과 머리 획 — 남보라."),
    "ieung-face": ("#141b3e", "#141b3e", "이응의 외곽선 · 눈동자 · 입."),
    "ieung-blush": ("#f8bec0", "#f8bec0", "이응의 볼."),
    "sun": ("#c2372a", "#ff8f87", None),
    "sat": ("#2e52b4", "#97b2ff", None),
    "special": ("#9a6400", "#f2c95c", None),
}
SHADOW = {
    "shadow-card": ("0 14px 30px -12px rgba(27, 31, 69, 0.22)", "0 14px 30px -12px rgba(0, 0, 0, 0.6)"),
    "shadow-folder": ("0 -6px 16px -8px rgba(27, 31, 69, 0.28)", "0 -6px 16px -8px rgba(0, 0, 0, 0.7)"),
}


def lum(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def ratio(a, b):
    x, y = sorted([lum(a), lum(b)], reverse=True)
    return (x + 0.05) / (y + 0.05)


ACC = ["blue", "pink", "yellow", "mint", "lavender", "coral", "orange", "gray"]
CHECKS = (
    [("ink", "bg", 4.5), ("ink", "surface", 4.5), ("muted", "bg", 4.5), ("muted", "surface", 4.5),
     ("muted", "sky", 4.5), ("primary-ink", "primary", 4.5), ("primary", "bg", 3), ("primary", "surface", 3),
     ("sky-ink", "sky", 4.5), ("sun", "surface", 4.5), ("sat", "surface", 4.5), ("special", "surface", 3)]
    + [(f"{a}-ink", f"{a}-bg", 4.5) for a in ACC]
    + [("ink", f"{a}-bg", 4.5) for a in ACC]
)


def check():
    bad = 0
    for mode, i in (("light", 0), ("dark", 1)):
        for fg, bgn, need in CHECKS:
            r = ratio(P[fg][i], P[bgn][i])
            flag = "ok " if r >= need else "LOW"
            bad += r < need
            if r < need or "--all" in sys.argv:
                print(f"{flag} {mode:5} {fg:13} on {bgn:12} {r:5.2f} (≥{need})")
    print("contrast:", "all pass" if not bad else f"{bad} low")
    return bad


def write():
    f = "shared/tokens/tokens.json"
    d = json.load(open(f))
    seen = set()

    def walk(o):
        if isinstance(o, dict):
            n = o.get("name")
            if n in P and isinstance(o.get("value"), dict):
                light, dark, usage = P[n]
                o["value"] = {"light": light, **({"dark": dark} if "dark" in o["value"] else {})}
                if usage:
                    o["usage"] = usage
                seen.add(n)
            elif n in SHADOW and isinstance(o.get("value"), dict):
                o["value"] = {"light": SHADOW[n][0], "dark": SHADOW[n][1]}
                seen.add(n)
            else:
                for v in o.values():
                    walk(v)
        elif isinstance(o, list):
            for x in o:
                walk(x)

    walk(d)
    missing = (set(P) | set(SHADOW)) - seen
    assert not missing, missing
    json.dump(d, open(f, "w"), ensure_ascii=False, indent=2)
    open(f, "a").write("\n")
    print("wrote", f)


if __name__ == "__main__":
    if check() == 0 and "--write" in sys.argv:
        write()
