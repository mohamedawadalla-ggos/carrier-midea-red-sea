import type { CoolingMode, ProductVariant } from "@/types/catalog";

const makeVariants = (familyId: string, models: readonly string[], start: number): ProductVariant[] =>
  models.map((modelCode, index) => ({
    id: `${familyId}-${modelCode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    familyId,
    modelCode,
    capacityHp: null,
    capacityBtu: null,
    coolingMode: (/53K|CR/.test(modelCode) ? "cool-only" : "heat-pump") as CoolingMode,
    energyClass: null,
    priceMode: "request-quote",
    priceReferenceDate: "2026-06-07",
    active: true,
    displayOrder: start + index,
  }));

export const productVariants: ProductVariant[] = [
  ...makeVariants("carrier-xcool-inverter", ["53KHEFT12DN8-708F", "53KHEFT18DN8-708F", "53KHEFT24DN8-708F", "53QHEFT12DN8-708F", "53QHEFT18DN8-708F", "53QHEFT24DN8-708F"], 1),
  ...makeVariants("carrier-optimax-inverter", ["53QHABT30DN-708F", "53QHABT36DN-708F"], 10),
  ...makeVariants("carrier-optimax-pro", ["53KHCT12N-708", "53KHCT18N-708", "53KHCT24N-708", "53QHCT12N-708F", "53QHCT18N-708F", "53QHCT24N-708F", "53QHABT30N-708F", "53QHABT36N-708F"], 20),
  ...makeVariants("carrier-xcool", ["53KHEFT12N8-708F", "53KHEFT18N8-708F", "53KHEFT24N8-708F", "53QHEFT12N8-708F", "53QHEFT18N8-708F", "53QHEFT24N8-708F"], 30),
  ...makeVariants("carrier-classicool-inverter", ["53QDMA6T18DN-728", "53QDMA6T24DN-728", "53QDMA6T36DN-728", "53QDHTGT48DN-528", "53QDHTGT60DN-528"], 40),
  ...makeVariants("carrier-classicool-pro", ["53QDMA6T12N-728", "53QDMA6T18N-728", "53QDMA6T24N-728", "53QDMA6T30N-728", "53QDMA6T36N-728", "53QDMA6T48N-528", "53QDMA6T60N-528"], 50),
  ...makeVariants("carrier-decor-inverter", ["53QCDT36DN-708", "53QCDT48DN-508"], 60),
  ...makeVariants("carrier-elegant-inverter", ["53QFGDT60DN-508"], 70),
  ...makeVariants("carrier-elegant-pro", ["53QFMT36N-708", "53KFGDT60N-508"], 80),
  ...makeVariants("midea-ai-ecomaster-inverter", ["M1SEFT-12CRDN8F-Q8", "M1SEFT-18CRDN8F-Q8", "M1SEFT-24CRDN8F-Q8", "M1SEFT-12HRDN8F-Q8", "M1SEFT-18HRDN8F-Q8", "M1SEFT-24HRDN8F-Q8"], 90),
  ...makeVariants("midea-mission-inverter", ["M1SABT-30HRDNF-Q8", "M1SABT-36HRDNF-Q8"], 100),
  ...makeVariants("midea-xtreme-pro", ["M1SEFT-12CRN8F-Q8", "M1SEFT-18CRN8F-Q8", "M1SEFT-24CRN8F-Q8", "M1SEFT-12HRN8F-Q8", "M1SEFT-18HRN8F-Q8", "M1SEFT-24HRN8F-Q8"], 110),
  ...makeVariants("midea-mission-pro", ["M1SCT-12CRN-Q8", "M1SCT-18CRN-Q8", "M1SCT-24CRN-Q8", "M1SCT-12HRNF-Q8", "M1SCT-18HRNF-Q8", "M1SCT-24HRNF-Q8", "M1SABT-30HRNF-Q8", "M1SABT-36HRNF-Q8"], 120),
].sort((a, b) => a.displayOrder - b.displayOrder);
