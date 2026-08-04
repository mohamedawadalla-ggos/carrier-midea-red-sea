import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20260803232047_align_prices_to_approved_master.sql", import.meta.url), "utf8");
const activation = await readFile(new URL("../supabase/migrations/20260803232205_activate_approved_master_prices_immediately.sql", import.meta.url), "utf8");
const rollback = await readFile(new URL("../docs/phase2/PRICE_MASTER_RECONCILIATION_ROLLBACK.sql", import.meta.url), "utf8");

function migrationRows(sql) {
  const block = sql.match(/insert into approved_price_master[\s\S]*?values\s*([\s\S]*?);\s*\n\s*do \$\$/i)?.[1];
  assert.ok(block, "approved price-master values block is missing");
  return [...block.matchAll(/\('([^']+)',\s*(\d+),\s*(\d+),\s*(\d+)\)/g)].map((match) => ({
    modelCode: match[1],
    dealerCostMinor: Number(match[2]),
    targetListPriceMinor: Number(match[3]),
    previousListPriceMinor: Number(match[4]),
  }));
}

function rollbackRows(sql) {
  const block = sql.match(/insert into previous_published_prices[\s\S]*?values\s*([\s\S]*?);\s*\n\s*do \$\$/i)?.[1];
  assert.ok(block, "rollback values block is missing");
  return [...block.matchAll(/\('([^']+)',\s*(\d+)\)/g)].map((match) => ({
    modelCode: match[1],
    previousListPriceMinor: Number(match[2]),
  }));
}

test("approved master reconciles all 61 models with the reviewed financial totals", () => {
  const rows = migrationRows(migration);
  assert.equal(rows.length, 61);
  assert.equal(new Set(rows.map((row) => row.modelCode)).size, 61);
  assert.equal(rows.filter((row) => row.targetListPriceMinor !== row.previousListPriceMinor).length, 49);
  assert.equal(rows.reduce((sum, row) => sum + row.previousListPriceMinor - row.targetListPriceMinor, 0), 5_129_500);
  assert.equal(rows.filter((row) => Math.floor(row.targetListPriceMinor * 0.9) < row.dealerCostMinor).length, 49);
  assert.ok(rows.every((row) => row.targetListPriceMinor >= row.dealerCostMinor));
});

test("migration is guarded, auditable, and archives the incompatible campaign", () => {
  const executableSql = migration.replace(/^\s*--.*$/gm, "");
  assert.match(migration, /B38A1AB5DF577D7D0A73CBDDEAFF0B51539E8F8C23C655BA390DC28577B88981/);
  assert.match(migration, /Production published-price preflight failed/);
  assert.match(migration, /Production dealer-cost preflight failed/);
  assert.match(migration, /Expected exactly one active SUMMER10_2026 campaign/);
  assert.match(migration, /update public\.discount_campaigns[\s\S]*code = 'SUMMER10_2026'[\s\S]*status = 'published'/);
  assert.match(migration, /insert into public\.product_price_entries/);
  assert.match(migration, /on conflict \(model_code\) do update/);
  assert.doesNotMatch(executableSql, /\b(?:grant|revoke)\b/i);
  assert.doesNotMatch(executableSql, /create table public\./i);
  assert.doesNotMatch(executableSql, /alter table/i);
});

test("UTC activation is limited to the 61 approved master prices", () => {
  assert.match(activation, /source_count <> 61 or published_count <> 61/);
  assert.match(activation, /set effective_from = current_date/);
  assert.match(activation, /Expected 61 immediately visible public prices/);
  assert.match(activation, /B38A1AB5DF577D7D0A73CBDDEAFF0B51539E8F8C23C655BA390DC28577B88981/);
});

test("rollback covers every model and restores the previous published prices", () => {
  const forward = new Map(migrationRows(migration).map((row) => [row.modelCode, row.previousListPriceMinor]));
  const reverse = rollbackRows(rollback);
  assert.equal(reverse.length, 61);
  assert.equal(new Set(reverse.map((row) => row.modelCode)).size, 61);
  assert.ok(reverse.every((row) => forward.get(row.modelCode) === row.previousListPriceMinor));
  assert.match(rollback, /set status = 'archived'/);
  assert.match(rollback, /set status = 'published'[\s\S]*code = 'SUMMER10_2026'/);
});
