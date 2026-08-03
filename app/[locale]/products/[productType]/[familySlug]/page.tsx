import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductFamilyLiveContent } from "@/components/products/ProductFamilyLiveContent";
import { productFamilies } from "@/content/product-families";
import { getFamily, getFamilyVariants } from "@/lib/catalog";
import { isLocale, locales } from "@/lib/i18n";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { canonicalUrl, localizedAlternates } from "@/lib/seo";

export function generateStaticParams() { return locales.flatMap((locale) => productFamilies.map((family) => ({ locale, productType: family.productType, familySlug: family.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; productType: string; familySlug: string }> }): Promise<Metadata> { const { locale, productType, familySlug } = await params; const family = getFamily(productType, familySlug); if (!family || !isLocale(locale)) return {}; return { title: `${family.name[locale]} | Carrier–Midea Red Sea`, description: family.description[locale], alternates: localizedAlternates(locale, `/products/${productType}/${familySlug}`), openGraph: { title: family.name[locale], description: family.description[locale], images: siteConfig.siteUrl && family.familyImagePath && family.assetAuthorization === "approved" ? [{ url: absoluteUrl(family.familyImagePath) }] : undefined } }; }

export default async function ProductFamilyPage({ params }: { params: Promise<{ locale: string; productType: string; familySlug: string }> }) {
  const { locale, productType, familySlug } = await params; if (!isLocale(locale)) notFound(); const family = getFamily(productType, familySlug); if (!family) notFound(); const variants = getFamilyVariants(family.id); const url = canonicalUrl(`/${locale}/products/${productType}/${familySlug}`);
  return <div className="site catalog-site"><SiteHeader locale={locale} currentPath="/products" /><ProductFamilyLiveContent family={family} variants={variants} locale={locale} url={url} /><SiteFooter locale={locale} /></div>;
}
