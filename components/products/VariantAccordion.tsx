import type { Locale } from "@/content/site";
import type { ProductVariant } from "@/types/catalog";
import { RequestCurrentPriceButton } from "@/components/products/RequestCurrentPriceButton";
import { formatHorsepower } from "@/lib/catalog-filtering";

export function VariantAccordion({ variants, locale }: { variants: ProductVariant[]; locale: Locale }) { return <div className="variant-accordions">{variants.map((variant) => <details key={variant.id}><summary><code>{variant.modelCode}</code><span>{variant.coolingMode === "cool-only" ? (locale === "ar" ? "بارد فقط" : "Cool only") : (locale === "ar" ? "بارد / ساخن" : "Cool & heat")}</span></summary><p><strong>{locale === "ar" ? "القدرة:" : "Horsepower:"}</strong> {formatHorsepower(locale, variant.capacityHp)}</p><RequestCurrentPriceButton locale={locale} /></details>)}</div>; }
