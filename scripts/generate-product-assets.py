"""Generate deterministic product-catalog derivatives without redrawing products.

Transparent sources are cropped to their alpha bounds. Opaque sources use either
an edge-connected white matte or a conservative unchanged source panel when a
safe separation is not possible. Assets are resized with Lanczos and composited
over a fixed studio canvas with a shadow derived from the resulting alpha channel.
No generative image model or content-aware reconstruction is used.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps, ImageStat


ROOT = Path(__file__).resolve().parents[1]
CANVAS_SIZE = (1600, 1200)
BACKGROUND = "#f5f7f8"
MAX_OBJECT_SIZE = (1280, 840)
MAX_UPSCALE = 1.25
SHADOW_OFFSET_Y = 24
SHADOW_BLUR = 22
SHADOW_OPACITY = 42
OPTION_SHADOW_OFFSET_Y = 28
OPTION_SHADOW_BLUR = 24
OPTION_SHADOW_OPACITY = 50
SOLID_BLUE_MILK = "#eaf3f8"
GRADIENT_BLUE_MILK_START = "#e6f1f7"
GRADIENT_BLUE_MILK_END = "#f7fafc"


@dataclass(frozen=True)
class ProductAsset:
    family_id: str
    brand: str
    slug: str
    source_path: str
    source_page: str
    original_image_url: str
    match: str
    authorization: str
    nael_approval: str


@dataclass(frozen=True)
class BatchSpec:
    asset: ProductAsset
    device_type: str
    strategy: str
    max_object_size: tuple[int, int]
    y_offset: int = 0
    max_upscale: float = 1.0
    matte_threshold: int = 246
    detail_regions: tuple[tuple[str, tuple[float, float, float, float]], ...] = ()


@dataclass(frozen=True)
class RevisionSpec:
    family_id: str
    strategy: str
    scale_multiplier: float = 1.0
    matte_transition: int = 260


PILOT = ProductAsset(
    family_id="carrier-xcool-inverter",
    brand="carrier",
    slug="xcool-inverter",
    source_path="public/products/families/carrier/xcool-inverter.png",
    source_page="https://miraco.com.eg/en/53kheft18dn8-708f",
    original_image_url=(
        "https://mcprod.miraco.com.eg/media/catalog/product/cache/"
        "8ddeeed85c51e5e61315f40dbec60ae7/1/-/1-5_left1.png"
    ),
    match="Exact family/variant",
    authorization="Approved",
    nael_approval="Approved manifest",
)


WALL_DETAILS = (
    ("LOGO", (0.03, 0.30, 0.30, 0.72)),
    ("DISPLAY / MARK", (0.68, 0.18, 0.98, 0.66)),
    ("VANES / EDGE", (0.22, 0.55, 0.82, 0.98)),
)
COMPOSITE_DETAILS = (
    ("INDOOR LOGO / EDGE", (0.02, 0.02, 0.55, 0.42)),
    ("OUTDOOR BADGE", (0.52, 0.44, 0.98, 0.92)),
    ("FAN / OUTER EDGE", (0.22, 0.42, 0.72, 0.98)),
)
DUCT_DETAILS = (
    ("LOGO", (0.28, 0.22, 0.66, 0.68)),
    ("COIL / OPENING", (0.02, 0.02, 0.62, 0.38)),
    ("CONNECTION / EDGE", (0.66, 0.02, 0.99, 0.62)),
)
CASSETTE_DETAILS = (
    ("LOGO / LABEL", (0.33, 0.10, 0.70, 0.34)),
    ("GRILLE / VANE", (0.22, 0.28, 0.78, 0.72)),
    ("OUTER EDGE", (0.68, 0.02, 0.99, 0.42)),
)
FLOOR_DETAILS = (
    ("VANES", (0.02, 0.00, 0.96, 0.28)),
    ("LOGO / DISPLAY", (0.20, 0.18, 0.80, 0.48)),
    ("BODY EDGE", (0.62, 0.34, 0.99, 0.88)),
)


def product_asset(
    family_id: str,
    brand: str,
    slug: str,
    extension: str,
    page: str,
    image_url: str,
) -> ProductAsset:
    return ProductAsset(
        family_id=family_id,
        brand=brand,
        slug=slug,
        source_path=f"public/products/families/{brand}/{slug}.{extension}",
        source_page=page,
        original_image_url=image_url,
        match="Exact family/variant",
        authorization="Approved",
        nael_approval="Approved manifest",
    )


BATCH_SPECS = (
    BatchSpec(product_asset("carrier-optimax-inverter", "carrier", "optimax-inverter", "png", "https://miraco.com.eg/en/53qhabt36dn-708f-seer", "https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/o/p/optimax_inverter_4hp_1_1_1.png"), "wall-mounted", "source-alpha", (1320, 620), -18, 1.0, detail_regions=WALL_DETAILS),
    BatchSpec(product_asset("carrier-optimax-pro", "carrier", "optimax-pro", "png", "https://miraco.com.eg/ar/en/53khct18n", "https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/s/y/system_copy_1.png"), "wall-mounted-composite", "edge-connected-white-matte", (780, 860), -10, 1.25, 248, COMPOSITE_DETAILS),
    BatchSpec(product_asset("carrier-classicool-inverter", "carrier", "classicool-inverter", "webp", "https://miraco.com.eg/en/classicool-inverter", "https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/d/u/ducted_msp_hsp.jpg"), "concealed-ducted-composite", "edge-connected-white-matte", (1320, 900), 0, 1.0, 246, DUCT_DETAILS),
    BatchSpec(product_asset("carrier-classicool-pro", "carrier", "classicool-pro", "webp", "https://miraco.com.eg/en/classicool-pro", "https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/d/u/ducted_a6_1.jpg"), "concealed-ducted", "edge-connected-white-matte", (1320, 620), -12, 1.0, 246, DUCT_DETAILS),
    BatchSpec(product_asset("carrier-decor-inverter", "carrier", "decor-inverter", "webp", "https://miraco.com.eg/decor-inverter-heat-pump-53qcdt-dn", "https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/p/a/panel_d_cor_inverter_with_green_speed_intelligence_-_photo.jpg"), "ceiling-cassette", "conservative-opaque-panel", (930, 930), 0, 1.0, detail_regions=CASSETTE_DETAILS),
    BatchSpec(product_asset("carrier-elegant-inverter", "carrier", "elegant-inverter", "webp", "https://miraco.com.eg/53qfgdt60dn-708-skd-seer", "https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/4/2/42qfgdt60dn.jpg"), "floor-standing", "conservative-opaque-panel-low-resolution", (520, 1040), 0, 1.0, detail_regions=FLOOR_DETAILS),
    BatchSpec(product_asset("midea-ai-ecomaster-inverter", "midea", "ai-ecomaster-inverter", "webp", "https://miraco.com.eg/m1seft-18crdn8f-q8-ai-ecomaster-seer", "https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/1/8/18.jpg"), "wall-mounted", "conservative-opaque-panel", (1320, 720), -12, 1.0, detail_regions=WALL_DETAILS),
    BatchSpec(product_asset("midea-mission-inverter", "midea", "mission-inverter", "webp", "https://miraco.com.eg/ar/ar/m1sabt-30hrdnf-q8", "https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/s/y/system.jpg"), "wall-mounted-composite", "conservative-opaque-panel", (1120, 1020), 0, 1.0, detail_regions=COMPOSITE_DETAILS),
    BatchSpec(product_asset("midea-xtreme-pro", "midea", "xtreme-pro", "png", "https://miraco.com.eg/en/m1seft-18crn8f-q8-seer", "https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/m/_/m_2-25_right_1_6.png"), "wall-mounted", "source-alpha", (1320, 720), -12, 1.0, detail_regions=WALL_DETAILS),
)


REVISION_SPECS = (
    RevisionSpec("carrier-classicool-pro", "approved-scale-revision", 1.18),
    RevisionSpec("carrier-optimax-pro", "approved-scale-revision", 1.55),
    RevisionSpec("carrier-decor-inverter", "matte-extension"),
    RevisionSpec("carrier-elegant-inverter", "matte-extension"),
    RevisionSpec("midea-ai-ecomaster-inverter", "matte-extension"),
    RevisionSpec("midea-mission-inverter", "matte-extension"),
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def alpha_bbox(image: Image.Image, threshold: int = 16) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value >= threshold else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("Source image contains no visible pixels")
    return bbox


def archive_baseline(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        if sha256(destination) != sha256(source):
            raise RuntimeError(f"Refusing to replace changed baseline: {destination}")
        return
    shutil.copy2(source, destination)


def studio_derivative(
    source: Image.Image, background: str = BACKGROUND, add_shadow: bool = True
) -> tuple[Image.Image, dict[str, object]]:
    rgba = ImageOps.exif_transpose(source).convert("RGBA")
    bbox = alpha_bbox(rgba)
    product = rgba.crop(bbox)

    fit_scale = min(MAX_OBJECT_SIZE[0] / product.width, MAX_OBJECT_SIZE[1] / product.height)
    scale = min(fit_scale, MAX_UPSCALE)
    output_size = (round(product.width * scale), round(product.height * scale))
    if output_size != product.size:
        product = product.resize(output_size, Image.Resampling.LANCZOS)

    x = (CANVAS_SIZE[0] - product.width) // 2
    y = (CANVAS_SIZE[1] - product.height) // 2 - 18

    canvas = Image.new("RGBA", CANVAS_SIZE, background)
    if add_shadow:
        shadow_mask = Image.new("L", CANVAS_SIZE, 0)
        shadow_mask.paste(product.getchannel("A"), (x, y + SHADOW_OFFSET_Y))
        shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))
        shadow_mask = shadow_mask.point(lambda value: round(value * SHADOW_OPACITY / 255))
        shadow = Image.new("RGBA", CANVAS_SIZE, (12, 37, 54, 0))
        shadow.putalpha(shadow_mask)
        canvas.alpha_composite(shadow)
    canvas.alpha_composite(product, (x, y))

    return canvas.convert("RGB"), {
        "sourceCrop": list(bbox),
        "scale": round(scale, 6),
        "objectSize": list(product.size),
        "placement": [x, y],
        "canvasSize": list(CANVAS_SIZE),
        "background": background,
        "shadow": {
            "color": "#0c2536",
            "offsetY": SHADOW_OFFSET_Y,
            "blurRadius": SHADOW_BLUR,
            "maximumAlpha": SHADOW_OPACITY,
        },
    }


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def checkerboard(size: tuple[int, int], cell: int = 32) -> Image.Image:
    image = Image.new("RGB", size, "#f7f9fa")
    draw = ImageDraw.Draw(image)
    for top in range(0, size[1], cell):
        for left in range(0, size[0], cell):
            if (left // cell + top // cell) % 2:
                draw.rectangle((left, top, left + cell - 1, top + cell - 1), fill="#e1e7ea")
    return image


def fitted(image: Image.Image, size: tuple[int, int], background: str | None = None) -> Image.Image:
    canvas = Image.new("RGB", size, background or "white")
    preview = image.copy()
    preview.thumbnail((size[0] - 36, size[1] - 36), Image.Resampling.LANCZOS)
    left = (size[0] - preview.width) // 2
    top = (size[1] - preview.height) // 2
    if preview.mode == "RGBA":
        canvas.paste(preview, (left, top), preview)
    else:
        canvas.paste(preview, (left, top))
    return canvas


def overlay_before_after(source: Image.Image, transform: dict[str, object]) -> Image.Image:
    overlay = Image.new("RGBA", CANVAS_SIZE, "#f5f7f8")
    rgba = ImageOps.exif_transpose(source).convert("RGBA")

    before = rgba.copy()
    before.thumbnail((CANVAS_SIZE[0], CANVAS_SIZE[1]), Image.Resampling.LANCZOS)
    before_tint = Image.new("RGBA", before.size, (220, 43, 68, 0))
    before_tint.putalpha(before.getchannel("A").point(lambda value: round(value * 0.5)))
    overlay.alpha_composite(before_tint, ((CANVAS_SIZE[0] - before.width) // 2, (CANVAS_SIZE[1] - before.height) // 2))

    bbox = tuple(transform["sourceCrop"])
    after = rgba.crop(bbox)
    after = after.resize(tuple(transform["objectSize"]), Image.Resampling.LANCZOS)
    after_tint = Image.new("RGBA", after.size, (0, 132, 188, 0))
    after_tint.putalpha(after.getchannel("A").point(lambda value: round(value * 0.5)))
    overlay.alpha_composite(after_tint, tuple(transform["placement"]))

    draw = ImageDraw.Draw(overlay)
    draw.rounded_rectangle((50, 50, 620, 118), radius=22, fill=(255, 255, 255, 235))
    draw.text((75, 68), "RED: input framing   CYAN: normalized framing", fill="#18384d", font=font(25, True))
    return overlay.convert("RGB")


def render_catalog_card(product: Image.Image, viewport: str) -> Image.Image:
    mobile = viewport == "mobile"
    width = 390 if mobile else 1080
    height = 760 if mobile else 660
    canvas = Image.new("RGB", (width, height), "#eef4f7")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, width, 70), fill="#063767")
    draw.text((28, 22), "Carrier–Midea Red Sea", fill="white", font=font(22, True))

    columns = 1 if mobile else 3
    gap = 22
    margin = 24
    card_width = width - 2 * margin if mobile else (width - 2 * margin - gap * 2) // 3
    card_height = 570 if mobile else 520
    card_top = 100
    for index in range(columns):
        left = margin + index * (card_width + gap)
        draw.rounded_rectangle((left, card_top, left + card_width, card_top + card_height), radius=8, fill="white", outline="#d2e0e7", width=2)
        stage_height = 205 if mobile else 220
        draw.rectangle((left + 1, card_top + 1, left + card_width - 1, card_top + stage_height), fill="#e7f0f4")
        if index == 0:
            preview = product.copy()
            preview.thumbnail((card_width - 56, stage_height - 48), Image.Resampling.LANCZOS)
            px = left + (card_width - preview.width) // 2
            py = card_top + (stage_height - preview.height) // 2
            canvas.paste(preview, (px, py))
            draw.rounded_rectangle((left + 16, card_top + 16, left + 86, card_top + 43), radius=4, fill="white")
            draw.text((left + 27, card_top + 23), "CARRIER", fill="#1267b1", font=font(12, True))
            draw.text((left + 24, card_top + stage_height + 28), "XCOOL Inverter", fill="#0b2e47", font=font(25, True))
            draw.text((left + 24, card_top + stage_height + 68), "Multiple model configurations", fill="#5e7280", font=font(15))
            draw.rounded_rectangle((left + 24, card_top + stage_height + 110, left + 106, card_top + stage_height + 142), radius=16, outline="#d7e3e9")
            draw.text((left + 44, card_top + stage_height + 119), "R32", fill="#405c6d", font=font(13, True))
            button_top = card_top + card_height - 70
            button_width = (card_width - 56) // 2
            draw.rounded_rectangle((left + 20, button_top, left + 20 + button_width, button_top + 44), radius=4, fill="#d82632")
            draw.text((left + 35, button_top + 14), "Request Price", fill="white", font=font(13, True))
            draw.rounded_rectangle((left + 32 + button_width, button_top, left + card_width - 20, button_top + 44), radius=4, outline="#20b95a", width=2)
            draw.text((left + 48 + button_width, button_top + 14), "WhatsApp", fill="#168647", font=font(13, True))
        else:
            draw.rounded_rectangle((left + 45, card_top + 70, left + card_width - 45, card_top + 130), radius=10, fill="#d8e4e9")
            draw.rectangle((left + 24, card_top + stage_height + 30, left + card_width - 65, card_top + stage_height + 48), fill="#e7eef2")
            draw.rectangle((left + 24, card_top + stage_height + 64, left + card_width - 105, card_top + stage_height + 76), fill="#edf2f4")
    return canvas


def contact_sheet(
    source: Image.Image,
    white: Image.Image,
    gray: Image.Image,
    transform: dict[str, object],
    path: Path,
) -> None:
    sheet = Image.new("RGB", (2400, 2380), "#dfe8ed")
    draw = ImageDraw.Draw(sheet)
    draw.text((60, 38), "CARRIER XCOOL INVERTER — CATALOG PILOT CONTACT SHEET", fill="#082f4c", font=font(40, True))
    draw.text((60, 92), "Deterministic pixel workflow · card panels are layout previews, not browser captures · live catalog unchanged", fill="#486777", font=font(23))

    items = [
        ("01  INPUT BASELINE / ORIGINAL FRAMING", fitted(source.convert("RGBA"), (1080, 610), "#eef2f4")),
        ("02  NORMALIZED / WHITE BACKGROUND", fitted(white, (1080, 610), "white")),
        ("03  NORMALIZED / #F5F7F8 BACKGROUND", fitted(gray, (1080, 610), BACKGROUND)),
        ("04  OVERLAY BEFORE / AFTER", fitted(overlay_before_after(source, transform), (1080, 610), BACKGROUND)),
        ("05  CARD LAYOUT PREVIEW / DESKTOP 1080 PX", fitted(render_catalog_card(gray, "desktop"), (1080, 610), "#eef4f7")),
        ("06  CARD LAYOUT PREVIEW / MOBILE 390 PX", fitted(render_catalog_card(gray, "mobile"), (1080, 610), "#eef4f7")),
    ]
    for index, (label, preview) in enumerate(items):
        column = index % 2
        row = index // 2
        left = 60 + column * 1160
        top = 150 + row * 730
        draw.rounded_rectangle((left, top, left + 1100, top + 680), radius=14, fill="white", outline="#c5d4dc", width=2)
        draw.text((left + 24, top + 20), label, fill="#113c58", font=font(23, True))
        sheet.paste(preview, (left + 10, top + 60))
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, "PNG", optimize=True)


def file_record(path: Path, purpose: str) -> dict[str, object]:
    with Image.open(path) as image:
        return {
            "path": path.relative_to(ROOT).as_posix(),
            "purpose": purpose,
            "format": image.format,
            "mode": image.mode,
            "width": image.width,
            "height": image.height,
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
        }


def sha256_pixels(image: Image.Image) -> str:
    return hashlib.sha256(image.tobytes()).hexdigest()


def hex_rgb(value: str) -> tuple[int, int, int]:
    clean = value.lstrip("#")
    return tuple(int(clean[index : index + 2], 16) for index in (0, 2, 4))


def linear_gradient(size: tuple[int, int], start: str, end: str) -> Image.Image:
    start_rgb = hex_rgb(start)
    end_rgb = hex_rgb(end)
    gradient = Image.new("RGB", size)
    draw = ImageDraw.Draw(gradient)
    denominator = max(1, size[1] - 1)
    for y in range(size[1]):
        ratio = y / denominator
        color = tuple(round(start_rgb[channel] * (1 - ratio) + end_rgb[channel] * ratio) for channel in range(3))
        draw.line((0, y, size[0], y), fill=color)
    return gradient


def promotional_background(size: tuple[int, int]) -> Image.Image:
    base = linear_gradient(size, "#063767", "#1687bd").convert("RGBA")
    waves = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(waves)
    width, height = size
    specifications = [
        (0.56, 54, 0.0, (109, 205, 235, 38)),
        (0.68, 72, 0.8, (223, 247, 255, 30)),
        (0.79, 48, 1.7, (42, 151, 205, 46)),
    ]
    for center, amplitude, phase, color in specifications:
        upper: list[tuple[int, int]] = []
        lower: list[tuple[int, int]] = []
        for x in range(-20, width + 21, 20):
            y = round(height * center + math.sin(x / 190 + phase) * amplitude)
            upper.append((x, y - 24))
            lower.append((x, y + 24))
        draw.polygon(upper + list(reversed(lower)), fill=color)
    waves = waves.filter(ImageFilter.GaussianBlur(18))
    base.alpha_composite(waves)

    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((width * 0.55, -height * 0.18, width * 1.12, height * 0.72), fill=(129, 220, 245, 40))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    base.alpha_composite(glow)
    return base.convert("RGB")


def prepare_shared_product(source: Image.Image) -> tuple[Image.Image, dict[str, object], Image.Image]:
    rgba = ImageOps.exif_transpose(source).convert("RGBA")
    bbox = alpha_bbox(rgba)
    product = rgba.crop(bbox)
    fit_scale = min(MAX_OBJECT_SIZE[0] / product.width, MAX_OBJECT_SIZE[1] / product.height)
    scale = min(fit_scale, MAX_UPSCALE)
    output_size = (round(product.width * scale), round(product.height * scale))
    if output_size != product.size:
        product = product.resize(output_size, Image.Resampling.LANCZOS)
    placement = ((CANVAS_SIZE[0] - product.width) // 2, (CANVAS_SIZE[1] - product.height) // 2 - 18)
    layer = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    layer.alpha_composite(product, placement)
    transform = {
        "sourceCrop": list(bbox),
        "scale": round(scale, 6),
        "objectSize": list(product.size),
        "placement": list(placement),
        "canvasSize": list(CANVAS_SIZE),
    }
    return product, transform, layer


def composite_option(background: Image.Image, product: Image.Image, placement: tuple[int, int]) -> Image.Image:
    canvas = background.convert("RGBA")
    shadow_mask = Image.new("L", CANVAS_SIZE, 0)
    shadow_mask.paste(product.getchannel("A"), (placement[0], placement[1] + OPTION_SHADOW_OFFSET_Y))
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(OPTION_SHADOW_BLUR))
    shadow_mask = shadow_mask.point(lambda value: round(value * OPTION_SHADOW_OPACITY / 255))
    shadow = Image.new("RGBA", CANVAS_SIZE, (8, 38, 61, 0))
    shadow.putalpha(shadow_mask)
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(product, placement)
    return canvas.convert("RGB")


def zoom_layout_preview(image: Image.Image, factor: float = 1.1) -> Image.Image:
    crop_width = round(image.width / factor)
    crop_height = round(image.height / factor)
    left = (image.width - crop_width) // 2
    top = (image.height - crop_height) // 2
    return image.crop((left, top, left + crop_width, top + crop_height)).resize(image.size, Image.Resampling.LANCZOS)


def detail_zoom_comparison(options: list[tuple[str, Image.Image]]) -> Image.Image:
    canvas = Image.new("RGB", (1080, 610), "white")
    draw = ImageDraw.Draw(canvas)
    crop_specs = [
        ("Carrier logo", (400, 580, 550, 670)),
        ("Display / XCOOL", (1200, 450, 1350, 540)),
        ("Vanes", (700, 650, 850, 740)),
    ]
    for row, (option_name, image) in enumerate(options):
        top = row * 200
        draw.text((12, top + 78), option_name, fill="#123b56", font=font(18, True))
        for column, (label, box) in enumerate(crop_specs):
            crop = image.crop(box).resize((300, 180), Image.Resampling.NEAREST)
            left = 150 + column * 305
            canvas.paste(crop, (left, top + 10))
            draw.rectangle((left, top + 10, left + 299, top + 189), outline="#8fa9b7", width=2)
            draw.text((left + 8, top + 155), f"{label} · 200%", fill="#0d334d", font=font(14, True))
    return canvas


def option_overlay(product_layer: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", CANVAS_SIZE, "#eef5f8")
    alpha = product_layer.getchannel("A")
    for color in ((220, 38, 58), (23, 170, 94), (20, 122, 210)):
        tint = Image.new("RGBA", CANVAS_SIZE, (*color, 0))
        tint.putalpha(alpha.point(lambda value: round(value / 3)))
        canvas.alpha_composite(tint)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((52, 52, 720, 126), radius=20, fill=(255, 255, 255, 235))
    draw.text((78, 72), "RGB product masks: complete overlap", fill="#153a52", font=font(29, True))
    return canvas.convert("RGB")


def hero_banner_preview(product: Image.Image) -> Image.Image:
    background = promotional_background((1200, 628)).convert("RGBA")
    display = product.copy()
    display.thumbnail((720, 390), Image.Resampling.LANCZOS)
    x = 1200 - display.width - 55
    y = (628 - display.height) // 2
    mask = display.getchannel("A").filter(ImageFilter.GaussianBlur(16)).point(lambda value: round(value * 44 / 255))
    shadow = Image.new("RGBA", display.size, (4, 25, 43, 0))
    shadow.putalpha(mask)
    background.alpha_composite(shadow, (x, y + 18))
    background.alpha_composite(display, (x, y))
    draw = ImageDraw.Draw(background)
    draw.rounded_rectangle((55, 115, 440, 505), radius=24, fill=(5, 45, 82, 118), outline=(152, 222, 244, 85), width=2)
    draw.rectangle((92, 188, 352, 213), fill=(231, 248, 255, 215))
    draw.rectangle((92, 240, 300, 256), fill=(189, 230, 244, 190))
    draw.rectangle((92, 278, 340, 294), fill=(189, 230, 244, 155))
    draw.rounded_rectangle((92, 365, 245, 414), radius=6, fill=(216, 38, 50, 230))
    return background.convert("RGB")


def background_options_contact_sheet(
    source: Image.Image,
    option_one: Image.Image,
    option_two: Image.Image,
    option_three: Image.Image,
    product_layer: Image.Image,
    path: Path,
) -> None:
    sheet = Image.new("RGB", (3600, 3150), "#dce8ee")
    draw = ImageDraw.Draw(sheet)
    draw.text((60, 35), "CARRIER XCOOL INVERTER — BACKGROUND OPTIONS", fill="#082f4c", font=font(43, True))
    draw.text((60, 92), "Deterministic background-only comparison · one shared product layer · no generative edits", fill="#486777", font=font(24))

    detail = detail_zoom_comparison([("OPTION 1", option_one), ("OPTION 2", option_two), ("OPTION 3", option_three)])
    desktop_one = render_catalog_card(zoom_layout_preview(option_one), "desktop")
    desktop_two = render_catalog_card(zoom_layout_preview(option_two), "desktop")
    mobile_one = render_catalog_card(zoom_layout_preview(option_one), "mobile")
    mobile_two = render_catalog_card(zoom_layout_preview(option_two), "mobile")
    hero = hero_banner_preview(product_layer.crop(alpha_bbox(product_layer)))

    items = [
        ("01  INPUT BASELINE", fitted(source.convert("RGBA"), (1080, 610), "#edf2f4"), "Current approved local input · transparent PNG"),
        ("02  OPTION 1 · SOLID BLUE MILK", fitted(option_one, (1080, 610), SOLID_BLUE_MILK), "Background: #EAF3F8"),
        ("03  OPTION 2 · BLUE MILK GRADIENT", fitted(option_two, (1080, 610), GRADIENT_BLUE_MILK_END), "Gradient: #E6F1F7 → #F7FAFC · preferred catalog direction"),
        ("04  OPTION 3 · PROMOTIONAL BLUE", fitted(option_three, (1080, 610), "#0a5587"), "Background: #063767 → #1687BD · abstract waves · promotional only"),
        ("05  DETAILS / LOGOS / DISPLAY / VANES", detail, "Three identical 200% crops; background is the only visual variable"),
        ("06  PRODUCT GEOMETRY OVERLAY", fitted(option_overlay(product_layer), (1080, 610), "#eef5f8"), "Red + green + blue Alpha masks fully overlap"),
        ("07  DESKTOP CARD · OPTION 1", fitted(desktop_one, (1080, 610), "#eef4f7"), "Layout preview: product appearance enlarged 10%"),
        ("08  DESKTOP CARD · OPTION 2", fitted(desktop_two, (1080, 610), "#eef4f7"), "Layout preview: product appearance enlarged 10%"),
        ("09  HERO / FACEBOOK BANNER · OPTION 3", fitted(hero, (1080, 610), "#0b4f7d"), "1200×628 promotional layout preview · not for catalog cards"),
        ("10  MOBILE 390 PX · OPTION 1", fitted(mobile_one, (1080, 610), "#eef4f7"), "Layout preview: #EAF3F8 · product appearance enlarged 10%"),
        ("11  MOBILE 390 PX · OPTION 2", fitted(mobile_two, (1080, 610), "#eef4f7"), "Layout preview: #E6F1F7 → #F7FAFC · product enlarged 10%"),
        ("12  CONTROL SUMMARY", fitted(option_overlay(product_layer), (1080, 610), "#eef5f8"), "Canvas 1600×1200 · shared RGBA layer · shared placement · Alpha-derived shadow"),
    ]
    for index, (label, preview, footer) in enumerate(items):
        column = index % 3
        row = index // 3
        left = 60 + column * 1170
        top = 150 + row * 740
        draw.rounded_rectangle((left, top, left + 1120, top + 700), radius=14, fill="white", outline="#bfd1db", width=2)
        draw.text((left + 22, top + 18), label, fill="#103b57", font=font(23, True))
        sheet.paste(preview, (left + 20, top + 60))
        draw.text((left + 24, top + 665), footer, fill="#456474", font=font(17))
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, "PNG", optimize=True)


def connected_white_matte(image: Image.Image, threshold: int) -> Image.Image:
    """Remove only near-white pixels connected to the source border."""
    rgb = image.convert("RGB")
    channels = [channel.point(lambda value: 255 if value >= threshold else 0) for channel in rgb.split()]
    candidate = ImageChops.multiply(ImageChops.multiply(channels[0], channels[1]), channels[2])
    flood = candidate.copy()
    seeds: list[tuple[int, int]] = []
    step = 16
    for x in range(0, flood.width, step):
        seeds.extend(((x, 0), (x, flood.height - 1)))
    for y in range(0, flood.height, step):
        seeds.extend(((0, y), (flood.width - 1, y)))
    for seed in seeds:
        if flood.getpixel(seed) == 255:
            ImageDraw.floodfill(flood, seed, 128, thresh=0)
    background = flood.point(lambda value: 255 if value == 128 else 0)
    background = background.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    return ImageOps.invert(background)


def batch_product_layer(source: Image.Image, spec: BatchSpec) -> tuple[Image.Image, dict[str, object]]:
    transposed = ImageOps.exif_transpose(source)
    source_size = transposed.size
    if spec.strategy == "source-alpha":
        rgba = transposed.convert("RGBA")
        crop = alpha_bbox(rgba)
        product = rgba.crop(crop)
    elif spec.strategy == "edge-connected-white-matte":
        rgba = transposed.convert("RGBA")
        rgba.putalpha(connected_white_matte(transposed, spec.matte_threshold))
        crop = alpha_bbox(rgba, threshold=8)
        product = rgba.crop(crop)
    else:
        crop = (0, 0, transposed.width, transposed.height)
        product = transposed.convert("RGBA")

    fit = min(spec.max_object_size[0] / product.width, spec.max_object_size[1] / product.height)
    scale = min(fit, spec.max_upscale)
    output_size = (max(1, round(product.width * scale)), max(1, round(product.height * scale)))
    if output_size != product.size:
        product = product.resize(output_size, Image.Resampling.LANCZOS)

    contrast = 1.0
    if spec.asset.slug in {"optimax-pro", "elegant-inverter"}:
        contrast = 1.02
        alpha = product.getchannel("A")
        adjusted = ImageEnhance.Contrast(product.convert("RGB")).enhance(contrast)
        product = adjusted.convert("RGBA")
        product.putalpha(alpha)

    x = (CANVAS_SIZE[0] - product.width) // 2
    y = (CANVAS_SIZE[1] - product.height) // 2 + spec.y_offset
    layer = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    layer.alpha_composite(product, (x, y))
    return layer, {
        "strategy": spec.strategy,
        "deviceType": spec.device_type,
        "sourceSize": list(source_size),
        "sourceCrop": list(crop),
        "scale": round(scale, 6),
        "objectSize": list(product.size),
        "placement": [x, y],
        "canvasSize": list(CANVAS_SIZE),
        "background": {"type": "vertical-linear-gradient", "start": "#E6F1F7", "end": "#F7FAFC"},
        "matteThreshold": spec.matte_threshold if spec.strategy == "edge-connected-white-matte" else None,
        "contrastAdjustment": contrast,
        "sharpening": "None",
        "compositePreserved": "composite" in spec.device_type,
    }


def composite_batch_layer(layer: Image.Image) -> Image.Image:
    canvas = linear_gradient(CANVAS_SIZE, GRADIENT_BLUE_MILK_START, GRADIENT_BLUE_MILK_END).convert("RGBA")
    alpha = layer.getchannel("A")
    shadow_mask = Image.new("L", CANVAS_SIZE, 0)
    shadow_mask.paste(alpha, (0, 22))
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(20)).point(lambda value: round(value * 38 / 255))
    shadow = Image.new("RGBA", CANVAS_SIZE, (8, 38, 61, 0))
    shadow.putalpha(shadow_mask)
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(layer)
    return canvas.convert("RGB")


def batch_detail_strip(output: Image.Image, transform: dict[str, object], spec: BatchSpec) -> Image.Image:
    strip = Image.new("RGB", (2100, 450), "#eef5f8")
    draw = ImageDraw.Draw(strip)
    x, y = transform["placement"]
    width, height = transform["objectSize"]
    for index, (label, region) in enumerate(spec.detail_regions):
        left = round(x + region[0] * width)
        top = round(y + region[1] * height)
        right = round(x + region[2] * width)
        bottom = round(y + region[3] * height)
        crop = output.crop((left, top, right, bottom))
        crop = crop.resize((640, 340), Image.Resampling.NEAREST)
        panel_x = 30 + index * 690
        strip.paste(crop, (panel_x, 54))
        draw.rectangle((panel_x, 54, panel_x + 640, 394), outline="#7ba4b8", width=2)
        draw.text((panel_x, 14), f"{label} · 200%", fill="#103b57", font=font(20, True))
    return strip


def batch_family_preview(
    source: Image.Image,
    output: Image.Image,
    transform: dict[str, object],
    spec: BatchSpec,
    destination: Path,
) -> None:
    sheet = Image.new("RGB", (2200, 1700), "#dceaf1")
    draw = ImageDraw.Draw(sheet)
    draw.text((55, 35), f"{spec.asset.brand.upper()} · {spec.asset.slug.upper()} · BATCH PREVIEW", fill="#0c3b5b", font=font(36, True))
    draw.text((55, 88), f"Strategy: {spec.strategy} · Device type: {spec.device_type} · Gradient #E6F1F7 → #F7FAFC", fill="#456474", font=font(22))
    panels = (("INPUT BASELINE", fitted(source.convert("RGBA"), (1020, 780), "#f4f7f9"), 55), ("CATALOG PREVIEW", fitted(output, (1020, 780), "#eef5f8"), 1125))
    for label, preview, left in panels:
        draw.rounded_rectangle((left, 145, left + 1020, 965), radius=14, fill="white", outline="#b9ced8", width=2)
        draw.text((left + 20, 165), label, fill="#103b57", font=font(23, True))
        sheet.paste(preview, (left, 205))
    strip = batch_detail_strip(output, transform, spec)
    sheet.paste(strip, (50, 1020))
    note = "Composite preserved" if transform["compositePreserved"] else "Single unit preserved"
    draw.text((55, 1515), f"{note} · no generative edits · no logo redraw · no sharpening", fill="#244f67", font=font(22, True))
    draw.text((55, 1560), f"Object {transform['objectSize'][0]}×{transform['objectSize'][1]} at {transform['placement']} · source crop {transform['sourceCrop']}", fill="#456474", font=font(20))
    if spec.strategy.startswith("conservative-opaque-panel"):
        draw.text((55, 1605), "Opaque source retained as one panel because safe product/background separation is not reliable.", fill="#8a5a20", font=font(20, True))
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "PNG", compress_level=6)


def batch_contact_sheet(items: list[tuple[BatchSpec, Image.Image, dict[str, object]]], destination: Path) -> None:
    sheet = Image.new("RGB", (3420, 3300), "#dceaf1")
    draw = ImageDraw.Draw(sheet)
    draw.text((60, 32), "CATALOG BATCH PREVIEW · 9 EXISTING FAMILIES", fill="#0c3b5b", font=font(42, True))
    draw.text((60, 92), "Approved direction #E6F1F7 → #F7FAFC · preview only · no activation", fill="#456474", font=font(24))
    for index, (spec, output, transform) in enumerate(items):
        column, row = index % 3, index // 3
        left, top = 60 + column * 1120, 155 + row * 1030
        draw.rounded_rectangle((left, top, left + 1080, top + 980), radius=16, fill="white", outline="#b9ced8", width=2)
        draw.text((left + 24, top + 20), f"{index + 1:02d} · {spec.asset.brand.upper()} · {spec.asset.slug}", fill="#103b57", font=font(25, True))
        sheet.paste(fitted(output, (1030, 780), "#eef5f8"), (left + 25, top + 72))
        draw.text((left + 24, top + 870), f"{spec.device_type} · {spec.strategy}", fill="#456474", font=font(19))
        draw.text((left + 24, top + 910), f"Object {transform['objectSize'][0]}×{transform['objectSize'][1]} · no activation", fill="#456474", font=font(18))
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "PNG", compress_level=6)


FINAL_BATCH_FAMILY_IDS = {
    "carrier-optimax-inverter",
    "carrier-classicool-inverter",
    "midea-xtreme-pro",
}


def canonical_master_path(asset: ProductAsset) -> Path:
    return ROOT / "assets" / "products" / "derivatives" / "catalog" / asset.brand / f"{asset.slug}.png"


def generate_batch_previews() -> tuple[
    list[dict[str, object]],
    dict[str, object],
    dict[str, Image.Image],
]:
    records: list[dict[str, object]] = []
    contact_items: list[tuple[BatchSpec, Image.Image, dict[str, object]]] = []
    outputs: dict[str, Image.Image] = {}
    for spec in BATCH_SPECS:
        source = ROOT / spec.asset.source_path
        if not source.is_file():
            raise FileNotFoundError(source)
        baseline = ROOT / "assets" / "products" / "input-baseline" / spec.asset.brand / source.name
        archive_baseline(source, baseline)
        with Image.open(baseline) as opened:
            source_image = ImageOps.exif_transpose(opened).copy()
        layer, transform = batch_product_layer(source_image, spec)
        output = composite_batch_layer(layer)
        outputs[spec.asset.family_id] = output
        contact_items.append((spec, output, transform))
        files = {
            "inputBaseline": file_record(baseline, "Untouched input baseline copy"),
        }
        if spec.asset.family_id in FINAL_BATCH_FAMILY_IDS:
            png_output = canonical_master_path(spec.asset)
            png_output.parent.mkdir(parents=True, exist_ok=True)
            output.save(png_output, "PNG", compress_level=6)
            files["canonicalMasterPng"] = file_record(
                png_output,
                "Approved canonical high-quality catalog master PNG",
            )
        records.append({
            "familyId": spec.asset.family_id,
            "brand": spec.asset.brand,
            "slug": spec.asset.slug,
            "status": "approved-batch-derivative",
            "source": {
                "localPath": spec.asset.source_path,
                "officialPage": spec.asset.source_page,
                "originalImageUrl": spec.asset.original_image_url,
                "match": spec.asset.match,
                "authorization": spec.asset.authorization,
                "naelApproval": spec.asset.nael_approval,
                "sha256": sha256(source),
            },
            "transform": transform,
            "files": files,
            "detailInspection": {"zoom": "200%", "regions": [label for label, _ in spec.detail_regions]},
            "activation": (
                "Canonical master retained for production encoding"
                if spec.asset.family_id in FINAL_BATCH_FAMILY_IDS
                else "Superseded by an approved revision record; batch image retained in memory for audit sheet only"
            ),
        })
    global_preview = ROOT / "assets" / "products" / "previews" / "catalog-batch-preview.png"
    batch_contact_sheet(contact_items, global_preview)
    return records, file_record(global_preview, "General contact sheet for nine-family batch preview"), outputs


def edge_median_color(panel: Image.Image) -> tuple[int, int, int]:
    """Return the per-channel median from the untouched panel's outermost edge."""
    rgb = panel.convert("RGB")
    width, height = rgb.size
    edge = Image.new("RGB", (2 * width + 2 * height, 1))
    offset = 0
    for strip in (
        rgb.crop((0, 0, width, 1)),
        rgb.crop((0, height - 1, width, height)),
        rgb.crop((0, 0, 1, height)).transpose(Image.Transpose.ROTATE_90),
        rgb.crop((width - 1, 0, width, height)).transpose(Image.Transpose.ROTATE_90),
    ):
        edge.paste(strip, (offset, 0))
        offset += strip.width
    return tuple(round(value) for value in ImageStat.Stat(edge).median)


