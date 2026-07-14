import Link from "next/link";
import type { Locale } from "@/content/site";
import type { ProductType } from "@/types/catalog";

export function ProductCategoryCard({ type, locale, familyCount }: { type: ProductType; locale: Locale; familyCount: number }) {
  return <article className="category-card"><span>{String(type.displayOrder).padStart(2, "0")}</span><h3><Link href={`/${locale}/products/${type.id}`} prefetch={false}>{type.name[locale]}</Link></h3><p>{type.description[locale]}</p><small>{locale === "ar" ? `${familyCount} عائلات منتجات` : `${familyCount} product families`}</small></article>;
}
