import type { Locale } from "@/content/site";
import type { ProductVariant } from "@/types/catalog";
import { RequestCurrentPriceButton } from "@/components/products/RequestCurrentPriceButton";
import { formatHorsepower } from "@/lib/catalog-filtering";
import { AddToRequestButton } from "@/components/cart/AddToRequestButton";

export function VariantAccordion({ variants, locale }: { variants: ProductVariant[]; locale: Locale }) { return <div className="variant-accordions">{variants.map((variant) => <details key={variant.id}><summary><strong>{formatHorsepower(locale, variant.capacityHp)}</strong><span>{variant.coolingMode === "cool-only" ? (locale === "ar" ? "بارد فقط" : "Cool only") : (locale === "ar" ? "بارد / ساخن" : "Cool & heat")}</span></summary><p><strong>{locale === "ar" ? "كود الموديل:" : "Model code:"}</strong> <code>{variant.modelCode}</code></p><div className="model-request-actions"><AddToRequestButton variantId={variant.id} locale={locale} className="add-request-button compact" /><RequestCurrentPriceButton locale={locale} /></div></details>)}</div>; }
