import assert from "node:assert/strict";
import test from "node:test";

const { acSizingConfig } = await import(new URL("../content/ac-sizing-config.ts", import.meta.url));
const { calculateAcSizing } = await import(new URL("../lib/ac-sizing.ts", import.meta.url));

function normalInput(overrides = {}) {
  return {
    locale: "en",
    location: "hurghada",
    lengthMeters: 4,
    widthMeters: 4,
    ceilingHeightMeters: 2.7,
    roomType: "bedroom",
    sunlight: "normal",
    floorCondition: "normal-floor",
    glazing: "normal",
    insulation: "average",
    occupants: 2,
    coolingModePreference: "either",
    technologyPreference: "either",
    brandPreference: "either",
    installationPreference: "unsure-show-all-suitable",
    connectedRooms: false,
    irregularGeometry: false,
    highEquipmentHeatLoad: false,
    ...overrides,
  };
}

test("approved sizing configuration contains the exact matrix", () => {
  assert.equal(acSizingConfig.baseBtuPerSquareMeter, 600);
  assert.equal(acSizingConfig.referenceCeilingHeightMeters, 2.7);
  assert.equal(acSizingConfig.climateProfile.multiplier, 1);
  assert.equal(acSizingConfig.climateProfile.separateCityMultipliers, false);
  assert.deepEqual(acSizingConfig.ceilingBands.map(({ maximumMeters, multiplier }) => [maximumMeters, multiplier]), [[2.7, 1], [3, 1.1], [3.3, 1.2], [3.6, 1.3]]);
  assert.deepEqual(Object.fromEntries(Object.entries(acSizingConfig.sunlight).map(([key, value]) => [key, value.multiplier])), { low: 0.9, normal: 1, high: 1.1 });
  assert.deepEqual(Object.fromEntries(Object.entries(acSizingConfig.floorCondition).map(([key, value]) => [key, value.multiplier])), { "normal-floor": 1, "top-floor-insulated": 1.1, "roof-exposed-poor-insulation": 1.2 });
  assert.deepEqual(Object.fromEntries(Object.entries(acSizingConfig.glazing).map(([key, value]) => [key, value.multiplier])), { small: 0.95, normal: 1, large: 1.15, "full-storefront": 1.15 });
  assert.deepEqual(Object.fromEntries(Object.entries(acSizingConfig.insulation).map(([key, value]) => [key, value.multiplier])), { good: 0.9, average: 1, poor: 1.15, unknown: 1.1 });
  assert.deepEqual(acSizingConfig.hpBands.map(({ hp, maximumAdjustedLoadBtu }) => [hp, maximumAdjustedLoadBtu]), [[1.5, 12000], [2.25, 18000], [3, 24000], [4, 30000], [5, 36000], [6, 48000], [7.5, 60000]]);
  assert.equal(acSizingConfig.boundaryTolerance, 0.05);
});

test("30m² sunny top-floor living room remains 3 HP with a complete breakdown", () => {
  const result = calculateAcSizing(normalInput({ lengthMeters: 6, widthMeters: 5, roomType: "living-room", sunlight: "high", floorCondition: "top-floor-insulated" }), acSizingConfig);
  assert.equal(result.areaSquareMeters, 30);
  assert.equal(result.volumeCubicMeters, 81);
  assert.equal(result.baseLoadBtu, 18000);
  assert.deepEqual(result.breakdown, {
    baseBtuPerSquareMeter: 600,
    climateMultiplier: 1,
    ceilingMultiplier: 1,
    sunlightMultiplier: 1.1,
    floorMultiplier: 1.1,
    glazingMultiplier: 1,
    insulationMultiplier: 1,
    roomTypeMultiplier: 1.05,
    occupancyAdjustmentBtu: 0,
    loadBeforeOccupancyBtu: 22869,
  });
  assert.equal(result.adjustedLoadBtu, 22869);
  assert.equal(result.recommendedHp, 3);
});

test("30m² large-glazing shop remains 3 HP with a complete breakdown", () => {
  const result = calculateAcSizing(normalInput({ lengthMeters: 6, widthMeters: 5, roomType: "shop-showroom", glazing: "large" }), acSizingConfig);
  assert.equal(result.areaSquareMeters, 30);
  assert.equal(result.volumeCubicMeters, 81);
  assert.equal(result.baseLoadBtu, 18000);
  assert.deepEqual(result.breakdown, {
    baseBtuPerSquareMeter: 600,
    climateMultiplier: 1,
    ceilingMultiplier: 1,
    sunlightMultiplier: 1,
    floorMultiplier: 1,
    glazingMultiplier: 1.15,
    insulationMultiplier: 1,
    roomTypeMultiplier: 1.15,
    occupancyAdjustmentBtu: 0,
    loadBeforeOccupancyBtu: 23805,
  });
  assert.equal(result.adjustedLoadBtu, 23805);
  assert.equal(result.recommendedHp, 3);
});

test("ceiling is adjusted once and occupancy is additive", () => {
  const result = calculateAcSizing(normalInput({ ceilingHeightMeters: 3, occupants: 4 }), acSizingConfig);
  assert.equal(result.volumeCubicMeters, 48);
  assert.equal(result.baseLoadBtu, 9600);
  assert.equal(result.breakdown.ceilingMultiplier, 1.1);
  assert.equal(result.breakdown.occupancyAdjustmentBtu, 1200);
  assert.equal(result.adjustedLoadBtu, 11760);
});

test("boundary tolerance shows the adjacent higher capacity and recommends inspection", () => {
  const result = calculateAcSizing(normalInput({ lengthMeters: 5, widthMeters: 4 }), acSizingConfig);
  assert.equal(result.adjustedLoadBtu, 12000);
  assert.equal(result.recommendedHp, 1.5);
  assert.equal(result.alternativeHp, 2.25);
  assert.equal(result.inspectionLevel, "recommended");
  assert.ok(result.reasons.some((reason) => reason.code === "boundary-proximity"));
});

test("mandatory cases never produce an unqualified result", () => {
  const restaurant = calculateAcSizing(normalInput({ roomType: "restaurant" }), acSizingConfig);
  assert.equal(restaurant.inspectionLevel, "required");
  assert.ok(restaurant.reasons.some((reason) => reason.code === "restaurant"));

  const aboveLoad = calculateAcSizing(normalInput({ lengthMeters: 10, widthMeters: 10, sunlight: "high" }), acSizingConfig);
  assert.equal(aboveLoad.adjustedLoadBtu, 66000);
  assert.equal(aboveLoad.recommendedHp, null);
  assert.equal(aboveLoad.inspectionLevel, "required");

  const aboveArea = calculateAcSizing(normalInput({ lengthMeters: 11, widthMeters: 10 }), acSizingConfig);
  assert.equal(aboveArea.areaSquareMeters, 110);
  assert.equal(aboveArea.adjustedLoadBtu, null);
  assert.equal(aboveArea.recommendedHp, null);

  const highCeiling = calculateAcSizing(normalInput({ ceilingHeightMeters: 3.7 }), acSizingConfig);
  assert.equal(highCeiling.adjustedLoadBtu, null);
  assert.equal(highCeiling.recommendedHp, null);
});
