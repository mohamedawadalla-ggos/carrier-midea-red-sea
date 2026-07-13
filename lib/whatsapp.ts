import { siteConfig } from "@/lib/site-config";

export function createWhatsAppUrl(message: string): string {
  const base = siteConfig.whatsappNumber
    ? `https://wa.me/${siteConfig.whatsappNumber}`
    : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
