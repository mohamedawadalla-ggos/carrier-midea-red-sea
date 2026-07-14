"""Generate deterministic Carrier–Midea Red Sea brand derivatives.

This script never redraws the supplied artwork. It crops, removes only the
border-connected light background, resizes down, and converts color modes.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
BRAND_ROOT = ROOT / "assets" / "brand"
PUBLIC_ROOT = ROOT / "public" / "brand"

CROPS = {
    "full": (52, 174, 1202, 1112),
    "signature": (52, 174, 1202, 820),
    "manufacturer-horizontal": (70, 188, 1190, 424),
    "business-wordmark": (66, 458, 1190, 814),
}


def flat_pixels(image: Image.Image):
    """Use Pillow's current flat-pixel API while remaining backward compatible."""
    flattened = getattr(image, "get_flattened_data", None)
    return flattened() if flattened else image.getdata()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def transparent_background(image: Image.Image) -> Image.Image:
    """Extract colored ink cleanly for use on white and light backgrounds."""
    rgb = image.convert("RGB")
    output_pixels: list[tuple[int, int, int, int]] = []
    for red, green, blue in flat_pixels(rgb):
        deltas = (255 - red, 255 - green, 255 - blue)
        alpha = max(deltas)
        if alpha <= 3:
            output_pixels.append((0, 0, 0, 0))
            continue
        # Undo the original white matte so antialiased edges retain brand color
        # instead of producing a pale fringe on transparent output.
        output_pixels.append(
            (
                max(0, 255 - round(deltas[0] * 255 / alpha)),
                max(0, 255 - round(deltas[1] * 255 / alpha)),
                max(0, 255 - round(deltas[2] * 255 / alpha)),
                alpha,
            )
        )
    rgba = Image.new("RGBA", rgb.size)
    rgba.putdata(output_pixels)
    return rgba


def ink_mask(image: Image.Image) -> Image.Image:
    """Build a monochrome mask from colored ink, leaving white cutouts open."""
    rgb = image.convert("RGB")
    alpha = Image.new("L", rgb.size)
    alpha.putdata(
        [
            max(0, min(255, round((255 - min(red, green, blue) - 3) * 1.5)))
            for red, green, blue in flat_pixels(rgb)
        ]
    )
    return alpha


