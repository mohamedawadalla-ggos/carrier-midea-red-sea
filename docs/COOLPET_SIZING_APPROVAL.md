# CoolPet Smart AC Advisor — Technical Sizing Approval

**Document status:** Draft for HVAC technical review

**Purpose:** Approval of deterministic sizing rules before software implementation

**No sizing value in this document is approved until the sign-off section is completed.**

## Review instructions

For every proposed principle or technical value, the reviewer must record one of the following outcomes:

- **Approved** — accept the proposal exactly as written.
- **Rejected** — do not use the proposal.
- **Revised value** — replace the proposal with the value entered by the reviewer.
- **Technical notes** — explain assumptions, exceptions, formulas, or evidence required for implementation.

Blank fields are intentionally unresolved. They must not be inferred, calculated from product model codes, or populated by the implementation team without written technical approval.

## 1. Product positioning

### Approved product name

- **English:** CoolPet Smart AC Advisor
- **Arabic:** مساعد كول بيت الذكي لاختيار التكييف

### Positioning for approval

CoolPet Smart AC Advisor is a **deterministic preliminary sizing assistant**. It uses an approved, fixed calculation method and the information entered by the visitor to produce a preliminary recommendation.

It must not be described as:

- A generative AI chatbot.
- A replacement for an engineering cooling-load calculation.
- A guaranteed final capacity selection.

| Review item | Approved | Rejected | Revised wording | Technical notes |
| --- | --- | --- | --- | --- |
| English product name | ☐ | ☐ |  |  |
| Arabic product name | ☐ | ☐ |  |  |
| Deterministic preliminary-sizing positioning | ☐ | ☐ |  |  |
| Prohibited claims and descriptions | ☐ | ☐ |  |  |

## 2. General sizing principles for approval

The percentages and BTU values below are proposals only.

| # | Proposed principle or value | Approved | Rejected | Revised value | Technical notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Calculations occur locally in the visitor's browser. | ☐ | ☐ |  |  |
| 2 | Room area alone is not sufficient for the preliminary recommendation. | ☐ | ☐ |  |  |
| 3 | Room volume and ceiling height affect the result. | ☐ | ☐ |  |  |
| 4 | Sunlight, floor position, glazing, insulation, occupancy, and room use affect the result. | ☐ | ☐ |  |  |
| 5 | All seven supported Red Sea and Gulf of Suez locations initially use one hot coastal climate profile. | ☐ | ☐ |  |  |
| 6 | V1 does not invent or apply separate city multipliers. | ☐ | ☐ |  |  |
| 7 | High sunlight adjustment proposal: **+10%**. | ☐ | ☐ |  |  |
| 8 | Heavy shade/low sunlight adjustment proposal: **-10%**. | ☐ | ☐ |  |  |
| 9 | Occupancy baseline proposal: **2 people**. | ☐ | ☐ |  |  |
| 10 | Additional occupancy proposal: **+600 BTU per person above the baseline**. | ☐ | ☐ |  |  |
| 11 | Kitchens and restaurants require technical inspection. | ☐ | ☐ |  |  |
| 12 | Large open-plan and unusual commercial applications require technical inspection. | ☐ | ☐ |  |  |
| 13 | Results near an HP threshold recommend technical inspection. | ☐ | ☐ |  |  |
| 14 | Loads below or above the approved matrix are not clamped to 1.5 HP or 7.5 HP. | ☐ | ☐ |  |  |

### Initial service locations using the shared climate profile

1. Ain Sokhna / العين السخنة
2. Ras Ghareb / رأس غارب
3. El Gouna / الجونة
4. Hurghada / الغردقة
5. Safaga / سفاجا
6. Quseir / القصير
7. Marsa Alam / مرسى علم

| Shared-location decision | Approved | Rejected | Revised decision | Technical notes |
| --- | --- | --- | --- | --- |
| These seven locations use one hot coastal profile in V1. | ☐ | ☐ |  |  |
| “Other” location uses the shared profile only with an inspection recommendation. | ☐ | ☐ |  |  |

## 3. Required matrix decisions

### A. Base calculation

