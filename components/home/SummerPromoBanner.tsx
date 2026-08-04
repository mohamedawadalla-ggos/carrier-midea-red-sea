/* eslint-disable @next/next/no-img-element -- static export uses an approved local marketing asset with explicit dimensions. */
import Link from "next/link";
import type { Locale } from "@/content/site";

const PROMO_IMAGE = "/hero/summer-2026-launch-promo.webp";

export function SummerPromoBanner({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  return <section className="summer-promo-banner" aria-label={ar ? "عروض صيف 2026" : "Summer 2026 offers"}>
    <Link href={`/${locale}/products`} prefetch={false}>
      <img
        src={PROMO_IMAGE}
        alt={ar ? "عروض صيف 2026 على تكييفات كاريير وميديا، خصومات من 8% إلى 15%" : "Summer 2026 offers on Carrier and Midea air conditioners, discounts from 8% to 15%"}
        width={1120}
        height={1335}
        loading="lazy"
      />
    </Link>
  </section>;
}
