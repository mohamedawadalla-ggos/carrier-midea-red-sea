# CoolPet Smart AC Advisor — Approved Technical Sizing Matrix

**Status:** Approved for deterministic implementation

**Approved by:** Nael

**Implementation record date:** 14 July 2026

**Version:** 1.0

This document records the client-approved V1 sizing assumptions. The assistant is a deterministic preliminary sizing tool, not a generative AI chatbot, an engineering load-calculation replacement, or a guaranteed final capacity selection.

## 1. Product positioning

- **English:** CoolPet Smart AC Advisor
- **Arabic:** مساعد كول بيت الذكي لاختيار التكييف
- Calculations occur locally in the browser.
- No answers are stored or transmitted until the visitor explicitly chooses WhatsApp.
- Product horsepower comes from the catalog's explicit `capacityHp`; it is never parsed from model codes.

## 2. Approved base calculation

| Decision | Approved value |
| --- | --- |
| Area | length × width |
| Volume | area × ceiling height |
| Base load | area × 600 BTU/m² |
| Reference ceiling | 2.7m |
| Climate profile | One V1 hot-coastal profile for all seven service locations |
| Separate city multipliers | No |

The 600 BTU/m² baseline represents the approved shared hot-coastal profile; V1 applies no additional city-specific factor. Volume is reported, while ceiling height is applied once through the approved bands below. It must not be double-counted.

## 3. Approved input limits

| Input | Approved limit |
| --- | --- |
| Length | minimum 2m; maximum 12m for direct calculation |
| Width | minimum 2m; maximum 12m for direct calculation |
| Ceiling | minimum 2.4m; maximum 3.6m for automatic calculation |
| Occupants | 1–12 for direct calculation |
| Normal automatic area | up to 60m² |
| Preliminary area with mandatory inspection | above 60m² through 100m² |
| No automatic HP | above 100m² |

## 4. Approved adjustment matrix

### Ceiling height

| Height | Multiplier | Inspection |
| --- | ---: | --- |
| Up to 2.7m | 1.00 | Standard |
| Above 2.7m through 3.0m | 1.10 | Standard |
| Above 3.0m through 3.3m | 1.20 | Standard |
| Above 3.3m through 3.6m | 1.30 | Recommended |
| Above 3.6m | No automatic calculation | Required |

### Sunlight

| Condition | Multiplier |
| --- | ---: |
| Low/heavily shaded | 0.90 |
| Normal | 1.00 |
| High/direct strong sunlight | 1.10 |

### Floor and roof

| Condition | Multiplier | Inspection |
| --- | ---: | --- |
| Normal floor | 1.00 | Standard |
| Top floor with insulated roof | 1.10 | Recommended when material to the result |
| Exposed roof with poor insulation | 1.20 | Required |

### Glazing

| Condition | Multiplier | Inspection |
| --- | ---: | --- |
| Small windows | 0.95 | Standard |
| Normal windows | 1.00 | Standard |
| Large glazing | 1.15 | Recommended |
| Full storefront glazing | 1.15 minimum preliminary factor | Required |

Full storefront glazing reuses the approved large-glazing factor only to provide a conservative preliminary breakdown; it never produces an unqualified final recommendation.

### Insulation

| Condition | Multiplier | Inspection |
| --- | ---: | --- |
| Good | 0.90 | Standard |
| Average | 1.00 | Standard |
| Poor | 1.15 | Adjustment reason shown |
| Unknown | 1.10 | Recommended; reason required |

### Occupancy

| Decision | Approved value |
| --- | --- |
| Included occupants | 2 |
| Additional load | +600 BTU per person above 2 |
| Above 8 occupants | Inspection recommended |
| Above 12 occupants | Inspection required; outside direct-input range |

### Room use

| Room type | Multiplier | Automatic status |
| --- | ---: | --- |
| Bedroom | 1.00 | Allowed |
| Hotel room | 1.00 | Allowed |
| Living room | 1.05 | Allowed |
| Office | 1.10 | Allowed |
| Clinic | 1.10 | Allowed |
| Shop/showroom | 1.15 | Allowed, subject to installation type |
| Restaurant/commercial kitchen | No additional approved multiplier | Inspection required; no unqualified result |
| Open-plan | No additional approved multiplier | Preliminary result plus mandatory inspection |
| Other | No additional approved multiplier | Inspection recommended or required according to other inputs |

## 5. Approved HP bands

| Adjusted load | Primary recommendation |
| --- | ---: |
| Up to 12,000 BTU | 1.5 HP |
| Above 12,000 through 18,000 BTU | 2.25 HP |
| Above 18,000 through 24,000 BTU | 3 HP |
| Above 24,000 through 30,000 BTU | 4 HP |
| Above 30,000 through 36,000 BTU | 5 HP |
| Above 36,000 through 48,000 BTU | 6 HP |
| Above 48,000 through 60,000 BTU | 7.5 HP |
| Above 60,000 BTU | No forced HP; inspection required |

