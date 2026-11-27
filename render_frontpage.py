#!/usr/bin/env python3
"""Render the 27 November 2026 front page (1024x1024, Pillow, deterministic).

Fresh design for 27 Nov 2026: masthead, lead story (Kuwait drone strike)
with a drawn schematic Gulf map panel, a Thanksgiving-storm panel with a
drawn grounded parade balloon, a Gaza panel, a Bangkok / UK-migration band,
a "By numbers" band, an "Also today" strip and a footer. No network, no
randomness. Stories verified by web search on 27 Nov 2026 (Reuters, BBC,
CNN, WSJ, The Times, France 24, NYT).
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1024, 1024
PAPER = (247, 243, 234)
INK = (17, 17, 17)
RED = (164, 18, 31)
NAVY = (26, 47, 90)
NAVY_LT = (58, 84, 138)
GREY = (90, 86, 78)
LINE = (120, 112, 96)
GOLD = (201, 162, 39)
ORANGE = (232, 116, 28)
TEAL = (18, 102, 96)

FD = "/usr/share/fonts/truetype/dejavu"


def f_serif(size, bold=False):
    return ImageFont.truetype(os.path.join(FD, "DejaVuSerif-Bold.ttf" if bold else "DejaVuSerif.ttf"), size)


def f_sans(size, bold=False):
    return ImageFont.truetype(os.path.join(FD, "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"), size)


def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def text(draw, x, y, s, font, fill=INK, anchor="la"):
    draw.text((x, y), s, font=font, fill=fill, anchor=anchor)
    return y + font.size


def main():
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    mx = 36  # margin
    rx = W - mx

    # ---------- masthead ----------
    d.line([(mx, 26), (rx, 26)], fill=INK, width=4)
    d.line([(mx, 32), (rx, 32)], fill=INK, width=1)
    mast = f_serif(88, bold=True)
    text(d, W // 2, 44, "THE WORLD", mast, anchor="ma")
    d.line([(mx, 140), (rx, 140)], fill=INK, width=2)
    d.line([(mx, 144), (rx, 144)], fill=INK, width=1)
    small = f_sans(17, bold=True)
    text(d, mx, 152, "FRIDAY 27 NOVEMBER 2026", small)
    text(d, rx, 152, "ONE IMAGE  •  THE DAY IN NEWS", small, anchor="ra")
    d.line([(mx, 178), (rx, 178)], fill=LINE, width=1)

    # ---------- lead story (left) ----------
    y = 196
    kick = f_sans(19, bold=True)
    text(d, mx, y, "GULF CRISIS  —  LEAD", kick, fill=RED)
    y = 228
    hl = f_serif(38, bold=True)
    text(d, mx, y, "DRONES KILL TWO", hl)
    y = 282
    text(d, mx, y, "IN KUWAIT", hl)
    y = 344
    body = f_sans(19)
    lines = wrap(d, "Two Italian technicians die at a Kuwaiti air-defence site hit by drones. Kuwait and Italy blame Iran; Tehran denies any role.", body, 500)
    for ln in lines:
        y = text(d, mx, y, ln, body)
        y += 6
    y += 10
    cap = f_sans(16)
    lines = wrap(d, "The dead worked for Rheinmetall Italia, maintaining detection antennas for the Skyguard system. Two more people were wounded.", cap, 500)
    for ln in lines:
        y = text(d, mx, y, ln, cap, fill=GREY)
        y += 5
    d.line([(mx, 500), (540, 500)], fill=LINE, width=1)

    # ---------- lead graphic panel: schematic Gulf map (right) ----------
    gx0, gy0, gx1, gy1 = 560, 192, 988, 500
    d.rectangle([gx0, gy0, gx1, gy1], fill=NAVY)
    d.rectangle([gx0, gy0, gx1, gy1], outline=INK, width=2)
    lab = f_sans(15, bold=True)
    text(d, gx0 + 14, gy0 + 10, "THE GULF, ON ALERT", lab, fill=(255, 255, 255))
    text(d, gx1 - 14, gy0 + 10, "SCHEMATIC", f_sans(13, bold=True), fill=(200, 208, 224), anchor="ra")
    # stylised Gulf water + land
    d.polygon([(600, 330), (660, 290), (760, 275), (880, 260), (950, 280),
               (940, 360), (870, 420), (760, 430), (650, 420), (595, 380)],
              outline=NAVY_LT, width=2)
    # Gulf water strip
    d.polygon([(690, 320), (820, 300), (900, 305), (880, 340), (760, 355), (700, 345)],
              fill=(38, 68, 120))
    text(d, 795, 318, "GULF", f_sans(13, bold=True), fill=(170, 190, 220), anchor="ma")
    text(d, 700, 250, "IRAN", f_sans(15, bold=True), fill=(255, 255, 255), anchor="ma")
    text(d, 700, 268, "denies role", f_sans(13), fill=(200, 208, 224), anchor="ma")
    text(d, 905, 380, "SAUDI", f_sans(13, bold=True), fill=(200, 208, 224), anchor="ma")
    text(d, 905, 397, "ARABIA", f_sans(13, bold=True), fill=(200, 208, 224), anchor="ma")
    # Kuwait marker with blast star
    kx, ky = 668, 345
    for r in (26, 18, 10):
        d.ellipse([kx - r, ky - r, kx + r, ky + r], outline=GOLD, width=2)
    d.ellipse([kx - 7, ky - 7, kx + 7, ky + 7], fill=GOLD, outline=(255, 255, 255), width=2)
    text(d, kx, ky + 32, "KUWAIT", f_sans(14, bold=True), fill=(255, 255, 255), anchor="ma")
    text(d, kx, ky + 50, "air-defence site hit", f_sans(13), fill=(200, 208, 224), anchor="ma")
    # dashed drone path Iran -> Kuwait
    for i in range(0, 130, 14):
        x = 700 + i
        yy = 285 + int((x - 700) * 60 / 130)
        d.ellipse([x, yy - 2, x + 8, yy + 2], fill=GOLD)
    text(d, 800, 285, "drones", f_sans(13, bold=True), fill=GOLD, anchor="ma")
    # blast star at Kuwait
    def star(x, yy, r, fill):
        # 8-point star polygon
        pts = [(x, yy - r), (x + r * 0.28, yy - r * 0.28), (x + r, yy),
               (x + r * 0.28, yy + r * 0.28), (x, yy + r), (x - r * 0.28, yy + r * 0.28),
               (x - r, yy), (x - r * 0.28, yy - r * 0.28)]
        d.polygon(pts, fill=fill)
    star(kx - 52, ky - 40, 14, ORANGE)
    text(d, gx0 + 14, gy1 - 26, "Reuters  •  BBC  •  CNN  •  WSJ", f_sans(13), fill=(200, 208, 224))

    # ---------- middle row ----------
    my0, my1 = 516, 740
    # left panel: Thanksgiving storm
    px0, px1 = mx, 500
    d.rectangle([px0, my0, px1, my1], outline=INK, width=2)
    d.rectangle([px0, my0, px1, my0 + 34], fill=INK)
    text(d, px0 + 12, my0 + 7, "THANKSGIVING STORM", f_sans(16, bold=True), fill=(255, 255, 255))
    text(d, px0 + 12, my0 + 44, "900,000 LOSE POWER", f_serif(24, bold=True))
    text(d, px0 + 12, my0 + 74, "AS PARADE IS PUT OFF", f_serif(24, bold=True))
    y = my0 + 110
    for ln in wrap(d, "A coastal storm batters the US East Coast on Thanksgiving; flights cancelled, floods hit the coast.", f_sans(15), px1 - px0 - 24):
        y = text(d, px0 + 12, y, ln, f_sans(15))
        y += 2
    text(d, px0 + 12, my0 + 152, "100th parade — first postponement ever", f_sans(14, bold=True), fill=RED)
    # drawn grounded balloon: deflated balloon + rain + lightning
    bx, by = px0 + 232, my0 + 196
    d.ellipse([bx - 46, by - 20, bx + 46, by + 20], fill=RED, outline=(120, 10, 20), width=2)
    d.line([(bx - 40, by + 16), (bx - 8, by + 30)], fill=INK, width=2)
    d.line([(bx + 40, by + 16), (bx + 8, by + 30)], fill=INK, width=2)
    # rain streaks
    for rx0 in (px0 + 30, px0 + 90, px0 + 400, px0 + 440):
        d.line([(rx0, my0 + 172), (rx0 - 8, my0 + 198)], fill=NAVY_LT, width=3)
    # lightning bolt
    d.polygon([(430, my0 + 172), (448, my0 + 172), (438, my0 + 190), (452, my0 + 190),
               (424, my0 + 216), (434, my0 + 196), (420, my0 + 196)], fill=GOLD)

    # right panel: Gaza
    qx0, qx1 = 524, 988
    d.rectangle([qx0, my0, qx1, my1], outline=INK, width=2)
    d.rectangle([qx0, my0, qx1, my0 + 34], fill=RED)
    text(d, qx0 + 12, my0 + 7, "GAZA", f_sans(16, bold=True), fill=(255, 255, 255))
    text(d, qx0 + 12, my0 + 44, "HAMAS WEIGHS REPLY", f_serif(24, bold=True))
    text(d, qx0 + 12, my0 + 74, "AFTER 10 KILLED", f_serif(24, bold=True))
    text(d, qx0 + 12, my0 + 110, "Israeli strikes kill 10 in Gaza, incl.", f_sans(15))
    text(d, qx0 + 12, my0 + 128, "senior Hamas official Khaled Abu Nada", f_sans(15))
    text(d, qx0 + 12, my0 + 146, "and his wife; Hamas weighs its reply.", f_sans(15))
    text(d, qx0 + 12, my0 + 172, "10", f_serif(46, bold=True), fill=RED)
    text(d, qx0 + 84, my0 + 186, "killed in a third night of", f_sans(15), fill=GREY)
    text(d, qx0 + 84, my0 + 206, "strikes — Reuters", f_sans(15), fill=GREY)

    # ---------- Bangkok / UK band ----------
    gy0, gy1 = 756, 856
    d.rectangle([mx, gy0, rx, gy1], outline=INK, width=2)
    d.rectangle([mx, gy0, mx + 10, gy1], fill=ORANGE)
    # left half: Bangkok
    y = gy0 + 10
    text(d, mx + 24, y, "BANGKOK", f_sans(16, bold=True), fill=ORANGE)
    y = text(d, mx + 24, y + 22, "REFINERY BLAST HURTS 9", f_serif(22, bold=True))
    y += 6
    lines = wrap(d, "An explosion at the Bangchak oil refinery injures at least nine; the company monitors air quality.", f_sans(15), 440)
    for ln in lines:
        y = text(d, mx + 24, y, ln, f_sans(15))
        y += 3
    # divider + right half: UK migration
    d.line([(512, gy0 + 8), (512, gy1 - 8)], fill=LINE, width=1)
    y = gy0 + 10
    text(d, 528, y, "BRITAIN", f_sans(16, bold=True), fill=TEAL)
    y = text(d, 528, y + 22, "MIGRATION LOWEST SINCE 1997", f_serif(22, bold=True))
    y += 6
    lines = wrap(d, "Net migration to the UK falls to its lowest level since 1997, excluding the pandemic years.", f_sans(15), 440)
    for ln in lines:
        y = text(d, 528, y, ln, f_sans(15))
        y += 3

    # ---------- by numbers ----------
    ny0, ny1 = 870, 940
    d.rectangle([mx, ny0, rx, ny1], outline=INK, width=2)
    nums = [("2", "killed in Kuwait"), ("900,000", "without power, US"),
            ("10", "killed in Gaza"), ("9", "hurt in Bangkok"),
            ("65 mph", "storm gusts")]
    cw = (rx - mx) / 5
    for i, (n, lab) in enumerate(nums):
        cx = mx + cw * i
        if i:
            d.line([(cx, ny0 + 8), (cx, ny1 - 8)], fill=LINE, width=1)
        text(d, cx + cw / 2, ny0 + 8, n, f_serif(30, bold=True), fill=RED, anchor="ma")
        text(d, cx + cw / 2, ny0 + 46, lab, f_sans(13), fill=GREY, anchor="ma")

    # ---------- also today ----------
    ay = 954
    strip = "ALSO TODAY:  Chess: Gukesh–Sindarov draw Game 3  •  Kim vows more nukes  •  US GDP 4.3%  •  Tanker sinks off Ibiza"
    assert d.textlength(strip, font=f_sans(14, bold=True)) <= rx - mx, "also-today strip too wide"
    text(d, mx, ay, strip, f_sans(14, bold=True))
    d.line([(mx, 978), (rx, 978)], fill=LINE, width=1)

    # ---------- footer ----------
    text(d, mx, 990, "Sources: Reuters  •  BBC  •  CNN  •  WSJ  •  The Times  •  France 24 — drawn from verified reporting, 27 November 2026", f_sans(14), fill=GREY)
    text(d, W // 2, 1006, "THE WORLD — one image, the day\u2019s news", f_sans(13), fill=GREY, anchor="ma")

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "entry.png")
    img.save(out, "PNG", optimize=True)
    print("wrote", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
