import { productFamilies } from "@/content/product-families";
import { productTypes } from "@/content/catalog-types";
import { productVariants } from "@/content/product-variants";
import type { ProductTypeId } from "@/types/catalog";

export const activeVariants = productVariants.filter((variant) => variant.active);
export const getFamily = (type: string, slug: string) => productFamilies.find((family) => family.productType === type && family.slug === slug);
export const getFamilyById = (id: string) => productFamilies.find((family) => family.id === id);
export const getFamilyVariants = (familyId: string) => activeVariants.filter((variant) => variant.familyId === familyId).sort((a, b) => a.displayOrder - b.displayOrder);
export const getProductType = (id: string) => productTypes.find((type) => type.id === id);
export const isProductType = (id: string): id is ProductTypeId => productTypes.some((type) => type.id === id);

export const legacyProductRoutes: Record<string, { familyId: string; modelCode?: string }> = {
  "carrier-xcool-15hp-heat-pump": { familyId: "carrier-xcool", modelCode: "53QHEFT12N8-708F" },
  "carrier-xcool-3hp-cool-only": { familyId: "carrier-xcool", modelCode: "53KHEFT24N8-708F" },
  "carrier-xcool-inverter-15hp-cool-only": { familyId: "carrier-xcool-inverter", modelCode: "53KHEFT12DN8-708F" },
  "carrier-xcool-inverter-225hp-cool-only": { familyId: "carrier-xcool-inverter", modelCode: "53KHEFT18DN8-708F" },
  "carrier-optimax-pro-15hp-cool-only": { familyId: "carrier-optimax-pro", modelCode: "53KHCT12N-708" },
  "carrier-optimax-pro-225hp-cool-only": { familyId: "carrier-optimax-pro", modelCode: "53KHCT18N-708" },
  "carrier-optimax-pro-3hp-cool-only": { familyId: "carrier-optimax-pro", modelCode: "53KHCT24N-708" },
  "carrier-optimax-inverter-3hp-heat-pump": { familyId: "carrier-optimax-inverter" },
  "midea-xtreme-pro-15hp-cool-only": { familyId: "midea-xtreme-pro", modelCode: "M1SEFT-12CRN8F-Q8" },
  "midea-xtreme-pro-225hp-cool-only": { familyId: "midea-xtreme-pro", modelCode: "M1SEFT-18CRN8F-Q8" },
  "midea-xtreme-pro-3hp-cool-only": { familyId: "midea-xtreme-pro", modelCode: "M1SEFT-24CRN8F-Q8" },
  "midea-xtreme-pro-225hp-heat-pump": { familyId: "midea-xtreme-pro", modelCode: "M1SEFT-18HRN8F-Q8" },
  "midea-ai-ecomaster-inverter-15hp-cool-only": { familyId: "midea-ai-ecomaster-inverter", modelCode: "M1SEFT-12CRDN8F-Q8" },
  "midea-ai-ecomaster-inverter-225hp-cool-only": { familyId: "midea-ai-ecomaster-inverter", modelCode: "M1SEFT-18CRDN8F-Q8" },
  "midea-ai-ecomaster-inverter-225hp-heat-pump": { familyId: "midea-ai-ecomaster-inverter", modelCode: "M1SEFT-18HRDN8F-Q8" },
  "midea-mission-pro-15hp-cool-only": { familyId: "midea-mission-pro", modelCode: "M1SCT-12CRN-Q8" },
};
