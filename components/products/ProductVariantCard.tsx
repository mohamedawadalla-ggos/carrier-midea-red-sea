/* eslint-disable @next/next/no-img-element -- static export uses approved local assets with explicit dimensions. */
import Link from "next/link";
import type { Locale } from "@/content/site";
import type { ProductFamily, ProductVariant } from "@/types/catalog";
import { formatHorsepower } from "@/lib/catalog-filtering";
import { AddToRequestButton } from "@/components/cart/AddToRequestButton";

export function ProductVariantCard({ family, variant, locale, inspectionRequired = false }: { family: ProductFamily; variant: ProductVariant; locale: Locale; inspectionRequired?: boolean }) {
  const ar = locale === "ar";
  const href = `/${locale}/products/${family.productType}/${family.slug}`;
  return <article className="product-card variant-card">
    <div className="product-stage"><span className={`product-brand ${family.brand}`}>{family.brand}</span>{family.assetAuthorization === "approved" && family.familyImagePath ? <img className="product-image" src={family.familyImagePath} alt={family.name[locale]} width={800} height={600} /> : <div className="product-placeholder"><div className="placeholder-unit"><i /></div></div>}</div>
    <div className="product-card-body"><p className="product-series">{family.technology === "inverter" ? "Inverter" : ar ? "ثابت السرعة" : "Fixed speed"} · {family.refrigerant}</p><h3><Link href={href} prefetch={false}>{family.name[locale]}</Link></h3><p>{family.description[locale]}</p><div className="product-specs"><span>{formatHorsepower(locale, variant.capacityHp)}</span><span>{variant.coolingMode === "cool-only" ? (ar ? "بارد فقط" : "Cool only") : (ar ? "بارد / ساخن" : "Cool & heat")}</span>{inspectionRequired && <span className="inspection-label">{ar ? "يتطلب معاينة" : "Inspection required"}</span>}</div><div className="variant-card-actions"><AddToRequestButton variantId={variant.id} locale={locale} className="add-request-button" /><Link className="request-current-price" href={`${href}#inquiry`} prefetch={false}>{ar ? "اطلب السعر الحالي" : "Request current price"}</Link></div></div>
  </article>;
}
