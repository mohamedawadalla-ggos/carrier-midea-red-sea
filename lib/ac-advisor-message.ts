import type { AcAdvisorInquiry } from "@/types/lead";
import type { SizingReasonCode } from "@/types/ac-advisor";
import type { LocalizedText, SupportedHorsepower } from "@/types/catalog";

type MessageDependencies = {
  options: {
    locations: readonly (readonly [string, LocalizedText])[];
    roomTypes: readonly (readonly [string, LocalizedText])[];
    installationTypes: readonly (readonly [string, LocalizedText])[];
  };
  reasonCopy: Record<SizingReasonCode, LocalizedText>;
  formatHorsepower: (locale: "ar" | "en", horsepower: SupportedHorsepower) => string;
};

function optionLabel(options: readonly (readonly [string, { readonly ar: string; readonly en: string }])[], value: string, locale: "ar" | "en"): string {
  return options.find(([id]) => id === value)?.[1][locale] ?? value;
}

const factorLabels = {
  sunlight: {
    low: { ar: "منخفض / ظل كثيف", en: "Low / heavily shaded" },
    normal: { ar: "طبيعي", en: "Normal" },
    high: { ar: "شمس قوية مباشرة", en: "High / strong direct sun" },
  },
  floor: {
    "normal-floor": { ar: "دور عادي", en: "Normal floor" },
    "top-floor-insulated": { ar: "دور أخير وسطح معزول", en: "Top floor with insulated roof" },
    "roof-exposed-poor-insulation": { ar: "سطح مكشوف وعزل ضعيف", en: "Exposed roof with poor insulation" },
  },
  glazing: {
    small: { ar: "نوافذ صغيرة", en: "Small windows" },
    normal: { ar: "نوافذ عادية", en: "Normal windows" },
    large: { ar: "زجاج كبير", en: "Large glazing" },
    "full-storefront": { ar: "واجهة زجاج كاملة", en: "Full storefront glazing" },
  },
  insulation: {
    good: { ar: "جيد", en: "Good" },
    average: { ar: "متوسط", en: "Average" },
    poor: { ar: "ضعيف", en: "Poor" },
    unknown: { ar: "غير معروف", en: "Unknown" },
  },
} as const;

export function buildAdvisorWhatsAppMessage(data: AcAdvisorInquiry, dependencies: MessageDependencies): string {
  const { input, result } = data;
  const locale = data.locale;
  const ar = locale === "ar";
  const number = new Intl.NumberFormat(ar ? "ar-EG" : "en-US", { maximumFractionDigits: 1, useGrouping: false });
  const integer = new Intl.NumberFormat(ar ? "ar-EG" : "en-US", { maximumFractionDigits: 0 });
  const location = optionLabel(dependencies.options.locations, input.location, locale);
  const roomType = optionLabel(dependencies.options.roomTypes, input.roomType, locale);
  const installation = optionLabel(dependencies.options.installationTypes, input.installationPreference, locale);
  const selectedProduct = data.selectedFamily && data.selectedVariant ? `${data.selectedFamily.name[locale]} — ${data.selectedVariant.modelCode}` : (ar ? "غير محدد" : "Not selected");
  const selectedSystemRequiresInspection = data.selectedFamily ? ["concealed-ducted", "ceiling-cassette", "floor-standing"].includes(data.selectedFamily.productType) : false;
  const reasons = result.reasons.length ? result.reasons.map((reason) => dependencies.reasonCopy[reason.code][locale]).join(ar ? "؛ " : "; ") : (ar ? "لا توجد عوامل إضافية" : "No additional factors");
  const hp = result.recommendedHp ? dependencies.formatHorsepower(locale, result.recommendedHp) : (ar ? "لا توجد قدرة تلقائية" : "No automatic capacity");
  const alternative = result.alternativeHp ? dependencies.formatHorsepower(locale, result.alternativeHp) : (ar ? "لا يوجد" : "None");
  const adjusted = result.adjustedLoadBtu === null ? (ar ? "غير محسوب — المعاينة مطلوبة" : "Not calculated — inspection required") : `${integer.format(result.adjustedLoadBtu)} BTU`;
  const sunlight = factorLabels.sunlight[input.sunlight][locale];
  const floor = factorLabels.floor[input.floorCondition][locale];
  const glazing = factorLabels.glazing[input.glazing][locale];
  const insulation = factorLabels.insulation[input.insulation][locale];
  const factorSummary = ar ? `الشمس: ${sunlight} | الدور/السطح: ${floor} | الزجاج: ${glazing} | العزل: ${insulation}` : `Sunlight: ${sunlight} | Floor/roof: ${floor} | Glazing: ${glazing} | Insulation: ${insulation}`;
  const inspectionStatus = selectedSystemRequiresInspection || result.inspectionLevel === "required" ? (ar ? "مطلوبة" : "Required") : result.inspectionLevel === "recommended" ? (ar ? "موصى بها" : "Recommended") : (ar ? "تأكيد عادي" : "Standard confirmation");

  return ar
    ? `طلب من مستر كول\n\nنوع الطلب: ${data.intent === "site-inspection" ? "معاينة فنية" : "تأكيد فني للتوصية"}\nالعميل: ${data.customerName || "غير مذكور"}\nالموقع: ${location}\nاستخدام الغرفة: ${roomType}\nالأبعاد: ${number.format(input.lengthMeters)} × ${number.format(input.widthMeters)} متر\nارتفاع السقف: ${number.format(input.ceilingHeightMeters)} متر\nالمساحة المحسوبة: ${number.format(result.areaSquareMeters)} م²\nالحجم المحسوب: ${number.format(result.volumeCubicMeters)} م³\n${factorSummary}\nعدد الأشخاص: ${integer.format(input.occupants)}\nنظام التركيب المفضل: ${installation}\nالحمل الأساسي: ${integer.format(result.baseLoadBtu)} BTU\nالحمل المعدل: ${adjusted}\nالقدرة المقترحة: ${hp}\nالقدرة البديلة: ${alternative}\nحالة المعاينة: ${inspectionStatus}\nالأسباب: ${reasons}\nالمنتج المختار: ${selectedProduct}\n\nأرجو التأكيد الفني للقدرة المناسبة قبل التنفيذ. هذه توصية مبدئية وليست حساب أحمال هندسيًا نهائيًا.`
    : `Mr. Cool AC Advisor request\n\nRequest type: ${data.intent === "site-inspection" ? "Site inspection" : "Technical recommendation confirmation"}\nCustomer: ${data.customerName || "Not provided"}\nLocation: ${location}\nRoom use: ${roomType}\nDimensions: ${number.format(input.lengthMeters)} × ${number.format(input.widthMeters)} metres\nCeiling height: ${number.format(input.ceilingHeightMeters)} metres\nCalculated area: ${number.format(result.areaSquareMeters)} m²\nCalculated volume: ${number.format(result.volumeCubicMeters)} m³\n${factorSummary}\nOccupants: ${integer.format(input.occupants)}\nPreferred installation: ${installation}\nBase load: ${integer.format(result.baseLoadBtu)} BTU\nAdjusted load: ${adjusted}\nRecommended capacity: ${hp}\nAlternative capacity: ${alternative}\nInspection status: ${inspectionStatus}\nReasons: ${reasons}\nSelected product: ${selectedProduct}\n\nPlease provide technical confirmation of the appropriate capacity before installation. This is a preliminary recommendation, not a final engineering load calculation.`;
}
