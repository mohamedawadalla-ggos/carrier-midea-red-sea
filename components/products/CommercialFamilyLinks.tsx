"use client";

import type { Locale } from "@/content/site";
import { productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import { useVisibleCatalog } from "@/components/catalog/PublicCatalogVisibilityProvider";

export function CommercialFamilyLinks({ locale }: { locale: Locale }) {
  const liveCatalog = useVisibleCatalog(productFamilies, productVariants);
  if (liveCatalog.status === "loading" || liveCatalog.status === "error") return null;
  const families = liveCatalog.families.filter((family) => family.marketSegments.includes("commercial") || family.marketSegments.includes("projects"));
  return <div className="commercial-family-links">{families.map((family) => <a key={family.id} href={`/${locale}/products/${family.productType}/${family.slug}`}>{family.name[locale]} <span>↗</span></a>)}</div>;
}
