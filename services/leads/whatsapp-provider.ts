import { createWhatsAppUrl } from "@/lib/whatsapp";
import type { LeadProvider } from "@/services/leads/lead-provider";
import type { ProductInquiry, ServiceRequest } from "@/types/lead";

function productMessage(data: ProductInquiry): string {
  const { product } = data;
  return data.locale === "ar"
    ? `استفسار عن منتج\n\nالمنتج: ${product.name.ar}\nالعلامة: ${product.brand === "carrier" ? "كاريير" : "ميديا"}\nكود الموديل: ${product.modelCode}\nالقدرة: ${product.capacityHp} حصان\nالعميل: ${data.customerName}\nالهاتف: ${data.telephone}\nالمنطقة: ${data.area}\nالتركيب مطلوب: ${data.installationRequired ? "نعم" : "لا"}\nملاحظات: ${data.notes || "لا توجد"}`
    : `Product inquiry\n\nProduct: ${product.name.en}\nBrand: ${product.brand === "carrier" ? "Carrier" : "Midea"}\nModel code: ${product.modelCode}\nCapacity: ${product.capacityHp} HP\nCustomer: ${data.customerName}\nTelephone: ${data.telephone}\nArea: ${data.area}\nInstallation required: ${data.installationRequired ? "Yes" : "No"}\nNotes: ${data.notes || "None"}`;
}

function serviceMessage(data: ServiceRequest): string {
  return data.locale === "ar"
    ? `طلب خدمة جديد\n\nالعميل: ${data.customerName}\nالهاتف: ${data.telephone}\nالمنطقة: ${data.area}\nالخدمة: ${data.service}\nالتفاصيل: ${data.notes}`
    : `New service request\n\nCustomer: ${data.customerName}\nTelephone: ${data.telephone}\nArea: ${data.area}\nService: ${data.service}\nDetails: ${data.notes}`;
}

export class WhatsAppLeadProvider implements LeadProvider {
  async submitProductInquiry(data: ProductInquiry): Promise<string> {
    return createWhatsAppUrl(productMessage(data));
  }

  async submitServiceRequest(data: ServiceRequest): Promise<string> {
    return createWhatsAppUrl(serviceMessage(data));
  }
}

export const leadProvider: LeadProvider = new WhatsAppLeadProvider();