def solid_variant(image: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    output = Image.new("RGBA", image.size, (*color, 0))
    output.putalpha(ink_mask(image))
    return output


def crop_with_padding(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    cropped = image.crop(box)
    pad_x = max(16, round(cropped.width * 0.025))
    pad_y = max(16, round(cropped.height * 0.04))
    canvas = Image.new("RGB", (cropped.width + 2 * pad_x, cropped.height + 2 * pad_y), "white")
    canvas.paste(cropped, (pad_x, pad_y))
    return canvas


def downscale(image: Image.Image, max_width: int) -> Image.Image:
    if image.width <= max_width:
        return image.copy()
    height = round(image.height * max_width / image.width)
    return image.resize((max_width, height), Image.Resampling.LANCZOS)


def save_png(image: Image.Image, path: Path, dpi: int = 300) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG", optimize=True, dpi=(dpi, dpi))


def add_record(records: list[dict[str, object]], path: Path, purpose: str) -> None:
    with Image.open(path) as image:
        records.append(
            {
                "path": path.relative_to(ROOT).as_posix(),
                "format": image.format,
                "mode": image.mode,
                "width": image.width,
                "height": image.height,
                "sha256": sha256(path),
                "purpose": purpose,
            }
        )


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def contact_sheet(previews: list[tuple[str, Image.Image]], path: Path) -> None:
    tile_width, tile_height = 680, 450
    sheet = Image.new("RGB", (tile_width * 2, tile_height * 4), "#eef3f6")
    draw = ImageDraw.Draw(sheet)
    for index, (label, artwork) in enumerate(previews):
        left = (index % 2) * tile_width
        top = (index // 2) * tile_height
        dark = "reversed" in label
        background = "#062b50" if dark else "white"
        draw.rounded_rectangle(
            (left + 18, top + 18, left + tile_width - 18, top + tile_height - 18),
            radius=10,
            fill=background,
            outline="#ccd9e0" if not dark else "#285675",
            width=2,
        )
        preview = artwork.copy()
        preview.thumbnail((tile_width - 90, tile_height - 105), Image.Resampling.LANCZOS)
        x = left + (tile_width - preview.width) // 2
        y = top + 55 + (tile_height - 105 - preview.height) // 2
        if preview.mode == "RGBA":
            sheet.paste(preview, (x, y), preview)
        else:
            sheet.paste(preview, (x, y))
        draw.text((left + 38, top + 30), label, fill="#08233a" if not dark else "white", font=font(19, True))
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, "PNG", optimize=True, dpi=(150, 150))


def generate(source: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(source)

    source_dir = BRAND_ROOT / "source"
    digital_dir = BRAND_ROOT / "digital"
    print_dir = BRAND_ROOT / "print"
    preview_dir = BRAND_ROOT / "previews"
    for directory in (source_dir, digital_dir, print_dir, preview_dir, PUBLIC_ROOT):
        directory.mkdir(parents=True, exist_ok=True)

    archived = source_dir / "carrier-midea-red-sea-approved-master.png"
    shutil.copy2(source, archived)
    master = Image.open(archived).convert("RGB")
    records: list[dict[str, object]] = []
    add_record(records, archived, "Untouched client-approved raster master")

    previews: list[tuple[str, Image.Image]] = []
    generated: dict[str, dict[str, Image.Image]] = {}
    for name, box in CROPS.items():
        white = crop_with_padding(master, box)
        transparent = transparent_background(white)
        grayscale = ImageOps.grayscale(white)
        black = solid_variant(white, (0, 0, 0))
        reversed_white = solid_variant(white, (255, 255, 255))
        generated[name] = {
            "white": white,
            "transparent": transparent,
            "grayscale": grayscale,
            "black": black,
            "reversed-white": reversed_white,
        }
        for treatment, artwork in generated[name].items():
            output = digital_dir / f"carrier-midea-red-sea-{name}-{treatment}.png"
            save_png(artwork, output)
            add_record(records, output, f"{name} lockup, {treatment} treatment")

        jpg_path = digital_dir / f"carrier-midea-red-sea-{name}-white.jpg"
        white.save(jpg_path, "JPEG", quality=95, optimize=True, progressive=True, dpi=(300, 300))
        add_record(records, jpg_path, f"{name} lockup, high-quality RGB JPEG")

    full_white = generated["full"]["white"]
    full_grayscale = generated["full"]["grayscale"]
    cmyk = full_white.convert("CMYK")
    cmyk_path = print_dir / "carrier-midea-red-sea-full-cmyk-300dpi.tif"
    cmyk_path.unlink(missing_ok=True)
    cmyk.save(cmyk_path, "TIFF", compression="tiff_lzw", dpi=(300, 300))
    add_record(records, cmyk_path, "Convenience CMYK print TIFF; proof before production")
    gray_path = print_dir / "carrier-midea-red-sea-full-grayscale-300dpi.tif"
    gray_path.unlink(missing_ok=True)
    full_grayscale.save(gray_path, "TIFF", compression="tiff_lzw", dpi=(300, 300))
    add_record(records, gray_path, "Grayscale print TIFF")
    pdf_path = print_dir / "carrier-midea-red-sea-full-rgb-300dpi.pdf"
    pdf_path.unlink(missing_ok=True)
    full_white.save(pdf_path, "PDF", resolution=300.0)
    records.append(
        {
            "path": pdf_path.relative_to(ROOT).as_posix(),
            "format": "PDF",
            "mode": "RGB raster",
            "width": full_white.width,
            "height": full_white.height,
            "sha256": sha256(pdf_path),
            "purpose": "Report and office-print PDF at 300 ppi effective size",
        }
    )

    web_exports = {
        "logo-full.png": downscale(generated["full"]["transparent"], 900),
        "logo-full-white.png": downscale(generated["full"]["white"], 900),
        "logo-signature.png": downscale(generated["signature"]["transparent"], 900),
        "logo-manufacturers.png": downscale(generated["manufacturer-horizontal"]["transparent"], 720),
        "logo-manufacturers-white.png": downscale(generated["manufacturer-horizontal"]["white"], 720),
        "logo-business-wordmark.png": downscale(generated["business-wordmark"]["transparent"], 720),
        "logo-signature-reversed.png": downscale(generated["signature"]["reversed-white"], 900),
    }
    for filename, artwork in web_exports.items():
        output = PUBLIC_ROOT / filename
        save_png(artwork, output, dpi=96)
        add_record(records, output, "Optimized local website derivative")

    previews.extend(
        [
            ("Full / color / white", generated["full"]["white"]),
            ("Full / color / transparent", generated["full"]["transparent"]),
            ("Signature / color", generated["signature"]["transparent"]),
            ("Manufacturers / horizontal", generated["manufacturer-horizontal"]["transparent"]),
            ("Business wordmark", generated["business-wordmark"]["transparent"]),
            ("Full / grayscale", generated["full"]["grayscale"]),
            ("Signature / black", generated["signature"]["black"]),
            ("Signature / reversed white", generated["signature"]["reversed-white"]),
        ]
    )
    sheet_path = preview_dir / "carrier-midea-red-sea-logo-contact-sheet.png"
    contact_sheet(previews, sheet_path)
    add_record(records, sheet_path, "Visual QA contact sheet")

    manifest = {
        "brand": "Carrier–Midea Red Sea / كاريير ميديا البحر الأحمر",
        "source": str(source),
        "sourceSha256": sha256(archived),
            "method": "Deterministic crops, non-white ink extraction for light backgrounds, downscaling, and color-mode conversion only",
        "limitations": [
            "The supplied master is raster, not an editable vector file.",
            "Full-color transparent files are for white or very light backgrounds; use reversed-white files on dark backgrounds.",
            "CMYK conversion is generic and must be press-proofed; no official CMYK or Pantone values were supplied.",
            "No generated file should be enlarged beyond its effective 300 ppi print size without approval.",
        ],
        "files": records,
    }
    manifest_path = BRAND_ROOT / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(records)} assets plus {manifest_path.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="Path to the approved PNG master")
    args = parser.parse_args()
    generate(args.source.resolve())


if __name__ == "__main__":
    main()
