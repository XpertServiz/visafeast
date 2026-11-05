"""
Builds every logo file the website uses from the owner's logo (design-reference/visafeast-logo.png).

Run from the project folder:   python scripts/make-brand-assets.py
(needs Python with Pillow and numpy.)

How it works: the logo is navy + orange + black lettering on white. Each pixel is split into "which logo colour" and
"how much of it", so the white background becomes truly see-through while the edges stay smooth. The logo's own colours are
never changed, except in the *-light files, where navy and black become white so the logo can sit on the navy header.
"""
import base64, io, json, os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "design-reference", "visafeast-logo.png")
PUB = os.path.join(ROOT, "public")
BRAND = os.path.join(PUB, "brand")
os.makedirs(BRAND, exist_ok=True)

src = Image.open(SRC).convert("RGB")
a = np.asarray(src).astype(np.float32)
H, W, _ = a.shape
lum = a.mean(axis=2)
yy = np.arange(H)[:, None] * np.ones((1, W))

def median(mask):
    return np.median(a[mask], axis=0)

NAVY = median((lum < 90) & (a[..., 0] < 70) & (a[..., 2] > a[..., 0] + 12) & (yy < 730))
ORANGE = median((a[..., 0] > 230) & (a[..., 1] > 90) & (a[..., 1] < 170) & (a[..., 2] < 70))
BLACK = median((lum < 40) & (yy > 740))
print("logo colours  navy", NAVY.round(), " orange", ORANGE.round(), " black", BLACK.round())
WHITE = np.array([255, 255, 255], np.float32)

# --- split every pixel into a logo colour and an amount of it
colours = [NAVY, ORANGE, BLACK]
best_err = np.full((H, W), 1e9, np.float32)
best_t = np.zeros((H, W), np.float32)
best_c = np.zeros((H, W), np.int8)
for i, c in enumerate(colours):
    d = c - WHITE
    t = np.clip(((a - WHITE) @ d) / float(d @ d), 0, 1)
    proj = WHITE + t[..., None] * d
    err = np.linalg.norm(a - proj, axis=2)
    better = err < best_err
    best_err[better], best_t[better], best_c[better] = err[better], t[better], i
alpha = np.where(best_t < 0.05, 0, best_t)

def build(reversed_: bool):
    pal = [c.copy() for c in colours]
    if reversed_:
        pal[0] = pal[2] = np.array([255, 255, 255], np.float32)
    rgb = np.zeros((H, W, 3), np.float32)
    for i, c in enumerate(pal):
        rgb[best_c == i] = c
    out = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")

normal, light = build(False), build(True)

# --- find the three parts: mark, lettering, tagline (separated by empty rows)
rows = (alpha > 0.08).any(axis=1)
groups, start = [], None
for y, on in enumerate(rows):
    if on and start is None: start = y
    if not on and start is not None:
        groups.append([start, y]); start = None
merged = []
for g in groups:
    if merged and g[0] - merged[-1][1] < 14: merged[-1][1] = g[1]
    else: merged.append(g)
print("logo parts (rows):", merged)
assert len(merged) == 3, "expected mark, lettering and tagline"

def box(y0, y1, pad=0):
    sub = alpha[y0:y1] > 0.08
    cols = np.where(sub.any(axis=0))[0]
    return (max(cols[0] - pad, 0), max(y0 - pad, 0), min(cols[-1] + 1 + pad, W), min(y1 + pad, H))

mark_box, word_box = box(*merged[0], pad=4), box(*merged[1], pad=2)
full_box = (min(mark_box[0], word_box[0], box(*merged[2])[0]), mark_box[1], max(mark_box[2], word_box[2], box(*merged[2])[2]), merged[2][1] + 4)

def crop(im, b): return im.crop(b)
def to_height(im, h): return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
def to_width(im, w): return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)

dims = {}
def save_webp(im, name, key=None):
    p = os.path.join(BRAND, name)
    im.save(p, "WEBP", quality=80, alpha_quality=85, method=6)
    if key: dims[key] = {"w": im.width, "h": im.height}
    print(f"  {name:28s} {im.width}x{im.height}  {os.path.getsize(p)/1024:.1f} KB")
