export type BrandId = "carrier" | "midea";

export type ProductTypeId =
  | "wall-mounted-split"
  | "concealed-ducted"
  | "ceiling-cassette"
  | "floor-standing";

export type MarketSegment = "residential" | "commercial" | "projects";
export type TechnologyId = "inverter" | "fixed-speed";
export type CoolingMode = "cool-only" | "heat-pump";

export interface LocalizedText { ar: string; en: string }

export interface ProductFamily {
  id: string;
  slug: string;
  brand: BrandId;
  name: LocalizedText;
  productType: ProductTypeId;
  marketSegments: MarketSegment[];
  technology: TechnologyId;
  refrigerant: "R32" | "R410A";
  description: LocalizedText;
  highlights: LocalizedText[];
  familyImagePath: string | null;
  assetAuthorization: "approved" | "pending";
  featured: boolean;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  familyId: string;
  modelCode: string;
  capacityHp: number | null;
  capacityBtu: number | null;
  coolingMode: CoolingMode;
  energyClass: string | null;
  priceMode: "request-quote";
  priceReferenceDate: "2026-06-07";
  active: boolean;
  displayOrder: number;
}

export interface ProductType {
  id: ProductTypeId;
  name: LocalizedText;
  description: LocalizedText;
  displayOrder: number;
}
