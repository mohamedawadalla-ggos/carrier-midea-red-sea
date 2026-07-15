import type { Locale } from "@/content/site";
import type { LocalizedText } from "@/types/catalog";

export type OfferExclusion = "installation" | "maintenance" | "delivery" | "service-charges";

export interface SiteOffer {
  active: boolean;
  startsAt: string;
  endsAtExclusive: string;
  discountPercentage: number;
  scope: "air-conditioning-units-only";
  headline: LocalizedText;
  supportingCopy: LocalizedText;
  validityCopy: LocalizedText;
  terms: LocalizedText;
  exclusions: readonly OfferExclusion[];
}

export const approvedOffer = {
  active: true,
  startsAt: "2026-07-14T00:00:00+03:00",
  endsAtExclusive: "2026-08-02T00:00:00+03:00",
  discountPercentage: 10,
  scope: "air-conditioning-units-only",
  headline: {
    ar: "خصم 10% على أجهزة التكييف لفترة محدودة",
    en: "10% off air-conditioning units for a limited time",
  },
  supportingCopy: {
    ar: "اطلب السعر الحالي وتفاصيل العرض عبر واتساب",
    en: "Request the current price and offer details on WhatsApp",
  },
  validityCopy: {
    ar: "ساري حتى 1 أغسطس 2026",
    en: "Valid through 1 August 2026",
  },
  terms: {
    ar: "يسري الخصم على أجهزة التكييف فقط، ولا يشمل التركيب أو الصيانة أو التوصيل أو رسوم الخدمات.",
    en: "The discount applies to air-conditioning units only and excludes installation, maintenance, delivery, and service charges.",
  },
  exclusions: ["installation", "maintenance", "delivery", "service-charges"],
} as const satisfies SiteOffer;

export function isOfferActiveAt(offer: SiteOffer, now: Date | number | string): boolean {
  if (!offer.active) return false;
  const nowTimestamp = now instanceof Date ? now.getTime() : typeof now === "number" ? now : Date.parse(now);
  const startsAt = Date.parse(offer.startsAt);
  const endsAtExclusive = Date.parse(offer.endsAtExclusive);
  return Number.isFinite(nowTimestamp) && Number.isFinite(startsAt) && Number.isFinite(endsAtExclusive)
    && nowTimestamp >= startsAt && nowTimestamp < endsAtExclusive;
}

export function getOfferCopy(offer: SiteOffer, locale: Locale) {
  return {
    headline: offer.headline[locale],
    supportingCopy: offer.supportingCopy[locale],
    validityCopy: offer.validityCopy[locale],
    terms: offer.terms[locale],
  };
}
