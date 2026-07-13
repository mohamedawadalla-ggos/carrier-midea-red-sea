import type { Locale } from "@/content/site";
export function RequestCurrentPriceButton({ locale, href = "#inquiry" }: { locale: Locale; href?: string }) { return <a className="product-price request-current-price" href={href}>{locale === "ar" ? "اطلب السعر الحالي" : "Request Current Price"}</a>; }
