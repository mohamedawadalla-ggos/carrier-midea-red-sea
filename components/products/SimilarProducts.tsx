import type { Locale } from "@/content/site";
import { productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import type { ProductFamily, ProductVariant } from "@/types/catalog";
import { rankRelatedProducts } from "@/lib/catalog-related";
import { ProductVariantCard } from "@/components/products/ProductVariantCard";

export function SimilarProducts({ family, variants, locale }: { family: ProductFamily; variants: ProductVariant[]; locale: Locale }) {
  const active = variants.filter((variant) => variant.active).sort((left, right) => left.capacityHp - right.capacityHp || left.displayOrder - right.displayOrder);
  const reference = active[0];
  if (!reference) return null;
  const suggestions = rankRelatedProducts(productFamilies, productVariants, { familyId: family.id, variantId: reference.id, horsepower: reference.capacityHp }).slice(0, 4);
  if (!suggestions.length) return null;
  return <section className="section similar-products" aria-labelledby="similar-products-title"><div className="section-heading"><p className="kicker">{locale === "ar" ? "خيارات من الكتالوج" : "MORE PRODUCTS"}</p><h2 id="similar-products-title">{locale === "ar" ? "منتجات مشابهة" : "Similar products"}</h2><p>{locale === "ar" ? "اقتراحات مرتبة حسب القدرة ونوع الجهاز، مع تأكيد الملاءمة النهائية بعد مراجعة الطلب." : "Suggestions ranked by capacity and equipment type, with final suitability confirmed after reviewing the request."}</p></div><div className="product-grid similar-products-grid">{suggestions.map((item) => <ProductVariantCard key={item.variant.id} family={item.family} variant={item.variant} locale={locale} inspectionRequired={item.requiresInspection} />)}</div></section>;
}
