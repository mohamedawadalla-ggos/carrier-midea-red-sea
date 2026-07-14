import type { acSizingConfig } from "@/content/ac-sizing-config";
import type {
  AcSizingInput,
  AcSizingResult,
  InspectionLevel,
  SizingReason,
  SizingReasonCode,
} from "@/types/ac-advisor";
import type { SupportedHorsepower } from "@/types/catalog";

const severity: Record<InspectionLevel, number> = { none: 0, recommended: 1, required: 2 };

function higherInspectionLevel(current: InspectionLevel, candidate: InspectionLevel): InspectionLevel {
  return severity[candidate] > severity[current] ? candidate : current;
}

function addReason(reasons: SizingReason[], code: SizingReasonCode, level: Exclude<InspectionLevel, "none">): void {
  if (!reasons.some((reason) => reason.code === code)) reasons.push({ code, level });
}

function assertFinitePositive(label: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be a finite positive number.`);
}

function nextHorsepower(hp: SupportedHorsepower, config: typeof acSizingConfig): SupportedHorsepower | undefined {
  const index = config.hpBands.findIndex((band) => band.hp === hp);
  return config.hpBands[index + 1]?.hp;
}

function confidenceFor(level: InspectionLevel): AcSizingResult["confidence"] {
  if (level === "required") return "site-inspection-required";
  if (level === "recommended") return "site-inspection-recommended";
  return "standard";
}

export function calculateAcSizing(input: AcSizingInput, config: typeof acSizingConfig): AcSizingResult {
  assertFinitePositive("lengthMeters", input.lengthMeters);
  assertFinitePositive("widthMeters", input.widthMeters);
  assertFinitePositive("ceilingHeightMeters", input.ceilingHeightMeters);
  assertFinitePositive("occupants", input.occupants);

  const { inputLimits } = config;
  if (input.lengthMeters < inputLimits.minimumLengthMeters || input.widthMeters < inputLimits.minimumWidthMeters || input.ceilingHeightMeters < inputLimits.minimumCeilingHeightMeters || input.occupants < inputLimits.minimumOccupants) {
    throw new RangeError("Room measurements and occupancy are below the approved input limits.");
  }

  const areaSquareMeters = input.lengthMeters * input.widthMeters;
  const volumeCubicMeters = areaSquareMeters * input.ceilingHeightMeters;
  const baseLoadBtu = areaSquareMeters * config.baseBtuPerSquareMeter;
  const reasons: SizingReason[] = [];
  let inspectionLevel: InspectionLevel = "none";

  const requireInspection = (code: SizingReasonCode): void => {
    inspectionLevel = "required";
    addReason(reasons, code, "required");
  };
  const recommendInspection = (code: SizingReasonCode): void => {
    inspectionLevel = higherInspectionLevel(inspectionLevel, "recommended");
    addReason(reasons, code, "recommended");
  };

  const dimensionsOutsideDirectRange = input.lengthMeters > inputLimits.maximumDirectLengthMeters || input.widthMeters > inputLimits.maximumDirectWidthMeters;
  const ceilingOutsideRange = input.ceilingHeightMeters > inputLimits.maximumAutomaticCeilingHeightMeters;
  const occupancyOutsideRange = input.occupants > inputLimits.maximumDirectOccupants;
  const areaOutsideRange = areaSquareMeters > inputLimits.maximumPreliminaryAreaSquareMeters;

  if (dimensionsOutsideDirectRange) requireInspection("dimensions-out-of-range");
  if (ceilingOutsideRange) requireInspection("ceiling-out-of-range");
  if (occupancyOutsideRange) requireInspection("occupancy-out-of-range");
  if (areaOutsideRange) requireInspection("area-out-of-range");
  else if (areaSquareMeters > inputLimits.maximumAutomaticAreaSquareMeters) requireInspection("large-area");

  if (input.connectedRooms) requireInspection("connected-rooms");
  if (input.irregularGeometry) requireInspection("irregular-geometry");
  if (input.highEquipmentHeatLoad) requireInspection("high-equipment-load");
  if (input.location === "other") recommendInspection("other-location");

  const floorRule = config.floorCondition[input.floorCondition];
  if (input.floorCondition === "top-floor-insulated") recommendInspection("top-floor");
  if (input.floorCondition === "roof-exposed-poor-insulation") requireInspection("roof-exposure");

  const glazingRule = config.glazing[input.glazing];
  if (input.glazing === "large") recommendInspection("large-glazing");
  if (input.glazing === "full-storefront") requireInspection("full-storefront");

  if (input.insulation === "unknown") recommendInspection("unknown-insulation");
  if (input.insulation === "poor") addReason(reasons, "poor-insulation", "recommended");
  if (input.sunlight === "high") addReason(reasons, "high-sunlight", "recommended");

  if (input.occupants > config.occupancy.inspectionRequiredAbove) requireInspection("occupancy-out-of-range");
  else if (input.occupants > config.occupancy.inspectionRecommendedAbove) recommendInspection("high-occupancy");

  const roomRule = config.roomTypes[input.roomType];
  if (roomRule.multiplier !== 1) addReason(reasons, "room-use-adjustment", "recommended");
  if (input.roomType === "restaurant") requireInspection("restaurant");
  if (input.roomType === "open-plan") requireInspection("open-plan");
  if (input.roomType === "other") recommendInspection("other-room");

  const ceilingRule = config.ceilingBands.find((band) => input.ceilingHeightMeters <= band.maximumMeters);
  if (ceilingRule?.inspection === "recommended") recommendInspection("high-ceiling");

  const cannotCalculate = dimensionsOutsideDirectRange || ceilingOutsideRange || occupancyOutsideRange || areaOutsideRange;
  const ceilingMultiplier = ceilingRule?.multiplier ?? 1;
  const sunlightMultiplier = config.sunlight[input.sunlight].multiplier;
  const insulationMultiplier = config.insulation[input.insulation].multiplier;
  const loadBeforeOccupancyBtu = baseLoadBtu
    * config.climateProfile.multiplier
    * ceilingMultiplier
    * sunlightMultiplier
    * floorRule.multiplier
    * glazingRule.multiplier
    * insulationMultiplier
    * roomRule.multiplier;
  const occupancyAdjustmentBtu = Math.max(0, input.occupants - config.occupancy.includedOccupants) * config.occupancy.additionalBtuPerOccupant;
  const adjustedLoadBtu = cannotCalculate ? null : Math.round(loadBeforeOccupancyBtu + occupancyAdjustmentBtu);

  let recommendedHp: SupportedHorsepower | null = null;
  let alternativeHp: SupportedHorsepower | undefined;

  if (adjustedLoadBtu !== null) {
    recommendedHp = config.hpBands.find((band) => adjustedLoadBtu <= band.maximumAdjustedLoadBtu)?.hp ?? null;
    if (!recommendedHp) requireInspection("load-out-of-range");
    else {
      if (recommendedHp === 1.5 && adjustedLoadBtu < config.hpBands[0].maximumAdjustedLoadBtu) recommendInspection("smallest-catalog-capacity");
      const nearBoundary = config.hpBands.slice(0, -1).some((band) => Math.abs(adjustedLoadBtu - band.maximumAdjustedLoadBtu) <= band.maximumAdjustedLoadBtu * config.boundaryTolerance);
      if (nearBoundary) {
        recommendInspection("boundary-proximity");
        alternativeHp = nextHorsepower(recommendedHp, config);
      }
    }
  }

  return {
    areaSquareMeters,
    volumeCubicMeters,
    baseLoadBtu,
    adjustedLoadBtu,
    recommendedHp,
    alternativeHp,
    confidence: confidenceFor(inspectionLevel),
    inspectionLevel,
    reasons,
    breakdown: {
      baseBtuPerSquareMeter: config.baseBtuPerSquareMeter,
      climateMultiplier: config.climateProfile.multiplier,
      ceilingMultiplier,
      sunlightMultiplier,
      floorMultiplier: floorRule.multiplier,
      glazingMultiplier: glazingRule.multiplier,
      insulationMultiplier,
      roomTypeMultiplier: roomRule.multiplier,
      occupancyAdjustmentBtu,
      loadBeforeOccupancyBtu: Math.round(loadBeforeOccupancyBtu),
    },
  };
}
