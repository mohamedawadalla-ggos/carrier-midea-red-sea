import type { Locale } from "@/content/site";
import type { ProductVariant } from "@/types/catalog";
import { RequestCurrentPriceButton } from "@/components/products/RequestCurrentPriceButton";
import { formatHorsepower } from "@/lib/catalog-filtering";

const mode = (locale: Locale, value: ProductVariant["coolingMode"]) => value === "cool-only" ? (locale === "ar" ? "بارد فقط" : "Cool only") : (locale === "ar" ? "بارد / ساخن" : "Cool & heat");
export function VariantComparisonTable({ variants, locale }: { variants: ProductVariant[]; locale: Locale }) { const ar = locale === "ar"; return <div className="variant-table-wrap"><table className="variant-table"><thead><tr><th>{ar ? "كود الموديل" : "Model code"}</th><th>{ar ? "التشغيل" : "Mode"}</th><th>{ar ? "القدرة" : "Horsepower"}</th><th>{ar ? "السعر" : "Price"}</th></tr></thead><tbody>{variants.map((variant) => <tr key={variant.id} id={`model-${variant.modelCode}`}><td><code>{variant.modelCode}</code></td><td>{mode(locale, variant.coolingMode)}</td><td>{formatHorsepower(locale, variant.capacityHp)}</td><td><RequestCurrentPriceButton locale={locale} /></td></tr>)}</tbody></table></div>; }
