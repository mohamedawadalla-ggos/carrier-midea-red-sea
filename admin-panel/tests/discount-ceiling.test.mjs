import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { calculateDiscountBps, parseCeilingPricePaste, validateCeilingPrice } = await import(new URL("../lib/discount-ceiling.ts", import.meta.url));
const migration = await readFile(new URL("../../supabase/migrations/20260804000222_ceiling_price_campaign_workflow.sql", import.meta.url), "utf8");
const panel = await readFile(new URL("../components/DiscountsPanel.tsx", import.meta.url), "utf8");
const orderMigration = await readFile(new URL("../../supabase/migrations/20260725110000_create_order_function.sql", import.meta.url), "utf8");

test("ceiling math derives a percentage from customer and offer prices", () => {
  assert.equal(calculateDiscountBps(3_000_000, 2_700_000), 1000);
  assert.equal(calculateDiscountBps(0, 0), 0);
});

test("Excel-style two-column paste preserves exact model codes and rejects duplicates", () => {
  assert.deepEqual(parseCeilingPricePaste("MODEL-A\t27000\nMODEL-B\t31500.50"), [
    { modelCode: "MODEL-A", salePriceMinor: 2_700_000 },
    { modelCode: "MODEL-B", salePriceMinor: 3_150_050 },
  ]);
  assert.throws(() => parseCeilingPricePaste("MODEL-A\t10\nMODEL-A\t9"), /Duplicate model code/);
});

test("thousand-separator commas in the price cell don't get mistaken for a column delimiter", () => {
  assert.deepEqual(parseCeilingPricePaste("MODEL-A\t57,135.00\nMODEL-B\t127,100"), [
    { modelCode: "MODEL-A", salePriceMinor: 5_713_500 },
    { modelCode: "MODEL-B", salePriceMinor: 12_710_000 },
  ]);
  // No-tab fallback (hand-typed/CSV-style input): split on the first comma
  // only, so further commas in the price are still just formatting.
  assert.deepEqual(parseCeilingPricePaste("MODEL-C,57,135.00"), [
    { modelCode: "MODEL-C", salePriceMinor: 5_713_500 },
  ]);
  assert.throws(() => parseCeilingPricePaste("MODEL-A\t10\t20"), /Row 1 must contain model code and offer price only/);
});

test("ceiling validation blocks prices above customer price or below the private floor", () => {
  assert.match(validateCeilingPrice({ modelCode: "A", listPriceMinor: 3000, minimumPriceMinor: 2500, salePriceMinor: 3000 }), /below the customer price/);
  assert.match(validateCeilingPrice({ modelCode: "A", listPriceMinor: 3000, minimumPriceMinor: 2500, salePriceMinor: 2400 }), /below the approved minimum/);
  assert.equal(validateCeilingPrice({ modelCode: "A", listPriceMinor: 3000, minimumPriceMinor: 2500, salePriceMinor: 2700 }), null);
});

test("database and admin enforce one atomic super-admin ceiling campaign", () => {
  assert.match(migration, /discount_campaigns_one_published_idx/);
  assert.match(migration, /Only a super admin can manage ceiling-price campaigns/);
  assert.match(migration, /lock table public\.discount_campaigns in share row exclusive mode/);
  assert.match(migration, /set status = 'archived'[\s\S]*set status = 'published'/);
  assert.match(migration, /campaign_sale_price_minor < floor_price\.minimum_price_minor/);
  assert.match(migration, /save_ceiling_campaign_products/);
  assert.match(panel, /Customer price is read-only/);
  assert.match(panel, /Calculated discount/);
});

test("safe public projection derives the crossed price without exposing private fields", () => {
  const publicFunction = migration.slice(migration.indexOf("create or replace function pricing_private.campaign_aware_public_price_rows"));
  assert.match(publicFunction, /when d\.discount_type = 'ceiling_price' then link\.campaign_sale_price_minor/);
  assert.doesNotMatch(publicFunction, /dealer_cost_minor/);
  assert.match(orderMigration, /from public\.public_product_prices p[\s\S]*p\.model_code = v_model_code/);
});
