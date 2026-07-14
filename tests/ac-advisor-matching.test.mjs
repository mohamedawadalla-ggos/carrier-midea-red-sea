import assert from "node:assert/strict";
import test from "node:test";

const { productFamilies } = await import(new URL("../content/product-families.ts", import.meta.url));
const { productVariants } = await import(new URL("../content/product-variants.ts", import.meta.url));
const { buildAdvisorCatalogUrl, matchAdvisorCatalog } = await import(new URL("../lib/ac-advisor-matching.ts", import.meta.url));
const { acSizingConfig } = await import(new URL("../content/ac-sizing-config.ts", import.meta.url));
const match = (values, horsepower) => matchAdvisorCatalog(values, horsepower, productFamilies, productVariants, acSizingConfig.inspectionProductTypes);

function input(overrides = {}) {
  return {
    locale: "en", location: "hurghada", lengthMeters: 6, widthMeters: 5, ceilingHeightMeters: 2.7,
    roomType: "living-room", sunlight: "normal", floorCondition: "normal-floor", glazing: "normal", insulation: "average", occupants: 2,
    coolingModePreference: "either", technologyPreference: "either", brandPreference: "either", installationPreference: "unsure-show-all-suitable",
    connectedRooms: false, irregularGeometry: false, highEquipmentHeatLoad: false, ...overrides,
  };
}

test("every catalog product type can surface at an available approved HP", () => {
  for (const productType of ["wall-mounted-split", "concealed-ducted", "ceiling-cassette", "floor-standing"]) {
    const family = productFamilies.find((item) => item.productType === productType);
    const variant = productVariants.find((item) => item.familyId === family.id && item.active);
    const matches = match(input({ installationPreference: productType }), variant.capacityHp);
    const surfaced = [...matches.direct, ...matches.inspectionRequired];
    assert.ok(surfaced.some((match) => match.productType === productType), productType);
  }
});

test("commercial system types are separated as inspection-required options", () => {
  for (const productType of ["concealed-ducted", "ceiling-cassette", "floor-standing"]) {
    const family = productFamilies.find((item) => item.productType === productType);
    const variant = productVariants.find((item) => item.familyId === family.id && item.active);
    const matches = match(input({ installationPreference: productType }), variant.capacityHp);
    assert.equal(matches.direct.length, 0);
    assert.ok(matches.inspectionRequired.length > 0, productType);
    assert.ok(matches.inspectionRequired.every((match) => match.suitability === "inspection-required-option"));
  }
});

test("unsure mode groups all matching families while respecting preferences", () => {
  const matches = match(input({ brandPreference: "carrier", coolingModePreference: "cool-only" }), 3);
  const all = [...matches.direct, ...matches.inspectionRequired];
  assert.ok(all.length > 0);
  assert.ok(all.every((match) => match.family.brand === "carrier"));
  assert.ok(all.every((match) => match.variants.every((variant) => variant.capacityHp === 3 && variant.coolingMode === "cool-only" && variant.active)));
  assert.ok(matches.direct.length <= 6);
});

test("localized catalog URL uses existing filter keys and no imperative routing", () => {
  const url = buildAdvisorCatalogUrl("ar", input({ brandPreference: "midea", technologyPreference: "inverter", coolingModePreference: "heat-pump", installationPreference: "wall-mounted-split" }), 2.25);
  assert.equal(url, "/ar/products?hp=2.25&brand=midea&technology=inverter&mode=heat-pump&type=wall-mounted-split");
});

test("a preference combination with no matching product is flagged as conflicting", () => {
  const matches = match(input({ brandPreference: "midea" }), 7.5);
  assert.equal(matches.direct.length + matches.inspectionRequired.length, 0);
  assert.equal(matches.conflictingPreferences, true);
});
