/* eslint-disable @next/next/no-img-element -- static export uses approved local marketing assets with explicit dimensions. */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/content/site";

const PROMO_IMAGES = [
  "/hero/summer-2026-launch-promo.webp",
  "/hero/summer-2026-promo-2.webp",
  "/hero/summer-2026-promo-3.webp",
  "/hero/summer-2026-promo-4.webp",
  "/hero/summer-2026-promo-5.webp",
] as const;

const SLIDE_DURATION_MS = 4500;

export function SummerPromoBanner({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % PROMO_IMAGES.length), SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, []);

  return <section className="summer-promo-banner" aria-label={ar ? "عروض صيف 2026" : "Summer 2026 offers"}>
    <Link href={`/${locale}/products`} prefetch={false} className="summer-promo-stage">
      {PROMO_IMAGES.map((src, slideIndex) => <img
        key={src}
        src={src}
        alt={ar ? "عروض صيف 2026 على تكييفات كاريير وميديا" : "Summer 2026 offers on Carrier and Midea air conditioners"}
        width={1122}
        height={1402}
        loading={slideIndex === 0 ? "eager" : "lazy"}
        className={slideIndex === index ? "active" : ""}
      />)}
    </Link>
  </section>;
}
