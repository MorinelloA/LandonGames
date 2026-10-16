"""Turn the family photos in photos-src/ into what Picture Puzzle loads.

    python tools/photos.py            rebuild photos/ from photos-src/
    python tools/photos.py --check    fail if photos/ is out of date
    python tools/photos.py --preview  also write photos-src/_preview.jpg

photos-src/ holds the masters (any of .jpg .jpeg .png .webp .heic .heif)
and is git-ignored, so originals never reach the site or the repo. For each
master this writes:

    photos/<name>.jpg         long edge at most 1600 px, sRGB, no metadata
    photos/thumbs/<name>.jpg  320 px square, cropped around the focus point
    photos/manifest.json      what the game reads

The puzzle crops the same square as the thumbnail, so what Landon taps is
exactly the picture he builds. The square sits around a focus point: the
middle of landscape photos, a little above the middle of portrait ones
(where faces usually are). To move it, list the photo in
tools/photo-focus.json, which is committed:

    { "IMG_7742": [0.5, 0.3] }      x and y as fractions of the photo

Needs Pillow; HEIC masters also need pillow-heif (pip install pillow-heif).
Neither ships with the site.
"""
import argparse
import hashlib
import io
import json
import os
import sys

from PIL import Image, ImageCms, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "photos-src")
OUT = os.path.join(ROOT, "photos")
THUMBS = os.path.join(OUT, "thumbs")
MANIFEST = os.path.join(OUT, "manifest.json")

MASTER_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
LONG_EDGE = 1600
THUMB = 320
QUALITY = 82
THUMB_QUALITY = 78
WARN_BYTES = 600 * 1024


def heif_opener():
    try:
        import pillow_heif
    except ImportError:
        return False
    pillow_heif.register_heif_opener()
    return True


def to_srgb(img):
    """Flatten to 8-bit RGB in sRGB, whatever the master was."""
    icc = img.info.get("icc_profile")
    if img.mode in ("P", "LA", "PA", "RGBA"):
        img = img.convert("RGBA")
        flat = Image.new("RGB", img.size, (255, 255, 255))
        flat.paste(img, mask=img.getchannel("A"))
        img = flat
    elif img.mode != "RGB" and img.mode != "CMYK":
        img = img.convert("RGB")
    if icc:
        try:
            src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            dst = ImageCms.createProfile("sRGB")
            img = ImageCms.profileToProfile(img, src, dst, outputMode="RGB")
        except (ImageCms.PyCMSError, OSError):
            img = img.convert("RGB")
    elif img.mode == "CMYK":
        img = img.convert("RGB")
    img.info.pop("icc_profile", None)
    return img


def default_focus(w, h):
    return [0.5, 0.42] if h > w else [0.5, 0.5]


def square_box(w, h, focus):
    """The largest square around the focus point, kept inside the photo."""
    side = min(w, h)
    cx, cy = focus[0] * w, focus[1] * h
    left = min(max(cx - side / 2, 0), w - side)
    top = min(max(cy - side / 2, 0), h - side)
    return (round(left), round(top), round(left) + side, round(top) + side)


def encode(img, quality):
    buf = io.BytesIO()
    # no exif, icc_profile or comment: nothing about the photo leaves this PC
    img.save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
    return buf.getvalue()


def build(path, focus):
    with Image.open(path) as raw:
        img = ImageOps.exif_transpose(raw)
        img = to_srgb(img)
    w, h = img.size
    focus = focus or default_focus(w, h)
    scale = min(1.0, LONG_EDGE / max(w, h))
    if scale < 1:
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS, reducing_gap=3.0)
    w, h = img.size
    thumb = img.crop(square_box(w, h, focus)).resize((THUMB, THUMB), Image.LANCZOS)
    return encode(img, QUALITY), encode(thumb, THUMB_QUALITY), w, h, focus


def short_hash(data):
    return hashlib.sha256(data).hexdigest()[:8]


