const rawWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const rawPhoneTel = process.env.NEXT_PUBLIC_PHONE_TEL ?? "";

const whatsappNumber = /^20\d{10}$/.test(rawWhatsApp) ? rawWhatsApp : "";
const phoneTel = /^\+20\d{10}$/.test(rawPhoneTel) ? rawPhoneTel : "";

export const siteConfig = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, ""),
  facebookPageUrl: process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? "",
  whatsappNumber,
  phoneTel,
  phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY ?? "",
  email: process.env.NEXT_PUBLIC_EMAIL ?? "",
  googleMapsUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ?? "",
  googleBusinessUrl: process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL ?? "",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
} as const;

export function absoluteUrl(path: string): string {
  if (!siteConfig.siteUrl) return path;
  return `${siteConfig.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