- Boundary tolerance is 5% of each HP boundary.
- Near a boundary, show the current recommendation and the adjacent higher HP when available.
- Near-boundary results recommend professional inspection.
- 1.5 HP is the smallest available catalog capacity; smaller loads must include an oversizing-confirmation warning.
- Loads outside the matrix must never be clamped to 1.5 HP or 7.5 HP.

## 6. Four resolved implementation decisions

1. **Floor input:** the earlier `topFloor` boolean is replaced by `normal-floor`, `top-floor-insulated`, and `roof-exposed-poor-insulation`.
2. **Climate:** all seven current locations share one approved hot-coastal profile in V1; no city multipliers are invented.
3. **Out-of-range behavior:** above 100m² or outside the direct measurement ranges returns inspection-required state without a forced HP; above 60,000 BTU never clamps to 7.5 HP.
4. **System selection:** every available suitable product type may be surfaced, grouped into direct room options and options requiring site inspection.

## 7. Approved installation and system-type behavior

| Room/use | Product-type behavior |
| --- | --- |
| Bedroom and hotel room | Wall-mounted is the direct primary option. |
| Living room, small office, and clinic | Wall-mounted is direct; other types appear only when the installation preference supports them. |
| Shop/showroom | Wall-mounted, cassette, floor-standing, and ducted may be shown when matching. |
| Restaurant, large open-plan, and project-like application | Potential commercial systems may be shown only with mandatory inspection. |

- Concealed ducted, ceiling cassette, and floor-standing selections always require technical inspection in V1.
- Cassette results do not assert ceiling suitability.
- Ducted results do not assert project suitability without assessment.
- “Unsure — show all suitable systems” evaluates every matching catalog family and groups results by product type.
- Results clearly distinguish direct room options from inspection-required options.

## 8. Mandatory and recommended inspection rules

### Required

- Restaurant or commercial kitchen.
- Multiple connected rooms.
- Large open-plan spaces.
- Area above 60m².
- Ceiling above 3.6m.
- Full glass storefront.
- Exposed roof with poor insulation.
- More than 12 occupants.
- Unusually high equipment or lighting load.
- Adjusted load above 60,000 BTU.
- Irregular room geometry.
- Ducted, cassette, or floor-standing final selection.
- Unclear or conflicting inputs.

### Recommended

- Result within 5% of an HP boundary.
- Unknown insulation.
- More than 8 occupants.
- Ceiling above 3.3m.
- Large glazing.
- Top-floor or roof exposure materially changes the load.

## 9. Approved 30m² regression scenarios

### Scenario A — Sunny top-floor living room

Approved normal inputs: 30m², 2.7m ceiling, 2 occupants, normal glazing, average insulation, top-floor insulated roof, strong sunlight.

| Calculation stage | Value |
| --- | ---: |
| Base load | 30 × 600 = 18,000 BTU |
| Ceiling | × 1.00 |
| Sunlight | × 1.10 |
| Floor | × 1.10 |
| Glazing | × 1.00 |
| Insulation | × 1.00 |
| Living-room use | × 1.05 |
| Occupancy | +0 BTU |
| Adjusted load | 22,869 BTU |
| Approved primary result | **3 HP** |

### Scenario B — Large-glazing shop/showroom

Approved normal inputs: 30m², 2.7m ceiling, 2 occupants, normal floor, normal sunlight, large glazing, average insulation.

| Calculation stage | Value |
| --- | ---: |
| Base load | 30 × 600 = 18,000 BTU |
| Ceiling | × 1.00 |
| Sunlight | × 1.00 |
| Floor | × 1.00 |
| Large glazing | × 1.15 |
| Insulation | × 1.00 |
| Shop/showroom use | × 1.15 |
| Occupancy | +0 BTU |
| Adjusted load | 23,805 BTU |
| Approved primary result | **3 HP** |

The multipliers are not altered to force either result; both follow the approved matrix directly.

## 10. Approved disclaimer

### English

> This is a preliminary recommendation based on the information provided and is not a final engineering load calculation. The required capacity should be confirmed through a professional site inspection.

### Arabic

> هذه توصية مبدئية بناءً على البيانات المدخلة، ولا تعتبر حساب أحمال هندسيًا نهائيًا. يجب تأكيد القدرة المناسبة بعد المعاينة الفنية للموقع.

## 11. Implementation approval

| Sign-off field | Approved value |
| --- | --- |
| Approved by | Nael |
| Approval status | Approved |
| Approved for implementation | Yes |
| Persistence | None |
| APIs | No AI or recommendation API |
| Data transmission | Only after explicit WhatsApp action |
