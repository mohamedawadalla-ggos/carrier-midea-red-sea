"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/content/site";
import { ProductVariantCard } from "@/components/products/ProductVariantCard";
import { formatHorsepower, supportedHorsepowerValues, emptyCatalogFilters, filterProductVariants } from "@/lib/catalog-filtering";
import { getBestSellingProducts } from "@/lib/best-selling-products";
import { productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import type { SupportedHorsepower } from "@/types/catalog";

const curatedCapacities: readonly SupportedHorsepower[] = [1.5, 2.25, 3];

export function BestSellingProducts({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const curatedProducts = getBestSellingProducts();
  const [capacity, setCapacity] = useState<SupportedHorsepower>(supportedHorsepowerValues[0]);

  const isCurated = curatedCapacities.includes(capacity);
  const catalogHref = isCurated
    ? `/${locale}/products?type=wall-mounted-split&hp=${capacity}`
    : `/${locale}/products?hp=${capacity}`;

  // The curated list is a fixed, reviewed 12-item marketing selection covering
  // only 1.5/2.25/3 HP wall-mounted models -- it is not a live catalog query
  // and does not extend to other capacities. For every other horsepower,
  // pull real matching catalog models across all equipment types instead of
  // showing an empty "not available" state.
  const items = isCurated
    ? curatedProducts
        .filter(({ variant }) => variant.capacityHp === capacity)
        .map(({ family, variant, selection }) => ({ key: selection.variantId, family, variant }))
    : filterProductVariants(productFamilies, productVariants, { ...emptyCatalogFilters, hp: String(capacity) })
        .map((variant) => ({ key: variant.id, family: productFamilies.find((family) => family.id === variant.familyId)!, variant }));

  return <section className="section best-selling-products" id="best-selling-products" aria-labelledby="best-selling-products-title">
    <div className="section-heading best-selling-heading">
      <p className="kicker">{ar ? "اختيارات الكتالوج" : "CATALOG SELECTIONS"}</p>
      <h2 id="best-selling-products-title">{ar ? "اختر تكييفك بالقدره (كم حصان؟) من هنا" : "Choose your AC by horsepower — how many HP?"}</h2>
    </div>
    <div className="best-selling-filter">
      <label>
        {ar ? "اختر القدرة بالحصان" : "Choose horsepower"}
        <select value={String(capacity)} onChange={(event) => setCapacity(Number(event.target.value) as SupportedHorsepower)} aria-label={ar ? "تصفية الأكثر مبيعًا حسب القدرة" : "Filter best-sellers by horsepower"}>
          {supportedHorsepowerValues.map((hp) => <option key={hp} value={hp}>{formatHorsepower(locale, hp)}</option>)}
        </select>
      </label>
    </div>
    <section className="best-selling-group" aria-labelledby="best-selling-active-group">
      <div className="best-selling-group-heading">
        <h3 id="best-selling-active-group">
          {formatHorsepower(locale, capacity)}
          {!isCurated && <small>{ar ? " — كل الموديلات المتاحة" : " — all available models"}</small>}
        </h3>
        <Link href={catalogHref} prefetch={false}>{ar ? "عرض كل الموديلات" : "View all models"}<span>↗</span></Link>
      </div>
      <div className="product-grid best-selling-grid">
        {items.map(({ key, family, variant }) => <ProductVariantCard key={key} family={family} variant={variant} locale={locale} />)}
      </div>
      {!items.length && <p className="empty">{ar ? "لا توجد موديلات متاحة لهذه القدرة حاليًا." : "No models available for this horsepower right now."}</p>}
    </section>
  </section>;
}
