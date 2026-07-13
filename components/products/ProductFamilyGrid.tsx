"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/content/site";
import type { ProductFamily, ProductVariant } from "@/types/catalog";
import { CatalogFilters, emptyCatalogFilters, type CatalogFilterState } from "@/components/products/CatalogFilters";
import { ProductFamilyCard } from "@/components/products/ProductFamilyCard";

function readFilters(): CatalogFilterState {
  if (typeof window === "undefined") return emptyCatalogFilters;
  const query = new URLSearchParams(window.location.search);
  return { brand: query.get("brand") ?? "", productType: query.get("type") ?? "", technology: query.get("technology") ?? "", coolingMode: query.get("mode") ?? "", refrigerant: query.get("refrigerant") ?? "", marketSegment: query.get("segment") ?? "", capacity: query.get("capacity") ?? "" };
}

export function ProductFamilyGrid({ families, variants, locale, lockProductType = false }: { families: ProductFamily[]; variants: ProductVariant[]; locale: Locale; lockProductType?: boolean }) {
  const [filters, setFilters] = useState<CatalogFilterState>(emptyCatalogFilters);
  useEffect(() => { const sync = () => setFilters(readFilters()); sync(); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  const update = (next: CatalogFilterState) => { setFilters(next); const query = new URLSearchParams(); Object.entries(next).forEach(([key, value]) => { if (value) query.set(key === "productType" ? "type" : key === "coolingMode" ? "mode" : key === "marketSegment" ? "segment" : key, value); }); window.history.replaceState({}, "", `${window.location.pathname}${query.size ? `?${query}` : ""}`); };
  const visible = useMemo(() => families.filter((family) => {
    const children = variants.filter((variant) => variant.familyId === family.id && variant.active);
    return (!filters.brand || family.brand === filters.brand) && (!filters.productType || family.productType === filters.productType) && (!filters.technology || family.technology === filters.technology) && (!filters.refrigerant || family.refrigerant === filters.refrigerant) && (!filters.marketSegment || family.marketSegments.includes(filters.marketSegment as never)) && children.some((variant) => (!filters.coolingMode || variant.coolingMode === filters.coolingMode) && (!filters.capacity || String(variant.capacityHp ?? variant.capacityBtu ?? "") === filters.capacity));
  }), [families, variants, filters]);
  return <><CatalogFilters locale={locale} value={filters} onChange={update} lockProductType={lockProductType} variants={variants} /><p className="product-count" aria-live="polite">{locale === "ar" ? `${visible.length} عائلة منتجات` : `${visible.length} product families`}</p>{visible.length ? <div className="product-grid">{visible.map((family) => <ProductFamilyCard key={family.id} family={family} variants={variants.filter((variant) => variant.familyId === family.id)} locale={locale} />)}</div> : <div className="product-empty"><h2>{locale === "ar" ? "لا توجد نتائج مطابقة" : "No matching families"}</h2></div>}</>;
}
