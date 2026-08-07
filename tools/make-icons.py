"""Regenerates the app icons in ../icons/.

The site itself has no build step -- this is a one-off script you run by hand
only when you want to change the icon art, then commit the resulting PNGs.

    pip install pillow numpy
    python tools/make-icons.py            # writes icons/
    python tools/make-icons.py --preview  # also writes tools/preview.png

The preview shows the icon at 180/152/120/76/60 px with iOS's rounded-square
mask applied, which is how it will actually look on the home screen.

To change the look, edit the palette constants below.  Keep the artwork inside
the middle ~80% of the square: iOS crops the corners, and Android's maskable
icon crops even more.  The icon must stay opaque -- iOS composites any
transparency onto black.

After re-uploading the site, delete and re-add the home screen shortcut on the
iPad/iPhone; iOS caches the old icon otherwise.
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons")
W = 2048  # master size everything is downsampled from

# ---- palette (matches the pastel scheme in css/style.css) -------------------
BG_STOPS = [
    (0.00, "#63cdf2"),   # sky blue
    (0.50, "#8fa9f0"),   # periwinkle
    (1.00, "#c48fe6"),   # soft violet
]
STAR_TOP, STAR_BOTTOM = "#ffe473", "#ffab1f"
# confetti: x, y, radius (all as a fraction of the icon), colour
CONFETTI = [
    (0.175, 0.230, 0.052, "#ffd166"),
    (0.845, 0.300, 0.040, "#90d4a3"),
    (0.135, 0.665, 0.044, "#ffb3c9"),
    (0.870, 0.720, 0.055, "#b5e48c"),
    (0.300, 0.868, 0.038, "#ffe08a"),
    (0.680, 0.885, 0.045, "#a7e0f5"),
    (0.075, 0.445, 0.028, "#ffffff"),
    (0.930, 0.520, 0.026, "#ffffff"),
    (0.500, 0.940, 0.024, "#ffffff"),
]


def hx(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def diagonal_gradient(size, stops):
    y, x = np.mgrid[0:size, 0:size]
    t = ((x + y) / (2.0 * (size - 1))).astype(np.float32)
    pos = np.array([s[0] for s in stops], dtype=np.float32)
    cols = np.array([hx(s[1]) for s in stops], dtype=np.float32)
    out = np.stack([np.interp(t, pos, cols[:, i]) for i in range(3)], axis=-1)
    return Image.fromarray(out.astype(np.uint8), "RGB")


def vertical_gradient(size, top, bottom):
    y = np.linspace(0, 1, size, dtype=np.float32)[:, None]
    c = (1 - y) * np.array(hx(top), np.float32) + y * np.array(hx(bottom), np.float32)
    return Image.fromarray(np.repeat(c[:, None, :], size, axis=1).astype(np.uint8), "RGB")


def radial_glow(size, cx, cy, radius, strength):
    y, x = np.mgrid[0:size, 0:size]
    d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) / radius
    return Image.fromarray(((np.clip(1.0 - d, 0, 1) ** 2 * strength) * 255).astype(np.uint8), "L")


def star_mask(size, cx, cy, outer, inner, round_px, n=5, rot=-math.pi / 2):
    pts = []
    for i in range(n * 2):
        r = outer if i % 2 == 0 else inner
        a = rot + i * math.pi / n
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.polygon(pts, fill=255)
    d.line(pts + [pts[0]], fill=255, width=round_px, joint="curve")  # rounds the points
    return m


def build_master():
    img = diagonal_gradient(W, BG_STOPS).convert("RGBA")

    # gentle light bloom behind the star so the gold pops
    glow = radial_glow(W, W * 0.5, W * 0.46, W * 0.52, 0.45)
    img.paste(Image.new("RGBA", (W, W), (255, 255, 255, 255)), (0, 0), glow)

    dots = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dots)
    for fx, fy, fr, col in CONFETTI:
        cx, cy, r = fx * W, fy * W, fr * W
        dd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=hx(col) + (235,))
    shadow = dots.split()[3].filter(ImageFilter.GaussianBlur(W * 0.010))
    shadow = shadow.point(lambda v: int(v * 0.30))
    img.paste(Image.new("RGBA", (W, W), (40, 40, 90, 255)),
              (int(W * 0.006), int(W * 0.010)), shadow)
    img.alpha_composite(dots)

    cx, cy = W * 0.5, W * 0.468
    outer = W * 0.335
    inner = outer * 0.475
    round_px = int(W * 0.055)
    sm = star_mask(W, cx, cy, outer, inner, round_px)

    ssh = sm.filter(ImageFilter.GaussianBlur(W * 0.018)).point(lambda v: int(v * 0.38))
    img.paste(Image.new("RGBA", (W, W), (35, 35, 85, 255)), (0, int(W * 0.018)), ssh)

    # white rim keeps the star legible against the violet corner
    rim = star_mask(W, cx, cy, outer + W * 0.020, inner + W * 0.020, round_px)
    img.paste(Image.new("RGBA", (W, W), (255, 255, 255, 255)), (0, 0), rim)
    img.paste(vertical_gradient(W, STAR_TOP, STAR_BOTTOM).convert("RGBA"), (0, 0), sm)

    # highlight along the top-left of the star
    hl = Image.new("L", (W, W), 0)
    ImageDraw.Draw(hl).ellipse(
        [cx - outer * 0.72, cy - outer * 0.95, cx + outer * 0.10, cy - outer * 0.10], fill=90)
    hl = hl.filter(ImageFilter.GaussianBlur(W * 0.030))
    hl = Image.fromarray(np.minimum(np.array(hl), np.array(sm)))
    img.paste(Image.new("RGBA", (W, W), (255, 255, 255, 255)), (0, 0), hl)

    return img.convert("RGB")  # opaque: iOS composites alpha onto black


def save(im, name):
    p = os.path.join(OUT, name)
    im.save(p, "PNG", optimize=True)
    print(f"icons/{name:24} {im.size[0]:>4}px {os.path.getsize(p) / 1024:6.1f} KB")


def write_preview(master):
    sq = 0.2237  # iOS squircle corner radius, as a fraction of the icon size
    sizes = (180, 152, 120, 76, 60)
    prev = Image.new("RGB", (sum(sizes) + 40 * (len(sizes) + 1), 300), hx("#2b2f45"))
    x = 40
    for px in sizes:
        ic = master.resize((px, px), Image.LANCZOS)
        m = Image.new("L", (px * 8, px * 8), 0)
        ImageDraw.Draw(m).rounded_rectangle(
            [0, 0, px * 8 - 1, px * 8 - 1], radius=int(px * 8 * sq), fill=255)
        ic.putalpha(m.resize((px, px), Image.LANCZOS))
        prev.paste(ic, (x, 60 + (180 - px) // 2), ic)
        x += px + 40
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "preview.png")
    prev.save(p)
    print(f"tools/preview.png (not committed)")


def main():
    master = build_master()
    os.makedirs(OUT, exist_ok=True)
    for px in (180, 192, 512):
        save(master.resize((px, px), Image.LANCZOS), f"icon-{px}.png")
    save(master.resize((32, 32), Image.LANCZOS), "favicon-32.png")

    # maskable: Android crops to the centre 80%, so shrink the art into that circle
    inner = master.resize((int(512 * 0.8), int(512 * 0.8)), Image.LANCZOS)
    mk = Image.new("RGB", (512, 512), hx(BG_STOPS[len(BG_STOPS) // 2][1]))
    mk.paste(inner, ((512 - inner.size[0]) // 2, (512 - inner.size[1]) // 2))
    save(mk, "icon-512-maskable.png")

    if "--preview" in sys.argv:
        write_preview(master)


if __name__ == "__main__":
    main()
