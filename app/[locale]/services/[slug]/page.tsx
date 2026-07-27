/* eslint-disable @next/next/no-img-element -- static export uses approved local assets with explicit dimensions. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { services, getService } from "@/content/services";
import { isLocale, locales } from "@/lib/i18n";
import { localizedAlternates } from "@/lib/seo";

export function generateStaticParams() { return locales.flatMap((locale) => services.map((service) => ({ locale, slug: service.slug }))); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = getService(slug);
  if (!service || !isLocale(locale)) return {};
  return {
    title: `${service.title[locale]} | Carrier–Midea Red Sea`,
    description: service.summary[locale],
    alternates: localizedAlternates(locale, `/services/${slug}`),
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const service = getService(slug);
  if (!service) notFound();
  const ar = locale === "ar";

  return <div className="site catalog-site">
    <SiteHeader locale={locale} />
    <main id="main-content" className="product-detail-main">
      <div className="section family-breadcrumb">
        <a href={`/${locale}#services`}>{ar ? "خدماتنا" : "Services"}</a>
        <span>/</span>
        <span>{service.title[locale]}</span>
      </div>
      <section className="section family-hero">
        <div className="product-detail-stage">
          {service.assetAuthorization === "approved" && service.imagePath
            ? <img className="product-image detail-image" src={service.imagePath} alt={service.title[locale]} width={1672} height={941} />
            : <div className="product-placeholder detail-placeholder"><div className="placeholder-unit"><i /></div><small>{ar ? "الصورة قيد الاعتماد" : "IMAGE APPROVAL PENDING"}</small></div>}
        </div>
        <div className="product-detail-copy">
          <p className="kicker">{ar ? `خدمة ${service.number}` : `SERVICE ${service.number}`}</p>
          <h1>{service.title[locale]}</h1>
          <p>{service.summary[locale]}</p>
          <div className="family-hero-actions">
            <a className="family-hero-secondary" href={`/${locale}#contact`}>{ar ? "اطلب هذه الخدمة" : "Request this service"}</a>
          </div>
        </div>
      </section>

      <section className="section family-highlights" aria-labelledby="service-steps-title">
        <p className="kicker">{ar ? "كيف نقدم الخدمة" : "HOW WE DELIVER IT"}</p>
        <h2 id="service-steps-title">{ar ? "خطوات العمل الفنية" : "Technical process"}</h2>
        <ul>
          {service.steps.map((step) => <li key={step.title.en}><strong>{step.title[locale]}</strong><p>{step.description[locale]}</p></li>)}
        </ul>
      </section>

      <section className="section family-highlights" aria-labelledby="service-examples-title">
        <p className="kicker">{ar ? "أمثلة توضيحية" : "ILLUSTRATIVE EXAMPLES"}</p>
        <h2 id="service-examples-title">{ar ? "حالات شائعة" : "Common scenarios"}</h2>
        <ul>
          {service.examples.map((example) => <li key={example.title.en}><strong>{example.title[locale]}</strong><p>{example.description[locale]}</p></li>)}
        </ul>
        <p className="catalog-disclaimer">{ar ? "الأمثلة أعلاه إرشادية عامة، والتقييم الدقيق يتطلب معاينة فعلية للموقع." : "The examples above are general guidance -- an accurate assessment requires an actual site visit."}</p>
      </section>

      <section className="product-inquiry-section">
        <div className="section inquiry-grid">
          <div>
            <p className="kicker light">{ar ? "ابدأ الآن" : "GET STARTED"}</p>
            <h2>{ar ? "اطلب هذه الخدمة عبر واتساب" : "Request this service on WhatsApp"}</h2>
            <p>{ar ? "أرسل تفاصيل موقعك واحتياجك وسنرد عليك لتحديد الخطوة التالية." : "Send us your location and what you need, and we'll follow up to arrange the next step."}</p>
          </div>
          <a className="btn whatsapp" href={`/${locale}#contact`}><span className="btn-label"><span className="whatsapp-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="#25D366" d="M16.5 14.2c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-.9-1-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.3-.4.1-.1.1-.2.2-.4 0-.1 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c.1.1 1.7 2.6 4.1 3.6.6.3 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1 .1-1.2-.1-.1-.2-.1-.4-.2Z"/></svg></span>{ar ? "اطلب خدمة" : "Request service"}</span><span>↗</span></a>
        </div>
      </section>
    </main>
    <SiteFooter locale={locale} />
  </div>;
}
