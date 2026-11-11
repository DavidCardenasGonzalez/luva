#!/usr/bin/env python3
"""Create a transparent 480x854 overlay with floating brand pills."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


WIDTH, HEIGHT = 480, 854
SCALE = 3
TOP = 78
PILL_H = 54
LOGO_PILL_W = 104
GAP = 14
TEXT_PADDING_X = 22


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tagline", required=True)
    parser.add_argument("--logo", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    canvas = Image.new("RGBA", (WIDTH * SCALE, HEIGHT * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    font_path = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
    if not font_path.is_file():
        font_path = Path("/Library/Fonts/Arial Bold.ttf")
    font = ImageFont.truetype(str(font_path), 18 * SCALE)

    top = TOP * SCALE
    height = PILL_H * SCALE
    logo_w = LOGO_PILL_W * SCALE
    max_text_w = WIDTH * SCALE - logo_w - GAP * SCALE - 2 * TEXT_PADDING_X * SCALE
    while font.getlength(args.tagline) > max_text_w and font.size > 14 * SCALE:
        font = ImageFont.truetype(str(font_path), font.size - SCALE)
    text_width = int(font.getlength(args.tagline))
    text_h = font.getbbox(args.tagline)[3] - font.getbbox(args.tagline)[1]
    tag_w = text_width + 2 * TEXT_PADDING_X * SCALE
    group_w = tag_w + GAP * SCALE + logo_w
    if group_w > WIDTH * SCALE:
        raise SystemExit("Tagline does not fit alongside the logo pill")
    left = (WIDTH * SCALE - group_w) // 2
    logo_left = left + tag_w + GAP * SCALE
    right = logo_left + logo_w

    radius = height // 2
    fill = (8, 10, 14, 192)
    outline = (255, 255, 255, 48)
    draw.rounded_rectangle((left, top, left + tag_w, top + height), radius, fill=fill, outline=outline, width=2 * SCALE)
    draw.rounded_rectangle((logo_left, top, right, top + height), radius, fill=fill, outline=outline, width=2 * SCALE)

    text_y = top + (height - text_h) // 2 - font.getbbox(args.tagline)[1]
    draw.text((left + TEXT_PADDING_X * SCALE, text_y), args.tagline, font=font, fill=(255, 255, 255, 255))

    logo = Image.open(args.logo).convert("RGBA")
    logo.thumbnail((66 * SCALE, 30 * SCALE), Image.Resampling.LANCZOS)
    logo_x = logo_left + (logo_w - logo.width) // 2
    logo_y = top + (height - logo.height) // 2
    canvas.alpha_composite(logo, (logo_x, logo_y))

    canvas.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS).save(args.output)
    print(f"Created {args.output}")


if __name__ == "__main__":
    main()
