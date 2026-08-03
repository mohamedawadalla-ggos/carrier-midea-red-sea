"use client";

import Link from "next/link";
import type { Locale } from "@/content/site";
import { featuredProductFamilies, productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import { ProductFamilyCard } from "@/components/products/ProductFamilyCard";
import { useVisibleCatalog } from "@/components/catalog/PublicCatalogVisibilityProvider";
import { PublicCatalogUnavailable } from "@/components/catalog/PublicCatalogUnavailable";

export function FeaturedProductFamilies({ locale }: { locale: Locale }) { const liveCatalog = useVisibleCatalog(productFamilies, productVariants); const featured = featuredProductFamilies.filter((family) => liveCatalog.families.some((item) => item.id === family.id)); return <section className="section featured-products" aria-labelledby="featured-products-title"><div className="section-heading"><p className="kicker">{locale === "ar" ? "اختيارات من الكتالوج" : "FROM THE CATALOG"}</p><h2 id="featured-products-title">{locale === "ar" ? "عائلات مختارة لكل مساحة" : "Selected families for every space"}</h2><p>{locale === "ar" ? `${featured.length} عائلات من إجمالي ${liveCatalog.families.length} عائلة و${liveCatalog.variants.length} موديل. السعر الحالي متاح عند الطلب.` : `${featured.length} families from ${liveCatalog.families.length} families and ${liveCatalog.variants.length} variants. Current pricing is available on request.`}</p></div>{liveCatalog.status === "loading" || liveCatalog.status === "error" ? <PublicCatalogUnavailable locale={locale} loading={liveCatalog.status === "loading"} compact /> : <div className="product-grid featured-grid">{featured.map((family) => <ProductFamilyCard key={family.id} family={family} variants={liveCatalog.variants.filter((variant) => variant.familyId === family.id)} locale={locale} />)}</div>}<Link className="catalog-link" href={`/${locale}/products`} prefetch={false}>{locale === "ar" ? "عرض الكتالوج" : "View catalog"}<span>↗</span></Link></section>; }
