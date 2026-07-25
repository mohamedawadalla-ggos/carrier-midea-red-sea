"use client";

import type { Locale } from "@/content/site";
import { formatPublicMoney, getCampaignLabel, getPublicPrice } from "@/lib/public-pricing";
import { usePublicPricing } from "@/components/pricing/PublicPricingProvider";

export function PublicProductPrice({ modelCode, locale }: { modelCode: string; locale: Locale }) {
  const price = getPublicPrice(usePublicPricing(), modelCode);
  if (!price) return null;

  const ar = locale === "ar";
  const campaignLabel = getCampaignLabel(price, locale);
  const hasSale = price.salePriceMinor < price.listPriceMinor;
  return <div className="public-product-price" aria-label={ar ? "السعر العام الحالي" : "Current public price"}>
    {campaignLabel && <span className="public-price-campaign">{campaignLabel}</span>}
    <div>
      {hasSale && <del aria-label={ar ? "السعر الأصلي" : "Original price"}>{formatPublicMoney(price.listPriceMinor, locale)}</del>}
      <strong aria-label={hasSale ? (ar ? "سعر العرض" : "Offer price") : (ar ? "السعر" : "Price")}>
        {formatPublicMoney(price.salePriceMinor, locale)}
      </strong>
    </div>
  </div>;
}
