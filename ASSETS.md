# Product family asset manifest

Only manufacturer or authorized-distributor media approved for this catalog may be stored here. Dimensions are completed after validating the downloaded file.

## Site brand and geographic assets

### Approved Carrier–Midea Red Sea logo system

- Client-approved source: `C:\Users\Mohamed Awadalla\Documents\Projects\Red sea AC\logo exclusive.png`
- Archived unchanged master: `assets/brand/source/carrier-midea-red-sea-approved-master.png`
- Source SHA-256: `FD1F85D34464D681BA45E5333B57F66D5A0589E7FB3107E72CD748311D5A92BF`
- Source dimensions: 1254×1254 RGB PNG with an opaque white background
- Digital derivatives: `assets/brand/digital/`
- Print derivatives: `assets/brand/print/`
- Website derivatives: `public/brand/`
- Visual contact sheet: `assets/brand/previews/carrier-midea-red-sea-logo-contact-sheet.png`
- Machine-readable record: `assets/brand/manifest.json`
- Usage instructions: `docs/BRAND_ASSET_GUIDE.md`
- Reproducible generator: `scripts/generate-brand-assets.py`
- External downloads: none
- Transformation: deterministic cropping, removal of the original white matte for light-background PNGs, downscaling, grayscale/one-color conversion, and generic CMYK conversion only
- Authorization: supplied by the client as the approved logo on 2026-07-14
- Important limitation: no official vector, Pantone, or CMYK master was supplied; raster derivatives must not be represented as native vector artwork

### Header wordmark

- Local path: `public/brand-wordmark.png`
- Source: `public/og.png` (existing approved repository artwork; no external source)
- Method: deterministic pixel crop only; source crop bounds `x=45`, `y=250`, `width=750`, `height=470`
- Output dimensions: 750×470 PNG
- Purpose: primary header wordmark on a matching navy brand plate
- Alterations: none beyond cropping; original typography, colors, proportions, and internal artwork are preserved
- Generated: 2026-07-14
- Status: retained as a legacy supporting asset; references to “the logo” now mean the approved logo system above

### Red Sea service coverage map

- Local path: `public/maps/red-sea-service-coverage.svg`
- Geographic source: Natural Earth 1:10m land vector data
- Source URL: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson
- Natural Earth reference page: https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/
- License/status: public domain under the Natural Earth terms of use
- Generated: 2026-07-14
- Transformation: clipped the land polygons to longitude 31.5–36.6°E and latitude 21.4–30.5°N, projected them to a local equirectangular 720×760 SVG, and added a service-corridor line with markers positioned from geographic coordinates
- Cities shown: Ain Sokhna, Ras Ghareb, El Gouna, Hurghada, Safaga, Quseir, and Marsa Alam
- Runtime behavior: served locally with bilingual HTML labels; no external map tiles or hotlinks
- Usage note: indicative service coverage map only; not intended for navigation or evidence of completed projects

### Homepage hero background

- Local path: `public/hero/carrier-midea-red-sea-hero.webp`
- Source: original abstract artwork created with the built-in OpenAI image-generation tool; no external image source or download
- Generated: 2026-07-14
- Output dimensions: 1672×941 WebP
- Output size: 75,688 bytes
- Treatment: premium deep navy and cooling-blue abstract wave and airflow composition, with brighter visual energy on the left and darker negative space on the right
- Runtime behavior: shown in its original orientation for Arabic and mirrored for English so the dark area remains behind locale-specific copy; mobile uses a separately verified crop position
- Exclusions: no text, logos, watermarks, people, projects, maps, buildings, or identifiable products
- Prompt constraints: original abstract coastal/cooling character; restrained gradients; no literal location, product model, or third-party imagery

