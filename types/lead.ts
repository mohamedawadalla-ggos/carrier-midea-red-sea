import type { Locale } from "@/content/site";
import type { ProductFamily, ProductTypeId, ProductVariant } from "@/types/catalog";
import type { AcSizingInput, AcSizingResult } from "@/types/ac-advisor";

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

export type AcAdvisorInquiry = {
  locale: Locale;
  intent: "technical-confirmation" | "site-inspection";
  customerName: string;
  input: AcSizingInput;
  result: AcSizingResult;
  selectedFamily?: ProductFamily;
  selectedVariant?: ProductVariant;
};
