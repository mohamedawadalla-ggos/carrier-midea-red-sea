import type { ProductInquiry, ServiceRequest } from "@/types/lead";

export interface LeadProvider {
  submitProductInquiry(data: ProductInquiry): Promise<string | null>;
  submitServiceRequest(data: ServiceRequest): Promise<string | null>;
}
