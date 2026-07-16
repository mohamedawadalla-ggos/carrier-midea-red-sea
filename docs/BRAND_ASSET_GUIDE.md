# Carrier–Midea Red Sea Logo Asset Guide

## Approved identity

In this project, **“the logo”** means the client-approved Carrier–Midea Red Sea artwork and the deterministic derivatives stored under `assets/brand/`. The older `public/brand-wordmark.png` remains a legacy supporting asset and is not the primary logo definition.

Arabic name: كاريير ميديا البحر الأحمر  
English name: Carrier–Midea Red Sea

The official Carrier and Midea marks must not be redrawn, distorted, recolored independently, separated for unrelated use, or modified.

## Choose the correct lockup

| Lockup | Intended use |
|---|---|
| `full` | Covers, proposals, reports, invoices, signs, social posts, and formal brand applications where space permits |
| `signature` | Reports, presentations, stationery, and medium-width layouts; omits the service-icon row and lower dealer statement |
| `manufacturer-horizontal` | Website header and very shallow horizontal spaces; pair with the nearby company name where possible |
| `business-wordmark` | Narrow report headers and bilingual company-name applications where manufacturer marks already appear nearby |

## Choose the correct treatment

| File suffix | Background and output |
|---|---|
| `white.png` / `white.jpg` | White or very light background; safest general-purpose version |
| `transparent.png` | White or very light background only; the original white matte has been removed |
| `reversed-white.png` | Navy, black, photographic, or other dark backgrounds |
| `black.png` | One-color black production, stamps, and monochrome office output |
| `grayscale.png` | Grayscale documents when tonal reproduction is available |
| `cmyk-300dpi.tif` | Convenience CMYK print file; always request a press proof |
| `rgb-300dpi.pdf` | Office reports and normal digital printing |

Do not place a full-color transparent version on a dark background. Its white details are intentionally open for light-background reproduction; use the reversed-white version instead.

## Folders

- `assets/brand/source/`: untouched approved source. Never overwrite it.
- `assets/brand/digital/`: archival-resolution PNG and JPG derivatives.
- `assets/brand/print/`: TIFF and PDF convenience exports.
- `assets/brand/previews/`: contact sheet for quick selection and QA.
- `public/brand/`: optimized files used by the website.
- `assets/brand/manifest.json`: dimensions, formats, purposes, hashes, and processing limitations.

## Print-size limits

The approved master is raster artwork. At 300 pixels per inch, the full white-background asset is approximately **4.03 × 3.38 inches (10.23 × 8.59 cm)**. Larger reproduction reduces effective resolution:

- 200 ppi: approximately 6.04 × 5.07 inches (15.34 × 12.88 cm).
- 150 ppi: approximately 8.05 × 6.76 inches (20.46 × 17.17 cm).

For large signs, vehicle graphics, exhibition walls, cutting, embroidery digitization, or precise commercial printing, request official editable vector artwork from the client or manufacturers. Do not auto-trace this raster master and call it official vector artwork.

## Clear space and minimum size

- Keep clear space around the logo equal to at least the height of the `RED SEA` letters in the selected lockup.
- Do not add borders, text, icons, or photographs inside that clear space.
- For the full lockup, do not reproduce below 45 mm wide in print or 260 px wide on screen because the service labels and Arabic dealer statement become difficult to read.
- At smaller sizes, move to `signature`, then `manufacturer-horizontal` as the available height decreases.

## Color and production cautions

- RGB PNG/JPG files preserve the supplied master most closely.
- The CMYK TIFF is a generic conversion because official Carrier–Midea Red Sea CMYK/Pantone specifications were not supplied.
- Print vendors must proof CMYK color before production.
- Do not sample the on-screen colors as contractual Pantone references.
- Do not stretch, crop through a mark, rotate, add shadows, apply gradients, or change the relative proportions.

## Website usage

- Header: `public/brand/logo-manufacturers.png`, paired with the unchanged client-supplied `public/brand/logo-client-header.png` on its navy contrast plate.
- Footer: `public/brand/logo-signature-reversed.png` on the approved navy background.
- Facebook follow section: `public/brand/logo-full-white.png`.
- Open Graph artwork remains `public/og.png`; it is promotional artwork, not the logo master.

The client-supplied header logo is an independent approved raster source archived at `assets/brand/source/carrier-midea-red-sea-client-header-logo.png`. Do not redraw, recolor, crop, or stretch it. Its white lettering requires the navy plate used by the header component.

## Reproduction

Run from the repository root:

```powershell
python .\scripts\generate-brand-assets.py "C:\Users\Mohamed Awadalla\Documents\Projects\Red sea AC\logo exclusive.png"
```

The generator creates deterministic derivatives only. It does not use image generation, redrawing, external downloads, or hotlinks.
