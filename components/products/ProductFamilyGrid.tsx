"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/content/site";
import type { ProductFamily, ProductVariant } from "@/types/catalog";
import { CatalogFilters, emptyCatalogFilters, type CatalogFilterState } from "@/components/products/CatalogFilters";
import { ProductFamilyCard } from "@/components/products/ProductFamilyCard";
import { filterProductFamilies, readCatalogFilters, updateCatalogFilterQuery } from "@/lib/catalog-filtering";

function readFilters(): CatalogFilterState {
  if (typeof window === "undefined") return emptyCatalogFilters;
  return readCatalogFilters(new URLSearchParams(window.location.search));
}

export function ProductFamilyGrid({ families, variants, locale, lockProductType = false }: { families: ProductFamily[]; variants: ProductVariant[]; locale: Locale; lockProductType?: boolean }) {
  const [filters, setFilters] = useState<CatalogFilterState>(emptyCatalogFilters);
  useEffect(() => { const sync = () => setFilters(readFilters()); sync(); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  const update = (next: CatalogFilterState) => { setFilters(next); const query = updateCatalogFilterQuery(new URLSearchParams(window.location.search), next); window.history.replaceState({}, "", `${window.location.pathname}${query.size ? `?${query}` : ""}`); };
  const visible = useMemo(() => filterProductFamilies(families, variants, filters), [families, variants, filters]);
  return <><CatalogFilters locale={locale} value={filters} onChange={update} lockProductType={lockProductType} /><p className="product-count" aria-live="polite">{locale === "ar" ? `${visible.length} عائلة منتجات` : `${visible.length} product families`}</p>{visible.length ? <div className="product-grid">{visible.map((family) => <ProductFamilyCard key={family.id} family={family} variants={variants.filter((variant) => variant.familyId === family.id)} locale={locale} />)}</div> : <div className="product-empty"><h2>{locale === "ar" ? "لا توجد نتائج مطابقة" : "No matching families"}</h2></div>}</>;
}
