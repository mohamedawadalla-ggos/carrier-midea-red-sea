import type { ProductInquiry, ServiceRequest } from "@/types/lead";

export interface LeadProvider {
  submitProductInquiry(data: ProductInquiry): Promise<string>;
  submitServiceRequest(data: ServiceRequest): Promise<string>;
}
