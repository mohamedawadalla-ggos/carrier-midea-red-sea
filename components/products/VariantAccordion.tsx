import type { Locale } from "@/content/site";
import type { ProductVariant } from "@/types/catalog";
import { RequestCurrentPriceButton } from "@/components/products/RequestCurrentPriceButton";

export function VariantAccordion({ variants, locale }: { variants: ProductVariant[]; locale: Locale }) { return <div className="variant-accordions">{variants.map((variant) => <details key={variant.id}><summary><code>{variant.modelCode}</code><span>{variant.coolingMode === "cool-only" ? (locale === "ar" ? "بارد فقط" : "Cool only") : (locale === "ar" ? "بارد / ساخن" : "Cool & heat")}</span></summary><p>{locale === "ar" ? "تواصل معنا لتأكيد القدرة الأنسب لمساحتك." : "Contact us to confirm the right capacity for your space."}</p><RequestCurrentPriceButton locale={locale} /></details>)}</div>; }
