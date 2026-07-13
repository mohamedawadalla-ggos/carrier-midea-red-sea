import type { Locale } from "@/content/site";
import type { ProductFamily, ProductTypeId, ProductVariant } from "@/types/catalog";

export type ProductInquiry = {
  locale: Locale;
  family: ProductFamily;
  variant: ProductVariant;
  productType: ProductTypeId;
  customerName: string;
  telephone: string;
  area: string;
  installationRequired: boolean;
  notes: string;
};

export type ServiceRequest = {
  locale: Locale;
  customerName: string;
  telephone: string;
  area: string;
  service: string;
  notes: string;
};
