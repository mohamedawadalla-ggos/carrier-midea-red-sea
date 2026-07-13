import type { Locale } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { FacebookLink } from "@/components/social/FacebookLink";

export function FacebookFollowSection({ locale }: { locale: Locale }) {
  if (!siteConfig.facebookPageUrl) return null;
  const ar = locale === "ar";
  return <section className="facebook-section">
    <div className="facebook-preview" aria-label={ar ? "مساحات صور الأعمال الحقيقية" : "Real project photo preview slots"}>
      <div className="facebook-photo-slot large"><span>01</span><p>{ar ? "صورة تركيب حقيقية" : "Real installation photo"}</p></div>
      <div className="facebook-photo-slot"><span>02</span><p>{ar ? "أحدث العروض" : "Latest offers"}</p></div>
      <div className="facebook-photo-slot"><span>03</span><p>{ar ? "نصائح الصيانة" : "Maintenance tips"}</p></div>
    </div>
    <div className="facebook-copy">
      <p className="kicker light">FACEBOOK</p>
      <h2>{ar ? "تابع أحدث العروض وأعمالنا على فيسبوك" : "Follow our latest offers and projects on Facebook"}</h2>
      <p>{ar ? "شاهد أعمال التركيب الفعلية، العروض الجديدة، ونصائح تحافظ على كفاءة تكييفك." : "See real installation work, new offers, and practical tips that help protect your AC performance."}</p>
      <FacebookLink className="facebook-follow-button" href={siteConfig.facebookPageUrl} event="facebook_home_section_click">f&nbsp; {ar ? "تابعنا على فيسبوك" : "Follow on Facebook"}<span>↗</span></FacebookLink>
      <small>{ar ? "يفتح صفحة فيسبوك الرسمية. لا يمكن للموقع التحقق من إتمام المتابعة." : "Opens the official Facebook page. Follow completion cannot be verified by this site."}</small>
    </div>
  </section>;
}
