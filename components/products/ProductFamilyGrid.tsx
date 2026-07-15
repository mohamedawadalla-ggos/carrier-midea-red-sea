"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/content/site";
import type { ProductFamily, ProductVariant } from "@/types/catalog";
import { CatalogFilters, emptyCatalogFilters, type CatalogFilterState } from "@/components/products/CatalogFilters";
import { ProductFamilyCard } from "@/components/products/ProductFamilyCard";
import { ProductVariantCard } from "@/components/products/ProductVariantCard";
import { defaultCatalogSort, filterProductFamilies, filterProductVariants, getCatalogResultMode, getMatchingFamilyVariants, hasActiveCatalogFilters, readCatalogFilters, readCatalogSort, sortProductFamilies, sortProductVariants, updateCatalogFilterQuery, updateCatalogSortQuery, type CatalogSortValue } from "@/lib/catalog-filtering";

function readFilters(): CatalogFilterState {
  if (typeof window === "undefined") return emptyCatalogFilters;
  return readCatalogFilters(new URLSearchParams(window.location.search));
}

function readSort(): CatalogSortValue {
  if (typeof window === "undefined") return defaultCatalogSort;
  return readCatalogSort(new URLSearchParams(window.location.search));
}

export function ProductFamilyGrid({ families, variants, locale, lockProductType = false }: { families: ProductFamily[]; variants: ProductVariant[]; locale: Locale; lockProductType?: boolean }) {
  const [filters, setFilters] = useState<CatalogFilterState>(emptyCatalogFilters);
  const [sort, setSort] = useState<CatalogSortValue>(defaultCatalogSort);
  useEffect(() => { const sync = () => { setFilters(readFilters()); setSort(readSort()); }; sync(); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  const update = (next: CatalogFilterState) => { setFilters(next); const query = updateCatalogFilterQuery(new URLSearchParams(window.location.search), next); window.history.replaceState({}, "", `${window.location.pathname}${query.size ? `?${query}` : ""}`); };
  const updateSort = (next: CatalogSortValue) => { setSort(next); const query = updateCatalogSortQuery(new URLSearchParams(window.location.search), next); window.history.replaceState({}, "", `${window.location.pathname}${query.size ? `?${query}` : ""}`); };
  const mode = getCatalogResultMode(filters);
  const visibleFamilies = useMemo(() => sortProductFamilies(filterProductFamilies(families, variants, filters), variants, filters, sort), [families, variants, filters, sort]);
  const visibleVariants = useMemo(() => sortProductVariants(filterProductVariants(families, variants, filters), families, sort), [families, variants, filters, sort]);
  const hasFilters = hasActiveCatalogFilters(filters);
  const count = mode === "variants" ? visibleVariants.length : visibleFamilies.length;
  return <><CatalogFilters locale={locale} value={filters} sort={sort} onChange={update} onSortChange={updateSort} lockProductType={lockProductType} /><p className="product-count" aria-live="polite">{mode === "variants" ? (locale === "ar" ? `${count} موديل مطابق` : `${count} matching models`) : (locale === "ar" ? `${count} عائلة منتجات` : `${count} product families`)}</p>{count ? <div className="product-grid">{mode === "variants" ? visibleVariants.map((variant) => { const family = families.find((item) => item.id === variant.familyId); return family ? <ProductVariantCard key={variant.id} family={family} variant={variant} locale={locale} /> : null; }) : visibleFamilies.map((family) => { const matchingVariants = getMatchingFamilyVariants(family, variants, filters); return <ProductFamilyCard key={family.id} family={family} variants={matchingVariants} locale={locale} matching={hasFilters} />; })}</div> : <div className="product-empty"><h2>{locale === "ar" ? "لا توجد نتائج مطابقة" : "No matching products"}</h2></div>}</>;
}
