import assert from "node:assert/strict";
import test from "node:test";

const { rankRelatedProducts } = await import(new URL("../lib/catalog-related.ts", import.meta.url));

const copy = (value) => ({ ar: value, en: value });
const family = (id, productType, brand = "carrier", technology = "inverter", displayOrder = 1) => ({
  id,
  slug: id,
  brand,
  name: copy(id),
  productType,
  marketSegments: ["residential"],
  technology,
  refrigerant: "R32",
  description: copy(id),
  highlights: [],
  familyImagePath: null,
  assetAuthorization: "pending",
  featured: false,
  displayOrder,
});
const variant = (id, familyId, capacityHp, displayOrder, active = true) => ({
  id,
  familyId,
  modelCode: id,
  capacityHp,
  capacityBtu: null,
  coolingMode: "cool-only",
  energyClass: null,
  priceMode: "request-quote",
  priceReferenceDate: "2026-06-07",
  active,
  displayOrder,
});

test("related products follow approved ranks, nearest-higher order, and inspection labeling", () => {
  const families = [
    family("current", "wall-mounted-split"),
    family("same-system", "wall-mounted-split", "midea", "fixed-speed", 2),
    family("higher-near", "wall-mounted-split", "carrier", "inverter", 3),
    family("higher-far", "wall-mounted-split", "carrier", "inverter", 4),
    family("other-different", "concealed-ducted", "midea", "fixed-speed", 5),
    family("other-same", "ceiling-cassette", "carrier", "inverter", 6),
  ];
  const variants = [
    variant("current-model", "current", 3, 1),
    variant("same-family-other-model", "current", 3, 2),
    variant("rank-1", "same-system", 3, 3),
    variant("rank-3-far", "higher-far", 5, 4),
    variant("rank-3-near", "higher-near", 4, 5),
    variant("rank-2", "other-different", 3, 6),
    variant("rank-4", "other-same", 3, 7),
  ];

  const results = rankRelatedProducts(families, variants, { familyId: "current", variantId: "current-model", horsepower: 3 });
  assert.deepEqual(results.map(({ variant: item, rank }) => [item.id, rank]), [
    ["rank-1", 1],
    ["rank-2", 2],
    ["rank-3-near", 3],
    ["rank-3-far", 3],
    ["rank-4", 4],
  ]);
  assert.equal(results.find((result) => result.variant.id === "rank-2").requiresInspection, true);
  assert.equal(results.find((result) => result.variant.id === "rank-4").requiresInspection, true);
  assert.ok(results.filter((result) => result.family.productType === "wall-mounted-split").every((result) => !result.requiresInspection));
});

test("related ranking excludes current family, inactive variants, and duplicate IDs", () => {
  const families = [
    family("current", "wall-mounted-split"),
    family("candidate", "wall-mounted-split", "midea", "inverter", 2),
  ];
  const active = variant("candidate-model", "candidate", 2.25, 1);
  const results = rankRelatedProducts(
    families,
    [variant("current-other", "current", 2.25, 1), active, { ...active }, variant("inactive", "candidate", 2.25, 2, false)],
    { familyId: "current", horsepower: 2.25 },
  );
  assert.deepEqual(results.map((result) => result.variant.id), ["candidate-model"]);
});

test("related ranking returns the full deterministic list and leaves slicing to the UI", () => {
  const families = [family("current", "wall-mounted-split"), family("candidate", "wall-mounted-split", "midea", "fixed-speed", 2)];
  const variants = Array.from({ length: 6 }, (_, index) => variant(`candidate-${index}`, "candidate", 1.5, index));
  const first = rankRelatedProducts(families, variants, { familyId: "current", horsepower: 1.5 });
  const second = rankRelatedProducts(families, [...variants].reverse(), { familyId: "current", horsepower: 1.5 });
  assert.equal(first.length, 6);
  assert.deepEqual(first.map((result) => result.variant.id), second.map((result) => result.variant.id));
});
