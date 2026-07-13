import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCategoryGrid } from "@/components/products/ProductCategoryGrid";
import { ProductFamilyGrid } from "@/components/products/ProductFamilyGrid";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import { absoluteUrl } from "@/lib/site-config";
import { isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; const ar = locale === "ar"; return { title: ar ? "كتالوج التكييفات | كاريير ميديا البحر الأحمر" : "Air Conditioner Catalog | Carrier–Midea Red Sea", description: ar ? "تصفح عائلات تكييفات كاريير وميديا واطلب السعر الحالي." : "Browse Carrier and Midea product families and request the current price.", alternates: { canonical: absoluteUrl(`/${locale}/products`) } }; }

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound(); const ar = locale === "ar";
  const commercialFamilies = productFamilies.filter((family) => family.marketSegments.includes("commercial") || family.marketSegments.includes("projects"));
  const applications = ar ? ["الفنادق والمنتجعات", "الفلل", "المطاعم", "المكاتب", "المحلات والمعارض", "العيادات", "المباني التجارية"] : ["Hotels and resorts", "Villas", "Restaurants", "Offices", "Shops and showrooms", "Clinics", "Commercial buildings"];
  return <div className="site catalog-site"><SiteHeader locale={locale} currentPath="/products" /><main id="main-content" className="catalog-main">
    <section className="catalog-hero"><p className="kicker light">{ar ? "كتالوج المنتجات" : "PRODUCT CATALOG"}</p><h1>{ar ? "اختر عائلة التكييف المناسبة" : "Find the right AC family"}</h1><p>{ar ? "ابدأ بنوع الجهاز ثم قارن الموديلات المتاحة داخل كل عائلة. جميع الأسعار الحالية متاحة عند الطلب." : "Start with the equipment type, then compare available models inside each family. All current prices are available on request."}</p></section>
    <section className="section catalog-categories" aria-labelledby="catalog-types-title"><div className="section-heading"><p className="kicker">{ar ? "أنواع الأجهزة" : "EQUIPMENT TYPES"}</p><h2 id="catalog-types-title">{ar ? "ابدأ بطريقة التركيب" : "Start with the installation type"}</h2></div><ProductCategoryGrid locale={locale} /></section>
    <section className="section catalog-content" aria-label={ar ? "عائلات المنتجات" : "Product families"}><ProductFamilyGrid families={productFamilies} variants={productVariants} locale={locale} /><p className="catalog-disclaimer">{ar ? "مرجع قائمة المنتجات: 7 يونيو 2026، ويخضع السعر والتوافر للتأكيد." : "Product list reference: 7 June 2026. Price and availability require confirmation."}</p></section>
    <section className="commercial-solutions"><div className="section commercial-inner"><div><p className="kicker light">{ar ? "حلول متكاملة" : "INTEGRATED SOLUTIONS"}</p><h2>{ar ? "حلول المشروعات والتكييف التجاري" : "Commercial and Project Solutions"}</h2><p>{ar ? "عائلات مناسبة للتطبيقات التجارية والمشروعات دون تكرار سجلات المنتجات." : "Eligible product families for commercial applications and projects without duplicating catalog records."}</p><div className="application-chips">{applications.map((item) => <span key={item}>{item}</span>)}</div></div><div className="commercial-family-links">{commercialFamilies.map((family) => <a key={family.id} href={`/${locale}/products/${family.productType}/${family.slug}`}>{family.name[locale]} <span>↗</span></a>)}</div></div></section>
  </main><SiteFooter locale={locale} /></div>;
}
