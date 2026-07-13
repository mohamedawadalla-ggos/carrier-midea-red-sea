import type { Locale } from "@/content/site";
import { productFamilies } from "@/content/product-families";
import { productTypes } from "@/content/catalog-types";
import { ProductCategoryCard } from "@/components/products/ProductCategoryCard";

export function ProductCategoryGrid({ locale }: { locale: Locale }) {
  return <div className="category-grid">{productTypes.map((type) => <ProductCategoryCard key={type.id} type={type} locale={locale} familyCount={productFamilies.filter((family) => family.productType === type.id).length} />)}</div>;
}