def save_png(im, path):
    if im.mode == "RGBA" and im.width >= 192:  # fewer colours: the logo only has a handful, so the file gets 3-4x smaller
        im = im.quantize(colors=64, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    im.save(path, "PNG", optimize=True)
    print(f"  {os.path.relpath(path, PUB):28s} {im.width}x{im.height}  {os.path.getsize(path)/1024:.1f} KB")

print("website pieces")
mark, mark_l = to_height(crop(normal, mark_box), 132), to_height(crop(light, mark_box), 132)
word, word_l = to_width(crop(normal, word_box), 400), to_width(crop(light, word_box), 400)
save_webp(mark, "mark.webp", "mark"); save_webp(mark_l, "mark-light.webp")
save_webp(word, "wordmark.webp", "word"); save_webp(word_l, "wordmark-light.webp")

# --- icons: the mark on a white tile (visible on light and dark browser tabs)
def tile(size, mark_share, rounded, safe=1.0):
    big = 1024
    t = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    if rounded: d.rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * 0.2), fill=(255, 255, 255, 255))
    else: d.rectangle((0, 0, big, big), fill=(255, 255, 255, 255))
    m = crop(normal, mark_box)
    scale = min(big * mark_share * safe / m.width, big * mark_share * safe / m.height)
    m = m.resize((round(m.width * scale), round(m.height * scale)), Image.LANCZOS)
    t.alpha_composite(m, ((big - m.width) // 2, (big - m.height) // 2))
    return t.resize((size, size), Image.LANCZOS)

print("icons")
save_png(tile(512, 0.80, True), os.path.join(PUB, "icon-512.png"))
save_png(tile(192, 0.80, True), os.path.join(PUB, "icon-192.png"))
save_png(tile(512, 0.80, False, safe=0.78), os.path.join(PUB, "icon-maskable-512.png"))
save_png(tile(180, 0.78, False), os.path.join(PUB, "apple-touch-icon.png"))
save_png(tile(32, 0.86, True), os.path.join(PUB, "favicon-32.png"))
ico = [tile(s, 0.88, True) for s in (48, 32, 16)]
ico[0].save(os.path.join(PUB, "favicon.ico"), format="ICO", sizes=[(48, 48), (32, 32), (16, 16)], append_images=ico[1:])
print(f"  favicon.ico                  48+32+16  {os.path.getsize(os.path.join(PUB, 'favicon.ico'))/1024:.1f} KB")

# --- the logo for search engines and sharing (white background, square and wide)
full = crop(normal, full_box)
sq = Image.new("RGB", (512, 512), "white")
f = to_height(full, 400) if full.height >= full.width else to_width(full, 400)
f = f if f.width <= 440 else to_width(full, 440)
sq.paste(f, ((512 - f.width) // 2, (512 - f.height) // 2), f)
sq.save(os.path.join(PUB, "logo.jpg"), "JPEG", quality=90, optimize=True)
print(f"  logo.jpg                     512x512  {os.path.getsize(os.path.join(PUB, 'logo.jpg'))/1024:.1f} KB")
og = Image.new("RGB", (1200, 630), "white")
fo = to_height(full, 470)
og.paste(fo, ((1200 - fo.width) // 2, (630 - fo.height) // 2), fo)
og.save(os.path.join(PUB, "og-image.jpg"), "JPEG", quality=88, optimize=True)
print(f"  og-image.jpg                 1200x630  {os.path.getsize(os.path.join(PUB, 'og-image.jpg'))/1024:.1f} KB")

# --- emails: a navy banner with the white-and-gold logo (PNG, because email programs do not all read WebP)
mh, wh = 56, 26
bm, bw = to_height(crop(light, mark_box), mh * 2), to_height(crop(light, word_box), wh * 2)
banner = Image.new("RGBA", (1200, 156), (10, 26, 51, 255))
x = 48
banner.alpha_composite(bm, (x, (156 - bm.height) // 2)); x += bm.width + 26
banner.alpha_composite(bw, (x, (156 - bw.height) // 2))
save_png(banner.convert("RGB").quantize(colors=48, dither=Image.Dither.NONE), os.path.join(BRAND, "email-header.png"))

# --- small copies for PDFs and generated images, as text inside the code (no file reading at run time)
def data_uri(im):
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
pdf_mark, pdf_word = to_height(crop(light, mark_box), 150), to_width(crop(light, word_box), 360)
with open(os.path.join(ROOT, "lib", "brand-data.ts"), "w", encoding="utf-8") as fh:
    fh.write("// Made by scripts/make-brand-assets.py from the owner's logo. Do not edit by hand.\n")
    fh.write("// Used inside PDFs and generated images, which cannot read files from the website folder.\n")
    fh.write(f"export const MARK_LIGHT_DATA = \"{data_uri(pdf_mark)}\";\n")
    fh.write(f"export const WORDMARK_LIGHT_DATA = \"{data_uri(pdf_word)}\";\n")
    fh.write(f"export const PDF_MARK = {{ w: {pdf_mark.width}, h: {pdf_mark.height} }} as const;\n")
    fh.write(f"export const PDF_WORD = {{ w: {pdf_word.width}, h: {pdf_word.height} }} as const;\n")
with open(os.path.join(ROOT, "lib", "brand-dims.ts"), "w", encoding="utf-8") as fh:
    fh.write("// Made by scripts/make-brand-assets.py. Pixel sizes of the logo pieces, so pages reserve the right space.\n")
    fh.write("export const BRAND = " + json.dumps(dims) + " as const;\n")

# --- a contact sheet to look at
sheet = Image.new("RGB", (1500, 460), "#EDEDED")
def put(im, x, y, bg=None):
    if bg:
        sheet.paste(Image.new("RGB", (im.width + 40, im.height + 40), bg), (x - 20, y - 20))
    sheet.paste(im, (x, y), im)
put(to_height(crop(normal, mark_box), 150), 40, 40, "#FFFFFF"); put(to_height(crop(light, mark_box), 150), 260, 40, "#0A1A33")
put(to_width(crop(normal, word_box), 320), 40, 260, "#FFFFFF"); put(to_width(crop(light, word_box), 320), 420, 260, "#0A1A33")
x = 560
for s, name in [(180, "icon-512.png"), (120, "apple-touch-icon.png"), (64, "favicon-32.png"), (48, "favicon-32.png"), (32, "favicon-32.png"), (16, "favicon-32.png")]:
    im = Image.open(os.path.join(PUB, name)).convert("RGBA").resize((s, s), Image.LANCZOS)
    sheet.paste(im, (x, 40), im); x += s + 24
sheet.paste(Image.open(os.path.join(PUB, "og-image.jpg")).resize((400, 210)), (560, 240))
sheet.paste(banner.convert("RGB").resize((450, 56)), (990, 240))
sheet.save(os.path.join(os.environ.get("TEMP", "."), "brand-sheet.png"))
print("done")
