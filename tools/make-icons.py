# 앱 아이콘(icons/app-*.png): 보라 타일 위에 오행 다섯 점과 가운데 태극 느낌의 원
# maskable = 안드로이드·아이폰용, 배경을 꽉 채우고 그림은 가운데 안전 영역 안에
# 실행: pip install pillow && python tools/make-icons.py
import math
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "icons"
TILE, LIGHT = "#3B2A6B", "#F5F4F0"
DOTS = ["#2E9A57", "#E04848", "#C99208", "#B8BEC8", "#4D7BE8"]  # 목 화 토 금 수 (상생 순서로 시계방향)
S = 4

def draw(size, maskable):
    big = size * S
    im = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    u = big / 512
    if maskable:
        d.rectangle([0, 0, big, big], fill=TILE); k, off = 0.76, 512 * 0.12
    else:
        d.rounded_rectangle([40 * u, 40 * u, 472 * u, 472 * u], radius=104 * u, fill=TILE); k, off = 1.0, 0
    P = lambda x, y: ((x * k + off) * u, (y * k + off) * u)
    R = lambda r: r * k * u
    cx, cy = 256, 256
    # 오행 고리
    for i, c in enumerate(DOTS):
        a = -math.pi / 2 + i * 2 * math.pi / 5
        x, y = cx + 128 * math.cos(a), cy + 128 * math.sin(a)
        px, py = P(x, y); r = R(40)
        d.ellipse([px - r, py - r, px + r, py + r], fill=c)
    # 가운데 음양
    px, py = P(cx, cy); r = R(62)
    d.ellipse([px - r, py - r, px + r, py + r], fill=LIGHT)
    d.pieslice([px - r, py - r, px + r, py + r], 90, 270, fill=TILE)
    r2 = r / 2
    d.ellipse([px - r2, py - r, px + r2, py], fill=TILE)
    d.ellipse([px - r2, py, px + r2, py + r], fill=LIGHT)
    rr = R(10)
    d.ellipse([px - rr, py - r2 - rr, px + rr, py - r2 + rr], fill=LIGHT)
    d.ellipse([px - rr, py + r2 - rr, px + rr, py + r2 + rr], fill=TILE)
    d.ellipse([px - r, py - r, px + r, py + r], outline=LIGHT, width=int(R(4)))
    return im.resize((size, size), Image.LANCZOS)

OUT.mkdir(exist_ok=True)
for s in (192, 512):
    draw(s, False).save(OUT / f"app-{s}.png")
    draw(s, True).save(OUT / f"app-maskable-{s}.png")
print("ok")
