"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/content/site";
import type { ProductFamily, ProductVariant } from "@/types/catalog";
import { siteConfig } from "@/lib/site-config";
import { leadProvider } from "@/services/leads/whatsapp-provider";
import { openPreparedLink } from "@/lib/whatsapp";

export function ProductConsultationForm({ family, variants, locale, selectedModel }: { family: ProductFamily; variants: ProductVariant[]; locale: Locale; selectedModel?: string }) {
  const ar = locale === "ar"; const [unavailable, setUnavailable] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!siteConfig.whatsappNumber) { setUnavailable(true); return; } const data = new FormData(event.currentTarget); const variant = variants.find((item) => item.modelCode === data.get("model")) ?? variants[0]; const opened = await openPreparedLink(leadProvider.submitProductInquiry({ locale, family, variant, productType: family.productType, customerName: String(data.get("name") ?? ""), telephone: String(data.get("telephone") ?? ""), area: String(data.get("area") ?? ""), installationRequired: data.get("installation") === "yes", notes: String(data.get("notes") ?? "") })); setUnavailable(!opened); }
  return <form className="lead-form product-inquiry" id="inquiry" onSubmit={submit}>
    <label>{ar ? "الاسم" : "Customer name"}<input required name="name" autoComplete="name" /></label><label>{ar ? "رقم الهاتف" : "Phone"}<input required name="telephone" type="tel" autoComplete="tel" /></label><label>{ar ? "المنطقة" : "Area"}<input required name="area" /></label>
    <label>{ar ? "الموديل" : "Selected model"}<select name="model" defaultValue={selectedModel ?? variants[0]?.modelCode}>{variants.map((variant) => <option key={variant.id}>{variant.modelCode}</option>)}</select></label><label>{ar ? "هل تحتاج إلى التركيب؟" : "Installation required?"}<select name="installation"><option value="yes">{ar ? "نعم" : "Yes"}</option><option value="no">{ar ? "لا" : "No"}</option></select></label><label className="full">{ar ? "ملاحظات إضافية" : "Additional notes"}<textarea name="notes" rows={3} /></label>
    <button className="full" type="submit" disabled={!siteConfig.whatsappNumber}>{ar ? "إرسال استفسار واتساب" : "Send WhatsApp inquiry"}<span>↗</span></button>
    {(!siteConfig.whatsappNumber || unavailable) && <p className="form-unavailable full" role="status">{ar ? "خدمة واتساب غير متاحة حالياً." : "WhatsApp inquiry is currently unavailable."}{siteConfig.phoneTel && <> <a href={`tel:${siteConfig.phoneTel}`}>{siteConfig.phoneDisplay || siteConfig.phoneTel}</a></>}{siteConfig.email && <> <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></>}</p>}
  </form>;
}
