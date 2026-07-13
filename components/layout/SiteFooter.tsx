import type { Locale } from "@/content/site";
import { company, content } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { FacebookLink } from "@/components/social/FacebookLink";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = content[locale];
  return (
    <footer>
      <div className="footer-brand"><span className="footer-logo" role="img" aria-label="Carrier–Midea Red Sea" /><div><strong>{company.name[locale]}</strong><span>{company.status[locale]} · {t.footerText}</span></div></div>
      <div className="footer-cities">{t.cities.slice(0, 5).map((city) => <span key={city}>{city}</span>)}</div>
      <FacebookLink className="footer-facebook" href={siteConfig.facebookPageUrl} event="facebook_footer_click">f&nbsp; {locale === "ar" ? "تابعنا على فيسبوك" : "Follow on Facebook"}</FacebookLink>
      <p>© 2026 {t.rights}</p>
    </footer>
  );
}
