import type { ProductVariant } from "@/types/catalog";

export type BestSellingProductSelection = {
  variantId: ProductVariant["id"];
  order: number;
  active: boolean;
};

export const bestSellingProductSelections = [
  { variantId: "carrier-xcool-inverter-53kheft18dn8-708f", order: 1, active: true },
  { variantId: "carrier-optimax-pro-53qhct18n-708f", order: 2, active: true },
  { variantId: "midea-ai-ecomaster-inverter-m1seft-18hrdn8f-q8", order: 3, active: true },
  { variantId: "midea-xtreme-pro-m1seft-18crn8f-q8", order: 4, active: true },
  { variantId: "carrier-xcool-inverter-53qheft12dn8-708f", order: 5, active: true },
  { variantId: "carrier-optimax-pro-53khct12n-708", order: 6, active: true },
  { variantId: "midea-ai-ecomaster-inverter-m1seft-12crdn8f-q8", order: 7, active: true },
  { variantId: "midea-xtreme-pro-m1seft-12hrn8f-q8", order: 8, active: true },
  { variantId: "carrier-xcool-inverter-53qheft24dn8-708f", order: 9, active: true },
  { variantId: "carrier-optimax-pro-53khct24n-708", order: 10, active: true },
  { variantId: "midea-ai-ecomaster-inverter-m1seft-24crdn8f-q8", order: 11, active: true },
  { variantId: "midea-xtreme-pro-m1seft-24hrn8f-q8", order: 12, active: true },
] as const satisfies readonly BestSellingProductSelection[];
