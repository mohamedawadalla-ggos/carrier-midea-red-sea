import type { AcSizingInput, AdvisorCatalogMatch, AdvisorCatalogMatches } from "@/types/ac-advisor";
import type { LocalizedText, ProductFamily, ProductTypeId, ProductVariant, SupportedHorsepower } from "@/types/catalog";

const inspectionReason: LocalizedText = {
  ar: "يتطلب هذا النظام معاينة فنية قبل تأكيد الاختيار والتركيب.",
  en: "This system requires a technical site inspection before selection and installation are confirmed.",
};

function requestedProductTypes(input: AcSizingInput): ProductTypeId[] {
  if (input.installationPreference !== "unsure-show-all-suitable") return [input.installationPreference];
  return ["wall-mounted-split", "concealed-ducted", "ceiling-cassette", "floor-standing"];
}

function isInspectionOption(input: AcSizingInput, productType: ProductTypeId, inspectionProductTypes: readonly ProductTypeId[]): boolean {
  if (inspectionProductTypes.some((type) => type === productType)) return true;
  return input.roomType === "restaurant" || input.roomType === "open-plan" || input.roomType === "other";
}

export function matchAdvisorCatalog(input: AcSizingInput, horsepower: SupportedHorsepower | null, productFamilies: ProductFamily[], productVariants: ProductVariant[], inspectionProductTypes: readonly ProductTypeId[]): AdvisorCatalogMatches {
  if (!horsepower) return { direct: [], inspectionRequired: [], conflictingPreferences: false };
  const productTypes = requestedProductTypes(input);
  const capacityVariants = productVariants.filter((variant) => variant.active && variant.capacityHp === horsepower);
  const preferredVariants = capacityVariants.filter((variant) => input.coolingModePreference === "either" || variant.coolingMode === input.coolingModePreference);

  const matches: AdvisorCatalogMatch[] = productFamilies
    .filter((family) => productTypes.includes(family.productType))
    .filter((family) => input.brandPreference === "either" || family.brand === input.brandPreference)
    .filter((family) => input.technologyPreference === "either" || family.technology === input.technologyPreference)
    .map((family) => {
      const variants = preferredVariants.filter((variant) => variant.familyId === family.id).sort((a, b) => a.displayOrder - b.displayOrder);
      const inspectionRequired = isInspectionOption(input, family.productType, inspectionProductTypes);
      return {
        family,
        variants,
        productType: family.productType,
        suitability: inspectionRequired ? "inspection-required-option" as const : "direct-room-option" as const,
        reasons: inspectionRequired ? [inspectionReason] : [],
      };
    })
    .filter((match) => match.variants.length > 0)
    .sort((a, b) => a.family.displayOrder - b.family.displayOrder);

  return {
    direct: matches.filter((match) => match.suitability === "direct-room-option").slice(0, 6),
    inspectionRequired: matches.filter((match) => match.suitability === "inspection-required-option"),
    conflictingPreferences: capacityVariants.length > 0 && matches.length === 0,
  };
}

export function buildAdvisorCatalogUrl(locale: "ar" | "en", input: AcSizingInput, horsepower: SupportedHorsepower): string {
  const query = new URLSearchParams({ hp: String(horsepower) });
  if (input.brandPreference !== "either") query.set("brand", input.brandPreference);
  if (input.technologyPreference !== "either") query.set("technology", input.technologyPreference);
  if (input.coolingModePreference !== "either") query.set("mode", input.coolingModePreference);
  if (input.installationPreference !== "unsure-show-all-suitable") query.set("type", input.installationPreference);
  return `/${locale}/products?${query.toString()}`;
}
