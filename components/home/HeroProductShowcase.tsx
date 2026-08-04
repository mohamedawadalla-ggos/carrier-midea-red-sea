import Link from "next/link";
import { company, type Locale } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { FacebookLink } from "@/components/social/FacebookLink";

export function HeroProductShowcase({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const mapUrl = siteConfig.googleMapsUrl || siteConfig.googleBusinessUrl;
  const address = company.address[locale].formatted;

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
      {mapUrl && (
        <a className="hero-facebook-banner" href={mapUrl} target="_blank" rel="noreferrer">
          <span className="facebook-icon hero-badge-icon-location" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          </span>
          <span className="hero-facebook-banner-text">
            <strong>{ar ? "فرع الغردقة" : "Hurghada branch"}</strong>
            <span>{address}</span>
          </span>
          <span className="hero-facebook-banner-arrow" aria-hidden="true">↗</span>
        </a>
      )}
      <Link className="hero-facebook-banner hero-promo-banner" href={`/${locale}/products`} prefetch={false}>
        <span className="facebook-icon hero-badge-icon-promo" aria-hidden="true">%</span>
        <span className="hero-facebook-banner-text">
          <strong>{ar ? "خصومات الصيف تصل 15%" : "Summer discounts up to 15%"}</strong>
          <span>{ar ? "تسوق موديلات مختارة بأسعار مخفضة" : "Shop selected models at reduced prices"}</span>
        </span>
        <span className="hero-facebook-banner-arrow" aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
