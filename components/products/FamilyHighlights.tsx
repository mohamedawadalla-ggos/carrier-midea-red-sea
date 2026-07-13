import type { Locale } from "@/content/site";
import type { ProductFamily } from "@/types/catalog";

export function FamilyHighlights({ family, locale }: { family: ProductFamily; locale: Locale }) { return <section className="section family-highlights" aria-labelledby="family-highlights-title"><p className="kicker">{locale === "ar" ? "نظرة سريعة" : "AT A GLANCE"}</p><h2 id="family-highlights-title">{locale === "ar" ? "معلومات العائلة" : "Family information"}</h2><ul>{family.highlights.map((item) => <li key={item.en}>{item[locale]}</li>)}</ul></section>; }
