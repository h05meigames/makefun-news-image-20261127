#!/usr/bin/env python3
"""Draw the front page of THE WORLD for Friday 27 November 2026.

A single 1024x1024 newspaper front page, rendered with Pillow. The picture
is fully deterministic: no network access, no randomness, no clock reads,
so running the script twice produces byte-identical output.

Usage:
    python3 render_frontpage.py [output-path]

The output path defaults to "entry.png" next to this script when omitted.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PAGE_W = 1024
PAGE_H = 1024
MARGIN = 36
CONTENT_W = PAGE_W - 2 * MARGIN

PAPER = (247, 243, 232)
INK = (18, 18, 18)
SOFT_INK = (70, 70, 70)
RULE = (120, 110, 95)
ACCENT = (163, 18, 18)
SEA = (198, 222, 235)
LAND = (232, 214, 178)
PANEL = (233, 226, 208)
STORM_BG = (226, 233, 240)

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")

SERIF = "DejaVuSerif.ttf"
SERIF_BOLD = "DejaVuSerif-Bold.ttf"
SANS = "DejaVuSans.ttf"
SANS_BOLD = "DejaVuSans-Bold.ttf"


def load_font(name, size):
    return ImageFont.truetype(str(FONT_DIR / name), size)


def wrap_words(draw, text, font, max_width):
    """Split text into lines that fit inside max_width pixels."""
    lines = []
    current = ""
    for word in text.split():
        trial = word if not current else current + " " + word
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_para(draw, text, font, x, y, width, leading, fill=INK):
    """Draw wrapped text starting at (x, y); return the y below the block."""
    for line in wrap_words(draw, text, font, width):
        draw.text((x, y), line, font=font, fill=fill)
        y += leading
    return y


def draw_centred(draw, text, font, cx, y, fill=INK):
    draw.text((cx, y), text, font=font, fill=fill, anchor="ma")


def draw_rule(draw, x0, x1, y, width=2, fill=RULE):
    draw.line([(x0, y), (x1, y)], fill=fill, width=width)


def draw_masthead(draw):
    draw_rule(draw, MARGIN, PAGE_W - MARGIN, 22, width=3, fill=INK)
    draw_centred(draw, "THE WORLD", load_font(SERIF_BOLD, 80), PAGE_W // 2, 30)
    draw_rule(draw, MARGIN, PAGE_W - MARGIN, 108, width=1)
    small = load_font(SANS_BOLD, 16)
    draw.text((MARGIN, 116), "FRIDAY 27 NOVEMBER 2026", font=small, fill=INK)
    draw.text(
        (PAGE_W - MARGIN, 116),
        "No. 331  •  PRICE $2.50",
        font=small,
        fill=INK,
        anchor="ra",
    )
    draw_rule(draw, MARGIN, PAGE_W - MARGIN, 142, width=3, fill=INK)
    return 154


def draw_lead(draw):
    y = draw_masthead(draw)
    draw_centred(
        draw,
        "Drones kill two in Kuwait",
        load_font(SERIF_BOLD, 52),
        PAGE_W // 2,
        y,
    )
    y += 72
    draw_centred(
        draw,
        "Italian technicians die at air-defence site as Kuwait and Rome",
        load_font(SERIF, 22),
        PAGE_W // 2,
        y,
    )
    y += 30
    draw_centred(
        draw,
        "blame Tehran; Iran denies any role",
        load_font(SERIF, 22),
        PAGE_W // 2,
        y,
    )
    return y + 36


def draw_gulf_map(draw, x0, y0, x1, y1):
    draw.rectangle([x0, y0, x1, y1], outline=INK, width=2, fill=(250, 248, 240))
    title = load_font(SANS_BOLD, 15)
    draw_centred(draw, "THE GULF — SCHEMATIC MAP", title, (x0 + x1) // 2, y0 + 8)
    inner = (x0 + 10, y0 + 34, x1 - 10, y1 - 10)
    draw.rectangle(inner, fill=SEA)
    # Stylised landmass: the Arabian peninsula and the northern shore.
    land = [
        (inner[0] + 150, inner[1]),
        (inner[0] + 330, inner[1]),
        (inner[0] + 330, inner[1] + 55),
        (inner[0] + 250, inner[1] + 95),
        (inner[0] + 205, inner[1] + 150),
        (inner[0] + 150, inner[1] + 150),
        (inner[0] + 120, inner[1] + 80),
    ]
    draw.polygon(land, fill=LAND, outline=(150, 130, 95))
    label = load_font(SANS_BOLD, 13)
    small = load_font(SANS, 13)
    draw.text((inner[0] + 18, inner[1] + 10), "IRAN", font=label, fill=SOFT_INK)
    draw.text((inner[0] + 20, inner[1] + 78), "IRAQ", font=label, fill=SOFT_INK)
    draw.text(
        (inner[0] + 148, inner[1] + 112),
        "SAUDI ARABIA",
        font=label,
        fill=SOFT_INK,
    )
    draw.text(
        (inner[0] + 275, inner[1] + 118),
        "PERSIAN\nGULF",
        font=small,
        fill=(40, 90, 130),
    )
    # Kuwait sits on the north-western shore of the Gulf.
    kx, ky = inner[0] + 178, inner[1] + 55
    draw.ellipse([kx - 7, ky - 7, kx + 7, ky + 7], fill=ACCENT, outline=INK)
    draw.text((kx - 86, ky - 9), "KUWAIT", font=label, fill=ACCENT)
    # Drone tracks: dashed lines converging on the site.
    for start in [(inner[0] + 300, inner[1] + 6), (inner[0] + 322, inner[1] + 48)]:
        steps = 9
        for i in range(steps):
            t0 = i / steps
            t1 = (i + 0.55) / steps
            ax = start[0] + (kx - start[0]) * t0
            ay = start[1] + (ky - start[1]) * t0
            bx = start[0] + (kx - start[0]) * t1
            by = start[1] + (ky - start[1]) * t1
            draw.line([(ax, ay), (bx, by)], fill=ACCENT, width=2)
        draw.ellipse(
            [start[0] - 4, start[1] - 4, start[0] + 4, start[1] + 4],
            fill=INK,
        )


def draw_lead_body(draw, y):
    text_x = MARGIN
    text_w = 556
    map_x0 = MARGIN + 584
    map_x1 = PAGE_W - MARGIN
    body = load_font(SANS, 19)
    lead_y = y
    y = draw_para(
        draw,
        "Two Italian technicians employed by Rheinmetall Italia were killed "
        "when drones struck a Kuwaiti air-defence site. Kuwait and Italy "
        "blamed Iran; Tehran denied any role and called it a false flag.",
        body,
        text_x,
        y,
        text_w,
        26,
    )
    y += 8
    draw_para(
        draw,
        "Rome demanded answers over the killing of its nationals, and "
        "Kuwait stepped up security around sensitive sites. Oil markets "
        "steadied after an early jump.",
        body,
        text_x,
        y,
        text_w,
        26,
    )
    draw_gulf_map(draw, map_x0, lead_y, map_x1, lead_y + 196)
    return lead_y + 196 + 10


def draw_balloon(draw, cx, top):
    # A Thanksgiving parade balloon, drawn from simple shapes.
    body_top = top
    body_bottom = top + 62
    draw.ellipse(
        [cx - 52, body_top, cx + 52, body_bottom],
        fill=(214, 72, 48),
        outline=INK,
        width=2,
    )
    draw.ellipse(
        [cx - 20, body_top, cx + 20, body_bottom],
        fill=(240, 200, 60),
        outline=INK,
        width=1,
    )
    draw.ellipse([cx - 8, body_top + 12, cx + 2, body_top + 26], fill=INK)
    draw.ellipse([cx + 12, body_top + 12, cx + 22, body_top + 26], fill=INK)
    draw.arc(
        [cx - 18, body_top + 30, cx + 18, body_top + 52],
        start=15,
        end=165,
        fill=INK,
        width=2,
    )
    for dx in (-34, 0, 34):
        draw.line(
            [(cx + dx, body_bottom - 4), (cx + dx // 2, body_bottom + 34)],
            fill=INK,
            width=2,
        )
    draw.rectangle(
        [cx - 16, body_bottom + 34, cx + 16, body_bottom + 56],
        fill=(122, 82, 40),
        outline=INK,
        width=2,
    )


def draw_storm_panel(draw, y):
    panel_h = 148
    draw.rectangle(
        [MARGIN, y, PAGE_W - MARGIN, y + panel_h],
        fill=STORM_BG,
        outline=INK,
        width=2,
    )
    draw_balloon(draw, MARGIN + 108, y + 24)
    tx = MARGIN + 232
    tw = PAGE_W - MARGIN - tx - 18
    draw.text(
        (tx, y + 12),
        "Storm blacks out 900,000; parade postponed",
        font=load_font(SERIF_BOLD, 26),
        fill=INK,
    )
    draw_para(
        draw,
        "A powerful coastal storm knocked out power to about 900,000 homes "
        "and businesses along the US East Coast and forced the postponement "
        "of the 100th Macy's Thanksgiving Day Parade — the first delay in "
        "its history. Organisers moved the parade to Saturday; gusts hit "
        "65 mph.",
        load_font(SANS, 17),
        tx,
        y + 48,
        tw,
        23,
    )
    return y + panel_h + 12


def draw_lower_stories(draw, y):
    gap = 17
    col_w = (CONTENT_W - 2 * gap) // 3
    xs = [MARGIN, MARGIN + col_w + gap, MARGIN + 2 * (col_w + gap)]
    kicker = load_font(SANS_BOLD, 14)
    head = load_font(SERIF_BOLD, 20)
    body = load_font(SANS, 15)
    stories = [
        (
            "GAZA",
            "Hamas weighs reply after strikes kill 10",
            "Hamas weighed its response after strikes killed 10 in Gaza, "
            "including senior official Khaled Abu Nada and his wife, on a "
            "third night of bombing.",
        ),
        (
            "BANGKOK",
            "Blast at Bangkok refinery injures nine",
            "An explosion at the Bangchak oil refinery injured at least "
            "nine people. The company was monitoring air quality around "
            "the plant.",
        ),
        (
            "BRITAIN",
            "Migration falls to lowest since 1997",
            "Net migration to Britain fell to its lowest since 1997, "
            "excluding the pandemic years, new figures showed.",
        ),
    ]
    for x, (tag, headline, text) in zip(xs, stories):
        draw.text((x, y), tag, font=kicker, fill=ACCENT)
        cy = y + 20
        cy = draw_para(draw, headline, head, x, cy, col_w, 26)
        cy += 4
        draw_para(draw, text, body, x, cy, col_w, 21)
    for dx in (xs[1] - gap // 2 - 1, xs[2] - gap // 2 - 1):
        draw.line([(dx, y), (dx, y + 166)], fill=RULE, width=1)
    return y + 166 + 8


def draw_by_numbers(draw, y):
    draw_rule(draw, MARGIN, PAGE_W - MARGIN, y, width=3, fill=INK)
    y += 8
    draw_centred(
        draw, "BY THE NUMBERS", load_font(SANS_BOLD, 15), PAGE_W // 2, y
    )
    y += 24
    stats = [
        ("2", "technicians killed\nin Kuwait"),
        ("900,000", "without power\nin the US"),
        ("10", "killed in\nGaza strikes"),
        ("9", "hurt in the\nBangkok blast"),
        ("65 mph", "storm gusts on\nthe East Coast"),
    ]
    gap = 10
    box_w = (CONTENT_W - gap * (len(stats) - 1)) // len(stats)
    big = load_font(SERIF_BOLD, 30)
    small = load_font(SANS, 13)
    for i, (value, label) in enumerate(stats):
        bx = MARGIN + i * (box_w + gap)
        draw.rectangle(
            [bx, y, bx + box_w, y + 76], fill=PANEL, outline=RULE, width=1
        )
        draw_centred(draw, value, big, bx + box_w // 2, y + 6, fill=ACCENT)
        ly = y + 42
        for line in label.split("\n"):
            draw_centred(draw, line, small, bx + box_w // 2, ly, fill=SOFT_INK)
            ly += 16
    return y + 76 + 8


def draw_also_today(draw, y):
    label = load_font(SANS_BOLD, 15)
    text = load_font(SANS, 15)
    lx = MARGIN
    draw.text((lx, y), "ALSO TODAY", font=label, fill=ACCENT)
    label_w = draw.textlength("ALSO TODAY  ", font=label)
    draw_para(
        draw,
        "Chess: Gukesh-Sindarov draw Game 3 of the World Championship  •  "
        "Kim Jong Un vows more nuclear weapons  •  US GDP up to 4.3%  •  "
        "Tanker capsizes off Ibiza",
        text,
        lx + int(label_w),
        y,
        PAGE_W - MARGIN - lx - int(label_w),
        20,
    )
    return y + 40


def draw_footer(draw, y):
    draw_centred(
        draw,
        "THE WORLD  •  Friday 27 November 2026  •  Front page drawn for the make.fun news-image-20261127 bounty",
        load_font(SANS, 12),
        PAGE_W // 2,
        y,
        fill=SOFT_INK,
    )


def build_page():
    image = Image.new("RGB", (PAGE_W, PAGE_H), PAPER)
    draw = ImageDraw.Draw(image)
    y = draw_lead(draw)
    y = draw_lead_body(draw, y)
    y = draw_storm_panel(draw, y)
    y = draw_lower_stories(draw, y)
    y = draw_by_numbers(draw, y)
    y = draw_also_today(draw, y)
    draw_footer(draw, y + 14)
    return image


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("entry.png")
    page = build_page()
    page.save(out, format="PNG", optimize=True)
    print(f"Wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
