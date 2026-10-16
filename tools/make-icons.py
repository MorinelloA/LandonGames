"""Draws the app icons in ../icons/ from tools/app-icon.js.

The icon is drawn in code like the rest of the game's art: tools/app-icon.js
puts the cat's face from js/art/mascot.js under the menu's bunting, on the
menu's wall. This script renders it in headless Chromium at every size
index.html and manifest.webmanifest use. The site has no build step, so run
it by hand only when the icon art changes, then restamp sw.js and commit the
PNGs.

    pip install playwright pillow
    python -m playwright install chromium
    python tools/make-icons.py            # writes icons/
    python tools/make-icons.py --preview  # also writes tools/preview.png

The preview shows the new PNGs at Home Screen size on a light and a dark
wallpaper with iOS's rounded corners, the maskable icon in Android's circle,
and the browser-tab icon.

Keep the art inside the middle ~80% of the square: iOS rounds the corners,
and Android's maskable icon crops to a circle. The PNGs must stay opaque:
iOS composites any transparency onto black.

After publishing, delete and re-add the Home Screen shortcut on the
iPad/iPhone; iOS keeps showing the old icon otherwise.
"""
import io
import os
import sys
from urllib.parse import urlparse

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "icons")

# The page loads from this made-up origin and every request is answered from
# the repo, so tools/app-icon.js can import the game's art modules.
ORIGIN = "http://icons.test"
# pinned: the Windows registry can map .js to text/plain, which breaks modules
TYPES = {".js": "text/javascript", ".png": "image/png", ".woff2": "font/woff2"}
BLANK = "<!doctype html><meta charset='utf-8'><style>body{margin:0}svg{display:block}</style>"

# file, pixels, options for appIconSvg()
ICONS = [
    ("icon-180.png", 180, {}),  # index.html's apple-touch-icon: the Home Screen
    ("icon-192.png", 192, {}),  # the manifest's
    ("icon-512.png", 512, {}),
    ("icon-512-maskable.png", 512, {"maskable": True}),
    ("favicon-32.png", 32, {"small": True}),  # index.html's browser-tab icon
]


def serve(route):
    path = urlparse(route.request.url).path
    if path == "/":
        route.fulfill(content_type="text/html", body=BLANK)
        return
    f = os.path.join(ROOT, *path.lstrip("/").split("/"))
    if not os.path.isfile(f):
        route.fulfill(status=404, body="no such file: " + path)
        return
    with open(f, "rb") as fh:
        route.fulfill(content_type=TYPES.get(os.path.splitext(f)[1], "application/octet-stream"), body=fh.read())


def open_page(browser, scale=1):
    page = browser.new_page(device_scale_factor=scale)
    page.route(lambda url: url.startswith(ORIGIN + "/"), serve)
    page.goto(ORIGIN + "/")
    return page


def render(page, px, opts):
    page.set_viewport_size({"width": px, "height": px})
    page.evaluate(
        """async ([size, opts]) => {
            const { appIconSvg } = await import("/tools/app-icon.js");
            document.body.innerHTML = appIconSvg({ size, ...opts });
        }""",
        [px, opts],
    )
    png = page.screenshot(clip={"x": 0, "y": 0, "width": px, "height": px})
    return Image.open(io.BytesIO(png)).convert("RGB")  # opaque: iOS composites alpha onto black


def save(im, name):
    p = os.path.join(OUT, name)
    im.save(p, "PNG", optimize=True)
    print(f"icons/{name:24} {im.size[0]:>4}px {os.path.getsize(p) / 1024:6.1f} KB")


PREVIEW_STYLE = """<style>
  body { margin: 0; width: 640px; font: 500 13px "Segoe UI", system-ui, sans-serif; }
  .row { display: flex; gap: 44px; align-items: flex-end; padding: 24px 32px 18px; }
  .light { background: linear-gradient(135deg, #DCE7F1, #F1E6DA); }
  .dark { background: linear-gradient(135deg, #121522, #2A2342); }
  .app { display: flex; flex-direction: column; align-items: center; gap: 7px; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.5); }
  .app img { border-radius: 22.37%; display: block; }
  .other { background: #FFF6E9; align-items: center; }
  .round { border-radius: 50%; display: block; }
  .tab { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 10px; }
</style>"""


def write_preview(browser):
    def app(px):
        return f'<div class="app"><img src="/icons/icon-180.png" width="{px}" height="{px}" alt="">Landon\'s Games</div>'

    def tab(bg, fg):
        return (f'<div class="tab" style="background:{bg};color:{fg}">'
                '<img src="/icons/favicon-32.png" width="16" height="16" alt="">Landon\'s Game Room</div>')

    # iPad Home Screen icons are 76 points, iPhone ones 60
    html = (PREVIEW_STYLE
            + "".join(f'<div class="row {k}">{app(76)}{app(60)}</div>' for k in ("light", "dark"))
            + '<div class="row other"><img class="round" src="/icons/icon-512-maskable.png" width="96" height="96" alt="">'
            + tab("#FFFFFF", "#202124") + tab("#35363A", "#E8EAED") + "</div>")
    page = open_page(browser, scale=2)
    page.set_viewport_size({"width": 640, "height": 400})
    page.set_content(html)
    p = os.path.join(HERE, "preview.png")
    page.screenshot(path=p, full_page=True)
    print("tools/preview.png (not committed)")


def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = open_page(browser)
        for name, px, opts in ICONS:
            save(render(page, px, opts), name)
        if "--preview" in sys.argv:
            write_preview(browser)
        browser.close()


if __name__ == "__main__":
    main()
