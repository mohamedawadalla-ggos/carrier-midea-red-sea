import type { Locale } from "@/content/site";
import type { Product } from "@/types/product";

export type ProductInquiry = {
  locale: Locale;
  product: Product;
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
