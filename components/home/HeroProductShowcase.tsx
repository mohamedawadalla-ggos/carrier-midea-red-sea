import type { Locale } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { FacebookLink } from "@/components/social/FacebookLink";

export function HeroProductShowcase({ locale }: { locale: Locale }) {
  const ar = locale === "ar";

  return (
    <div
      className="hero-product-showcase hero-facebook-banner-wrap"
      role="group"
      aria-label={ar ? "عروض وترويج" : "Promotions"}
    >
      {siteConfig.facebookPageUrl && (
        <FacebookLink className="hero-facebook-banner" href={siteConfig.facebookPageUrl} event="facebook_hero_banner_click">
          <span className="facebook-icon" aria-hidden="true">f</span>
          <span className="hero-facebook-banner-text">
            <strong>{ar ? "انضم إلى صفحتنا على فيسبوك" : "Join our Facebook page"}</strong>
            <span>{ar ? "للحصول على عروض خاصة ومتابعة آخر التحديثات" : "for special promos and to follow up"}</span>
          </span>
          <span className="hero-facebook-banner-arrow" aria-hidden="true">↗</span>
        </FacebookLink>
      )}
    </div>
  );
}
