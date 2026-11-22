"""공유 그림(OG) 도구들이 같이 쓰는 레트로 재료 (#110).

사이트와 같은 재료만 쓴다 — 값을 여기 옮겨 적지 않는다.
  색          shared/tokens/tokens.css (라이트)
  글꼴        제목 영문 Caprasimo (public/fonts, 사이트와 같은 파일) · 본문 Nunito · 한국어 Pretendard
              — font-family 는 토큰의 --font-display · --font-app 그대로
  이응이      public/mascot/<표정>.webp — 유진 님이 준 그림 그대로. 다시 그리지 않는다

공유 그림은 file:// 로 열어서 찍는다. 그림 경로(/mascot/…)가 안 풀리니 data: 주소로 넣는다.
"""
import base64, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))


def file_url(*p):
    return "file:///" + os.path.join(ROOT, *p).replace("\\", "/").lstrip("/")


def data_uri(*p):
    path = os.path.join(ROOT, *p)
    ext = os.path.splitext(path)[1].lstrip(".").replace("jpg", "jpeg")
    with open(path, "rb") as f:
        return f"data:image/{ext};base64," + base64.b64encode(f.read()).decode()


def mascot(art):
    """이응이 표정 한 장 (neutral · laughing · surprised … · mark · peek)"""
    return data_uri("public", "mascot", f"{art}.webp")


def head(w, h):
    """<head> 안쪽 — 토큰 · 글꼴 · 기본 모양. 페이지마다 자기 <style> 을 뒤에 더한다"""
    caprasimo = file_url("public", "fonts", "caprasimo-latin-400-normal.woff2")
    return f"""<meta charset="utf-8">
<link rel="stylesheet" href="{file_url('shared', 'tokens', 'tokens.css')}">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=block" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
  @font-face {{ font-family: "Caprasimo"; font-weight: 100 900; font-display: block; src: url("{caprasimo}") format("woff2"); }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; animation: none !important; }}
  html, body {{ width: {w}px; height: {h}px; overflow: hidden; }}
  body {{ font-family: var(--font-app); color: var(--ink); background: var(--bg); font-synthesis: none; }}
  /* 제목 글꼴 — 사이트의 .font-display 와 같게 한 굵기(800) */
  .d {{ font-family: var(--font-display); font-weight: 800; }}
  .ko {{ font-family: "Pretendard Variable", Pretendard, sans-serif; font-weight: 800; }}
  /* 워드마크의 You (#83) */
  u {{ text-decoration: none; color: var(--primary); }}
  /* 레트로 스티커 — 남색 굵은 테 + 딱딱한 잉크 그림자 (홈 카드 · 버튼과 같은 모양) */
  .ink {{ border: 3px solid var(--ink); box-shadow: 0 6px 0 var(--ink); }}
  /* 바탕 — 크림 종이 위에 잉크 점 (홈 남산 점묘의 결) */
  .paper {{ background: radial-gradient(color-mix(in srgb, var(--ink) 9%, transparent) 1.4px, transparent 1.6px) 0 0 / 18px 18px, var(--bg); }}
  .brand {{ display: inline-flex; align-items: center; gap: 12px; font-size: 30px; }}
  .brand img {{ width: 52px; height: 52px; }}
</style>"""


def brand():
    """로고 마크 + 워드마크 한 줄"""
    return f"""<p class="brand d"><img src="{mascot('mark')}" alt=""><span>Korean with <u>You</u>jin</span></p>"""