| Decision | Proposed or approved value | Approved | Rejected | Revised value | Units/formula | Technical notes |
| --- | --- | --- | --- | --- | --- | --- |
| Base BTU per square metre | **To be supplied** | ☐ | ☐ |  | BTU/m² |  |
| Reference ceiling height | **To be supplied** | ☐ | ☐ |  | metres |  |
| Minimum valid room length | **To be supplied** | ☐ | ☐ |  | metres |  |
| Minimum valid room width | **To be supplied** | ☐ | ☐ |  | metres |  |
| Maximum valid room length | **To be supplied** | ☐ | ☐ |  | metres |  |
| Maximum valid room width | **To be supplied** | ☐ | ☐ |  | metres |  |
| Minimum valid room area | **To be supplied** | ☐ | ☐ |  | m² |  |
| Maximum automatic-recommendation area | **To be supplied** | ☐ | ☐ |  | m² |  |
| Base-load calculation formula | **To be supplied** | ☐ | ☐ |  | formula |  |

### B. Ceiling and volume adjustment

The approved method must use area, volume, and ceiling height without applying the same height effect twice.

| Decision | Proposed or approved value | Approved | Rejected | Revised value | Technical notes |
| --- | --- | --- | --- | --- | --- |
| Reference ceiling height | **To be supplied** | ☐ | ☐ |  |  |
| Adjustment method: formula or bands | **To be supplied** | ☐ | ☐ |  | Include complete formula or every band. |
| Adjustment below reference height | **To be supplied** | ☐ | ☐ |  |  |
| Adjustment above reference height | **To be supplied** | ☐ | ☐ |  |  |
| Maximum ceiling height for automatic recommendation | **To be supplied** | ☐ | ☐ |  | Metres. |
| Height above the limit requires inspection | **To be supplied** | ☐ | ☐ |  | Yes/No. |

#### Ceiling-height bands, if a banded method is approved

| Minimum height | Maximum height | Adjustment | Automatic recommendation allowed | Inspection rule | Technical notes |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

### C. Climate

| Decision | Proposed value | Approved | Rejected | Revised value | Technical notes |
| --- | --- | --- | --- | --- | --- |
| One multiplier for all seven service locations | Hot coastal multiplier: **To be supplied** | ☐ | ☐ |  |  |
| Separate city multipliers in V1 | No | ☐ | ☐ |  |  |
| Separate city multipliers in a later version | Review after field evidence is available | ☐ | ☐ |  | Define evidence and review date. |
| Treatment of “other” locations | Inspection recommendation proposed | ☐ | ☐ |  |  |

### D. Sunlight

| Condition | Proposed adjustment | Approved | Rejected | Revised value | Technical definition and notes |
| --- | --- | --- | --- | --- | --- |
| Low / heavy shade | **-10%** | ☐ | ☐ |  | Define shade/orientation criteria. |
| Normal | **0%** | ☐ | ☐ |  | Define normal exposure. |
| High | **+10%** | ☐ | ☐ |  | Define hours/orientation criteria. |

### E. Floor condition

| Condition | Proposed adjustment | Approved | Rejected | Revised value | Automatic recommendation allowed | Inspection rule | Technical notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal floor | **To be supplied** | ☐ | ☐ |  |  |  |  |
| Top floor below insulated roof | **To be supplied** | ☐ | ☐ |  |  |  |  |
| Direct roof exposure | **To be supplied** | ☐ | ☐ |  |  |  |  |

### F. Glazing

| Condition | Proposed adjustment | Approved | Rejected | Revised value | Automatic recommendation allowed | Inspection rule | Technical definition and notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Small windows | **To be supplied** | ☐ | ☐ |  |  |  | Define glass area or ratio. |
| Normal windows | **To be supplied** | ☐ | ☐ |  |  |  | Define glass area or ratio. |
| Large glazing/storefront | **To be supplied** | ☐ | ☐ |  |  |  | Define mandatory-inspection threshold. |

### G. Insulation

| Condition | Proposed adjustment | Approved | Rejected | Revised value | Automatic recommendation allowed | Inspection rule | Technical definition and notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Good | **To be supplied** | ☐ | ☐ |  |  |  | Define construction criteria. |
| Average | **To be supplied** | ☐ | ☐ |  |  |  | Define construction criteria. |
| Poor | **To be supplied** | ☐ | ☐ |  |  |  | Define inspection requirement. |
| Unknown | Inspection recommendation proposed | ☐ | ☐ |  |  |  |  |

### H. Occupancy

