"use client";

import { FacebookShareButton } from "@/components/social/FacebookShareButton";
import { FamilyHero } from "@/components/products/FamilyHero";
import { FamilyHighlights } from "@/components/products/FamilyHighlights";
import { VariantComparisonTable } from "@/components/products/VariantComparisonTable";
import { VariantAccordion } from "@/components/products/VariantAccordion";
import { RecommendationCta } from "@/components/products/RecommendationCta";
import { ProductConsultationForm } from "@/components/products/ProductConsultationForm";
import { SimilarProducts } from "@/components/products/SimilarProducts";
import { PublicCatalogUnavailable } from "@/components/catalog/PublicCatalogUnavailable";
import { useVisibleCatalog } from "@/components/catalog/PublicCatalogVisibilityProvider";
import { productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import { formatHorsepower } from "@/lib/catalog-filtering";
import type { Locale } from "@/content/site";
import type { ProductFamily, ProductVariant } from "@/types/catalog";

export function ProductFamilyLiveContent({ family, variants, locale, url }: { family: ProductFamily; variants: ProductVariant[]; locale: Locale; url: string }) {
  const liveCatalog = useVisibleCatalog(productFamilies, productVariants);
  const ar = locale === "ar";
  if (liveCatalog.status === "loading" || liveCatalog.status === "error") {
    return <main id="main-content" className="product-detail-main"><section className="section"><PublicCatalogUnavailable locale={locale} loading={liveCatalog.status === "loading"} /></section></main>;
  }

  const familyVisible = liveCatalog.families.some((item) => item.id === family.id);
  const visibleVariants = variants.filter((variant) => liveCatalog.variants.some((item) => item.modelCode === variant.modelCode));
  if (!familyVisible || !visibleVariants.length) {
    return <main id="main-content" className="product-detail-main"><section className="section family-unavailable"><PublicCatalogUnavailable locale={locale} /></section></main>;
  }

  const productGroup = { "@context": "https://schema.org", "@type": "ProductGroup", name: family.name[locale], description: family.description[locale], brand: { "@type": "Brand", name: family.brand === "carrier" ? "Carrier" : "Midea" }, category: family.productType, url, hasVariant: visibleVariants.map((variant) => ({ "@type": "Product", name: `${family.name[locale]} · ${formatHorsepower(locale, variant.capacityHp)}` })) };
  return <main id="main-content" className="product-detail-main"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productGroup).replace(/</g, "\\u003c") }} /><div className="section family-breadcrumb"><a href={`/${locale}/products`}>{ar ? "الكتالوج" : "Catalog"}</a><span>/</span><a href={`/${locale}/products/${family.productType}`}>{ar ? "نوع الجهاز" : "Equipment type"}</a><FacebookShareButton url={url} label={ar ? "شارك العائلة" : "Share family"} /></div><FamilyHero family={family} locale={locale} /><FamilyHighlights family={family} locale={locale} /><section className="section family-variants" aria-labelledby="variants-title"><p className="kicker">{ar ? "الموديلات المتاحة" : "AVAILABLE MODELS"}</p><h2 id="variants-title">{ar ? "قارن موديلات العائلة" : "Compare family variants"}</h2><VariantComparisonTable variants={visibleVariants} locale={locale} /><VariantAccordion variants={visibleVariants} locale={locale} /></section><SimilarProducts family={family} variants={visibleVariants} locale={locale} /><RecommendationCta locale={locale} /><section className="product-inquiry-section"><div className="section inquiry-grid"><div><p className="kicker light">{ar ? "اطلب السعر الحالي" : "REQUEST CURRENT PRICE"}</p><h2>{ar ? "اختر الموديل وأرسل تفاصيلك" : "Select a model and send your details"}</h2><p>{ar ? "لن يتم تنفيذ شراء أو دفع إلكتروني. ستفتح رسالة واتساب منظمة." : "No purchase or online payment will take place. A prepared WhatsApp inquiry will open."}</p></div><ProductConsultationForm family={family} variants={visibleVariants} locale={locale} /></div></section><p className="section product-confirmation-note">{ar ? "مرجع قائمة المنتجات: 7 يونيو 2026، ويخضع السعر والتوافر للتأكيد." : "Product list reference: 7 June 2026. Price and availability require confirmation."}</p></main>;
}
