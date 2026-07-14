import { createWhatsAppUrl } from "@/lib/whatsapp";
import { formatHorsepower } from "@/lib/catalog-filtering";
import { buildAdvisorWhatsAppMessage } from "@/lib/ac-advisor-message";
import { advisorOptions, advisorReasonCopy } from "@/content/ac-advisor-copy";
import type { LeadProvider } from "@/services/leads/lead-provider";
import type { AcAdvisorInquiry, ProductInquiry, ServiceRequest } from "@/types/lead";

function productMessage(data: ProductInquiry): string {
  const { family, variant } = data;
  const horsepowerLine = variant?.capacityHp ? (data.locale === "ar" ? `\nالقدرة: ${formatHorsepower("ar", variant.capacityHp)}` : `\nHorsepower: ${formatHorsepower("en", variant.capacityHp)}`) : "";
  return data.locale === "ar"
    ? `استفسار عن منتج\n\nالعميل: ${data.customerName}\nالهاتف: ${data.telephone}\nالمنطقة: ${data.area}\nالعلامة: ${family.brand === "carrier" ? "كاريير" : "ميديا"}\nنوع الجهاز: ${data.productType}\nعائلة المنتج: ${family.name.ar}\nكود الموديل: ${variant.modelCode}${horsepowerLine}\nنظام التشغيل: ${variant.coolingMode === "cool-only" ? "بارد فقط" : "بارد / ساخن"}\nالتركيب مطلوب: ${data.installationRequired ? "نعم" : "لا"}\nملاحظات إضافية: ${data.notes || "لا توجد"}`
    : `Product inquiry\n\nCustomer name: ${data.customerName}\nPhone: ${data.telephone}\nArea: ${data.area}\nBrand: ${family.brand === "carrier" ? "Carrier" : "Midea"}\nEquipment type: ${data.productType}\nProduct family: ${family.name.en}\nSelected model code: ${variant.modelCode}${horsepowerLine}\nCooling mode: ${variant.coolingMode === "cool-only" ? "Cool only" : "Cool & heat"}\nInstallation required: ${data.installationRequired ? "Yes" : "No"}\nAdditional notes: ${data.notes || "None"}`;
}

function serviceMessage(data: ServiceRequest): string {
  return data.locale === "ar"
    ? `طلب خدمة جديد\n\nالعميل: ${data.customerName}\nالهاتف: ${data.telephone}\nالمنطقة: ${data.area}\nالخدمة: ${data.service}\nالتفاصيل: ${data.notes}`
    : `New service request\n\nCustomer: ${data.customerName}\nTelephone: ${data.telephone}\nArea: ${data.area}\nService: ${data.service}\nDetails: ${data.notes}`;
}

export class WhatsAppLeadProvider implements LeadProvider {
  async submitProductInquiry(data: ProductInquiry): Promise<string | null> {
    return createWhatsAppUrl(productMessage(data));
  }

  async submitServiceRequest(data: ServiceRequest): Promise<string | null> {
    return createWhatsAppUrl(serviceMessage(data));
  }

  async submitAcAdvisorInquiry(data: AcAdvisorInquiry): Promise<string | null> {
    return createWhatsAppUrl(buildAdvisorWhatsAppMessage(data, { options: advisorOptions, reasonCopy: advisorReasonCopy, formatHorsepower }));
  }
}

export const leadProvider: LeadProvider = new WhatsAppLeadProvider();