| Decision | Proposed value | Approved | Rejected | Revised value | Technical notes |
| --- | --- | --- | --- | --- | --- |
| Included occupants | **2 people** | ☐ | ☐ |  |  |
| Load per additional occupant | **+600 BTU** | ☐ | ☐ |  | State whether this varies by room use/activity. |
| Maximum occupancy for automatic recommendation | **To be supplied** | ☐ | ☐ |  |  |
| Occupancy above the limit | Inspection required proposed | ☐ | ☐ |  |  |

### I. Room use

Enter an adjustment as a percentage, multiplier, fixed BTU value, or an explicitly documented combination.

| Room type | Adjustment value/formula | Automatic recommendation allowed | Inspection recommended | Inspection mandatory | Approved | Rejected | Revised value | Technical notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bedroom |  |  |  |  | ☐ | ☐ |  |  |
| Living room |  |  |  |  | ☐ | ☐ |  |  |
| Hotel room |  |  |  |  | ☐ | ☐ |  |  |
| Office |  |  |  |  | ☐ | ☐ |  |  |
| Shop/showroom |  |  |  |  | ☐ | ☐ |  |  |
| Clinic |  |  |  |  | ☐ | ☐ |  |  |
| Restaurant |  | No proposed |  | Yes proposed | ☐ | ☐ |  | Include kitchens and heat-generating equipment. |
| Open-plan space |  |  |  | Large spaces: Yes proposed | ☐ | ☐ |  | Define “large.” |
| Other |  | No proposed |  | Yes proposed | ☐ | ☐ |  |  |

## 4. HP and BTU approval bands

The catalog's existing `capacityHp` values confirm which products are categorized as 1.5, 2.25, 3, 4, 5, 6, or 7.5 HP. They do **not** automatically define a room-sizing matrix, nominal BTU values, or safe load boundaries.

Do not populate or implement a final threshold until every applicable field below is technically approved.

| HP | Nominal BTU | Minimum adjusted load | Maximum adjusted load | Boundary tolerance | Show adjacent HP? | Inspection rule | Approved | Rejected | Revised value / technical notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.5 HP |  |  |  |  |  |  | ☐ | ☐ |  |
| 2.25 HP |  |  |  |  |  |  | ☐ | ☐ |  |
| 3 HP |  |  |  |  |  |  | ☐ | ☐ |  |
| 4 HP |  |  |  |  |  |  | ☐ | ☐ |  |
| 5 HP |  |  |  |  |  |  | ☐ | ☐ |  |
| 6 HP |  |  |  |  |  |  | ☐ | ☐ |  |
| 7.5 HP |  |  |  |  |  |  | ☐ | ☐ |  |

### Band-wide decisions

| Decision | Approved value | Approved | Rejected | Revised value | Technical notes |
| --- | --- | --- | --- | --- | --- |
| Mathematical definition of “near a boundary” |  | ☐ | ☐ |  | Percentage and/or BTU value. |
| Whether boundary tolerance is symmetrical |  | ☐ | ☐ |  |  |
| Lower-bound behavior | No clamping proposed | ☐ | ☐ |  |  |
| Upper-bound behavior | No clamping proposed | ☐ | ☐ |  |  |
| Adjacent-capacity display wording | “Alternative capacity” proposed | ☐ | ☐ |  |  |

## 5. Technical-inspection rules

For each case, choose one outcome: automatic recommendation allowed, inspection recommended, or inspection mandatory.

| Condition | Automatic recommendation allowed | Inspection recommended | Inspection mandatory | Approved | Rejected | Revised rule | Technical notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Adjusted load below supported minimum |  |  | Proposed | ☐ | ☐ |  | Do not clamp to 1.5 HP. |
| Adjusted load above supported maximum |  |  | Proposed | ☐ | ☐ |  | Do not clamp to 7.5 HP. |
| Ceiling above approved limit |  |  | Proposed | ☐ | ☐ |  |  |
| Restaurant or kitchen |  |  | Proposed | ☐ | ☐ |  |  |
| Large open-plan space |  |  | Proposed | ☐ | ☐ |  | Define size threshold. |
| Connected rooms |  |  | Proposed | ☐ | ☐ |  |  |
| Irregular room shape |  | Proposed |  | ☐ | ☐ |  | Define mandatory cases. |
| Large glass frontage |  |  | Proposed | ☐ | ☐ |  | Define glass threshold. |
| Poor insulation |  | Proposed |  | ☐ | ☐ |  |  |
| Unknown insulation |  | Proposed |  | ☐ | ☐ |  |  |
| Unusually high occupancy |  |  | Proposed | ☐ | ☐ |  | Define occupancy threshold. |
| Unknown room type |  |  | Proposed | ☐ | ☐ |  |  |
| Result close to an HP boundary |  | Proposed |  | ☐ | ☐ |  | Use approved boundary tolerance. |
| Commercial or project application |  | Proposed |  | ☐ | ☐ |  | Define mandatory cases. |
| Conflicting customer preferences |  | Proposed |  | ☐ | ☐ |  | Example: required mode unavailable at calculated HP. |
| Location outside supported service area |  | Proposed |  | ☐ | ☐ |  |  |

