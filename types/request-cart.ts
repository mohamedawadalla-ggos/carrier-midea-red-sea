import type { ProductFamily, ProductVariant } from "@/types/catalog";

export type RequestCartItem = {
  variantId: string;
  quantity: number;
};

export type RequestCartPayload = {
  version: 1;
  items: RequestCartItem[];
};

export type ResolvedRequestCartItem = RequestCartItem & {
  family: ProductFamily;
  variant: ProductVariant;
};

