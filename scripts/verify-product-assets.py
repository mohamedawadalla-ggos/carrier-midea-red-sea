"""Verify deterministic product pilot files and their recorded hashes."""

from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageOps


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "products" / "manifest.json"
EXPECTED_SOURCE_SHA256 = "e0af1ff12af2e656a20accbec24751af1b8f772b1e838f879ab7433a76bfc3b1"
EXPECTED_CANVAS = (1600, 1200)
EXPECTED_OPTION_IDS = ["solid-blue-milk", "blue-milk-gradient", "promotional-blue"]
EXPECTED_LOCAL_TEST_PATH = "/products/catalog/carrier/xcool-inverter.webp"
EXPECTED_BATCH_FAMILY_IDS = [
    "carrier-optimax-inverter",
    "carrier-optimax-pro",
    "carrier-classicool-inverter",
    "carrier-classicool-pro",
    "carrier-decor-inverter",
    "carrier-elegant-inverter",
    "midea-ai-ecomaster-inverter",
    "midea-mission-inverter",
    "midea-xtreme-pro",
]
EXPECTED_REVISION_FAMILY_IDS = [
    "carrier-classicool-pro",
    "carrier-optimax-pro",
    "carrier-decor-inverter",
    "carrier-elegant-inverter",
    "midea-ai-ecomaster-inverter",
    "midea-mission-inverter",
]
EXPECTED_FINAL_BATCH_FAMILY_IDS = {
    "carrier-optimax-inverter",
    "carrier-classicool-inverter",
    "midea-xtreme-pro",
}
EXPECTED_REVISION_SIZES = {
    "carrier-classicool-pro": (1074, 395),
    "carrier-optimax-pro": (614, 572),
}
EXPECTED_LIVE_CATALOG_IDS = [
    "carrier-xcool-inverter",
    "carrier-optimax-inverter",
    "carrier-optimax-pro",
    "carrier-classicool-inverter",
    "carrier-classicool-pro",
    "carrier-decor-inverter",
    "carrier-elegant-inverter",
    "midea-ai-ecomaster-inverter",
    "midea-mission-inverter",
    "midea-xtreme-pro",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_pixels(image: Image.Image) -> str:
    return hashlib.sha256(image.tobytes()).hexdigest()


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest["status"] != "ten-approved-catalog-assets-local-test-only":
        raise AssertionError("Unexpected pilot status")
    if len(manifest["assets"]) != 10:
        raise AssertionError("Manifest must contain XCOOL plus nine batch-preview assets")

    asset = next(item for item in manifest["assets"] if item["familyId"] == "carrier-xcool-inverter")
    if asset["source"]["sha256"] != EXPECTED_SOURCE_SHA256:
        raise AssertionError("Approved source hash changed")

    for record in asset["files"]:
        path = ROOT / record["path"]
        if not path.is_file():
            raise FileNotFoundError(path)
        if sha256(path) != record["sha256"]:
            raise AssertionError(f"Hash mismatch: {path}")
        with Image.open(path) as image:
            if image.size != (record["width"], record["height"]):
                raise AssertionError(f"Dimension mismatch: {path}")
            if image.format != record["format"]:
                raise AssertionError(f"Format mismatch: {path}")

    baseline, png_output, contact_sheet = [ROOT / item["path"] for item in asset["files"]]
    if sha256(baseline) != EXPECTED_SOURCE_SHA256:
        raise AssertionError("Baseline is not byte-identical to the approved local source")
    with Image.open(png_output) as image:
        if image.size != EXPECTED_CANVAS or image.mode != "RGB" or image.format != "PNG":
            raise AssertionError(f"Unexpected canonical catalog master properties: {png_output}")
    with Image.open(contact_sheet) as image:
        if image.size != (2400, 2380) or image.mode != "RGB":
            raise AssertionError("Unexpected contact-sheet properties")

    pilot = asset["pilotOptions"]
    if pilot["status"] != "option-2-approved-for-local-visual-test":
        raise AssertionError("Unexpected background comparison status")
    selected = pilot["selectedOption"]
    if selected["id"] != "blue-milk-gradient" or selected["localTestPath"] != EXPECTED_LOCAL_TEST_PATH:
        raise AssertionError("Option 2 local-test selection is not recorded correctly")
    if [option["id"] for option in pilot["options"]] != EXPECTED_OPTION_IDS:
        raise AssertionError("Unexpected background option set")

    shared = pilot["sharedProduct"]
    with Image.open(baseline) as input_image:
        rgba = ImageOps.exif_transpose(input_image).convert("RGBA")
        product = rgba.crop(tuple(shared["sourceCrop"]))
        product = product.resize(tuple(shared["objectSize"]), Image.Resampling.LANCZOS)
        layer = Image.new("RGBA", EXPECTED_CANVAS, (0, 0, 0, 0))
        layer.alpha_composite(product, tuple(shared["placement"]))
    if sha256_pixels(layer) != shared["productLayerSha256"]:
        raise AssertionError("Shared product pixels changed")
    if sha256_pixels(layer.getchannel("A")) != shared["alphaMaskSha256"]:
        raise AssertionError("Shared product geometry/Alpha mask changed")
    if shared["layoutPreviewScale"] != 1.1:
        raise AssertionError("Layout preview must enlarge appearance by 10% only")

    geometry_records = set()
    for option in pilot["options"]:
        geometry_records.add((shared["productLayerSha256"], shared["alphaMaskSha256"], tuple(shared["objectSize"]), tuple(shared["placement"])))
        if option["id"] != "blue-milk-gradient" and any(key in option for key in ("png", "webp", "canonicalMasterPng")):
            raise AssertionError("Historical XCOOL alternatives must be generated in memory only")
    selected_option = next(option for option in pilot["options"] if option["id"] == "blue-milk-gradient")
    selected_master = selected_option["canonicalMasterPng"]
    if selected_master["path"] != str(png_output.relative_to(ROOT)).replace("\\", "/"):
        raise AssertionError("XCOOL selected option does not reference the canonical master PNG")
    if len(geometry_records) != 1:
        raise AssertionError("Product geometry differs between options")

    options_sheet = ROOT / pilot["contactSheet"]["path"]
    if sha256(options_sheet) != pilot["contactSheet"]["sha256"]:
        raise AssertionError("Background options contact sheet hash mismatch")
    with Image.open(options_sheet) as image:
        if image.size != (3600, 3150) or image.mode != "RGB":
            raise AssertionError("Unexpected background-options contact-sheet properties")
    if pilot["detailInspection"]["zoom"] != "200%":
        raise AssertionError("Detail inspection must be recorded at 200%")

    content = (ROOT / "content" / "product-families.ts").read_text(encoding="utf-8")
    if f'familyImagePath: "{EXPECTED_LOCAL_TEST_PATH}"' not in content:
        raise AssertionError("XCOOL is not connected to the approved local-test image")

    batch = manifest["batchPreview"]
    if batch["status"] != "approved-nine-family-batch":
        raise AssertionError("Unexpected batch-preview status")
    if batch["families"] != EXPECTED_BATCH_FAMILY_IDS:
        raise AssertionError("Batch preview scope changed")
    general_sheet = ROOT / batch["generalContactSheet"]["path"]
    if sha256(general_sheet) != batch["generalContactSheet"]["sha256"]:
        raise AssertionError("General batch contact sheet hash mismatch")
    with Image.open(general_sheet) as image:
        if image.size != (3420, 3300) or image.mode != "RGB":
            raise AssertionError("Unexpected general batch contact sheet properties")

    batch_assets = [item for item in manifest["assets"] if item["familyId"] in EXPECTED_BATCH_FAMILY_IDS]
    if [item["familyId"] for item in batch_assets] != EXPECTED_BATCH_FAMILY_IDS:
        raise AssertionError("Batch asset order or membership changed")
    for item in batch_assets:
        if item["status"] != "approved-batch-derivative":
            raise AssertionError(f"Unexpected batch status: {item['familyId']}")
        source = ROOT / item["source"]["localPath"]
        baseline_record = item["files"]["inputBaseline"]
        baseline = ROOT / baseline_record["path"]
        if sha256(source) != item["source"]["sha256"] or sha256(baseline) != sha256(source):
            raise AssertionError(f"Input baseline changed: {item['familyId']}")
        for key, record in item["files"].items():
            path = ROOT / record["path"]
            if not path.is_file() or sha256(path) != record["sha256"] or path.stat().st_size != record["bytes"]:
                raise AssertionError(f"Missing or changed {key}: {path}")
            with Image.open(path) as image:
                if image.size != (record["width"], record["height"]) or image.format != record["format"]:
                    raise AssertionError(f"Unexpected file properties: {path}")
        expected_file_keys = {"inputBaseline", "canonicalMasterPng"} if item["familyId"] in EXPECTED_FINAL_BATCH_FAMILY_IDS else {"inputBaseline"}
        if set(item["files"]) != expected_file_keys:
            raise AssertionError(f"Unexpected retained batch files: {item['familyId']}")
        if "canonicalMasterPng" in item["files"]:
            with Image.open(ROOT / item["files"]["canonicalMasterPng"]["path"]) as image:
                if image.size != EXPECTED_CANVAS or image.mode != "RGB" or image.format != "PNG":
                    raise AssertionError(f"Unexpected batch canonical master: {item['familyId']}")
        if item["detailInspection"]["zoom"] != "200%":
            raise AssertionError(f"Missing 200% detail inspection: {item['familyId']}")
        preview_path = f'/products/catalog-preview/{item["brand"]}/{item["slug"]}.webp'
        if preview_path in content:
            raise AssertionError(f"Batch preview was activated: {item['familyId']}")

    revision = manifest["revisionPreview"]
    if revision["status"] != "approved-six-family-revision":
        raise AssertionError("Unexpected revision-preview status")
    if revision["families"] != EXPECTED_REVISION_FAMILY_IDS:
        raise AssertionError("Revision preview scope changed")
    if [item["familyId"] for item in revision["records"]] != EXPECTED_REVISION_FAMILY_IDS:
        raise AssertionError("Revision record order or membership changed")
    revision_sheet = ROOT / revision["generalContactSheet"]["path"]
    if sha256(revision_sheet) != revision["generalContactSheet"]["sha256"]:
        raise AssertionError("General revision contact sheet hash mismatch")
    with Image.open(revision_sheet) as image:
        if image.size != (3420, 2350) or image.mode != "RGB":
            raise AssertionError("Unexpected general revision contact sheet properties")

    generator_path = ROOT / "scripts" / "generate-product-assets.py"
    module_spec = importlib.util.spec_from_file_location("product_asset_generator", generator_path)
    if module_spec is None or module_spec.loader is None:
        raise RuntimeError("Unable to load product asset generator for pixel-integrity verification")
    generator = importlib.util.module_from_spec(module_spec)
    sys.modules[module_spec.name] = generator
    module_spec.loader.exec_module(generator)
    batch_specs = {item.asset.family_id: item for item in generator.BATCH_SPECS}

    for item in revision["records"]:
        family_id = item["familyId"]
        if item["status"] != "approved-revision-derivative":
            raise AssertionError(f"Unexpected revision status: {family_id}")
        for key, record in item["files"].items():
            path = ROOT / record["path"]
            if not path.is_file() or sha256(path) != record["sha256"] or path.stat().st_size != record["bytes"]:
                raise AssertionError(f"Missing or changed revision {key}: {path}")
            with Image.open(path) as image:
                if image.size != (record["width"], record["height"]) or image.format != record["format"]:
                    raise AssertionError(f"Unexpected revision file properties: {path}")
        if set(item["files"]) != {"canonicalMasterPng"}:
            raise AssertionError(f"Unexpected retained revision files: {family_id}")
        with Image.open(ROOT / item["files"]["canonicalMasterPng"]["path"]) as image:
            if image.size != EXPECTED_CANVAS or image.mode != "RGB":
                raise AssertionError(f"Unexpected revision PNG: {family_id}")
            revised_png = image.copy()
        if item["cardChecks"]["desktop"]["stageCssPixels"] != [380, 220]:
            raise AssertionError(f"Missing actual-size desktop card check: {family_id}")
        if item["cardChecks"]["mobile390Viewport"]["stageCssPixels"] != [336, 205]:
            raise AssertionError(f"Missing actual-size mobile card check: {family_id}")

        transform = item["transform"]
        if item["strategy"] == "matte-extension":
            integrity = transform["panelPixelIntegrity"]
            if not integrity["exactMatch"] or len({integrity["beforeSha256"], integrity["afterSha256"], integrity["resizedSourcePanelSha256"]}) != 1:
                raise AssertionError(f"Recorded inside-panel pixels differ: {family_id}")
            batch_spec = batch_specs[family_id]
            baseline_name = Path(batch_spec.asset.source_path).name
            baseline = ROOT / "assets" / "products" / "input-baseline" / batch_spec.asset.brand / baseline_name
            with Image.open(baseline) as opened:
                source_image = ImageOps.exif_transpose(opened).copy()
            base_layer, base_transform = generator.batch_product_layer(source_image, batch_spec)
            x, y = base_transform["placement"]
            width, height = base_transform["objectSize"]
            source_panel = base_layer.crop((x, y, x + width, y + height)).convert("RGB")
            revised_panel = revised_png.crop((x, y, x + width, y + height))
            if sha256_pixels(source_panel) != integrity["resizedSourcePanelSha256"]:
                raise AssertionError(f"Resized source panel hash changed: {family_id}")
            if ImageChops.difference(source_panel, revised_panel).getbbox() is not None:
                raise AssertionError(f"Matte Extension modified pixels inside panel: {family_id}")
            if transform["matteExtension"]["scope"] != "Outside source panel only":
                raise AssertionError(f"Matte Extension scope changed: {family_id}")
            if transform["matteExtension"]["panelShadow"] != "None" or transform["matteExtension"]["featherInsidePanel"] != "None":
                raise AssertionError(f"Unsafe panel treatment recorded: {family_id}")
        else:
            if tuple(transform["objectSize"]) != EXPECTED_REVISION_SIZES[family_id]:
                raise AssertionError(f"Unexpected approved revision size: {family_id}")
            expected_multiplier = 1.18 if family_id == "carrier-classicool-pro" else 1.55
            if transform["revisionScaleMultiplier"] != expected_multiplier or transform["resampling"] != "Lanczos" or transform["sharpening"] != "None":
                raise AssertionError(f"Unexpected scale treatment: {family_id}")

        preview_path = f'/products/catalog-revision-preview/{item["brand"]}/{item["slug"]}.webp'
        if preview_path in content:
            raise AssertionError(f"Revision preview was activated: {family_id}")

    activation = manifest["catalogActivation"]
    if activation["status"] != "local-test-only":
        raise AssertionError("Catalog activation must remain local-test-only")
    if [item["familyId"] for item in activation["assets"]] != EXPECTED_LIVE_CATALOG_IDS:
        raise AssertionError("Live catalog activation scope changed")
    if activation["previewPathReferencesAllowedInLiveContent"] is not False:
        raise AssertionError("Preview paths must be prohibited in live content")
    expected_master_paths = set()
    for item in activation["assets"]:
        if not item["approvedSource"].startswith("assets/products/derivatives/catalog/") or not item["approvedSource"].endswith(".png"):
            raise AssertionError(f"Approved source is not a canonical catalog master PNG: {item['familyId']}")
        if "preview" in item["approvedSource"] or "revision" in item["approvedSource"]:
            raise AssertionError(f"Non-final naming remains in approved source: {item['familyId']}")
        source = ROOT / item["approvedSource"]
        production = ROOT / item["productionPath"]
        expected_master_paths.add(source.resolve())
        if not source.is_file() or not production.is_file():
            raise FileNotFoundError(production if not production.is_file() else source)
        source_hash = sha256(source)
        production_hash = sha256(production)
        if source_hash != item["approvedSourceSha256"] or production_hash != item["sha256"]:
            raise AssertionError(f"Canonical or production hash mismatch: {item['familyId']}")
        if production.stat().st_size != item["bytes"]:
            raise AssertionError(f"Production asset size mismatch: {item['familyId']}")
        if item["encoding"] != {"format": "WEBP", "quality": 86, "method": 6, "exact": True}:
            raise AssertionError(f"Unexpected production encoding settings: {item['familyId']}")
        with Image.open(source) as master:
            if master.size != EXPECTED_CANVAS or master.mode != "RGB" or master.format != "PNG":
                raise AssertionError(f"Unexpected canonical master properties: {item['familyId']}")
            encoded = io.BytesIO()
            master.save(encoded, "WEBP", quality=86, method=6, exact=True)
        if hashlib.sha256(encoded.getvalue()).hexdigest() != production_hash or encoded.getvalue() != production.read_bytes():
            raise AssertionError(f"Production WebP is not the deterministic encoding of its canonical master: {item['familyId']}")
        with Image.open(production) as image:
            if image.size != EXPECTED_CANVAS or image.mode != "RGB" or image.format != "WEBP":
                raise AssertionError(f"Unexpected production asset properties: {item['familyId']}")
        expected_reference = f'familyImagePath: "{item["livePath"]}"'
        if expected_reference not in content:
            raise AssertionError(f"Production catalog path is not live: {item['familyId']}")

    derivative_files = {path.resolve() for path in (ROOT / "assets" / "products" / "derivatives").rglob("*") if path.is_file()}
    if derivative_files != expected_master_paths:
        unexpected = sorted(str(path.relative_to(ROOT)) for path in derivative_files - expected_master_paths)
        missing = sorted(str(path.relative_to(ROOT)) for path in expected_master_paths - derivative_files)
        raise AssertionError(f"Derivative scope is not exactly ten canonical PNGs; unexpected={unexpected}, missing={missing}")

    if "/products/catalog-preview/" in content or "/products/catalog-revision-preview/" in content:
        raise AssertionError("Preview path remains in live product content")

    forbidden_preview_directories = (
        "assets/products/previews/live-activation/",
        "assets/products/previews/batch/",
        "assets/products/previews/revision/",
        "public/products/catalog-preview/",
        "public/products/catalog-revision-preview/",
        "public/products/promotional-preview/",
    )
    manifest_text = MANIFEST_PATH.read_text(encoding="utf-8")
    generator_text = generator_path.read_text(encoding="utf-8")
    for forbidden in forbidden_preview_directories:
        if forbidden in manifest_text or forbidden in generator_text:
            raise AssertionError(f"Generator or manifest depends on excluded preview directory: {forbidden}")

    print("Product asset pilot verification passed")
    print("Shared product geometry verified across 3 options")
    print("Nine approved batch transformations verified; only three final batch masters retained")
    print("Six approved revision canonical masters verified")
    print("Matte Extension verified outside source panels with exact inside-panel pixels")
    print("Ten production WebPs verified as deterministic encodings of ten canonical master PNGs")


if __name__ == "__main__":
    main()
