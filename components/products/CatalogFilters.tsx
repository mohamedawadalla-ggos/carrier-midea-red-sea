"use client";

import type { Locale } from "@/content/site";
import type { ProductVariant } from "@/types/catalog";
import { productTypes } from "@/content/catalog-types";

export type CatalogFilterState = { brand: string; productType: string; technology: string; coolingMode: string; refrigerant: string; marketSegment: string; capacity: string };
export const emptyCatalogFilters: CatalogFilterState = { brand: "", productType: "", technology: "", coolingMode: "", refrigerant: "", marketSegment: "", capacity: "" };

export function CatalogFilters({ locale, value, onChange, lockProductType, variants }: { locale: Locale; value: CatalogFilterState; onChange: (next: CatalogFilterState) => void; lockProductType?: boolean; variants: ProductVariant[] }) {
  const ar = locale === "ar"; const set = (key: keyof CatalogFilterState, next: string) => onChange({ ...value, [key]: next });
  const capacityLabels = new Map<string, string>();
  variants.forEach((variant) => {
    if (variant.capacityHp !== null) capacityLabels.set(String(variant.capacityHp), `${variant.capacityHp} HP`);
    else if (variant.capacityBtu !== null) capacityLabels.set(String(variant.capacityBtu), `${variant.capacityBtu} BTU`);
  });
  const capacities = [...capacityLabels.entries()];
  return <div className="product-filters catalog-filters" aria-label={ar ? "تصفية عائلات المنتجات" : "Product-family filters"}>
    <label>{ar ? "العلامة" : "Brand"}<select value={value.brand} onChange={(e) => set("brand", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option><option value="carrier">Carrier</option><option value="midea">Midea</option></select></label>
    {!lockProductType && <label>{ar ? "نوع الجهاز" : "Equipment type"}<select value={value.productType} onChange={(e) => set("productType", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option>{productTypes.map((type) => <option key={type.id} value={type.id}>{type.name[locale]}</option>)}</select></label>}
    <label>{ar ? "التقنية" : "Technology"}<select value={value.technology} onChange={(e) => set("technology", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option><option value="inverter">Inverter</option><option value="fixed-speed">{ar ? "ثابت السرعة" : "Fixed speed"}</option></select></label>
    <label>{ar ? "التشغيل" : "Mode"}<select value={value.coolingMode} onChange={(e) => set("coolingMode", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option><option value="cool-only">{ar ? "بارد فقط" : "Cool only"}</option><option value="heat-pump">{ar ? "بارد / ساخن" : "Cool & heat"}</option></select></label>
    <label>{ar ? "المبرد" : "Refrigerant"}<select value={value.refrigerant} onChange={(e) => set("refrigerant", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option><option>R32</option><option>R410A</option></select></label>
    <label>{ar ? "الاستخدام" : "Market segment"}<select value={value.marketSegment} onChange={(e) => set("marketSegment", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option><option value="residential">{ar ? "سكني" : "Residential"}</option><option value="commercial">{ar ? "تجاري" : "Commercial"}</option><option value="projects">{ar ? "مشروعات" : "Projects"}</option></select></label>
    {capacities.length > 0 && <label>{ar ? "القدرة الموثقة" : "Verified capacity"}<select value={value.capacity} onChange={(e) => set("capacity", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option>{capacities.map(([capacity, label]) => <option key={capacity} value={capacity}>{label}</option>)}</select></label>}
    <button type="button" onClick={() => onChange({ ...emptyCatalogFilters, productType: lockProductType ? value.productType : "" })}>{ar ? "مسح الفلاتر" : "Clear filters"}</button>
  </div>;
}