| Family | Local path | Official source page | Original image URL | Match | Authorization | Nael approval | Download date | Dimensions |
|---|---|---|---|---|---|---|---|---|
| Carrier XCOOL Inverter | `public/products/families/carrier/xcool-inverter.png` | https://miraco.com.eg/en/53kheft18dn8-708f | https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/1/-/1-5_left1.png | Exact family/variant | Approved | Approved manifest | 2026-07-13 | 1920×1080, transparent PNG |
| Carrier XCOOL | Placeholder only | Not verified | Not downloaded | Unverified | Pending | Pending | — | — |
| Carrier Optimax Inverter | `public/products/families/carrier/optimax-inverter.png` | https://miraco.com.eg/en/53qhabt36dn-708f-seer | https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/o/p/optimax_inverter_4hp_1_1_1.png | Exact family/variant | Approved | Approved manifest | 2026-07-13 | 1920×540, transparent PNG |
| Carrier Optimax Pro | `public/products/families/carrier/optimax-pro.png` | https://miraco.com.eg/ar/en/53khct18n | https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/s/y/system_copy_1.png | Exact family/variant | Approved | Approved manifest | 2026-07-13 | 357×343, opaque PNG |
| Carrier ClassiCool Inverter | `public/products/families/carrier/classicool-inverter.webp` | https://miraco.com.eg/en/classicool-inverter | https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/d/u/ducted_msp_hsp.jpg | Exact family | Approved | Approved manifest | 2026-07-13 | 1210×756, opaque WebP |
| Carrier ClassiCool Pro | `public/products/families/carrier/classicool-pro.webp` | https://miraco.com.eg/en/classicool-pro | https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/d/u/ducted_a6_1.jpg | Exact family | Approved | Approved manifest | 2026-07-13 | 910×336, opaque WebP |
| Carrier DÉCOR Inverter | `public/products/families/carrier/decor-inverter.webp` | https://miraco.com.eg/decor-inverter-heat-pump-53qcdt-dn | https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/p/a/panel_d_cor_inverter_with_green_speed_intelligence_-_photo.jpg | Exact family | Approved | Approved manifest | 2026-07-13 | 1201×1200, opaque WebP |
| Carrier Elegant Inverter | `public/products/families/carrier/elegant-inverter.webp` | https://miraco.com.eg/53qfgdt60dn-708-skd-seer | https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/4/2/42qfgdt60dn.jpg | Exact family/variant | Approved | Approved manifest | 2026-07-13 | 422×1200, opaque WebP |
| Carrier Elegant Pro | Placeholder only | Source/model mismatch unresolved | Not downloaded | Unverified | Pending | Pending | — | — |
| Midea AI ECOMASTER Inverter | `public/products/families/midea/ai-ecomaster-inverter.webp` | https://miraco.com.eg/m1seft-18crdn8f-q8-ai-ecomaster-seer | https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/1/8/18.jpg | Exact family/variant | Approved | Approved manifest | 2026-07-13 | 1920×888, opaque WebP |
| Midea Mission Inverter | `public/products/families/midea/mission-inverter.webp` | https://miraco.com.eg/ar/ar/m1sabt-30hrdnf-q8 | https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/s/y/system.jpg | Exact family/variant | Approved | Approved manifest | 2026-07-13 | 1319×1200, opaque WebP |
| Midea XTreme Pro | `public/products/families/midea/xtreme-pro.png` | https://miraco.com.eg/en/m1seft-18crn8f-q8-seer | https://mcprod.miraco.com.eg/media/catalog/product/cache/8ddeeed85c51e5e61315f40dbec60ae7/m/_/m_2-25_right_1_6.png | Exact family/variant | Approved | Approved manifest | 2026-07-13 | 1920×872, transparent PNG |
| Midea Mission Pro | Placeholder only | No acceptable current source | Not downloaded | Unverified | Pending | Pending | — | — |

## Catalog normalization pilot

### Carrier XCOOL Inverter

