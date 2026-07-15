import type { Locale } from "@/content/site";
import { productFamilies } from "@/content/product-families";

const HERO_FAMILY_IDS = [
  "carrier-optimax-pro",
  "midea-xtreme-pro",
  "carrier-classicool-inverter",
] as const;

export function HeroProductShowcase({ locale }: { locale: Locale }) {
  const families = HERO_FAMILY_IDS.map((id) => productFamilies.find((family) => family.id === id))
    .filter((family) => family?.assetAuthorization === "approved" && family.familyImagePath);

  return (
    <div
      className="hero-product-showcase"
      role="group"
      aria-label={locale === "ar" ? "نماذج من أجهزة التكييف المتاحة" : "A selection of available air conditioners"}
    >
      {families.map((family, index) => family && (
        <figure className={`hero-product-tile hero-product-tile-${index + 1}`} key={family.id}>
          <span className={`hero-product-brand ${family.brand}`}>{family.brand}</span>
          {/* Product catalog assets are intentionally rendered without optimization for static export. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={family.familyImagePath!} alt={family.name[locale]} width="520" height="300" />
          <figcaption>{family.name[locale]}</figcaption>
        </figure>
      ))}
    </div>
  );
}