### Additional inspection rule requested by reviewer

| Condition | Automatic recommendation allowed | Inspection recommended | Inspection mandatory | Technical notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

## 6. Representative test scenarios

The HVAC reviewer must complete the blank fields. **Expected HP must not be calculated or inferred by the implementation team.** Add dimensional or technical context in the notes where the title alone is insufficient.

### Scenario 1 — Small bedroom

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Bedroom |
| Sunlight |  |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

### Scenario 2 — Medium bedroom

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Bedroom |
| Sunlight |  |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

### Scenario 3 — Large top-floor bedroom

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Bedroom |
| Sunlight |  |
| Floor condition | Top floor |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

### Scenario 4 — Small living room

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Living room |
| Sunlight |  |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

### Scenario 5 — Large sunny living room

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Living room |
| Sunlight | High |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

### Scenario 6 — Hotel room

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Hotel room |
| Sunlight |  |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

### Scenario 7 — Small office

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Office |
| Sunlight |  |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

### Scenario 8 — Office with multiple occupants

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Office |
| Sunlight |  |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

### Scenario 9 — Clinic room

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Clinic |
| Sunlight |  |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

### Scenario 10 — Shop with large glazing

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Shop/showroom |
| Sunlight |  |
| Floor condition |  |
| Glazing | Large glazing/storefront |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

### Scenario 11 — Restaurant

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Restaurant |
| Sunlight |  |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes | Include cooking equipment, exhaust, operating hours, and heat sources. |

### Scenario 12 — Large open-plan space

| Field | Technical input or expected result |
| --- | --- |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type | Open-plan space |
| Sunlight |  |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes | Record connected zones, openings, partitions, and unusual geometry. |

### Additional reviewer scenario

| Field | Technical input or expected result |
| --- | --- |
| Scenario name |  |
| Location |  |
| Length (m) |  |
| Width (m) |  |
| Ceiling height (m) |  |
| Area (m²) |  |
| Room type |  |
| Sunlight |  |
| Floor condition |  |
| Glazing |  |
| Insulation |  |
| Occupants |  |
| Expected HP according to Nael | **To be completed by Nael** |
| Inspection required (Yes/No) |  |
| Technical notes |  |

## 7. Disclaimer approval

### English proposal

> This is a preliminary recommendation based on the information provided. Final capacity should be confirmed through a professional site inspection.

| Approved | Rejected | Revised English wording | Technical/legal notes |
| --- | --- | --- | --- |
| ☐ | ☐ |  |  |

### Arabic proposal

> هذه توصية مبدئية بناءً على البيانات المدخلة، ويجب تأكيد القدرة المناسبة بعد المعاينة الفنية للموقع.

| Approved | Rejected | Revised Arabic wording | Technical/legal notes |
| --- | --- | --- | --- |
| ☐ | ☐ |  |  |

## 8. Technical sign-off

Completion of this section confirms that the approved or revised values in this document may be converted into typed application configuration and deterministic tests. Blank technical values are not approved for implementation.

| Sign-off field | Response |
| --- | --- |
| Approved by |  |
| Technical role |  |
| Approval date |  |
| Version |  |
| Notes |  |
| Approved for implementation | ☐ Yes &nbsp;&nbsp; ☐ No |

### Implementation handoff checklist

| Requirement | Confirmed |
| --- | --- |
| Every base-calculation value is approved. | ☐ |
| Every adjustment and formula is approved. | ☐ |
| Every HP/BTU band is approved. | ☐ |
| Every inspection rule is approved. | ☐ |
| All twelve representative scenarios have expected outcomes. | ☐ |
| English disclaimer is approved. | ☐ |
| Arabic disclaimer is approved. | ☐ |
| Document is approved for implementation. | ☐ |