def matte_extension_background(
    panel_box: tuple[int, int, int, int],
    edge_color: tuple[int, int, int],
    transition: int,
) -> Image.Image:
    """Extend an edge median outside the panel, fading to the catalog gradient."""
    left, top, right, bottom = panel_box
    mask_bytes = bytearray(CANVAS_SIZE[0] * CANVAS_SIZE[1])
    index = 0
    for y in range(CANVAS_SIZE[1]):
        dy = top - y if y < top else y - (bottom - 1) if y >= bottom else 0
        for x in range(CANVAS_SIZE[0]):
            dx = left - x if x < left else x - (right - 1) if x >= right else 0
            if dx == 0 and dy == 0:
                alpha = 255
            else:
                distance = math.hypot(dx, dy)
                position = min(1.0, distance / transition)
                smooth = position * position * (3.0 - 2.0 * position)
                alpha = round(255 * (1.0 - smooth))
            mask_bytes[index] = alpha
            index += 1
    mask = Image.frombytes("L", CANVAS_SIZE, bytes(mask_bytes))
    gradient = linear_gradient(CANVAS_SIZE, GRADIENT_BLUE_MILK_START, GRADIENT_BLUE_MILK_END).convert("RGB")
    extension = Image.new("RGB", CANVAS_SIZE, edge_color)
    gradient.paste(extension, (0, 0), mask)
    return gradient


