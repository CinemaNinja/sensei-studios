#!/usr/bin/env python3
"""Cut a gold piece out of a raw photo and grade it for the site.

Usage (from the repo root):
    .venv/bin/python tools/cutout.py RAWPHOTOS/DSC06602.ARW --name feather-collar
    .venv/bin/python tools/cutout.py RAWPHOTOS/*.ARW

Each photo becomes images/float/<name>.png (transparent, 1700px wide).
Without --name the file is named after the photo.

One-time setup:
    python3 -m venv .venv && .venv/bin/pip install numpy opencv-python-headless

Tuned for yellow gold on a pale, low-color background (the pink suede tray).
Diamonds, opal, silver, and dark chains need a different key; shoot those on
matte medium gray and check the result before using it.
"""
import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "images" / "float"
OUT_WIDTH = 1700


def develop(raw: Path) -> np.ndarray:
    """Develop the raw with the macOS raw engine and return float BGR in 0..1."""
    with tempfile.TemporaryDirectory() as tmp:
        tiff = Path(tmp) / "dev.png"
        subprocess.run(
            ["sips", "-s", "format", "png", str(raw), "--out", str(tiff)],
            check=True,
            capture_output=True,
        )
        im = cv2.imread(str(tiff), cv2.IMREAD_UNCHANGED)
    if im is None:
        raise RuntimeError(f"could not develop {raw}")
    scale = 65535.0 if im.dtype == np.uint16 else 255.0
    return im[:, :, :3].astype(np.float32) / scale


def ellipse(size: int) -> np.ndarray:
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (size, size))


def tighten(matte: np.ndarray) -> np.ndarray:
    matte = cv2.GaussianBlur(matte, (0, 0), 0.9)
    return np.clip((matte - 0.22) / (0.78 - 0.22), 0, 1)