def masters():
    if not os.path.isdir(SRC):
        return []
    names = [f for f in os.listdir(SRC)
             if os.path.splitext(f)[1].lower() in MASTER_EXTS and not f.startswith("_")]
    return sorted(names, key=str.lower)


def load_focus():
    path = os.path.join(ROOT, "tools", "photo-focus.json")
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def manifest_text(entries):
    rows = ",\n".join("    " + json.dumps(e) for e in entries)
    return '{\n  "version": 2,\n  "photos": [\n' + rows + "\n  ]\n}\n"


def write_bytes(path, data):
    with open(path, "wb") as f:
        f.write(data)


def contact_sheet(thumbs, path):
    cols = 5
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (THUMB + 10) + 10, rows * (THUMB + 10) + 10), (40, 40, 48))
    for i, data in enumerate(thumbs):
        with Image.open(io.BytesIO(data)) as t:
            sheet.paste(t, (10 + (i % cols) * (THUMB + 10), 10 + (i // cols) * (THUMB + 10)))
    sheet.save(path, "JPEG", quality=85)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="fail if photos/ is out of date")
    ap.add_argument("--preview", action="store_true", help="write photos-src/_preview.jpg")
    args = ap.parse_args()

    names = masters()
    if not names:
        print(f"No photos in {SRC}. Put the originals there, then run this again.")
        return 1
    heic = [n for n in names if n.lower().endswith((".heic", ".heif"))]
    if heic and not heif_opener():
        print("These are HEIC photos, which need pillow-heif (pip install pillow-heif):")
        print("  " + ", ".join(heic))
        return 1

    focus_overrides = load_focus()
    entries, stale, thumbs, total = [], [], [], 0
    for name in names:
        stem = os.path.splitext(name)[0]
        full, thumb, w, h, focus = build(os.path.join(SRC, name), focus_overrides.get(stem))
        thumbs.append(thumb)
        total += len(full) + len(thumb)
        targets = {
            os.path.join(OUT, stem + ".jpg"): full,
            os.path.join(THUMBS, stem + ".jpg"): thumb,
        }
        for target, data in targets.items():
            current = open(target, "rb").read() if os.path.exists(target) else None
            if current != data:
                stale.append(os.path.relpath(target, ROOT))
                if not args.check:
                    os.makedirs(os.path.dirname(target), exist_ok=True)
                    write_bytes(target, data)
        size_note = "  (big: consider a smaller master)" if len(full) > WARN_BYTES else ""
        print(f"{stem}.jpg  {w}x{h}  {len(full) // 1024} KB, thumb {len(thumb) // 1024} KB{size_note}")
        entries.append({
            "id": stem,
            "src": f"{stem}.jpg?v={short_hash(full)}",
            "thumb": f"thumbs/{stem}.jpg?v={short_hash(thumb)}",
            "w": w,
            "h": h,
            "focus": [round(focus[0], 3), round(focus[1], 3)],
        })

    # outputs whose master is gone
    keep = {e["id"] + ".jpg" for e in entries}
    for folder in (OUT, THUMBS):
        if not os.path.isdir(folder):
            continue
        for f in os.listdir(folder):
            if os.path.splitext(f)[1].lower() in MASTER_EXTS and f not in keep:
                stale.append(os.path.relpath(os.path.join(folder, f), ROOT))
                if not args.check:
                    os.remove(os.path.join(folder, f))

    text = manifest_text(entries)
    current = open(MANIFEST, encoding="utf-8").read() if os.path.exists(MANIFEST) else None
    if current != text:
        stale.append(os.path.relpath(MANIFEST, ROOT))
        if not args.check:
            with open(MANIFEST, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)

    if args.preview:
        contact_sheet(thumbs, os.path.join(SRC, "_preview.jpg"))
        print("Wrote photos-src/_preview.jpg")

    print(f"{len(entries)} photos, {total / 1048576:.1f} MB in all")
    if args.check:
        if stale:
            print("Out of date (run python tools/photos.py):")
            for s in stale:
                print("  " + s)
            return 1
        print("photos/ is up to date")
    return 0


if __name__ == "__main__":
    sys.exit(main())
