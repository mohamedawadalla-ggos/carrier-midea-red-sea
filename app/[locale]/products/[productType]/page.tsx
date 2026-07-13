import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductFamilyGrid } from "@/components/products/ProductFamilyGrid";
import { productFamilies } from "@/content/product-families";
import { productTypes } from "@/content/catalog-types";
import { productVariants } from "@/content/product-variants";
import { getFamilyById, getProductType, isProductType, legacyProductRoutes } from "@/lib/catalog";
import { isLocale } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site-config";

export function generateStaticParams() { return [...productTypes.map((type) => ({ productType: type.id })), ...Object.keys(legacyProductRoutes).map((productType) => ({ productType }))]; }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; productType: string }> }): Promise<Metadata> { const { locale, productType } = await params; const type = getProductType(productType); const legacy = legacyProductRoutes[productType]; const family = legacy && getFamilyById(legacy.familyId); if (!isLocale(locale) || (!type && !family)) return {}; const title = type?.name[locale] ?? family?.name[locale] ?? ""; return { title: `${title} | Carrier–Midea Red Sea`, description: type?.description[locale] ?? family?.description[locale], alternates: { canonical: absoluteUrl(type ? `/${locale}/products/${type.id}` : `/${locale}/products/${family!.productType}/${family!.slug}`) } }; }

export default async function ProductTypeOrLegacyPage({ params }: { params: Promise<{ locale: string; productType: string }> }) {
  const { locale, productType } = await params; if (!isLocale(locale)) notFound(); const ar = locale === "ar";
  if (!isProductType(productType)) { const legacy = legacyProductRoutes[productType]; const family = legacy && getFamilyById(legacy.familyId); if (!legacy || !family) notFound(); const target = `/${locale}/products/${family.productType}/${family.slug}${legacy.modelCode ? `#model-${legacy.modelCode}` : ""}`; return <div className="site catalog-site"><SiteHeader locale={locale} currentPath="/products" /><main id="main-content" className="catalog-main"><section className="section legacy-product"><p className="kicker">{ar ? "تم تحديث الكتالوج" : "CATALOG UPDATED"}</p><h1>{family.name[locale]}</h1><p>{ar ? "أصبح هذا الموديل جزءاً من صفحة عائلة المنتج لسهولة المقارنة." : "This model now belongs to its product-family page for easier comparison."}</p>{legacy.modelCode && <code>{legacy.modelCode}</code>}<a className="btn primary" href={target}>{ar ? "الانتقال إلى العائلة" : "Continue to family"}</a></section></main><SiteFooter locale={locale} /></div>; }
  const type = getProductType(productType)!; const families = productFamilies.filter((family) => family.productType === productType);
  return <div className="site catalog-site"><SiteHeader locale={locale} currentPath="/products" /><main id="main-content" className="catalog-main"><section className="catalog-hero category-hero"><p className="kicker light">{ar ? "نوع الجهاز" : "EQUIPMENT TYPE"}</p><h1>{type.name[locale]}</h1><p>{type.description[locale]}</p></section><section className="section catalog-content"><a className="back-link" href={`/${locale}/products`}>← {ar ? "كل أنواع الأجهزة" : "All equipment types"}</a><ProductFamilyGrid families={families} variants={productVariants} locale={locale} lockProductType /><p className="catalog-disclaimer">{ar ? "مرجع قائمة المنتجات: 7 يونيو 2026، ويخضع السعر والتوافر للتأكيد." : "Product list reference: 7 June 2026. Price and availability require confirmation."}</p></section></main><SiteFooter locale={locale} /></div>;
}