def cut(img: np.ndarray):
    """Return (foreground BGR, alpha) cropped around the piece."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2Lab)
    L, a, b = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]

    # Find the piece: the largest yellow region once leaf gaps are bridged.
    seed = ((b > 12) & (a < 2.0)).astype(np.uint8)
    joined = cv2.morphologyEx(seed, cv2.MORPH_CLOSE, ellipse(15))
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(joined, connectivity=8)
    if n < 2:
        raise RuntimeError("no gold found in this photo")
    big = int(np.argmax(stats[1:, 4])) + 1
    body = (lbl == big).astype(np.uint8)
    x, y, w, h, _ = stats[big]
    pad = 50
    H, W = L.shape
    x0, y0 = max(0, x - pad), max(0, y - pad)
    x1, y1 = min(W, x + w + pad), min(H, y + h + pad)
    roi = cv2.dilate(body, ellipse(41))

    # Gold is yellow relative to its own brightness, so shaded gold still
    # counts and bright suede does not. The hue gate rejects the warm cast
    # shadow the piece throws on the tray.
    ratio = b / np.maximum(L, 15.0)
    hue = np.degrees(np.arctan2(b, a))
    base = np.clip((ratio - 0.17) / (0.30 - 0.17), 0, 1)
    strict = base * np.clip((hue - 89.0) / (97.0 - 89.0), 0, 1)
    loose = base * np.clip((4.5 - a) / 3.0, 0, 1)
    strict[roi == 0] = 0
    loose[roi == 0] = 0
    strict = tighten(strict)
    loose = tighten(loose)

    # Drop specks that are not part of the piece.
    hard = (strict > 0.5).astype(np.uint8)
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(hard, connectivity=8)
    keep = np.zeros(n, np.uint8)
    keep[1:] = stats[1:, 4] >= 300
    strict = strict * cv2.dilate(keep[lbl], ellipse(7))

    # Inside the piece's own outline, shaded metal and narrow slits stay
    # solid. Outside it, only clear gold survives.
    hard = (strict > 0.5).astype(np.uint8)
    closed = cv2.morphologyEx(hard, cv2.MORPH_CLOSE, ellipse(11))
    inside = cv2.GaussianBlur(closed.astype(np.float32), (0, 0), 0.8)
    shade = np.clip((52.0 - L) / 18.0, 0, 1)
    alpha = np.maximum(strict, np.maximum(loose, shade) * inside).astype(np.float32)

    # Edge color comes from the solid metal beside it, never from the tray.
    solid = (alpha > 0.92).astype(np.float32)
    num = cv2.GaussianBlur(img * solid[:, :, None], (0, 0), 2.2)
    den = cv2.GaussianBlur(solid, (0, 0), 2.2)
    fill = num / np.maximum(den[:, :, None], 1e-4)
    fg = img * solid[:, :, None] + fill * (1 - solid[:, :, None])

    alpha = alpha[y0:y1, x0:x1].copy()
    fg = fg[y0:y1, x0:x1].copy()

    # Pinholes inside the metal are closed with the gold around them.
    holes = (alpha < 0.5).astype(np.uint8)
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(holes, connectivity=4)
    small = np.zeros(n, np.uint8)
    small[1:] = stats[1:, 4] < 160
    pin = cv2.dilate(small[lbl], np.ones((3, 3), np.uint8)).astype(bool)
    solid = ((alpha > 0.92) & ~pin).astype(np.float32)
    num = cv2.GaussianBlur(fg * solid[:, :, None], (0, 0), 4.0)
    den = cv2.GaussianBlur(solid, (0, 0), 4.0)
    fill = num / np.maximum(den[:, :, None], 1e-4)
    fg[pin] = fill[pin]
    alpha[pin] = np.maximum(alpha[pin], np.clip(den[pin] * 3, 0, 1))
    return fg.astype(np.float32), alpha


def cut_white(img: np.ndarray, sculpture=False):
    """Lift a near-white field. Keeps the smoke, drops the white fringe."""
    dist = np.linalg.norm(img - 1.0, axis=2)
    alpha = np.clip((dist - 0.014) / 0.045, 0, 1).astype(np.float32)
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.55)
    h = alpha.shape[0]
    chroma = img.std(axis=2)
    light = img.mean(axis=2)
    if sculpture:
        rows = np.arange(h)[:, None]
        # Pale fringe and the floor under the base. Smoke stays in the top of the frame.
        fringe = (rows > h * 0.40) & (light > 0.72) & (chroma < 0.055)
        alpha[fringe] = 0
    # Pull white out of the wood edge only. Smoke is neutral, so leave it.
    edge = (alpha < 0.92) & (chroma > 0.045)
    fg = img.copy()
    a = np.clip(alpha, 1e-3, 1)
    fg[edge] = np.clip((img[edge] - (1.0 - a[edge, None])) / a[edge, None], 0, 1)
    return fg.astype(np.float32), alpha


def grade(fg: np.ndarray) -> np.ndarray:
    """Olive raw gold to warm yellow gold: deeper shadows, brighter faces."""
    lab = cv2.cvtColor(fg, cv2.COLOR_BGR2Lab)
    L, a, b = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]
    colored = np.clip(np.hypot(a, b) / 14.0, 0, 1)  # leave neutral shadow neutral
    t = np.clip((L - 46.0) * 1.5 + 56.0, 0, None)
    L2 = np.where(t > 80, 80 + (t - 80) * 0.45, t)  # soft shoulder keeps highlight detail
    out = np.dstack([np.clip(L2, 3, 97), a + 11.0 * colored, b * 1.75 + 3.0 * colored])
    return np.clip(cv2.cvtColor(out.astype(np.float32), cv2.COLOR_Lab2BGR), 0, 1)


def export(fg: np.ndarray, alpha: np.ndarray, path: Path) -> tuple:
    rgba = np.dstack([fg, alpha[:, :, None]])
    ys, xs = np.where(alpha > 0.03)
    pad = 14
    rgba = rgba[max(0, ys.min() - pad):ys.max() + pad, max(0, xs.min() - pad):xs.max() + pad]
    h, w = rgba.shape[:2]
    if w > OUT_WIDTH:
        # Premultiplied resize keeps the edges clean.
        pm = rgba.copy()
        pm[:, :, :3] *= pm[:, :, 3:4]
        pm = cv2.resize(pm, (OUT_WIDTH, int(round(h * OUT_WIDTH / w))), interpolation=cv2.INTER_AREA)
        A = pm[:, :, 3:4]
        rgb = np.where(A > 1e-4, pm[:, :, :3] / np.maximum(A, 1e-4), 0)
        rgba = np.dstack([np.clip(rgb, 0, 1), A])
    png = (rgba * 255 + 0.5).astype(np.uint8)
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), png, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    return png.shape[1], png.shape[0]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("photos", nargs="+", type=Path)
    parser.add_argument("--name", help="output name (only with a single photo)")
    parser.add_argument("--out-dir", type=Path, default=OUT_DIR)
    parser.add_argument("--white", action="store_true", help="key a white background instead of gold")
    args = parser.parse_args()
    if args.name and len(args.photos) > 1:
        parser.error("--name works with one photo at a time")

    failed = 0
    for photo in args.photos:
        name = args.name or photo.stem.lower()
        target = args.out_dir / f"{name}.png"
        try:
            developed = develop(photo)
            if args.white:
                fg, alpha = cut_white(developed, sculpture=True)
            else:
                fg, alpha = cut(developed)
                fg = grade(fg)
            width, height = export(fg, alpha, target)
        except Exception as err:  # keep going through a batch, report at the end
            failed += 1
            print(f"FAILED {photo.name}: {err}", file=sys.stderr)
            continue
        print(f"{photo.name} -> {target.relative_to(REPO) if target.is_relative_to(REPO) else target} ({width}x{height})")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
