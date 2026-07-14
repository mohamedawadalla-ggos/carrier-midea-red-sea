import type {
  FloorCondition,
  GlazingLevel,
  InsulationLevel,
  InspectionLevel,
  RoomType,
  SunlightLevel,
} from "@/types/ac-advisor";
import type { ProductTypeId, SupportedHorsepower } from "@/types/catalog";

type AdjustmentRule = {
  multiplier: number;
  inspection: InspectionLevel;
};

type RoomTypeRule = AdjustmentRule & {
  automaticRecommendation: boolean;
};

export const acSizingConfig = {
  approval: {
    approvedBy: "Nael",
    status: "approved",
    implementationDate: "2026-07-14",
  },
  baseBtuPerSquareMeter: 600,
  referenceCeilingHeightMeters: 2.7,
  climateProfile: {
    id: "red-sea-hot-coastal-v1",
    multiplier: 1,
    separateCityMultipliers: false,
  },
  inputLimits: {
    minimumLengthMeters: 2,
    maximumDirectLengthMeters: 12,
    minimumWidthMeters: 2,
    maximumDirectWidthMeters: 12,
    minimumCeilingHeightMeters: 2.4,
    maximumAutomaticCeilingHeightMeters: 3.6,
    minimumOccupants: 1,
    maximumDirectOccupants: 12,
    maximumAutomaticAreaSquareMeters: 60,
    maximumPreliminaryAreaSquareMeters: 100,
  },
  ceilingBands: [
    { maximumMeters: 2.7, multiplier: 1, inspection: "none" },
    { maximumMeters: 3, multiplier: 1.1, inspection: "none" },
    { maximumMeters: 3.3, multiplier: 1.2, inspection: "none" },
    { maximumMeters: 3.6, multiplier: 1.3, inspection: "recommended" },
  ],
  sunlight: {
    low: { multiplier: 0.9, inspection: "none" },
    normal: { multiplier: 1, inspection: "none" },
    high: { multiplier: 1.1, inspection: "none" },
  } satisfies Record<SunlightLevel, AdjustmentRule>,
  floorCondition: {
    "normal-floor": { multiplier: 1, inspection: "none" },
    "top-floor-insulated": { multiplier: 1.1, inspection: "recommended" },
    "roof-exposed-poor-insulation": { multiplier: 1.2, inspection: "required" },
  } satisfies Record<FloorCondition, AdjustmentRule>,
  glazing: {
    small: { multiplier: 0.95, inspection: "none" },
    normal: { multiplier: 1, inspection: "none" },
    large: { multiplier: 1.15, inspection: "recommended" },
    "full-storefront": { multiplier: 1.15, inspection: "required" },
  } satisfies Record<GlazingLevel, AdjustmentRule>,
  insulation: {
    good: { multiplier: 0.9, inspection: "none" },
    average: { multiplier: 1, inspection: "none" },
    poor: { multiplier: 1.15, inspection: "none" },
    unknown: { multiplier: 1.1, inspection: "recommended" },
  } satisfies Record<InsulationLevel, AdjustmentRule>,
  occupancy: {
    includedOccupants: 2,
    additionalBtuPerOccupant: 600,
    inspectionRecommendedAbove: 8,
    inspectionRequiredAbove: 12,
  },
  roomTypes: {
    bedroom: { multiplier: 1, inspection: "none", automaticRecommendation: true },
    "hotel-room": { multiplier: 1, inspection: "none", automaticRecommendation: true },
    "living-room": { multiplier: 1.05, inspection: "none", automaticRecommendation: true },
    office: { multiplier: 1.1, inspection: "none", automaticRecommendation: true },
    clinic: { multiplier: 1.1, inspection: "none", automaticRecommendation: true },
    "shop-showroom": { multiplier: 1.15, inspection: "none", automaticRecommendation: true },
    restaurant: { multiplier: 1, inspection: "required", automaticRecommendation: false },
    "open-plan": { multiplier: 1, inspection: "required", automaticRecommendation: false },
    other: { multiplier: 1, inspection: "recommended", automaticRecommendation: false },
  } satisfies Record<RoomType, RoomTypeRule>,
  hpBands: [
    { hp: 1.5, maximumAdjustedLoadBtu: 12_000 },
    { hp: 2.25, maximumAdjustedLoadBtu: 18_000 },
    { hp: 3, maximumAdjustedLoadBtu: 24_000 },
    { hp: 4, maximumAdjustedLoadBtu: 30_000 },
    { hp: 5, maximumAdjustedLoadBtu: 36_000 },
    { hp: 6, maximumAdjustedLoadBtu: 48_000 },
    { hp: 7.5, maximumAdjustedLoadBtu: 60_000 },
  ] as const satisfies readonly { hp: SupportedHorsepower; maximumAdjustedLoadBtu: number }[],
  boundaryTolerance: 0.05,
  inspectionProductTypes: ["concealed-ducted", "ceiling-cassette", "floor-standing"] as const satisfies readonly ProductTypeId[],
} as const;
