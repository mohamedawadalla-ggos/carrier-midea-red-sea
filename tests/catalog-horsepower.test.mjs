import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { productFamilies } = await import(new URL("../content/product-families.ts", import.meta.url));
const { productVariants } = await import(new URL("../content/product-variants.ts", import.meta.url));
const {
  emptyCatalogFilters,
  filterProductFamilies,
  formatFamilyHorsepowerSummary,
  formatHorsepower,
  getAvailableHorsepower,
  readCatalogFilters,
  supportedHorsepowerValues,
  updateCatalogFilterQuery,
} = await import(new URL("../lib/catalog-filtering.ts", import.meta.url));

const expectedSummaries = {
  "carrier-xcool-inverter": [1.5, 2.25, 3],
  "carrier-optimax-inverter": [4, 5],
  "carrier-optimax-pro": [1.5, 2.25, 3, 4, 5],
  "carrier-xcool": [1.5, 2.25, 3],
  "carrier-classicool-inverter": [2.25, 3, 5, 6, 7.5],
  "carrier-classicool-pro": [1.5, 2.25, 3, 4, 5, 6, 7.5],
  "carrier-decor-inverter": [5, 6],
  "carrier-elegant-inverter": [7.5],
  "carrier-elegant-pro": [5, 7.5],
  "midea-ai-ecomaster-inverter": [1.5, 2.25, 3],
  "midea-mission-inverter": [4, 5],
  "midea-xtreme-pro": [1.5, 2.25, 3],
  "midea-mission-pro": [1.5, 2.25, 3, 4, 5],
};

const ids = (families) => families.map((family) => family.id);
const withFilters = (filters) => filterProductFamilies(productFamilies, productVariants, { ...emptyCatalogFilters, ...filters });

test("horsepower values and localized format are canonical", () => {
  assert.deepEqual([...supportedHorsepowerValues], [1.5, 2.25, 3, 4, 5, 6, 7.5]);
  assert.equal(formatHorsepower("en", 2.25), "2.25 HP");
  assert.equal(formatHorsepower("ar", 2.25), "٢٫٢٥ حصان");
});

test("all family capacity summaries are unique and numerically sorted", () => {
  for (const family of productFamilies) {
    const variants = productVariants.filter((variant) => variant.familyId === family.id);
    assert.deepEqual(getAvailableHorsepower(variants), expectedSummaries[family.id], family.id);
  }
  const sample = productVariants.filter((variant) => variant.familyId === "carrier-xcool-inverter");
  assert.equal(formatFamilyHorsepowerSummary("en", sample), "Available: 1.5, 2.25, and 3 HP");
  assert.equal(formatFamilyHorsepowerSummary("ar", sample), "متاح بقدرات ١٫٥ و٢٫٢٥ و٣ حصان");
});

test("horsepower filtering works alone and with family and variant filters", () => {
  assert.deepEqual(ids(withFilters({ hp: "3" })), ["carrier-xcool-inverter", "carrier-optimax-pro", "carrier-xcool", "carrier-classicool-inverter", "carrier-classicool-pro", "midea-ai-ecomaster-inverter", "midea-xtreme-pro", "midea-mission-pro"]);
  assert.deepEqual(ids(withFilters({ hp: "3", brand: "carrier" })), ["carrier-xcool-inverter", "carrier-optimax-pro", "carrier-xcool", "carrier-classicool-inverter", "carrier-classicool-pro"]);
  assert.deepEqual(ids(withFilters({ hp: "3", productType: "concealed-ducted" })), ["carrier-classicool-inverter", "carrier-classicool-pro"]);
  assert.deepEqual(ids(withFilters({ hp: "3", coolingMode: "cool-only" })), ["carrier-xcool-inverter", "carrier-optimax-pro", "carrier-xcool", "midea-ai-ecomaster-inverter", "midea-xtreme-pro", "midea-mission-pro"]);
});

test("direct HP queries normalize invalid values and clearing preserves unrelated parameters", () => {
  assert.equal(readCatalogFilters(new URL("https://example.test/en/products?hp=3").searchParams).hp, "3");
  assert.equal(readCatalogFilters(new URL("https://example.test/ar/products?hp=2.25").searchParams).hp, "2.25");
  assert.equal(readCatalogFilters(new URL("https://example.test/en/products?hp=9").searchParams).hp, "");
  const current = new URLSearchParams("hp=3&brand=carrier&campaign=summer");
  const cleared = updateCatalogFilterQuery(current, emptyCatalogFilters);
  assert.equal(cleared.get("hp"), null);
  assert.equal(cleared.get("brand"), null);
  assert.equal(cleared.get("campaign"), "summer");
});

test("desktop, mobile, cards, filters, and WhatsApp use the shared formatter", async () => {
  const sources = await Promise.all([
    "../components/products/CatalogFilters.tsx",
    "../components/products/ProductFamilyCard.tsx",
    "../components/products/VariantComparisonTable.tsx",
    "../components/products/VariantAccordion.tsx",
    "../services/leads/whatsapp-provider.ts",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  for (const source of sources) assert.match(source, /format(?:Family)?Horsepower/);
  assert.equal((sources[1].match(/prefetch=\{false\}/gu) ?? []).length, 2);
});

test("the internal manifest records the approved mapping without resolving the pending model", async () => {
  const source = await readFile(new URL("../internal/catalog-source-manifest.ts", import.meta.url), "utf8");
  assert.match(source, /capacityCodeMapping: \{ 12: 1\.5, 18: 2\.25, 24: 3, 30: 4, 36: 5, 48: 6, 60: 7\.5 \}/u);
  assert.match(source, /implementationDate: "2026-07-14"/u);
  assert.match(source, /mappingApprovalStatus: "approved"/u);
  assert.match(source, /modelCode: "53QHABT30DN-708F"[\s\S]*status: "client-confirmation-required"/u);
});
