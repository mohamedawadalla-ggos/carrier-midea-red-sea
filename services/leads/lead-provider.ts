import type { AcAdvisorInquiry, ProductInquiry, RequestCartInquiry, ServiceRequest } from "@/types/lead";

export interface LeadProvider {
  submitProductInquiry(data: ProductInquiry): Promise<string | null>;
  submitServiceRequest(data: ServiceRequest): Promise<string | null>;
  submitAcAdvisorInquiry(data: AcAdvisorInquiry): Promise<string | null>;
  submitRequestCart(data: RequestCartInquiry): Promise<string | null>;
}