def scaled_revision_layer(
    base_layer: Image.Image,
    base_transform: dict[str, object],
    multiplier: float,
) -> tuple[Image.Image, dict[str, object]]:
    x, y = base_transform["placement"]
    width, height = base_transform["objectSize"]
    product = base_layer.crop((x, y, x + width, y + height))
    revised_size = (round(width * multiplier), round(height * multiplier))
    product = product.resize(revised_size, Image.Resampling.LANCZOS)
    revised_x = (CANVAS_SIZE[0] - revised_size[0]) // 2
    revised_y = (CANVAS_SIZE[1] - revised_size[1]) // 2 + round(base_transform["placement"][1] - (CANVAS_SIZE[1] - height) / 2)
    layer = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    layer.alpha_composite(product, (revised_x, revised_y))
    transform = dict(base_transform)
    transform.update({
        "strategy": "approved-scale-revision",
        "revisionScaleMultiplier": multiplier,
        "objectSize": list(revised_size),
        "placement": [revised_x, revised_y],
        "resampling": "Lanczos",
        "sharpening": "None",
    })
    return layer, transform


def matte_extension_revision(
    base_layer: Image.Image,
    base_output: Image.Image,
    base_transform: dict[str, object],
    transition: int,
) -> tuple[Image.Image, dict[str, object]]:
    x, y = base_transform["placement"]
    width, height = base_transform["objectSize"]
    panel_box = (x, y, x + width, y + height)
    panel = base_layer.crop(panel_box).convert("RGB")
    edge_color = edge_median_color(panel)
    output = matte_extension_background(panel_box, edge_color, transition)
    output.paste(panel, (x, y))
    before_pixels = base_output.crop(panel_box).convert("RGB")
    transform = dict(base_transform)
    transform.update({
        "strategy": "matte-extension",
        "matteExtension": {
            "scope": "Outside source panel only",
            "edgeMedianColor": "#%02X%02X%02X" % edge_color,
            "transitionPixels": transition,
            "panelShadow": "None",
            "featherInsidePanel": "None",
        },
        "panelPixelIntegrity": {
            "beforeSha256": sha256_pixels(before_pixels),
            "afterSha256": sha256_pixels(output.crop(panel_box)),
            "resizedSourcePanelSha256": sha256_pixels(panel),
            "exactMatch": (
                sha256_pixels(before_pixels)
                == sha256_pixels(output.crop(panel_box))
                == sha256_pixels(panel)
            ),
        },
    })
    if not transform["panelPixelIntegrity"]["exactMatch"]:
        raise AssertionError("Matte Extension changed pixels inside the source panel")
    return output, transform


