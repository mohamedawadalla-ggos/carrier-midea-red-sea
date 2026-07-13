import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FamilyHero } from "@/components/products/FamilyHero";
import { FamilyHighlights } from "@/components/products/FamilyHighlights";
import { VariantComparisonTable } from "@/components/products/VariantComparisonTable";
import { VariantAccordion } from "@/components/products/VariantAccordion";
import { RecommendationCta } from "@/components/products/RecommendationCta";
import { ProductConsultationForm } from "@/components/products/ProductConsultationForm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FacebookShareButton } from "@/components/social/FacebookShareButton";
import { productFamilies } from "@/content/product-families";
import { getFamily, getFamilyVariants } from "@/lib/catalog";
import { isLocale, locales } from "@/lib/i18n";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export function generateStaticParams() { return locales.flatMap((locale) => productFamilies.map((family) => ({ locale, productType: family.productType, familySlug: family.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; productType: string; familySlug: string }> }): Promise<Metadata> { const { locale, productType, familySlug } = await params; const family = getFamily(productType, familySlug); if (!family || !isLocale(locale)) return {}; return { title: `${family.name[locale]} | Carrier–Midea Red Sea`, description: family.description[locale], alternates: { canonical: absoluteUrl(`/${locale}/products/${productType}/${familySlug}`) }, openGraph: { title: family.name[locale], description: family.description[locale], images: siteConfig.siteUrl && family.familyImagePath && family.assetAuthorization === "approved" ? [{ url: absoluteUrl(family.familyImagePath) }] : undefined } }; }

export default async function ProductFamilyPage({ params }: { params: Promise<{ locale: string; productType: string; familySlug: string }> }) {
  const { locale, productType, familySlug } = await params; if (!isLocale(locale)) notFound(); const family = getFamily(productType, familySlug); if (!family) notFound(); const variants = getFamilyVariants(family.id); const ar = locale === "ar"; const url = absoluteUrl(`/${locale}/products/${productType}/${familySlug}`);
  const productGroup = { "@context": "https://schema.org", "@type": "ProductGroup", name: family.name[locale], description: family.description[locale], brand: { "@type": "Brand", name: family.brand === "carrier" ? "Carrier" : "Midea" }, category: productType, url, hasVariant: variants.map((variant) => ({ "@type": "Product", name: `${family.name[locale]} ${variant.modelCode}`, sku: variant.modelCode })) };
  return <div className="site catalog-site"><SiteHeader locale={locale} currentPath="/products" /><main id="main-content" className="product-detail-main"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productGroup).replace(/</g, "\\u003c") }} /><div className="section family-breadcrumb"><a href={`/${locale}/products`}>{ar ? "الكتالوج" : "Catalog"}</a><span>/</span><a href={`/${locale}/products/${productType}`}>{ar ? "نوع الجهاز" : "Equipment type"}</a><FacebookShareButton url={url} label={ar ? "شارك العائلة" : "Share family"} /></div><FamilyHero family={family} locale={locale} /><FamilyHighlights family={family} locale={locale} /><section className="section family-variants" aria-labelledby="variants-title"><p className="kicker">{ar ? "الموديلات المتاحة" : "AVAILABLE MODELS"}</p><h2 id="variants-title">{ar ? "قارن موديلات العائلة" : "Compare family variants"}</h2><VariantComparisonTable variants={variants} locale={locale} /><VariantAccordion variants={variants} locale={locale} /></section><RecommendationCta locale={locale} /><section className="product-inquiry-section"><div className="section inquiry-grid"><div><p className="kicker light">{ar ? "اطلب السعر الحالي" : "REQUEST CURRENT PRICE"}</p><h2>{ar ? "اختر الموديل وأرسل تفاصيلك" : "Select a model and send your details"}</h2><p>{ar ? "لن يتم تنفيذ شراء أو دفع إلكتروني. ستفتح رسالة واتساب منظمة." : "No purchase or online payment will take place. A prepared WhatsApp inquiry will open."}</p></div><ProductConsultationForm family={family} variants={variants} locale={locale} /></div></section><p className="section product-confirmation-note">{ar ? "مرجع قائمة المنتجات: 7 يونيو 2026، ويخضع السعر والتوافر للتأكيد." : "Product list reference: 7 June 2026. Price and availability require confirmation."}</p></main><SiteFooter locale={locale} /></div>;
}
