import type { PublicSupabaseConfig } from "./site-config";
import type { Locale } from "@/content/site";
import type { ProductVariant } from "@/types/catalog";

export type PublicPrice = Readonly<{
  modelCode: string;
  currency: "EGP";
  listPriceMinor: number;
  salePriceMinor: number;
  campaignApplied: boolean;
  campaignCode: string | null;
  campaignTitleAr: string | null;
  campaignTitleEn: string | null;
  campaignDiscountType: "percentage" | "fixed_amount" | "ceiling_price" | null;
  campaignDiscountValue: number | null;
  campaignStartsAt: string | null;
  campaignEndsAt: string | null;
}>;

export type PublicPricingSnapshot = Readonly<{
  enabled: boolean;
  prices: ReadonlyMap<string, PublicPrice>;
}>;

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
const emptySnapshot = (): PublicPricingSnapshot => ({ enabled: false, prices: new Map() });
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isSafeMinor = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
const nullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

function parsePrice(value: unknown): PublicPrice | null {
  if (!isObject(value)) return null;
  const modelCode = value.model_code;
  const currency = value.currency;
  const listPriceMinor = value.list_price_minor;
  const salePriceMinor = value.sale_price_minor;
  const campaignApplied = value.campaign_applied;
  if (
    typeof modelCode !== "string" || !modelCode || currency !== "EGP" ||
    !isSafeMinor(listPriceMinor) || !isSafeMinor(salePriceMinor) ||
    salePriceMinor > listPriceMinor || typeof campaignApplied !== "boolean"
  ) return null;

  const campaignCode = value.campaign_code;
  const campaignTitleAr = value.campaign_title_ar;
  const campaignTitleEn = value.campaign_title_en;
  const campaignDiscountType = value.campaign_discount_type;
  const campaignDiscountValue = value.campaign_discount_value;
  const campaignStartsAt = value.campaign_starts_at;
  const campaignEndsAt = value.campaign_ends_at;
  if (
    !nullableString(campaignCode) || !nullableString(campaignTitleAr) ||
    !nullableString(campaignTitleEn) || !nullableString(campaignStartsAt) ||
    !nullableString(campaignEndsAt)
  ) return null;
  if (campaignApplied && (
    !campaignCode || !campaignTitleAr || !campaignTitleEn ||
    !isSafeMinor(campaignDiscountValue) || campaignDiscountValue === 0 ||
    (campaignDiscountType !== "percentage" && campaignDiscountType !== "fixed_amount" && campaignDiscountType !== "ceiling_price") ||
    !campaignStartsAt || !campaignEndsAt || salePriceMinor >= listPriceMinor
  )) return null;

  const safeDiscountType =
    campaignDiscountType === "percentage" || campaignDiscountType === "fixed_amount" || campaignDiscountType === "ceiling_price"
      ? campaignDiscountType
      : null;
  const safeDiscountValue = isSafeMinor(campaignDiscountValue) ? campaignDiscountValue : null;

  return {
    modelCode,
    currency,
    listPriceMinor,
    salePriceMinor,
    campaignApplied,
    campaignCode: campaignApplied ? campaignCode : null,
    campaignTitleAr: campaignApplied ? campaignTitleAr : null,
    campaignTitleEn: campaignApplied ? campaignTitleEn : null,
    campaignDiscountType: campaignApplied ? safeDiscountType : null,
    campaignDiscountValue: campaignApplied ? safeDiscountValue : null,
    campaignStartsAt: campaignApplied ? campaignStartsAt : null,
    campaignEndsAt: campaignApplied ? campaignEndsAt : null,
  };
}

async function getJson(fetchImpl: FetchLike, url: URL, config: PublicSupabaseConfig): Promise<unknown> {
  const response = await fetchImpl(url, {
    headers: { apikey: config.publishableKey },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Public pricing request failed");
  return response.json();
}

export async function loadPublicPricing(options: {
  config?: PublicSupabaseConfig;
  fetchImpl?: FetchLike;
} = {}): Promise<PublicPricingSnapshot> {
  const config = options.config ?? { url: "", publishableKey: "" };
  const fetchImpl = options.fetchImpl ?? fetch;
  if (!config.url || !config.publishableKey) return emptySnapshot();

  try {
    const settingsUrl = new URL("/rest/v1/public_site_settings", config.url);
    settingsUrl.searchParams.set("select", "key,value_json,value_type");
    settingsUrl.searchParams.set("key", "eq.commerce.public_prices_enabled");
    settingsUrl.searchParams.set("limit", "1");
    const settings = await getJson(fetchImpl, settingsUrl, config);
    if (
      !Array.isArray(settings) || settings.length !== 1 || !isObject(settings[0]) ||
      settings[0].key !== "commerce.public_prices_enabled" ||
      settings[0].value_type !== "boolean" || settings[0].value_json !== true
    ) return emptySnapshot();

    const pricesUrl = new URL("/rest/v1/public_product_prices", config.url);
    pricesUrl.searchParams.set("select", [
      "model_code", "currency", "list_price_minor", "sale_price_minor",
      "campaign_code", "campaign_title_ar", "campaign_title_en",
      "campaign_discount_type", "campaign_discount_value",
      "campaign_starts_at", "campaign_ends_at", "campaign_applied",
    ].join(","));
    const response = await getJson(fetchImpl, pricesUrl, config);
    if (!Array.isArray(response)) return emptySnapshot();

    const prices = new Map<string, PublicPrice>();
    for (const rawPrice of response) {
      const price = parsePrice(rawPrice);
      if (!price || prices.has(price.modelCode)) return emptySnapshot();
      prices.set(price.modelCode, price);
    }
    return { enabled: true, prices };
  } catch {
    return emptySnapshot();
  }
}

export function getPublicPrice(snapshot: PublicPricingSnapshot, modelCode: string): PublicPrice | undefined {
  return snapshot.enabled ? snapshot.prices.get(modelCode) : undefined;
}

export function formatPublicMoney(minorUnits: number, locale: "ar" | "en"): string {
  if (!isSafeMinor(minorUnits)) return "";
  const hasMinorFraction = minorUnits % 100 !== 0;
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: hasMinorFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}

export function getCampaignLabel(price: PublicPrice, locale: "ar" | "en"): string | null {
  if (!price.campaignApplied) return null;
  return locale === "ar" ? price.campaignTitleAr : price.campaignTitleEn;
}

export function getPricingProps(variant: ProductVariant, locale: Locale): { modelCode: string; locale: Locale } {
  return { modelCode: variant.modelCode, locale };
}