- Status: option 2 visually approved; its canonical PNG is encoded deterministically to the stable production WebP path for local catalog testing; not deployed
- Approved catalog direction: soft blue-milk gradient `#E6F1F7 → #F7FAFC`
- Local test path: `public/products/catalog/carrier/xcool-inverter.webp`
- Local content reference: `/products/catalog/carrier/xcool-inverter.webp`
- Existing approved local source: `public/products/families/carrier/xcool-inverter.png`
- Untouched input baseline copy: `assets/products/input-baseline/carrier/xcool-inverter.png`
- Canonical approved master PNG: `assets/products/derivatives/catalog/carrier/xcool-inverter.png`
- Optimized production WebP: `public/products/catalog/carrier/xcool-inverter.webp`
- Visual review contact sheet: `assets/products/previews/carrier/xcool-inverter-contact-sheet.png`
- Background-options contact sheet: `assets/products/previews/carrier/xcool-inverter-background-options.png`
- Contact-sheet card panels: deterministic layout previews at 1080px and 390px; browser verification is required for the local activation
- Machine-readable record: `assets/products/manifest.json`
- Reproducible generator: `scripts/generate-product-assets.py`
- Verification script: `scripts/verify-product-assets.py`
- Transformation: deterministic alpha-bound crop, Lanczos resize, fixed 1600×1200 `#E6F1F7 → #F7FAFC` gradient canvas, and a light shadow derived only from the original alpha channel
- Prohibited transformations: no generative editing, content-aware fill, logo redraw, device-part reconstruction, geometric distortion, or source replacement
- External downloads: none
- Approval: option 2 approved by the client on 2026-07-15 and retained as the final XCOOL catalog direction
- Scope limit: the approved treatment currently covers the ten documented catalog families only; option 3 remains advertising-only, and no commit, push, or deployment is authorized in this round

## Nine-family catalog batch transformations

- Status: visually approved; the nine transformations remain reproducible, while only the three unrevised approved results are retained as canonical masters
- Scope: the nine existing approved family images other than Carrier XCOOL Inverter
- Excluded missing families: Carrier XCOOL, Carrier Elegant Pro, and Midea Mission Pro; no image was created for them
- Approved preview background: vertical blue-milk gradient `#E6F1F7 → #F7FAFC`
- General contact sheet: `assets/products/previews/catalog-batch-preview.png`
- Retained canonical batch masters: `assets/products/derivatives/catalog/carrier/{optimax-inverter,classicool-inverter}.png` and `assets/products/derivatives/catalog/midea/xtreme-pro.png`
- Untouched baseline copies: `assets/products/input-baseline/<brand>/`
- Source-alpha strategy: Carrier Optimax Inverter and Midea XTreme Pro
- Edge-connected white-matte strategy: Carrier Optimax Pro, Carrier ClassiCool Inverter, and Carrier ClassiCool Pro
- Conservative opaque-panel strategy: Carrier DÉCOR Inverter, Carrier Elegant Inverter, Midea AI ECOMASTER Inverter, and Midea Mission Inverter; their white product/background boundaries cannot be separated reliably without risking device loss
- Composite preservation: both indoor and outdoor units remain together for Carrier Optimax Pro and Midea Mission Inverter; the ClassiCool source composition and existing repetition are retained unchanged
- Low-resolution handling: Carrier Optimax Pro is capped at 1.25× upscale; Carrier Elegant Inverter is downscaled only; both receive a conservative 2% contrast adjustment and no sharpening
- Detail QA: the general contact sheet and recorded transform metadata cover the approved 200% logo/edge/vane checks
- Prohibited processing: no generative editing, logo redraw, invented controls or vents, content-aware reconstruction, or source replacement
- External downloads: none
- Reproducible generator: `scripts/generate-product-assets.py`
- Verification script: `scripts/verify-product-assets.py`
- Approval gate: no commit, push, or deployment until the cleaned final scope is reviewed
- XCOOL production-path note: the approved gradient master is encoded directly to `public/products/catalog/carrier/xcool-inverter.webp` with the same deterministic settings as the other nine catalog assets

## Six-family approved revisions

