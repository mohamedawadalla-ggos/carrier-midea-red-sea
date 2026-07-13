import { siteConfig } from "@/lib/site-config";

export function createWhatsAppUrl(message: string): string | null {
  if (!siteConfig.whatsappNumber) return null;
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export async function openPreparedLink(targetPromise: Promise<string | null>): Promise<boolean> {
  const target = await targetPromise;
  if (!target) return false;
  const popup = window.open(target, "_blank", "noopener,noreferrer");
  if (!popup) window.location.assign(target);
  return true;
}
