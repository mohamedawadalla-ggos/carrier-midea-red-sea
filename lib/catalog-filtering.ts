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

export const catalogSortValues = ["hp-asc", "hp-desc", "product-type", "brand", "technology"] as const;
export type CatalogSortValue = (typeof catalogSortValues)[number];
export const defaultCatalogSort = "product-type" as const satisfies CatalogSortValue;
export type CatalogResultMode = "families" | "variants";

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
const catalogSortValueSet = new Set<string>(catalogSortValues);
const productTypePriority: Record<ProductFamily["productType"], number> = {
  "wall-mounted-split": 0,
  "concealed-ducted": 1,
  "ceiling-cassette": 2,
  "floor-standing": 3,
};
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

export function normalizeCatalogSort(value: string | null): CatalogSortValue {
  return value && catalogSortValueSet.has(value) ? value as CatalogSortValue : defaultCatalogSort;
}

export function readCatalogSort(query: URLSearchParams): CatalogSortValue {
  return normalizeCatalogSort(query.get("sort"));
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

export function updateCatalogSortQuery(current: URLSearchParams, sort: string): URLSearchParams {
  const query = new URLSearchParams(current);
  const normalized = normalizeCatalogSort(sort);
  if (normalized === defaultCatalogSort) query.delete("sort");
  else query.set("sort", normalized);
  return query;
}

export function hasActiveCatalogFilters(filters: CatalogFilterState): boolean {
  return Object.values(filters).some(Boolean);
}

export function getCatalogResultMode(filters: CatalogFilterState): CatalogResultMode {
  return filters.hp ? "variants" : "families";
}

function familyMatchesFilters(family: ProductFamily, filters: CatalogFilterState): boolean {
  return (!filters.brand || family.brand === filters.brand)
    && (!filters.productType || family.productType === filters.productType)
    && (!filters.technology || family.technology === filters.technology)
    && (!filters.refrigerant || family.refrigerant === filters.refrigerant)
    && (!filters.marketSegment || family.marketSegments.includes(filters.marketSegment as never));
}

function variantMatchesFilters(variant: ProductVariant, filters: CatalogFilterState): boolean {
  return variant.active
    && (!filters.coolingMode || variant.coolingMode === filters.coolingMode)
    && (!filters.hp || String(variant.capacityHp) === filters.hp);
}

export function getMatchingFamilyVariants(
  family: ProductFamily,
  variants: ProductVariant[],
  filters: CatalogFilterState,
): ProductVariant[] {
  if (!familyMatchesFilters(family, filters)) return [];
  return variants.filter((variant) => variant.familyId === family.id && variantMatchesFilters(variant, filters));
}

export function getMatchingVariantCount(
  family: ProductFamily,
  variants: ProductVariant[],
  filters: CatalogFilterState,
): number {
  return getMatchingFamilyVariants(family, variants, filters).length;
}

export function getMatchingVariantCounts(
  families: ProductFamily[],
  variants: ProductVariant[],
  filters: CatalogFilterState,
): Map<string, number> {
  return new Map(families.map((family) => [family.id, getMatchingVariantCount(family, variants, filters)]));
}

export function filterProductFamilies(families: ProductFamily[], variants: ProductVariant[], filters: CatalogFilterState): ProductFamily[] {
  return families.filter((family) => getMatchingVariantCount(family, variants, filters) > 0);
}

export function filterProductVariants(
  families: ProductFamily[],
  variants: ProductVariant[],
  filters: CatalogFilterState,
): ProductVariant[] {
  const matchingFamilyIds = new Set(families.filter((family) => familyMatchesFilters(family, filters)).map((family) => family.id));
  return variants.filter((variant) => matchingFamilyIds.has(variant.familyId) && variantMatchesFilters(variant, filters));
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, "en");
}

function compareFamiliesByDefault(
  left: ProductFamily,
  right: ProductFamily,
  matchingVariants: Map<string, ProductVariant[]>,
): number {
  const typeDifference = productTypePriority[left.productType] - productTypePriority[right.productType];
  if (typeDifference) return typeDifference;
  const leftHp = Math.min(...(matchingVariants.get(left.id) ?? []).map((variant) => variant.capacityHp));
  const rightHp = Math.min(...(matchingVariants.get(right.id) ?? []).map((variant) => variant.capacityHp));
  return leftHp - rightHp || left.displayOrder - right.displayOrder || compareText(left.id, right.id);
}

export function sortProductFamilies(
  families: ProductFamily[],
  variants: ProductVariant[],
  filters: CatalogFilterState,
  sort: string = defaultCatalogSort,
): ProductFamily[] {
  const normalizedSort = normalizeCatalogSort(sort);
  const matchingVariants = new Map(families.map((family) => [family.id, getMatchingFamilyVariants(family, variants, filters)]));
  const minimumHp = (family: ProductFamily) => Math.min(...(matchingVariants.get(family.id) ?? []).map((variant) => variant.capacityHp));
  const compareDefault = (left: ProductFamily, right: ProductFamily) => compareFamiliesByDefault(left, right, matchingVariants);

  return [...families].sort((left, right) => {
    if (normalizedSort === "hp-asc") return minimumHp(left) - minimumHp(right) || compareDefault(left, right);
    if (normalizedSort === "hp-desc") return minimumHp(right) - minimumHp(left) || compareDefault(left, right);
    if (normalizedSort === "brand") return compareText(left.brand, right.brand) || compareDefault(left, right);
    if (normalizedSort === "technology") return compareText(left.technology, right.technology) || compareDefault(left, right);
    return compareDefault(left, right);
  });
}

export function sortProductVariants(
  variants: ProductVariant[],
  families: ProductFamily[],
  sort: string = defaultCatalogSort,
): ProductVariant[] {
  const normalizedSort = normalizeCatalogSort(sort);
  const familyById = new Map(families.map((family) => [family.id, family]));
  const compareDefault = (left: ProductVariant, right: ProductVariant) => {
    const leftFamily = familyById.get(left.familyId);
    const rightFamily = familyById.get(right.familyId);
    const typeDifference = (leftFamily ? productTypePriority[leftFamily.productType] : Number.MAX_SAFE_INTEGER)
      - (rightFamily ? productTypePriority[rightFamily.productType] : Number.MAX_SAFE_INTEGER);
    return typeDifference || left.capacityHp - right.capacityHp || left.displayOrder - right.displayOrder || compareText(left.id, right.id);
  };

  return [...variants].sort((left, right) => {
    const leftFamily = familyById.get(left.familyId);
    const rightFamily = familyById.get(right.familyId);
    if (normalizedSort === "hp-asc") return left.capacityHp - right.capacityHp || compareDefault(left, right);
    if (normalizedSort === "hp-desc") return right.capacityHp - left.capacityHp || compareDefault(left, right);
    if (normalizedSort === "brand") return compareText(leftFamily?.brand ?? "", rightFamily?.brand ?? "") || compareDefault(left, right);
    if (normalizedSort === "technology") return compareText(leftFamily?.technology ?? "", rightFamily?.technology ?? "") || compareDefault(left, right);
    return compareDefault(left, right);
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
