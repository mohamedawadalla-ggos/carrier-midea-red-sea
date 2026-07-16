import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { calculateAcSizing } = await import(new URL("../lib/ac-sizing.ts", import.meta.url));
const { buildAdvisorWhatsAppMessage } = await import(new URL("../lib/ac-advisor-message.ts", import.meta.url));
const { acSizingConfig } = await import(new URL("../content/ac-sizing-config.ts", import.meta.url));
const { advisorOptions, advisorReasonCopy } = await import(new URL("../content/ac-advisor-copy.ts", import.meta.url));
const { formatHorsepower } = await import(new URL("../lib/catalog-filtering.ts", import.meta.url));
const dependencies = { options: advisorOptions, reasonCopy: advisorReasonCopy, formatHorsepower };

function input(locale) {
  return { locale, location: "hurghada", lengthMeters: 6, widthMeters: 5, ceilingHeightMeters: 2.7, roomType: "living-room", sunlight: "high", floorCondition: "top-floor-insulated", glazing: "normal", insulation: "average", occupants: 2, coolingModePreference: "either", technologyPreference: "either", brandPreference: "either", installationPreference: "wall-mounted-split", connectedRooms: false, irregularGeometry: false, highEquipmentHeatLoad: false };
}

test("English advisor message includes the full calculation and confirmation request", () => {
  const sizingInput = input("en");
  const message = buildAdvisorWhatsAppMessage({ locale: "en", intent: "technical-confirmation", customerName: "Mona", input: sizingInput, result: calculateAcSizing(sizingInput, acSizingConfig) }, dependencies);
  assert.match(message, /Mona/);
  assert.match(message, /Hurghada/);
  assert.match(message, /6 × 5 metres/);
  assert.match(message, /Calculated area: 30 m²/);
  assert.match(message, /Calculated volume: 81 m³/);
  assert.match(message, /Base load: 18,000 BTU/);
  assert.match(message, /Adjusted load: 22,869 BTU/);
  assert.match(message, /Recommended capacity: 3 HP/);
  assert.match(message, /Mr\. Cool AC Advisor request/);
  assert.match(message, /technical confirmation/i);
});

test("Arabic advisor message includes localized calculation details", () => {
  const sizingInput = input("ar");
  const message = buildAdvisorWhatsAppMessage({ locale: "ar", intent: "site-inspection", customerName: "منى", input: sizingInput, result: calculateAcSizing(sizingInput, acSizingConfig) }, dependencies);
  assert.match(message, /منى/);
  assert.match(message, /الغردقة/);
  assert.match(message, /المساحة المحسوبة: ٣٠ م²/);
  assert.match(message, /الحجم المحسوب: ٨١ م³/);
  assert.match(message, /القدرة المقترحة: ٣ حصان/);
  assert.match(message, /طلب من مستر كول/);
  assert.match(message, /المعاينة/);
});

test("advisor reuses LeadProvider and centralized WhatsApp URL creation", async () => {
  const provider = await readFile(new URL("../services/leads/whatsapp-provider.ts", import.meta.url), "utf8");
  const component = await readFile(new URL("../components/advisor/CoolPetAdvisor.tsx", import.meta.url), "utf8");
  assert.match(provider, /submitAcAdvisorInquiry/);
  assert.match(provider, /createWhatsAppUrl\(buildAdvisorWhatsAppMessage\(data,/);
  assert.doesNotMatch(component, /wa\.me|createWhatsAppUrl/);
});

test("a selected commercial system forces inspection wording", async () => {
  const { productFamilies } = await import(new URL("../content/product-families.ts", import.meta.url));
  const { productVariants } = await import(new URL("../content/product-variants.ts", import.meta.url));
  const selectedFamily = productFamilies.find((family) => family.productType === "concealed-ducted");
  const selectedVariant = productVariants.find((variant) => variant.familyId === selectedFamily.id);
  const sizingInput = input("en");
  const message = buildAdvisorWhatsAppMessage({ locale: "en", intent: "technical-confirmation", customerName: "", input: sizingInput, result: calculateAcSizing(sizingInput, acSizingConfig), selectedFamily, selectedVariant }, dependencies);
  assert.match(message, /Inspection status: Required/);
  assert.match(message, new RegExp(selectedVariant.modelCode));
});
