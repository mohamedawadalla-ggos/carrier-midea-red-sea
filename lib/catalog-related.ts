import type { ProductFamily, ProductVariant, SupportedHorsepower } from "@/types/catalog";

export type RelatedProductRank = 1 | 2 | 3 | 4;

export type RelatedProduct = {
  family: ProductFamily;
  variant: ProductVariant;
  rank: RelatedProductRank;
  requiresInspection: boolean;
};

export type RelatedProductContext = {
  familyId: string;
  variantId?: string;
  horsepower: SupportedHorsepower;
};

const productTypePriority: Record<ProductFamily["productType"], number> = {
  "wall-mounted-split": 0,
  "concealed-ducted": 1,
  "ceiling-cassette": 2,
  "floor-standing": 3,
};

export function rankRelatedProducts(
  families: ProductFamily[],
  variants: ProductVariant[],
  context: RelatedProductContext,
): RelatedProduct[] {
  const currentFamily = families.find((family) => family.id === context.familyId);
  if (!currentFamily) return [];

  const familyById = new Map(families.map((family) => [family.id, family]));
  const seen = new Set<string>();
  const ranked: (RelatedProduct & { higherHpDistance: number })[] = [];

  for (const variant of variants) {
    if (!variant.active || variant.familyId === context.familyId || variant.id === context.variantId || seen.has(variant.id)) continue;
    const family = familyById.get(variant.familyId);
    if (!family) continue;

    let rank: RelatedProductRank | null = null;
    if (variant.capacityHp === context.horsepower && family.productType === currentFamily.productType) rank = 1;
    else if (variant.capacityHp === context.horsepower
      && (family.brand !== currentFamily.brand || family.technology !== currentFamily.technology)) rank = 2;
    else if (family.productType === currentFamily.productType && variant.capacityHp > context.horsepower) rank = 3;
    else if (family.productType !== currentFamily.productType && variant.capacityHp === context.horsepower) rank = 4;
    if (rank === null) continue;

    seen.add(variant.id);
    ranked.push({
      family,
      variant,
      rank,
      requiresInspection: family.productType !== currentFamily.productType,
      higherHpDistance: rank === 3 ? variant.capacityHp - context.horsepower : 0,
    });
  }

  return ranked.sort((left, right) => left.rank - right.rank
    || left.higherHpDistance - right.higherHpDistance
    || productTypePriority[left.family.productType] - productTypePriority[right.family.productType]
    || left.variant.capacityHp - right.variant.capacityHp
    || left.family.displayOrder - right.family.displayOrder
    || left.variant.displayOrder - right.variant.displayOrder
    || left.variant.id.localeCompare(right.variant.id, "en"))
    .map((related) => ({
      family: related.family,
      variant: related.variant,
      rank: related.rank,
      requiresInspection: related.requiresInspection,
    }));
}