def catalog_stage_preview(output: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Reproduce .product-stage + .product-image object-fit/padding at actual CSS pixels."""
    stage = linear_gradient(size, "#F7FBFD", "#EAF4F8").convert("RGB")
    inner = (max(1, size[0] - 56), max(1, size[1] - 56))
    rendered = ImageOps.contain(output.convert("RGB"), inner, Image.Resampling.LANCZOS)
    stage.paste(rendered, ((size[0] - rendered.width) // 2, (size[1] - rendered.height) // 2))
    return stage


def revision_family_preview(
    before: Image.Image,
    after: Image.Image,
    transform: dict[str, object],
    batch_spec: BatchSpec,
    revision_spec: RevisionSpec,
    destination: Path,
) -> None:
    sheet = Image.new("RGB", (2400, 2100), "#dceaf1")
    draw = ImageDraw.Draw(sheet)
    draw.text((60, 35), f"{batch_spec.asset.brand.upper()} · {batch_spec.asset.slug.upper()} · REVISION PREVIEW", fill="#0c3b5b", font=font(38, True))
    draw.text((60, 92), f"{revision_spec.strategy} · preview only · no activation · gradient #E6F1F7 → #F7FAFC", fill="#456474", font=font(22))
    for label, image, left in (("BEFORE", before, 60), ("AFTER", after, 1220)):
        draw.rounded_rectangle((left, 145, left + 1120, 935), radius=14, fill="white", outline="#b9ced8", width=2)
        draw.text((left + 22, 165), label, fill="#103b57", font=font(24, True))
        sheet.paste(fitted(image, (1080, 700), "#eef5f8"), (left + 20, 215))

    desktop = catalog_stage_preview(after, (380, 220))
    mobile = catalog_stage_preview(after, (336, 205))
    draw.text((60, 985), "DESKTOP CARD · ACTUAL 380×220 CSS PX", fill="#103b57", font=font(22, True))
    sheet.paste(desktop, (60, 1030))
    draw.rectangle((60, 1030, 440, 1250), outline="#7ba4b8", width=2)
    draw.text((900, 985), "MOBILE 390PX VIEWPORT · ACTUAL STAGE 336×205 CSS PX", fill="#103b57", font=font(22, True))
    sheet.paste(mobile, (900, 1030))
    draw.rectangle((900, 1030, 1236, 1235), outline="#7ba4b8", width=2)

    strip = batch_detail_strip(after, transform, batch_spec)
    sheet.paste(strip, (150, 1330))
    if revision_spec.strategy == "matte-extension":
        integrity = transform["panelPixelIntegrity"]
        note = f"Panel pixels before/after: EXACT · edge median {transform['matteExtension']['edgeMedianColor']} · no panel shadow"
    else:
        integrity = None
        note = f"Approved scale: {round((revision_spec.scale_multiplier - 1) * 100)}% larger · Lanczos · no sharpening"
    draw.text((60, 1815), note, fill="#244f67", font=font(22, True))
    draw.text((60, 1860), f"Object {transform['objectSize'][0]}×{transform['objectSize'][1]} at {transform['placement']} · source/device pixels not generatively altered", fill="#456474", font=font(20))
    if integrity:
        draw.text((60, 1905), f"Inside-panel SHA-256: {integrity['afterSha256']}", fill="#456474", font=font(18))
    if batch_spec.asset.slug == "optimax-pro":
        draw.text((60, 1950), "Low-resolution source retained honestly for comparison; no generative enhancement.", fill="#8a5a20", font=font(20, True))
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "PNG", compress_level=6)


def revision_contact_sheet(
    items: list[tuple[BatchSpec, Image.Image, Image.Image, dict[str, object], RevisionSpec]],
    destination: Path,
) -> None:
    sheet = Image.new("RGB", (3420, 2350), "#dceaf1")
    draw = ImageDraw.Draw(sheet)
    draw.text((60, 32), "CATALOG REVISION PREVIEW · 6 FAMILIES", fill="#0c3b5b", font=font(42, True))
    draw.text((60, 92), "Before / after · Matte Extension outside panels only · actual-size card checks · no activation", fill="#456474", font=font(24))
    for index, (spec, before, after, transform, revision) in enumerate(items):
        column, row = index % 3, index // 3
        left, top = 60 + column * 1120, 155 + row * 1060
        draw.rounded_rectangle((left, top, left + 1080, top + 1005), radius=16, fill="white", outline="#b9ced8", width=2)
        draw.text((left + 24, top + 20), f"{index + 1:02d} · {spec.asset.brand.upper()} · {spec.asset.slug}", fill="#103b57", font=font(25, True))
        sheet.paste(fitted(before, (500, 650), "#eef5f8"), (left + 25, top + 72))
        sheet.paste(fitted(after, (500, 650), "#eef5f8"), (left + 555, top + 72))
        draw.text((left + 25, top + 735), "BEFORE", fill="#456474", font=font(18, True))
        draw.text((left + 555, top + 735), "AFTER", fill="#456474", font=font(18, True))
        desktop = catalog_stage_preview(after, (380, 220))
        mobile = catalog_stage_preview(after, (336, 205))
        sheet.paste(desktop, (left + 25, top + 780))
        sheet.paste(mobile, (left + 460, top + 795))
        status = "panel pixels exact" if revision.strategy == "matte-extension" else f"+{round((revision.scale_multiplier - 1) * 100)}%"
        draw.text((left + 825, top + 865), status, fill="#244f67", font=font(19, True))
        draw.text((left + 825, top + 905), "preview only", fill="#456474", font=font(18))
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "PNG", compress_level=6)


def generate_revision_previews() -> tuple[
    list[dict[str, object]],
    dict[str, object],
    dict[str, Image.Image],
]:
    batch_by_id = {spec.asset.family_id: spec for spec in BATCH_SPECS}
    records: list[dict[str, object]] = []
    contact_items: list[tuple[BatchSpec, Image.Image, Image.Image, dict[str, object], RevisionSpec]] = []
    outputs: dict[str, Image.Image] = {}
    for revision in REVISION_SPECS:
        spec = batch_by_id[revision.family_id]
        baseline = ROOT / "assets" / "products" / "input-baseline" / spec.asset.brand / Path(spec.asset.source_path).name
        with Image.open(baseline) as opened:
            source_image = ImageOps.exif_transpose(opened).copy()
        base_layer, base_transform = batch_product_layer(source_image, spec)
        before = composite_batch_layer(base_layer)
        if revision.strategy == "matte-extension":
            after, transform = matte_extension_revision(base_layer, before, base_transform, revision.matte_transition)
        else:
            revised_layer, transform = scaled_revision_layer(base_layer, base_transform, revision.scale_multiplier)
            after = composite_batch_layer(revised_layer)

        png_output = canonical_master_path(spec.asset)
        png_output.parent.mkdir(parents=True, exist_ok=True)
        after.save(png_output, "PNG", compress_level=6)
        outputs[revision.family_id] = after
        contact_items.append((spec, before, after, transform, revision))
        records.append({
            "familyId": revision.family_id,
            "brand": spec.asset.brand,
            "slug": spec.asset.slug,
            "status": "approved-revision-derivative",
            "strategy": revision.strategy,
            "transform": transform,
            "files": {
                "canonicalMasterPng": file_record(png_output, "Approved canonical high-quality catalog master PNG"),
            },
            "cardChecks": {
                "desktop": {"stageCssPixels": [380, 220], "imagePaddingCssPixels": 28},
                "mobile390Viewport": {"stageCssPixels": [336, 205], "imagePaddingCssPixels": 28},
            },
            "activation": "Canonical master is encoded directly to its stable production catalog path",
        })
    global_preview = ROOT / "assets" / "products" / "previews" / "catalog-revision-preview.png"
    revision_contact_sheet(contact_items, global_preview)
    return records, file_record(global_preview, "General before/after contact sheet for six-family revision preview"), outputs


def generate(asset: ProductAsset) -> None:
    source = ROOT / asset.source_path
    if not source.is_file():
        raise FileNotFoundError(source)

    baseline = ROOT / "assets" / "products" / "input-baseline" / asset.brand / source.name
    png_output = ROOT / "assets" / "products" / "derivatives" / "catalog" / asset.brand / f"{asset.slug}.png"
    preview_output = ROOT / "assets" / "products" / "previews" / asset.brand / f"{asset.slug}-contact-sheet.png"
    options_preview = ROOT / "assets" / "products" / "previews" / asset.brand / f"{asset.slug}-background-options.png"
    manifest_path = ROOT / "assets" / "products" / "manifest.json"

    archive_baseline(source, baseline)
    with Image.open(baseline) as image:
        derivative, transform = studio_derivative(image)
        white_derivative, _ = studio_derivative(image, background="#ffffff")
        input_image = image.convert("RGBA")
        shared_product, option_transform, product_layer = prepare_shared_product(image)

    placement = tuple(option_transform["placement"])
    option_one = composite_option(Image.new("RGB", CANVAS_SIZE, SOLID_BLUE_MILK), shared_product, placement)
    option_two = composite_option(linear_gradient(CANVAS_SIZE, GRADIENT_BLUE_MILK_START, GRADIENT_BLUE_MILK_END), shared_product, placement)
    option_three = composite_option(promotional_background(CANVAS_SIZE), shared_product, placement)

    png_output.parent.mkdir(parents=True, exist_ok=True)
    option_two.save(png_output, "PNG", compress_level=6)
    contact_sheet(input_image, white_derivative, derivative, transform, preview_output)
    background_options_contact_sheet(input_image, option_one, option_two, option_three, product_layer, options_preview)

    shared_product_record = {
        **option_transform,
        "productLayerSha256": sha256_pixels(product_layer),
        "alphaMaskSha256": sha256_pixels(product_layer.getchannel("A")),
        "shadow": {
            "color": "#08263D",
            "offsetY": OPTION_SHADOW_OFFSET_Y,
            "blurRadius": OPTION_SHADOW_BLUR,
            "maximumAlpha": OPTION_SHADOW_OPACITY,
        },
        "productPixelTreatment": "None; source crop and deterministic Lanczos resize only",
        "layoutPreviewScale": 1.1,
    }
    batch_records, batch_contact_record, batch_outputs = generate_batch_previews()
    revision_records, revision_contact_record, revision_outputs = generate_revision_previews()

    approved_images = {
        "carrier-xcool-inverter": option_two,
        "carrier-optimax-inverter": batch_outputs["carrier-optimax-inverter"],
        "carrier-optimax-pro": revision_outputs["carrier-optimax-pro"],
        "carrier-classicool-inverter": batch_outputs["carrier-classicool-inverter"],
        "carrier-classicool-pro": revision_outputs["carrier-classicool-pro"],
        "carrier-decor-inverter": revision_outputs["carrier-decor-inverter"],
        "carrier-elegant-inverter": revision_outputs["carrier-elegant-inverter"],
        "midea-ai-ecomaster-inverter": revision_outputs["midea-ai-ecomaster-inverter"],
        "midea-mission-inverter": revision_outputs["midea-mission-inverter"],
        "midea-xtreme-pro": batch_outputs["midea-xtreme-pro"],
    }
    family_index = {asset.family_id: asset}
    family_index.update({spec.asset.family_id: spec.asset for spec in BATCH_SPECS})
    activation_records: list[dict[str, object]] = []
    for family_id, approved_image in approved_images.items():
        family = family_index[family_id]
        approved_source = canonical_master_path(family)
        production = ROOT / "public" / "products" / "catalog" / family.brand / f"{family.slug}.webp"
        production.parent.mkdir(parents=True, exist_ok=True)
        approved_image.convert("RGB").save(production, "WEBP", quality=86, method=6, exact=True)
        activation_records.append({
            "familyId": family_id,
            "approvedSource": str(approved_source.relative_to(ROOT)).replace("\\", "/"),
            "approvedSourceSha256": sha256(approved_source),
            "productionPath": str(production.relative_to(ROOT)).replace("\\", "/"),
            "livePath": f"/products/catalog/{family.brand}/{family.slug}.webp",
            "bytes": production.stat().st_size,
            "sha256": sha256(production),
            "encoding": {"format": "WEBP", "quality": 86, "method": 6, "exact": True},
        })

    manifest = {
        "schemaVersion": 1,
        "status": "ten-approved-catalog-assets-local-test-only",
        "method": (
            "Deterministic source-alpha or conservative edge-connected white matte, "
            "family-specific Lanczos sizing, fixed gradient canvas, alpha-derived shadow, and "
            "outside-panel Matte Extension with exact inside-panel pixel verification; "
            "no generative or content-aware editing"
        ),
        "batchPreview": {
            "status": "approved-nine-family-batch",
            "scope": "Nine existing family images excluding the approved XCOOL pilot and three missing families",
            "background": {"type": "vertical-linear-gradient", "start": "#E6F1F7", "end": "#F7FAFC"},
            "families": [spec.asset.family_id for spec in BATCH_SPECS],
            "generalContactSheet": batch_contact_record,
            "activation": "Approved canonical masters are encoded directly to stable production catalog paths",
        },
        "revisionPreview": {
            "status": "approved-six-family-revision",
            "scope": "Six requested revisions only; three visually approved batch images remain unchanged",
            "families": [spec.family_id for spec in REVISION_SPECS],
            "background": {"type": "vertical-linear-gradient", "start": "#E6F1F7", "end": "#F7FAFC"},
            "generalContactSheet": revision_contact_record,
            "records": revision_records,
            "activation": "Approved canonical masters are encoded directly to stable production catalog paths",
        },
        "catalogActivation": {
            "status": "local-test-only",
            "approvedAt": "2026-07-16",
            "method": "Deterministic WebP encoding directly from the ten approved canonical master PNGs",
            "livePathRule": "/products/catalog/<brand>/<slug>.webp",
            "previewPathReferencesAllowedInLiveContent": False,
            "assets": activation_records,
        },
        "assets": [
            {
                "familyId": asset.family_id,
                "brand": asset.brand,
                "slug": asset.slug,
                "source": {
                    "localPath": asset.source_path,
                    "officialPage": asset.source_page,
                    "originalImageUrl": asset.original_image_url,
                    "match": asset.match,
                    "authorization": asset.authorization,
                    "naelApproval": asset.nael_approval,
                    "sha256": sha256(source),
                },
                "transform": transform,
                "pilotOptions": {
                    "status": "option-2-approved-for-local-visual-test",
                    "selectedOption": {
                        "id": "blue-milk-gradient",
                        "approval": "Client-approved catalog direction on 2026-07-15",
                        "background": {"type": "vertical-linear-gradient", "start": "#E6F1F7", "end": "#F7FAFC"},
                        "localTestPath": "/products/catalog/carrier/xcool-inverter.webp",
                        "publicationStatus": "Local visual test only; not published or generalized",
                    },
                    "sharedProduct": shared_product_record,
                    "options": [
                        {
                            "id": "solid-blue-milk",
                            "intendedUse": "historical-comparison-only-generated-in-memory",
                            "background": {"type": "solid", "color": "#EAF3F8"},
                        },
                        {
                            "id": "blue-milk-gradient",
                            "intendedUse": "approved-catalog-master",
                            "background": {"type": "vertical-linear-gradient", "start": "#E6F1F7", "end": "#F7FAFC"},
                            "canonicalMasterPng": file_record(png_output, "Approved canonical high-quality catalog master PNG"),
                        },
                        {
                            "id": "promotional-blue",
                            "intendedUse": "historical-advertising-comparison-only-generated-in-memory",
                            "background": {
                                "type": "deterministic-gradient-and-abstract-waves",
                                "start": "#063767",
                                "end": "#1687BD",
                                "externalReferenceCopied": False,
                            },
                        },
                    ],
                    "contactSheet": file_record(options_preview, "Background options contact sheet for visual approval"),
                    "detailInspection": {
                        "zoom": "200%",
                        "regions": ["Carrier logo", "display and XCOOL mark", "air vanes"],
                    },
                    "activation": "Local visual test only via content/product-families.ts; no deployment or catalog-wide rollout",
                },
                "files": [
                    file_record(baseline, "Untouched input baseline copy of the current approved local file"),
                    file_record(png_output, "Approved canonical high-quality catalog master PNG"),
                    file_record(preview_output, "Pilot contact sheet for visual approval"),
                ],
                "limitations": [
                    "Option 2 is referenced locally for XCOOL visual testing only; it has not been deployed or generalized.",
                    "The input baseline is the current approved local file, not a documented original master or independent proof of manufacturer licensing.",
                ],
            },
            *batch_records,
        ],
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pilot", choices=[PILOT.family_id], default=PILOT.family_id)
    parser.parse_args()
    generate(PILOT)


if __name__ == "__main__":
    main()
