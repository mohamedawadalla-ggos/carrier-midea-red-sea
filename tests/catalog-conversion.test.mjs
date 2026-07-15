import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { productFamilies } = await import(new URL("../content/product-families.ts", import.meta.url));
const { productVariants } = await import(new URL("../content/product-variants.ts", import.meta.url));
const {
  catalogSortValues,
  defaultCatalogSort,
  emptyCatalogFilters,
  filterProductFamilies,
  filterProductVariants,
  getCatalogResultMode,
  getMatchingVariantCount,
  hasActiveCatalogFilters,
  normalizeCatalogSort,
  readCatalogSort,
  sortProductFamilies,
  sortProductVariants,
  updateCatalogFilterQuery,
  updateCatalogSortQuery,
} = await import(new URL("../lib/catalog-filtering.ts", import.meta.url));

test("catalog sort values are closed, validated, and safely fall back", () => {
  assert.deepEqual([...catalogSortValues], ["hp-asc", "hp-desc", "product-type", "brand", "technology"]);
  assert.equal(defaultCatalogSort, "product-type");
  assert.equal(normalizeCatalogSort("hp-desc"), "hp-desc");
  assert.equal(normalizeCatalogSort("price"), defaultCatalogSort);
  assert.equal(readCatalogSort(new URLSearchParams("sort=unknown")), defaultCatalogSort);
});

test("sort and filter query updates preserve each other and unrelated parameters", () => {
  const current = new URLSearchParams("campaign=summer&sort=hp-desc&hp=3&brand=carrier");
  const filtered = updateCatalogFilterQuery(current, { ...emptyCatalogFilters, technology: "inverter" });
  assert.equal(filtered.get("campaign"), "summer");
  assert.equal(filtered.get("sort"), "hp-desc");
  assert.equal(filtered.get("technology"), "inverter");
  assert.equal(filtered.get("hp"), null);

  const sorted = updateCatalogSortQuery(filtered, "brand");
  assert.equal(sorted.get("campaign"), "summer");
  assert.equal(sorted.get("technology"), "inverter");
  assert.equal(sorted.get("sort"), "brand");
  assert.equal(updateCatalogSortQuery(sorted, "price").get("sort"), null);
});

test("family-first browsing changes to model results only when HP is selected", () => {
  assert.equal(hasActiveCatalogFilters(emptyCatalogFilters), false);
  assert.equal(getCatalogResultMode(emptyCatalogFilters), "families");
  assert.equal(getCatalogResultMode({ ...emptyCatalogFilters, brand: "carrier" }), "families");
  assert.equal(getCatalogResultMode({ ...emptyCatalogFilters, hp: "3" }), "variants");

  const broad = { ...emptyCatalogFilters, brand: "midea" };
  const broadFamilies = filterProductFamilies(productFamilies, productVariants, broad);
  assert.equal(broadFamilies.length, 4);
  assert.equal(getMatchingVariantCount(broadFamilies[0], productVariants, broad), 6);

  const exact = { ...emptyCatalogFilters, hp: "3", brand: "midea", technology: "inverter" };
  const exactVariants = filterProductVariants(productFamilies, productVariants, exact);
  assert.equal(exactVariants.length, 2);
  assert.ok(exactVariants.every((variant) => variant.active && variant.capacityHp === 3));
  assert.deepEqual([...new Set(exactVariants.map((variant) => variant.familyId))], ["midea-ai-ecomaster-inverter"]);
});

test("default ordering is system priority then minimum matching active HP", () => {
  const families = filterProductFamilies(productFamilies, productVariants, emptyCatalogFilters);
  const ordered = sortProductFamilies(families, productVariants, emptyCatalogFilters, "invalid");
  assert.deepEqual(ordered.map((family) => family.id), [
    "carrier-xcool-inverter",
    "carrier-optimax-pro",
    "carrier-xcool",
    "midea-ai-ecomaster-inverter",
    "midea-xtreme-pro",
    "midea-mission-pro",
    "carrier-optimax-inverter",
    "midea-mission-inverter",
    "carrier-classicool-pro",
    "carrier-classicool-inverter",
    "carrier-decor-inverter",
    "carrier-elegant-pro",
    "carrier-elegant-inverter",
  ]);

  const hpFive = { ...emptyCatalogFilters, hp: "5" };
  const hpFiveFamilies = filterProductFamilies(productFamilies, productVariants, hpFive);
  assert.deepEqual(
    sortProductFamilies(hpFiveFamilies, productVariants, hpFive).map((family) => family.productType),
    ["wall-mounted-split", "wall-mounted-split", "wall-mounted-split", "wall-mounted-split", "concealed-ducted", "concealed-ducted", "ceiling-cassette", "floor-standing"],
  );
});

test("variant sorting supports HP directions and keeps the approved default", () => {
  const candidates = filterProductVariants(productFamilies, productVariants, { ...emptyCatalogFilters, brand: "carrier" });
  const ascending = sortProductVariants(candidates, productFamilies, "hp-asc");
  const descending = sortProductVariants(candidates, productFamilies, "hp-desc");
  assert.equal(ascending[0].capacityHp, 1.5);
  assert.equal(descending[0].capacityHp, 7.5);
  assert.equal(sortProductVariants(candidates, productFamilies, "price")[0].familyId, "carrier-xcool-inverter");
});

test("catalog source cardinality remains unchanged", () => {
  assert.equal(productFamilies.length, 13);
  assert.equal(productVariants.length, 61);
});

test("catalog UI keeps HP first, switches to model cards, and hides codes from cards", async () => {
  const filters = await readFile(new URL("../components/products/CatalogFilters.tsx", import.meta.url), "utf8");
  const grid = await readFile(new URL("../components/products/ProductFamilyGrid.tsx", import.meta.url), "utf8");
  const familyCard = await readFile(new URL("../components/products/ProductFamilyCard.tsx", import.meta.url), "utf8");
  const variantCard = await readFile(new URL("../components/products/ProductVariantCard.tsx", import.meta.url), "utf8");
  assert.ok(filters.indexOf("Horsepower") < filters.indexOf("Brand"));
  assert.doesNotMatch(filters, /price/i);
  assert.match(grid, /getCatalogResultMode\(filters\)/);
  assert.match(grid, /<ProductVariantCard/);
  assert.match(familyCard, /View matching models/);
  assert.match(variantCard, /AddToRequestButton/);
  assert.match(variantCard, /Request current price/);
  assert.doesNotMatch(variantCard, /modelCode/);
});
