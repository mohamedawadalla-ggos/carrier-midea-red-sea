/* eslint-disable @next/next/no-img-element -- static export uses approved local assets with explicit dimensions. */
import Link from "next/link";
import type { Locale } from "@/content/site";
import type { ProductFamily, ProductVariant } from "@/types/catalog";
import { pick } from "@/lib/i18n";
import { formatFamilyHorsepowerSummary } from "@/lib/catalog-filtering";

export function ProductFamilyCard({ family, variants, locale }: { family: ProductFamily; variants: ProductVariant[]; locale: Locale }) {
  return <article className="product-card family-card">
    <div className="product-stage"><span className={`product-brand ${family.brand}`}>{family.brand}</span>{family.assetAuthorization === "approved" && family.familyImagePath ? <img className="product-image" src={family.familyImagePath} alt={family.name[locale]} width={800} height={600} /> : <div className="product-placeholder" aria-label={pick(locale, "صورة العائلة قيد اعتماد العميل", "Family image pending client approval")}><div className="placeholder-unit"><i /></div><small>{pick(locale, "الصورة قيد الاعتماد", "IMAGE APPROVAL PENDING")}</small></div>}</div>
    <div className="product-card-body"><p className="product-series">{family.technology === "inverter" ? "Inverter" : pick(locale, "ثابت السرعة", "Fixed speed")} · {family.refrigerant}</p><h3><Link href={`/${locale}/products/${family.productType}/${family.slug}`} prefetch={false}>{family.name[locale]}</Link></h3><p>{family.description[locale]}</p><p className="family-capacities">{formatFamilyHorsepowerSummary(locale, variants)}</p><div className="product-specs"><span>{variants.length} {pick(locale, "موديلات", "models")}</span><span>{pick(locale, "اطلب السعر الحالي", "Request Current Price")}</span></div><Link className="product-price family-link" href={`/${locale}/products/${family.productType}/${family.slug}`} prefetch={false}>{pick(locale, "عرض العائلة والموديلات", "View family and models")}</Link></div>
  </article>;
}
