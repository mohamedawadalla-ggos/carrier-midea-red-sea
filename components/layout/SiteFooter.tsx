/* eslint-disable @next/next/no-img-element -- static export uses the approved local logo derivative. */
import type { Locale } from "@/content/site";
import { company, content } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { FacebookLink } from "@/components/social/FacebookLink";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = content[locale];
  const mapUrl = siteConfig.googleMapsUrl || siteConfig.googleBusinessUrl;
  const address = company.address[locale].formatted;
  return (
    <footer>
      <div className="footer-brand"><img className="footer-logo" src="/brand/logo-signature-reversed.png" alt="Carrier–Midea Red Sea" width={900} height={520} /><div><strong>{company.name[locale]}</strong><span>{company.status[locale]} · {t.footerText}</span><address className="footer-address">{mapUrl ? <a href={mapUrl} target="_blank" rel="noreferrer">{address}</a> : address}</address></div></div>
      <div className="footer-cities">{t.cities.slice(0, 5).map((city) => <span key={city}>{city}</span>)}</div>
      <FacebookLink className="footer-facebook" href={siteConfig.facebookPageUrl} event="facebook_footer_click">f&nbsp; {locale === "ar" ? "تابعنا على فيسبوك" : "Follow on Facebook"}</FacebookLink>
      <p>© 2026 {t.rights}</p>
    </footer>
  );
}
