import type { Locale } from "@/content/site";
import type { ProductFamily, ProductVariant, SupportedHorsepower } from "@/types/catalog";

export const supportedHorsepowerValues = [1.5, 2.25, 3, 4, 5, 6, 7.5] as const satisfies readonly SupportedHorsepower[];

export type CatalogFilterState = {
  brand: string;
  productType: string;
  technology: string;
  coolingMode: string;
  refrigerant: string;
  marketSegment: string;
  hp: string;
};

export const emptyCatalogFilters: CatalogFilterState = {
  brand: "",
  productType: "",
  technology: "",
  coolingMode: "",
  refrigerant: "",
  marketSegment: "",
  hp: "",
};

const horsepowerQueryValues = new Set<string>(supportedHorsepowerValues.map(String));
const queryKeys = {
  brand: "brand",
  productType: "type",
  technology: "technology",
  coolingMode: "mode",
  refrigerant: "refrigerant",
  marketSegment: "segment",
  hp: "hp",
} as const satisfies Record<keyof CatalogFilterState, string>;

export function normalizeHorsepowerFilter(value: string | null): string {
  return value && horsepowerQueryValues.has(value) ? value : "";
}

export function readCatalogFilters(query: URLSearchParams): CatalogFilterState {
  return {
    brand: query.get(queryKeys.brand) ?? "",
    productType: query.get(queryKeys.productType) ?? "",
    technology: query.get(queryKeys.technology) ?? "",
    coolingMode: query.get(queryKeys.coolingMode) ?? "",
    refrigerant: query.get(queryKeys.refrigerant) ?? "",
    marketSegment: query.get(queryKeys.marketSegment) ?? "",
    hp: normalizeHorsepowerFilter(query.get(queryKeys.hp)),
  };
}

export function updateCatalogFilterQuery(current: URLSearchParams, filters: CatalogFilterState): URLSearchParams {
  const query = new URLSearchParams(current);
  for (const key of Object.values(queryKeys)) query.delete(key);
  for (const [filter, value] of Object.entries(filters) as [keyof CatalogFilterState, string][]) {
    if (value) query.set(queryKeys[filter], value);
  }
  return query;
}

export function filterProductFamilies(families: ProductFamily[], variants: ProductVariant[], filters: CatalogFilterState): ProductFamily[] {
  return families.filter((family) => {
    const children = variants.filter((variant) => variant.familyId === family.id && variant.active);
    return (!filters.brand || family.brand === filters.brand)
      && (!filters.productType || family.productType === filters.productType)
      && (!filters.technology || family.technology === filters.technology)
      && (!filters.refrigerant || family.refrigerant === filters.refrigerant)
      && (!filters.marketSegment || family.marketSegments.includes(filters.marketSegment as never))
      && children.some((variant) => (!filters.coolingMode || variant.coolingMode === filters.coolingMode)
        && (!filters.hp || String(variant.capacityHp) === filters.hp));
  });
}

export function getAvailableHorsepower(variants: ProductVariant[]): SupportedHorsepower[] {
  return [...new Set(variants.filter((variant) => variant.active).map((variant) => variant.capacityHp))].sort((a, b) => a - b);
}

export function formatHorsepower(locale: Locale, horsepower: SupportedHorsepower): string {
  const value = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2, useGrouping: false }).format(horsepower);
  return locale === "ar" ? `${value} حصان` : `${value} HP`;
}

export function formatFamilyHorsepowerSummary(locale: Locale, variants: ProductVariant[]): string {
  const values = getAvailableHorsepower(variants).map((horsepower) => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2, useGrouping: false }).format(horsepower));
  const list = new Intl.ListFormat(locale === "ar" ? "ar-EG" : "en-US", { style: "long", type: "conjunction" }).format(values);
  return locale === "ar" ? `متاح بقدرات ${list} حصان` : `Available: ${list} HP`;
}
