import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const {
  formatPublicMoney,
  getCampaignLabel,
  getPublicPrice,
  loadPublicPricing,
} = await import(new URL("../lib/public-pricing.ts", import.meta.url));
const { resolvePublicSupabaseConfig } = await import(new URL("../lib/site-config.ts", import.meta.url));

const config = { url: "https://example.supabase.co", publishableKey: "sb_publishable_test" };
const setting = [{ key: "commerce.public_prices_enabled", value_json: true, value_type: "boolean" }];
const basePrice = {
  model_code: "53KHCT12N-708",
  currency: "EGP",
  list_price_minor: 2641500,
  sale_price_minor: 2641500,
  campaign_code: null,
  campaign_title_ar: null,
  campaign_title_en: null,
  campaign_discount_type: null,
  campaign_discount_value: null,
  campaign_starts_at: null,
  campaign_ends_at: null,
  campaign_applied: false,
};

function mockFetch(settings = setting, prices = [basePrice]) {
  return async (input) => {
    const url = String(input);
    return new Response(JSON.stringify(url.includes("public_site_settings") ? settings : prices), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
}

test("configuration is empty when missing, invalid, or secret", () => {
  assert.deepEqual(resolvePublicSupabaseConfig("", ""), { url: "", publishableKey: "" });
  assert.deepEqual(resolvePublicSupabaseConfig("http://example.supabase.co", "sb_publishable_test"), { url: "", publishableKey: "" });
  assert.deepEqual(resolvePublicSupabaseConfig("https://example.supabase.co", "sb_secret_test"), { url: "", publishableKey: "" });
});

test("disabled public pricing returns a safe empty snapshot without fetching prices", async () => {
  let calls = 0;
  const result = await loadPublicPricing({
    config,
    fetchImpl: async () => {
      calls += 1;
      return new Response(JSON.stringify([{ ...setting[0], value_json: false }]));
    },
  });
  assert.equal(result.enabled, false);
  assert.equal(result.prices.size, 0);
  assert.equal(calls, 1);
});

test("valid list and sale prices map by exact model code", async () => {
  const sale = { ...basePrice, model_code: "M1SEFT-12CRDN8F-Q8", sale_price_minor: 2500000 };
  const result = await loadPublicPricing({ config, fetchImpl: mockFetch(setting, [basePrice, sale]) });
  assert.equal(result.enabled, true);
  assert.equal(getPublicPrice(result, "53KHCT12N-708")?.salePriceMinor, 2641500);
  assert.equal(getPublicPrice(result, "M1SEFT-12CRDN8F-Q8")?.salePriceMinor, 2500000);
  assert.equal(getPublicPrice(result, "53khct12n-708"), undefined);
});

test("percentage and fixed campaigns retain safe public metadata", async () => {
  const common = {
    ...basePrice,
    sale_price_minor: 2377350,
    campaign_code: "SUMMER10_2026",
    campaign_title_ar: "خصم الصيف 10%",
    campaign_title_en: "10% Summer Offer",
    campaign_discount_value: 1000,
    campaign_starts_at: "2026-07-25T00:00:00+02:00",
    campaign_ends_at: "2026-08-01T23:59:59+02:00",
    campaign_applied: true,
  };
  const fixed = { ...common, model_code: "FIXED-1", campaign_discount_type: "fixed_amount", campaign_discount_value: 10000 };
  const percentage = { ...common, campaign_discount_type: "percentage" };
  const result = await loadPublicPricing({ config, fetchImpl: mockFetch(setting, [percentage, fixed]) });
  assert.equal(getPublicPrice(result, basePrice.model_code)?.campaignDiscountType, "percentage");
  assert.equal(getPublicPrice(result, "FIXED-1")?.campaignDiscountType, "fixed_amount");
});

test("invalid negative and malformed responses fail safely", async () => {
  const invalid = await loadPublicPricing({
    config,
    fetchImpl: mockFetch(setting, [{ ...basePrice, sale_price_minor: -1 }]),
  });
  assert.equal(invalid.enabled, false);
  assert.equal(invalid.prices.size, 0);

  const malformed = await loadPublicPricing({
    config,
    fetchImpl: async () => new Response("{", { status: 200 }),
  });
  assert.equal(malformed.enabled, false);
  assert.equal(malformed.prices.size, 0);
});

test("EGP money formatting supports English and Arabic", () => {
  assert.match(formatPublicMoney(2641500, "en"), /EGP/);
  assert.match(formatPublicMoney(2641500, "en"), /26,415/);
  assert.match(formatPublicMoney(2641500, "ar"), /ج\.م|EGP/u);
  assert.equal(formatPublicMoney(-1, "en"), "");
});

test("campaign labels require campaign_applied", async () => {
  const result = await loadPublicPricing({ config, fetchImpl: mockFetch() });
  const price = getPublicPrice(result, basePrice.model_code);
  assert.ok(price);
  assert.equal(getCampaignLabel(price, "en"), null);

  const component = await readFile(new URL("../components/pricing/PublicProductPrice.tsx", import.meta.url), "utf8");
  assert.match(component, /campaignLabel &&/);
});
