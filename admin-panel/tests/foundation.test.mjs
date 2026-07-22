import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../supabase/schema/phase2_control_panel.sql", import.meta.url), "utf8");
const seed = await readFile(new URL("../../supabase/seed.sql", import.meta.url), "utf8");
const access = await readFile(new URL("../lib/access.ts", import.meta.url), "utf8");
const pricesPanel = await readFile(new URL("../components/PricesPanel.tsx", import.meta.url), "utf8");
const settingsPanel = await readFile(new URL("../components/SettingsPanel.tsx", import.meta.url), "utf8");
const discountsPanel = await readFile(new URL("../components/DiscountsPanel.tsx", import.meta.url), "utf8");
const locationsPanel = await readFile(new URL("../components/LocationsPanel.tsx", import.meta.url), "utf8");

test("all exposed tables have RLS enabled", () => {
  for (const table of ["staff_profiles","catalog_products","product_price_entries","published_product_prices","discount_campaigns","discount_campaign_products","site_settings","service_locations","service_location_revisions","warehouses","audit_log"]) {
    assert.match(migration, new RegExp(`alter table public\.${table} enable row level security`, "i"));
  }
});

test("anonymous access is column-scoped and location edits use revisions", () => {
  assert.match(migration, /revoke select on public\.catalog_products[\s\S]*from anon/i);
  assert.match(migration, /grant select \(slug, name_ar[\s\S]*on public\.service_locations to anon/i);
  assert.match(migration, /create table public\.service_location_revisions/i);
  assert.doesNotMatch(migration, /create policy locations_operations_update/i);
  assert.match(migration, /publish_service_location_revision\(revision_id uuid\)[\s\S]*security invoker/i);
  assert.match(migration, /create constraint trigger service_location_revision_consistency[\s\S]*deferrable initially deferred/i);
  assert.match(locationsPanel, /from\("service_location_revisions"\)\.insert/);
  assert.match(locationsPanel, /publish_service_location_revision/);
});

test("public views never contain dealer cost", () => {
  const publicViews = migration.slice(migration.indexOf("create or replace view public.public_product_prices"));
  assert.doesNotMatch(publicViews, /dealer_cost_minor/i);
});

test("seed contains exactly 61 product rows", () => {
  const productSection = seed.slice(seed.indexOf("insert into public.catalog_products"), seed.indexOf("insert into public.site_settings"));
  assert.equal((productSection.match(/\('\w|\('M|\('5/g) ?? []).length, 61);
});

test("seed includes approved WhatsApp number", () => {
  assert.match(seed, /201099055854/);
});

test("price workflow edits only eligible rows and supports approved publication retries", () => {
  assert.match(access, /entry\.created_by === profile\.user_id/);
  assert.match(access, /entry\.status === "pending_approval"/);
  assert.match(access, /entry\.status === "approved"/);
  assert.match(pricesPanel, /findEditablePriceEntry/);
  assert.match(pricesPanel, /\.eq\("status", "pending_approval"\)/);
  assert.match(pricesPanel, /Publish approved price/);
});

test("settings workflow blocks final marketing edits and exposes explicit transitions", () => {
  assert.match(access, /canEditSettingDraft/);
  assert.match(settingsPanel, /disabled=\{!canChangeValue\}/);
  assert.match(settingsPanel, /save\(item\.key, "draft"\)/);
  assert.match(settingsPanel, /save\(item\.key, "pending_approval"\)/);
  assert.match(settingsPanel, /save\(item\.key, "published"\)/);
});

test("marketing discounts default to draft with an explicit approval submission", () => {
  assert.match(discountsPanel, /\? "pending_approval" : "draft"/);
  assert.match(discountsPanel, /name="submitForApproval"/);
  assert.match(discountsPanel, /approved_by: publish \? data\.profile\.user_id : null/);
});
