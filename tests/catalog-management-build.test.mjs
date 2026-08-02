import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const syncScript = await readFile(new URL("../scripts/sync-public-catalog.mjs", import.meta.url), "utf8");
const families = await readFile(new URL("../content/product-families.ts", import.meta.url), "utf8");
const variants = await readFile(new URL("../content/product-variants.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20260802024417_admin_catalog_management.sql", import.meta.url), "utf8");

test("static storefront catalog sync is build-time only and fails closed on an empty production snapshot", () => {
  assert.match(syncScript, /public_catalog_rows/);
  assert.match(syncScript, /refusing to build a blank storefront/);
  assert.match(syncScript, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(families, /generatedCatalog\.families\.length/);
  assert.match(variants, /generatedCatalog\.variants\.length/);
});

test("public catalog rows expose only published visible families with visible active products", () => {
  assert.match(migration, /f\.status = 'published' and f\.visible = true/);
  assert.match(migration, /p\.catalog_status = 'published' and p\.visible = true and p\.active = true/);
  assert.doesNotMatch(migration.slice(migration.indexOf("returns table ("), migration.indexOf(")\nlanguage sql")), /dealer_cost|minimum_price|source_reference|created_by|approved_by/i);
});
