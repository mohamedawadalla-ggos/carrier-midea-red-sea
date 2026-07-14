/* eslint-disable @next/next/no-img-element -- static export uses the approved local brand artwork. */
import type { Locale } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { FacebookLink } from "@/components/social/FacebookLink";

export function FacebookFollowSection({ locale }: { locale: Locale }) {
  if (!siteConfig.facebookPageUrl) return null;
  const ar = locale === "ar";
  return <section className="facebook-section">
    <div className="facebook-brand-visual">
      <img src="/brand/logo-full-white.png" alt={ar ? "الشعار المعتمد لكاريير ميديا البحر الأحمر" : "Approved Carrier–Midea Red Sea logo"} width={900} height={755} />
      <div className="facebook-brand-caption"><span>Carrier–Midea Red Sea</span><strong>{ar ? "عروض ونصائح وتحديثات محلية" : "Local offers, advice and updates"}</strong></div>
    </div>
    <div className="facebook-copy">
      <p className="kicker light">FACEBOOK</p>
      <h2>{ar ? "تابع أحدث العروض وأعمالنا على فيسبوك" : "Follow our latest offers and projects on Facebook"}</h2>
      <p>{ar ? "شاهد أعمال التركيب الفعلية، العروض الجديدة، ونصائح تحافظ على كفاءة تكييفك." : "See real installation work, new offers, and practical tips that help protect your AC performance."}</p>
      <FacebookLink className="facebook-follow-button" href={siteConfig.facebookPageUrl} event="facebook_home_section_click"><span className="facebook-icon" aria-hidden="true">f</span>{ar ? "تابعنا على فيسبوك" : "Follow us on Facebook"}<span>↗</span></FacebookLink>
      <small>{ar ? "يفتح صفحة فيسبوك الرسمية. لا يمكن للموقع التحقق من إتمام المتابعة." : "Opens the official Facebook page. Follow completion cannot be verified by this site."}</small>
    </div>
  </section>;
}
