#!/usr/bin/env python3
"""Re-pack frogwiz atlas with tight per-frame crops and matte flood removal."""
from __future__ import annotations

import json
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
SHEET_PATH = ROOT / "public/assets/sprites/atlas/frogwiz_atlas.png"
JSON_PATH = ROOT / "public/data/atlas/frogwiz_atlas.json"
PAD = 2
COLS = 4


def is_matte(r: int, g: int, b: int, a: int) -> bool:
    if a < 12:
        return True
    if r > 235 and g > 235 and b > 235:
        return True
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    sat = max(r, g, b) - min(r, g, b)
    return luma > 198 and sat < 32


def flood_clear(img: Image.Image) -> Image.Image:
    px = img.load()
    w, h = img.size
    visited = [[False] * w for _ in range(h)]
    stack: list[tuple[int, int]] = []

    def seed(x: int, y: int) -> None:
        if visited[y][x]:
            return
        r, g, b, a = px[x, y]
        if not is_matte(r, g, b, a):
            return
        visited[y][x] = True
        stack.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while stack:
        x, y = stack.pop()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                seed(nx, ny)
    return img


def defringe(img: Image.Image) -> None:
    px = img.load()
    w, h = img.size
    clear: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            touches = False
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if nx < 0 or ny < 0 or nx >= w or ny >= h or px[nx, ny][3] == 0:
                    touches = True
                    break
            if not touches:
                continue
            luma = 0.299 * r + 0.587 * g + 0.114 * b
            if luma > 190:
                clear.append((x, y))
    for x, y in clear:
        px[x, y] = (0, 0, 0, 0)


def trim_bounds(img: Image.Image, pad: int = 1) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def clean_frame(crop: Image.Image) -> Image.Image:
    out = crop.convert("RGBA").copy()
    flood_clear(out)
    defringe(out)
    defringe(out)
    return trim_bounds(out, 1)


def main() -> None:
    manifest = json.loads(JSON_PATH.read_text())
    sheet = Image.open(SHEET_PATH).convert("RGBA")

    cleaned: list[tuple[str, Image.Image]] = []
    for name, rect in manifest["frames"].items():
        x, y, w, h = rect["x"], rect["y"], rect["w"], rect["h"]
        crop = sheet.crop((x, y, x + w, y + h))
        frame = clean_frame(crop)
        cleaned.append((name, frame))
        print(f"{name:12} {w}x{h} -> {frame.width}x{frame.height}")

    max_w = max(im.width for _, im in cleaned)
    max_h = max(im.height for _, im in cleaned)
    cell_w = max_w + PAD * 2
    cell_h = max_h + PAD * 2
    rows = (len(cleaned) + COLS - 1) // COLS
    out_w = COLS * cell_w - PAD
    out_h = rows * cell_h - PAD

    atlas = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    frames_out: dict = {}

    for i, (name, frame) in enumerate(cleaned):
        col = i % COLS
        row = i // COLS
        ox = col * cell_w + PAD + (max_w - frame.width) // 2
        oy = row * cell_h + PAD + (max_h - frame.height) // 2
        atlas.paste(frame, (ox, oy), frame)
        frames_out[name] = {
            "x": ox,
            "y": oy,
            "w": frame.width,
            "h": frame.height,
            "col": col,
            "row": row,
        }

    meta = {
        **manifest["meta"],
        "size": {"w": out_w, "h": out_h},
        "cell": {"w": cell_w, "h": cell_h},
        "padding": PAD,
        "columns": COLS,
        "rows": rows,
        "anchor": "bottom-center",
        "trimmed": True,
    }

    out_json = {"meta": meta, "frames": frames_out}
    atlas.save(SHEET_PATH)
    JSON_PATH.write_text(json.dumps(out_json, indent=2) + "\n")
    print(f"\nWrote {SHEET_PATH.name} {out_w}x{out_h} and updated {JSON_PATH.name}")


if __name__ == "__main__":
    main()
