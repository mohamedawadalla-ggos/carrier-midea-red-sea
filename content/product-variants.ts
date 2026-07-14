import type { CoolingMode, ProductVariant, SupportedHorsepower } from "@/types/catalog";

type VariantSeed = readonly [modelCode: string, capacityHp: SupportedHorsepower];

const makeVariants = (familyId: string, models: readonly VariantSeed[], start: number): ProductVariant[] =>
  models.map(([modelCode, capacityHp], index) => ({
    id: `${familyId}-${modelCode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    familyId,
    modelCode,
    capacityHp,
    capacityBtu: null,
    coolingMode: (/53K|CR/.test(modelCode) ? "cool-only" : "heat-pump") as CoolingMode,
    energyClass: null,
    priceMode: "request-quote",
    priceReferenceDate: "2026-06-07",
    active: true,
    displayOrder: start + index,
  }));

export const productVariants: ProductVariant[] = [
  ...makeVariants("carrier-xcool-inverter", [["53KHEFT12DN8-708F", 1.5], ["53KHEFT18DN8-708F", 2.25], ["53KHEFT24DN8-708F", 3], ["53QHEFT12DN8-708F", 1.5], ["53QHEFT18DN8-708F", 2.25], ["53QHEFT24DN8-708F", 3]], 1),
  ...makeVariants("carrier-optimax-inverter", [["53QHABT30DN-708F", 4], ["53QHABT36DN-708F", 5]], 10),
  ...makeVariants("carrier-optimax-pro", [["53KHCT12N-708", 1.5], ["53KHCT18N-708", 2.25], ["53KHCT24N-708", 3], ["53QHCT12N-708F", 1.5], ["53QHCT18N-708F", 2.25], ["53QHCT24N-708F", 3], ["53QHABT30N-708F", 4], ["53QHABT36N-708F", 5]], 20),
  ...makeVariants("carrier-xcool", [["53KHEFT12N8-708F", 1.5], ["53KHEFT18N8-708F", 2.25], ["53KHEFT24N8-708F", 3], ["53QHEFT12N8-708F", 1.5], ["53QHEFT18N8-708F", 2.25], ["53QHEFT24N8-708F", 3]], 30),
  ...makeVariants("carrier-classicool-inverter", [["53QDMA6T18DN-728", 2.25], ["53QDMA6T24DN-728", 3], ["53QDMA6T36DN-728", 5], ["53QDHTGT48DN-528", 6], ["53QDHTGT60DN-528", 7.5]], 40),
  ...makeVariants("carrier-classicool-pro", [["53QDMA6T12N-728", 1.5], ["53QDMA6T18N-728", 2.25], ["53QDMA6T24N-728", 3], ["53QDMA6T30N-728", 4], ["53QDMA6T36N-728", 5], ["53QDMA6T48N-528", 6], ["53QDMA6T60N-528", 7.5]], 50),
  ...makeVariants("carrier-decor-inverter", [["53QCDT36DN-708", 5], ["53QCDT48DN-508", 6]], 60),
  ...makeVariants("carrier-elegant-inverter", [["53QFGDT60DN-508", 7.5]], 70),
  ...makeVariants("carrier-elegant-pro", [["53QFMT36N-708", 5], ["53KFGDT60N-508", 7.5]], 80),
  ...makeVariants("midea-ai-ecomaster-inverter", [["M1SEFT-12CRDN8F-Q8", 1.5], ["M1SEFT-18CRDN8F-Q8", 2.25], ["M1SEFT-24CRDN8F-Q8", 3], ["M1SEFT-12HRDN8F-Q8", 1.5], ["M1SEFT-18HRDN8F-Q8", 2.25], ["M1SEFT-24HRDN8F-Q8", 3]], 90),
  ...makeVariants("midea-mission-inverter", [["M1SABT-30HRDNF-Q8", 4], ["M1SABT-36HRDNF-Q8", 5]], 100),
  ...makeVariants("midea-xtreme-pro", [["M1SEFT-12CRN8F-Q8", 1.5], ["M1SEFT-18CRN8F-Q8", 2.25], ["M1SEFT-24CRN8F-Q8", 3], ["M1SEFT-12HRN8F-Q8", 1.5], ["M1SEFT-18HRN8F-Q8", 2.25], ["M1SEFT-24HRN8F-Q8", 3]], 110),
  ...makeVariants("midea-mission-pro", [["M1SCT-12CRN-Q8", 1.5], ["M1SCT-18CRN-Q8", 2.25], ["M1SCT-24CRN-Q8", 3], ["M1SCT-12HRNF-Q8", 1.5], ["M1SCT-18HRNF-Q8", 2.25], ["M1SCT-24HRNF-Q8", 3], ["M1SABT-30HRNF-Q8", 4], ["M1SABT-36HRNF-Q8", 5]], 120),
].sort((a, b) => a.displayOrder - b.displayOrder);
