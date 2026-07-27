# Service page image prompts

Four prompts, one per new service detail page. Paste each into the ChatGPT
thread that already has the approved Red Sea AC logo as reference, so it can
place/watermark it consistently. Target aspect ratio ~4:3 (matches the
`.product-detail-stage` image slot, e.g. 1200x900).

## 1. Installation & fit-out (`installation-and-fit-out`)

> Professional HVAC technician installing a wall-mounted split air
> conditioner indoor unit in a bright modern room in a coastal Egyptian home.
> Technician in a clean branded uniform, using a level and hand tools,
> copper refrigerant lines visible, focused and precise work. Natural
> daylight, warm neutral interior tones contrasted with cool blue accent
> lighting. Wide shot with some negative space on the right side for text
> overlay. Photorealistic, professional service-marketing photography style,
> not stock-photo generic. Include the approved Red Sea AC logo subtly on the
> technician's uniform or a branded toolbox, small and unobtrusive.

## 2. Maintenance & repair (`maintenance-and-repair`)

> Professional HVAC technician diagnosing an outdoor AC condenser unit with a
> digital pressure gauge manifold, focused expression, mid-repair. Setting:
> outdoor unit mounted on a wall or rooftop under bright Red Sea coastal
> daylight. Technician wearing branded workwear. Emphasize technical
> precision -- gauges, tools laid out neatly, cables. Deep blue and white
> color grading to match a modern HVAC brand identity. Wide shot with
> negative space on the left for text overlay. Photorealistic, professional
> service photography, not generic stock. Include the approved Red Sea AC
> logo small and unobtrusive on the uniform or toolbox.

## 3. Deep cleaning (`deep-cleaning`)

> Close-up professional photo of a technician deep-cleaning a wall-mounted
> AC indoor unit's aluminum coil fins with specialized cleaning equipment
> (foam/spray and a coil comb), visible water/foam runoff, clean and
> methodical. Bright, clean modern interior. Branded uniform and gloves.
> Deep blue and crisp white color grading. Wide shot with negative space for
> text overlay. Photorealistic, professional service-marketing photography,
> not generic stock. Include the approved Red Sea AC logo small and
> unobtrusive on the uniform or equipment case.

## 4. Annual contracts (`annual-contracts`)

> Professional HVAC technician on a scheduled maintenance visit at a villa
> or small hotel in a Red Sea coastal setting, holding a tablet or clipboard
> with a service checklist, multiple AC units visible in the background
> (rooftop or exterior wall), confident and professional demeanor. Bright
> daylight, palm trees or coastal architecture hinted in the background.
> Deep blue and white brand color grading. Wide shot with negative space for
> text overlay. Photorealistic, professional service-marketing photography,
> not generic stock. Include the approved Red Sea AC logo small and
> unobtrusive on the uniform or clipboard/tablet case.

---

Once you have the 4 images, send them over (with which slug each belongs to)
and I'll drop them into `public/services/<slug>.webp`, flip each service's
`assetAuthorization` to `"approved"` in `content/services.ts`, and redeploy.
