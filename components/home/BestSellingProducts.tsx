"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/content/site";
import { ProductVariantCard } from "@/components/products/ProductVariantCard";
import { formatHorsepower, supportedHorsepowerValues } from "@/lib/catalog-filtering";
import { getBestSellingProducts } from "@/lib/best-selling-products";
import type { SupportedHorsepower } from "@/types/catalog";

export function BestSellingProducts({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const products = getBestSellingProducts();
  const [capacity, setCapacity] = useState<SupportedHorsepower>(supportedHorsepowerValues[0]);

  const group = products.filter(({ variant }) => variant.capacityHp === capacity);
  const catalogHref = `/${locale}/products?type=wall-mounted-split&hp=${capacity}`;

  return <section className="section best-selling-products" id="best-selling-products" aria-labelledby="best-selling-products-title">
    <div className="section-heading best-selling-heading">
      <p className="kicker">{ar ? "اختيارات الكتالوج" : "CATALOG SELECTIONS"}</p>
      <h2 id="best-selling-products-title">{ar ? "الأكثر مبيعًا" : "Best-selling air conditioners"}</h2>
      <p>{ar ? "اختيار تسويقي معتمد من موديلات السبليت الحائطية، دون نشر أرقام مبيعات أو ادعاء ترتيب رقمي." : "An approved marketing selection of wall-mounted split models, without publishing sales figures or claiming a numerical order."}</p>
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
        <h3 id="best-selling-active-group">{formatHorsepower(locale, capacity)}</h3>
        <Link href={catalogHref} prefetch={false}>{ar ? "عرض كل الموديلات" : "View all models"}<span>↗</span></Link>
      </div>
      <div className="product-grid best-selling-grid">
        {group.map(({ family, selection, variant }) => <ProductVariantCard key={selection.variantId} family={family} variant={variant} locale={locale} />)}
      </div>
      {!group.length && <p className="empty">{ar ? "لا توجد موديلات متاحة لهذه القدرة حاليًا." : "No models available for this horsepower right now."}</p>}
    </section>
  </section>;
}