- Status: visually approved and activated locally through stable production catalog paths
- Scope: Carrier ClassiCool Pro, Carrier Optimax Pro, Carrier DÉCOR Inverter, Carrier Elegant Inverter, Midea AI ECOMASTER Inverter, and Midea Mission Inverter
- Excluded approved batch images: Carrier ClassiCool Inverter, Carrier Optimax Inverter, and Midea XTreme Pro remain unchanged
- General before/after sheet: `assets/products/previews/catalog-revision-preview.png`
- Retained revision masters: six canonical PNGs under `assets/products/derivatives/catalog/<brand>/<slug>.png`; no intermediate WebP is stored under `assets/products/derivatives`
- Approved size revisions: ClassiCool Pro is 18% larger; Optimax Pro is 55% larger using deterministic Lanczos resampling and no sharpening
- Optimax Pro limitation: the low-resolution source remains visibly limited at 200%; the comparison is retained without generative enhancement or invented detail
- Matte Extension families: DÉCOR Inverter, Elegant Inverter, AI ECOMASTER Inverter, and Mission Inverter
- Matte Extension method: retain the complete resized source panel unchanged, sample the median RGB color from its outermost edge, extend that color outside the panel, and transition smoothly to `#E6F1F7 → #F7FAFC` toward the canvas edges
- Pixel-integrity rule: Matte Extension does not operate inside the source-panel bounds; SHA-256 hashes for the before panel, after panel, and resized source panel must be identical
- Panel treatment: no rectangular panel shadow and no feathering or overlay inside the source panel
- Card QA: the general contact sheet records the actual 380×220 desktop product stage and 336×205 mobile product stage, both reflecting the current 28px `.product-image` padding
- Detail QA: transform and pixel-integrity metadata retain the approved 200% checks for applicable device details
- Canvas: 1600×1200 RGB; preview background direction remains `#E6F1F7 → #F7FAFC`
- External downloads: none
- Generator and verifier: `scripts/generate-product-assets.py` and `scripts/verify-product-assets.py`
- Approval gate: no commit, push, or deployment until the cleaned final scope is reviewed

## Unified approved catalog activation

- Status: `local-test-only`; visually approved assets are active locally for final catalog review and have not been committed, pushed, or deployed
- Activation date: 2026-07-16
- Production path convention: `public/products/catalog/<brand>/<slug>.webp`, referenced as `/products/catalog/<brand>/<slug>.webp`
- Encoding rule: every production WebP is generated directly and deterministically from its approved canonical PNG using Pillow WebP quality 86, method 6, and `exact=True`; the verifier re-encodes and requires byte-for-byte equality
- Live content rule: `content/product-families.ts` must contain no `catalog-preview` or `catalog-revision-preview` reference
- Audit rule: ten untouched `input-baseline` files, ten canonical master PNGs, ten production WebPs, and the four general contact sheets remain in the final scope
- Carrier XCOOL Inverter: approved source `assets/products/derivatives/catalog/carrier/xcool-inverter.png` → production `public/products/catalog/carrier/xcool-inverter.webp`
- Carrier Optimax Inverter: approved source `assets/products/derivatives/catalog/carrier/optimax-inverter.png` → production `public/products/catalog/carrier/optimax-inverter.webp`
- Carrier Optimax Pro: approved source `assets/products/derivatives/catalog/carrier/optimax-pro.png` → production `public/products/catalog/carrier/optimax-pro.webp`
- Carrier ClassiCool Inverter: approved source `assets/products/derivatives/catalog/carrier/classicool-inverter.png` → production `public/products/catalog/carrier/classicool-inverter.webp`
- Carrier ClassiCool Pro: approved source `assets/products/derivatives/catalog/carrier/classicool-pro.png` → production `public/products/catalog/carrier/classicool-pro.webp`
- Carrier DÉCOR Inverter: approved source `assets/products/derivatives/catalog/carrier/decor-inverter.png` → production `public/products/catalog/carrier/decor-inverter.webp`
- Carrier Elegant Inverter: approved source `assets/products/derivatives/catalog/carrier/elegant-inverter.png` → production `public/products/catalog/carrier/elegant-inverter.webp`
- Midea AI ECOMASTER Inverter: approved source `assets/products/derivatives/catalog/midea/ai-ecomaster-inverter.png` → production `public/products/catalog/midea/ai-ecomaster-inverter.webp`
- Midea Mission Inverter: approved source `assets/products/derivatives/catalog/midea/mission-inverter.png` → production `public/products/catalog/midea/mission-inverter.webp`
- Midea XTreme Pro: approved source `assets/products/derivatives/catalog/midea/xtreme-pro.png` → production `public/products/catalog/midea/xtreme-pro.webp`
- Final gate: review Arabic and English catalog, family pages, model cards, similar products, homepage selections, and Open Graph locally before any commit, push, or deployment
