import { bestSellingProductSelections } from "@/content/best-selling-products";
import { productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import type { ProductFamily, ProductVariant, SupportedHorsepower } from "@/types/catalog";

export type ResolvedBestSellingProduct = {
  selection: (typeof bestSellingProductSelections)[number];
  family: ProductFamily;
  variant: ProductVariant;
};

const expectedCapacityByOrder = (order: number): SupportedHorsepower => order <= 4 ? 2.25 : order <= 8 ? 1.5 : 3;

export function getBestSellingProducts(): ResolvedBestSellingProduct[] {
  if (bestSellingProductSelections.length !== 12) throw new Error("Best-selling selection must contain exactly 12 products");

  const variantById = new Map(productVariants.map((variant) => [variant.id, variant]));
  const familyById = new Map(productFamilies.map((family) => [family.id, family]));
  const variantIds = new Set<string>();
  const orders = new Set<number>();

  return [...bestSellingProductSelections].sort((left, right) => left.order - right.order).map((selection) => {
    if (!selection.active) throw new Error(`Inactive best-selling selection: ${selection.variantId}`);
    if (variantIds.has(selection.variantId)) throw new Error(`Duplicate best-selling variant: ${selection.variantId}`);
    if (orders.has(selection.order)) throw new Error(`Duplicate best-selling order: ${selection.order}`);
    variantIds.add(selection.variantId);
    orders.add(selection.order);

    const variant = variantById.get(selection.variantId);
    if (!variant?.active) throw new Error(`Best-selling variant is missing or inactive: ${selection.variantId}`);
    const family = familyById.get(variant.familyId);
    if (!family) throw new Error(`Best-selling family is missing: ${variant.familyId}`);
    if (family.productType !== "wall-mounted-split") throw new Error(`Best-selling variant is not wall-mounted: ${selection.variantId}`);
    if (family.assetAuthorization !== "approved" || !family.familyImagePath?.startsWith("/products/catalog/")) {
      throw new Error(`Best-selling variant lacks an approved catalog image: ${selection.variantId}`);
    }
    if (variant.capacityHp !== expectedCapacityByOrder(selection.order)) {
      throw new Error(`Best-selling capacity/order mismatch: ${selection.variantId}`);
    }
    return { selection, family, variant };
  });
}
