"use client";

import type { Locale } from "@/content/site";
import { productFamilies } from "@/content/product-families";
import { productTypes } from "@/content/catalog-types";
import { ProductCategoryCard } from "@/components/products/ProductCategoryCard";
import { productVariants } from "@/content/product-variants";
import { useVisibleCatalog } from "@/components/catalog/PublicCatalogVisibilityProvider";

export function ProductCategoryGrid({ locale }: { locale: Locale }) {
  const liveCatalog = useVisibleCatalog(productFamilies, productVariants);
  if (liveCatalog.status === "loading" || liveCatalog.status === "error") return null;
  const visibleTypes = productTypes.map((type) => ({ type, familyCount: liveCatalog.families.filter((family) => family.productType === type.id).length })).filter(({ familyCount }) => familyCount > 0);
  return <div className="category-grid">{visibleTypes.map(({ type, familyCount }) => <ProductCategoryCard key={type.id} type={type} locale={locale} familyCount={familyCount} />)}</div>;
}
