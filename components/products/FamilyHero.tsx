/* eslint-disable @next/next/no-img-element -- approved local family assets have explicit dimensions. */
import type { Locale } from "@/content/site";
import type { ProductFamily } from "@/types/catalog";
import { RequestCurrentPriceButton } from "@/components/products/RequestCurrentPriceButton";

export function FamilyHero({ family, locale }: { family: ProductFamily; locale: Locale }) {
  return <section className="section family-hero"><div className="product-detail-stage"><span className={`product-brand ${family.brand}`}>{family.brand}</span>{family.assetAuthorization === "approved" && family.familyImagePath ? <img className="product-image detail-image" src={family.familyImagePath} alt={family.name[locale]} width={1200} height={900} /> : <div className="product-placeholder detail-placeholder"><div className="placeholder-unit"><i /></div><small>{locale === "ar" ? "الصورة قيد اعتماد العميل" : "IMAGE APPROVAL PENDING"}</small></div>}</div><div className="product-detail-copy"><p className="kicker">{family.brand} · {family.refrigerant}</p><h1>{family.name[locale]}</h1><p>{family.description[locale]}</p><div className="product-specs"><span>{family.technology === "inverter" ? "Inverter" : locale === "ar" ? "ثابت السرعة" : "Fixed speed"}</span><span>{family.refrigerant}</span></div><div className="family-hero-actions"><RequestCurrentPriceButton locale={locale} /><a className="family-hero-secondary" href={`/${locale}#contact`}>{locale === "ar" ? "اطلب استشارة" : "Request consultation"}</a></div></div></section>;
}
