import type { Locale } from "@/content/site";
import type {
  BrandId,
  CoolingMode,
  LocalizedText,
  ProductFamily,
  ProductTypeId,
  ProductVariant,
  SupportedHorsepower,
  TechnologyId,
} from "@/types/catalog";

export type ServiceLocation =
  | "ain-sokhna"
  | "ras-ghareb"
  | "el-gouna"
  | "hurghada"
  | "safaga"
  | "quseir"
  | "marsa-alam"
  | "other";

export type RoomType =
  | "bedroom"
  | "living-room"
  | "hotel-room"
  | "office"
  | "shop-showroom"
  | "clinic"
  | "restaurant"
  | "open-plan"
  | "other";

export type SunlightLevel = "low" | "normal" | "high";
export type FloorCondition = "normal-floor" | "top-floor-insulated" | "roof-exposed-poor-insulation";
export type GlazingLevel = "small" | "normal" | "large" | "full-storefront";
export type InsulationLevel = "good" | "average" | "poor" | "unknown";
export type CoolingModePreference = CoolingMode | "either";
export type TechnologyPreference = TechnologyId | "either";
export type BrandPreference = BrandId | "either";
export type InstallationPreference = ProductTypeId | "unsure-show-all-suitable";
export type InspectionLevel = "none" | "recommended" | "required";

export type SizingReasonCode =
  | "smallest-catalog-capacity"
  | "boundary-proximity"
  | "high-sunlight"
  | "high-ceiling"
  | "ceiling-out-of-range"
  | "top-floor"
  | "roof-exposure"
  | "large-glazing"
  | "full-storefront"
  | "unknown-insulation"
  | "poor-insulation"
  | "room-use-adjustment"
  | "high-occupancy"
  | "occupancy-out-of-range"
  | "restaurant"
  | "open-plan"
  | "other-room"
  | "other-location"
  | "large-area"
  | "area-out-of-range"
  | "dimensions-out-of-range"
  | "connected-rooms"
  | "irregular-geometry"
  | "high-equipment-load"
  | "conflicting-preferences"
  | "load-out-of-range";

export interface AcSizingInput {
  locale: Locale;
  location: ServiceLocation;
  lengthMeters: number;
  widthMeters: number;
  ceilingHeightMeters: number;
  roomType: RoomType;
  sunlight: SunlightLevel;
  floorCondition: FloorCondition;
  glazing: GlazingLevel;
  insulation: InsulationLevel;
  occupants: number;
  coolingModePreference: CoolingModePreference;
  technologyPreference: TechnologyPreference;
  brandPreference: BrandPreference;
  installationPreference: InstallationPreference;
  connectedRooms: boolean;
  irregularGeometry: boolean;
  highEquipmentHeatLoad: boolean;
}

export interface SizingReason {
  code: SizingReasonCode;
  level: Exclude<InspectionLevel, "none">;
}

export interface AcSizingBreakdown {
  baseBtuPerSquareMeter: number;
  climateMultiplier: number;
  ceilingMultiplier: number;
  sunlightMultiplier: number;
  floorMultiplier: number;
  glazingMultiplier: number;
  insulationMultiplier: number;
  roomTypeMultiplier: number;
  occupancyAdjustmentBtu: number;
  loadBeforeOccupancyBtu: number;
}

export interface AcSizingResult {
  areaSquareMeters: number;
  volumeCubicMeters: number;
  baseLoadBtu: number;
  adjustedLoadBtu: number | null;
  recommendedHp: SupportedHorsepower | null;
  alternativeHp?: SupportedHorsepower;
  confidence: "standard" | "site-inspection-recommended" | "site-inspection-required";
  inspectionLevel: InspectionLevel;
  reasons: SizingReason[];
  breakdown: AcSizingBreakdown;
}

export interface AdvisorCatalogMatch {
  family: ProductFamily;
  variants: ProductVariant[];
  productType: ProductTypeId;
  suitability: "direct-room-option" | "inspection-required-option";
  reasons: LocalizedText[];
}

export interface AdvisorCatalogMatches {
  direct: AdvisorCatalogMatch[];
  inspectionRequired: AdvisorCatalogMatch[];
  conflictingPreferences: boolean;
}
