"use client";

import type { Locale } from "@/content/site";
import { productTypes } from "@/content/catalog-types";
import { emptyCatalogFilters, formatHorsepower, supportedHorsepowerValues, type CatalogFilterState } from "@/lib/catalog-filtering";

export { emptyCatalogFilters, type CatalogFilterState } from "@/lib/catalog-filtering";

export function CatalogFilters({ locale, value, onChange, lockProductType }: { locale: Locale; value: CatalogFilterState; onChange: (next: CatalogFilterState) => void; lockProductType?: boolean }) {
  const ar = locale === "ar"; const set = (key: keyof CatalogFilterState, next: string) => onChange({ ...value, [key]: next });
  return <div className="product-filters catalog-filters" aria-label={ar ? "تصفية عائلات المنتجات" : "Product-family filters"}>
    <label>{ar ? "العلامة" : "Brand"}<select value={value.brand} onChange={(e) => set("brand", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option><option value="carrier">Carrier</option><option value="midea">Midea</option></select></label>
    {!lockProductType && <label>{ar ? "نوع الجهاز" : "Equipment type"}<select value={value.productType} onChange={(e) => set("productType", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option>{productTypes.map((type) => <option key={type.id} value={type.id}>{type.name[locale]}</option>)}</select></label>}
    <label>{ar ? "التقنية" : "Technology"}<select value={value.technology} onChange={(e) => set("technology", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option><option value="inverter">Inverter</option><option value="fixed-speed">{ar ? "ثابت السرعة" : "Fixed speed"}</option></select></label>
    <label>{ar ? "التشغيل" : "Mode"}<select value={value.coolingMode} onChange={(e) => set("coolingMode", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option><option value="cool-only">{ar ? "بارد فقط" : "Cool only"}</option><option value="heat-pump">{ar ? "بارد / ساخن" : "Cool & heat"}</option></select></label>
    <label>{ar ? "المبرد" : "Refrigerant"}<select value={value.refrigerant} onChange={(e) => set("refrigerant", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option><option>R32</option><option>R410A</option></select></label>
    <label>{ar ? "الاستخدام" : "Market segment"}<select value={value.marketSegment} onChange={(e) => set("marketSegment", e.target.value)}><option value="">{ar ? "الكل" : "All"}</option><option value="residential">{ar ? "سكني" : "Residential"}</option><option value="commercial">{ar ? "تجاري" : "Commercial"}</option><option value="projects">{ar ? "مشروعات" : "Projects"}</option></select></label>
    <label>{ar ? "القدرة بالحصان" : "Horsepower"}<select value={value.hp} onChange={(e) => set("hp", e.target.value)}><option value="">{ar ? "كل القدرات" : "All capacities"}</option>{supportedHorsepowerValues.map((horsepower) => <option key={horsepower} value={String(horsepower)}>{formatHorsepower(locale, horsepower)}</option>)}</select></label>
    <button type="button" onClick={() => onChange({ ...emptyCatalogFilters, productType: lockProductType ? value.productType : "" })}>{ar ? "مسح الفلاتر" : "Clear filters"}</button>
  </div>;
}
