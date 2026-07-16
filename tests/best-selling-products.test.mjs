import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { bestSellingProductSelections } = await import(new URL("../content/best-selling-products.ts", import.meta.url));
const { productFamilies } = await import(new URL("../content/product-families.ts", import.meta.url));
const { productVariants } = await import(new URL("../content/product-variants.ts", import.meta.url));
const component = await readFile(new URL("../components/home/BestSellingProducts.tsx", import.meta.url), "utf8");

const familyById = new Map(productFamilies.map((family) => [family.id, family]));
const variantById = new Map(productVariants.map((variant) => [variant.id, variant]));
const products = [...bestSellingProductSelections].sort((left, right) => left.order - right.order).map((selection) => {
  const variant = variantById.get(selection.variantId);
  assert.ok(variant, `Missing variant ${selection.variantId}`);
  const family = familyById.get(variant.familyId);
  assert.ok(family, `Missing family ${variant.familyId}`);
  return { selection, family, variant };
});

test("approved best-selling selection resolves to 12 active wall-mounted catalog variants", () => {
  assert.equal(products.length, 12);
  assert.deepEqual(products.map(({ selection }) => selection.order), Array.from({ length: 12 }, (_, index) => index + 1));
  assert.deepEqual(products.map(({ variant }) => variant.capacityHp), [2.25, 2.25, 2.25, 2.25, 1.5, 1.5, 1.5, 1.5, 3, 3, 3, 3]);
  assert.ok(products.every(({ family, selection, variant }) => selection.active && variant.active && family.productType === "wall-mounted-split" && family.assetAuthorization === "approved" && family.familyImagePath?.startsWith("/products/catalog/")));
  assert.equal(new Set(products.map(({ variant }) => variant.id)).size, 12);
  assert.ok(bestSellingProductSelections.every((selection) => Object.keys(selection).sort().join(",") === "active,order,variantId"));
});

test("each capacity group balances brands, technologies, and cooling modes", () => {
  for (const capacity of [2.25, 1.5, 3]) {
    const group = products.filter(({ variant }) => variant.capacityHp === capacity);
    assert.deepEqual(group.map(({ family }) => family.brand).sort(), ["carrier", "carrier", "midea", "midea"]);
    assert.deepEqual(group.map(({ family }) => family.technology).sort(), ["fixed-speed", "fixed-speed", "inverter", "inverter"]);
    assert.deepEqual(group.map(({ variant }) => variant.coolingMode).sort(), ["cool-only", "cool-only", "heat-pump", "heat-pump"]);
  }
});

test("homepage section reuses variant cards and current catalog query parameters", () => {
  assert.match(component, /الأكثر مبيعًا/);
  assert.match(component, /Best-selling air conditioners/);
  assert.match(component, /<ProductVariantCard/);
  assert.match(component, /\[2\.25, 1\.5, 3\]/);
  assert.match(component, /type=wall-mounted-split&hp=\$\{capacity\}/);
  assert.match(component, /prefetch=\{false\}/);
  assert.doesNotMatch(component, /modelCode|priceMode|stock|inventory|payment|sales rank/i);
});
