import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
const migration = await readFile(new URL("../supabase/schema/phase2_control_panel.sql", import.meta.url), "utf8");
const seed = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
const variants = [...seed.matchAll(/^\('([^']+)',\s*'[^']+',\s*'[^']+',\s*'[^']+',\s*'(carrier|midea)',/gm)];
assert.equal(variants.length, 61, `Expected 61 product variants, got ${variants.length}`);
assert.equal(new Set(variants.map((match) => match[1])).size, 61, "Model codes must be unique");
assert.match(seed, /201099055854/);
assert.match(migration, /security_invoker = true/g);
assert.doesNotMatch(migration.slice(migration.indexOf("create or replace view public.public_product_prices")), /dealer_cost_minor/i);
const rlsTables = ["staff_profiles","catalog_products","product_price_entries","published_product_prices","discount_campaigns","discount_campaign_products","site_settings","service_locations","service_location_revisions","warehouses","audit_log"];
for (const table of rlsTables) {
  assert.match(migration, new RegExp(`alter table public\.${table} enable row level security`, "i"));
}
const componentFiles = (await readdir(new URL("../admin-panel/components/", import.meta.url))).filter((name) => name.endsWith(".tsx"));
assert.ok(componentFiles.length >= 8, "Expected the full panel component set");
console.log(JSON.stringify({ ok: true, products: variants.length, components: componentFiles.length, rlsTables: rlsTables.length }, null, 2));
