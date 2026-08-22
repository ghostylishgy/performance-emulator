"""Generate deterministic local WeChat share thumbnails (5:4)."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "miniprogram" / "assets"
WIDTH, HEIGHT = 750, 600

COLORS = {
    "page": "#F6F1EA", "card": "#FFFDF9", "ink": "#2B2628", "muted": "#6B6266",
    "primary": "#E94F87", "primary_strong": "#C9366F", "primary_pale": "#FBE4ED",
    "secondary": "#89658E", "secondary_strong": "#704F75", "secondary_pale": "#F0E7F1",
    "accent": "#F0CA6A", "border": "#E4DAD4",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    windows = Path("C:/Windows/Fonts")
    candidates = ["msyhbd.ttc", "simhei.ttf"] if bold else ["msyh.ttc", "simsun.ttc"]
    for candidate in candidates:
        path = windows / candidate
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default(size=size)


def base_canvas(spine: str, tag_fill: str, tag_text: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (WIDTH, HEIGHT), COLORS["page"])
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 18, HEIGHT), fill=spine)
    draw.rounded_rectangle((48, 42, 702, 558), radius=34, fill=COLORS["card"], outline=COLORS["border"], width=2)
    draw.text((82, 76), "烛龙实验室｜绩效内测会", font=font(24, True), fill=COLORS["muted"])
    draw.rounded_rectangle((512, 68, 665, 110), radius=10, fill=tag_fill)
    draw.text((534, 78), "INTERNAL ONLY", font=font(15, True), fill=tag_text)
    draw.line((82, 128, 665, 128), fill=COLORS["border"], width=2)
    return image, draw


def single() -> Image.Image:
    image, draw = base_canvas(COLORS["primary"], COLORS["primary_pale"], COLORS["primary_strong"])
    draw.text((82, 160), "RESULT CONFIRMED", font=font(18, True), fill=COLORS["primary_strong"])
    draw.text((82, 202), "你是哪种", font=font(72, True), fill=COLORS["ink"])
    draw.text((82, 292), "职场本体？", font=font(72, True), fill=COLORS["primary_strong"])
    draw.rounded_rectangle((82, 414, 402, 460), radius=9, fill=COLORS["primary_pale"])
    draw.text((102, 424), "25 题 · 假装严肃地算一下", font=font(20, True), fill=COLORS["primary_strong"])
    draw.text((82, 496), "同样是 3.5，死法各不相同。", font=font(24, True), fill=COLORS["muted"])
    draw.ellipse((602, 430, 650, 478), fill=COLORS["accent"])
    draw.line((588, 493, 664, 478), fill=COLORS["primary"], width=6)
    return image


def relationship() -> Image.Image:
    image, draw = base_canvas(COLORS["secondary"], COLORS["secondary_pale"], COLORS["secondary_strong"])
    draw.text((82, 160), "RELATIONSHIP REVIEWED", font=font(18, True), fill=COLORS["secondary_strong"])
    draw.text((82, 202), "你俩组队后", font=font(68, True), fill=COLORS["ink"])
    draw.text((82, 290), "是什么东西？", font=font(68, True), fill=COLORS["secondary_strong"])
    draw.rounded_rectangle((82, 408, 304, 466), radius=14, fill=COLORS["secondary_pale"])
    draw.rounded_rectangle((326, 408, 548, 466), radius=14, fill=COLORS["primary_pale"])
    draw.text((104, 422), "A / 对方人格", font=font(20, True), fill=COLORS["secondary_strong"])
    draw.text((348, 422), "B / 我的人格", font=font(20, True), fill=COLORS["primary_strong"])
    draw.text((82, 502), "来，和同事对一下口径。", font=font(24, True), fill=COLORS["muted"])
    return image


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    single().save(OUTPUT / "share-single.png", format="PNG", optimize=True)
    relationship().save(OUTPUT / "share-relationship.png", format="PNG", optimize=True)
    print(f"Generated share thumbnails in {OUTPUT}")


if __name__ == "__main__":
    main()
