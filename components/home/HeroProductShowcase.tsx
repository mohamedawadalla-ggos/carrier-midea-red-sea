import type { Locale } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { FacebookLink } from "@/components/social/FacebookLink";

export function HeroProductShowcase({ locale }: { locale: Locale }) {
  if (!siteConfig.facebookPageUrl) return null;
  const ar = locale === "ar";

  return (
    <div
      className="hero-product-showcase hero-facebook-banner-wrap"
      role="group"
      aria-label={ar ? "تابعنا على فيسبوك" : "Follow us on Facebook"}
    >
      <a className="hero-campaign-badge" href={`/${locale}/products`}>
        <strong>{ar ? "صيف 2026" : "SUMMER 2026"}</strong>
        <span>{ar ? "خصم 10% على كل الموديلات حتى 1 سبتمبر" : "10% OFF every model, ends Sep 1"}</span>
      </a>
      <FacebookLink className="hero-facebook-banner" href={siteConfig.facebookPageUrl} event="facebook_hero_banner_click">
        <span className="facebook-icon" aria-hidden="true">f</span>
        <span className="hero-facebook-banner-text">
          <strong>{ar ? "انضم إلى صفحتنا على فيسبوك" : "Join our Facebook page"}</strong>
          <span>{ar ? "للحصول على عروض خاصة ومتابعة آخر التحديثات" : "for special promos and to follow up"}</span>
        </span>
        <span className="hero-facebook-banner-arrow" aria-hidden="true">↗</span>
      </FacebookLink>
    </div>
  );
}
