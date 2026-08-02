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
const accountPanel = await readFile(new URL("../components/AccountPanel.tsx", import.meta.url), "utf8");
const loginScreen = await readFile(new URL("../components/LoginScreen.tsx", import.meta.url), "utf8");
const controlPanel = await readFile(new URL("../components/ControlPanelApp.tsx", import.meta.url), "utf8");
const usersPanel = await readFile(new URL("../components/UsersPanel.tsx", import.meta.url), "utf8");
const manageStaffUsers = await readFile(new URL("../../supabase/functions/manage-staff-users/index.ts", import.meta.url), "utf8");
const catalogMigration = await readFile(new URL("../../supabase/migrations/20260802024417_admin_catalog_management.sql", import.meta.url), "utf8");
const warehousesPanel = await readFile(new URL("../components/WarehousesPanel.tsx", import.meta.url), "utf8");
const catalogVisibilityPanel = await readFile(new URL("../components/CatalogVisibilityPanel.tsx", import.meta.url), "utf8");
const catalogManagementPanel = await readFile(new URL("../components/CatalogManagementPanel.tsx", import.meta.url), "utf8");

test("all exposed tables have RLS enabled", () => {
  for (const table of ["staff_profiles","catalog_products","product_price_entries","published_product_prices","discount_campaigns","discount_campaign_products","site_settings","service_locations","warehouses","audit_log"]) {
    assert.match(migration, new RegExp(`alter table public\.${table} enable row level security`, "i"));
  }
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

test("staff user management is super-admin-only and deactivates instead of deleting", () => {
  assert.match(access, /manageStaffUsers: \["super_admin"\]/);
  assert.match(controlPanel, /data\.profile\.role === "super_admin"/);
  assert.match(usersPanel, /manage-staff-users/);
  assert.doesNotMatch(usersPanel, /deleteUser/);
  assert.match(manageStaffUsers, /callerProfile\.role !== "super_admin"/);
  assert.match(manageStaffUsers, /last active super admin/i);
  assert.match(manageStaffUsers, /cannot deactivate or demote your own/i);
  assert.match(manageStaffUsers, /ban_duration: active \? "none" : "876000h"/);
  assert.match(manageStaffUsers, /staff_profiles/);
});

test("security actions verify the current password and expose mobile sign-out", () => {
  assert.match(accountPanel, /current_password: currentPassword/);
  assert.match(accountPanel, /signOut\(\{ scope: "others" \}\)/);
  assert.match(accountPanel, /password\.length < 14/);
  assert.match(controlPanel, /className="mobile-actions"/);
  assert.match(controlPanel, /aria-label="Select admin section"/);
});

test("password recovery opens a new-password flow without requiring the forgotten password", () => {
  assert.match(loginScreen, /resetPasswordForEmail/);
  assert.match(loginScreen, /redirectTo: window\.location\.origin/);
  assert.match(controlPanel, /event === "PASSWORD_RECOVERY"/);
  assert.match(controlPanel, /setTab\("account"\)/);
  assert.match(accountPanel, /passwordRecovery\s*\? \{ password: newPassword \}/);
  assert.match(accountPanel, /!passwordRecovery && <label>Current password/);
});

test("immediate publication paths require confirmation and use accurate city wording", () => {
  assert.match(pricesPanel, /window\.confirm/);
  assert.match(discountsPanel, /publish && !window\.confirm/);
  assert.match(settingsPanel, /status === "published" && !window\.confirm/);
  assert.match(locationsPanel, /publish && !window\.confirm/);
  assert.match(locationsPanel, /Add and publish city/);
  assert.match(locationsPanel, /City added and published/);
});

test("catalog management separates operational availability from storefront visibility", () => {
  assert.match(catalogMigration, /add column visible boolean not null default true/);
  assert.match(catalogMigration, /catalog_status public\.record_status/);
  assert.match(catalogMigration, /p\.visible = true and p\.active = true/);
  assert.match(catalogVisibilityPanel, /Pending storefront deployment/);
  assert.match(catalogVisibilityPanel, /Mark manual deployment complete/);
});

test("empty visible families cannot leak into the safe public catalog snapshot", () => {
  assert.match(catalogMigration, /join public\.catalog_products p on p\.family_id = f\.id/);
  assert.match(catalogMigration, /f\.status = 'published' and f\.visible = true/);
  assert.match(catalogMigration, /p\.catalog_status = 'published' and p\.visible = true/);
});

test("warehouse and catalog editors expose controlled edit flows without permanent delete", () => {
  assert.match(warehousesPanel, /Edit warehouse/);
  assert.match(warehousesPanel, /\.from\("warehouses"\)\.update/);
  assert.match(catalogManagementPanel, /Create family draft/);
  assert.match(catalogManagementPanel, /Create product draft/);
  assert.doesNotMatch(catalogManagementPanel, /\.delete\(/);
  assert.match(access, /manageCatalogVisibility: \["super_admin", "management"\]/);
});
