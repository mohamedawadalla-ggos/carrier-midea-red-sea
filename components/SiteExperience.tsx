"use client";

import { FormEvent, useEffect } from "react";
import Link from "next/link";
import { content, type Locale } from "@/content/site";
import { services } from "@/content/services";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FeaturedProductFamilies } from "@/components/home/FeaturedProductFamilies";
import { FacebookFollowSection } from "@/components/home/FacebookFollowSection";
import { ServiceAreaMap } from "@/components/home/ServiceAreaMap";
import { AdvisorCheckpoint } from "@/components/home/AdvisorCheckpoint";
import { HeroProductShowcase } from "@/components/home/HeroProductShowcase";
import { SummerPromoBanner } from "@/components/home/SummerPromoBanner";
import { BestSellingProducts } from "@/components/home/BestSellingProducts";
import { OfferBanner } from "@/components/offers/OfferBanner";
import { leadProvider } from "@/services/leads/whatsapp-provider";
import { siteConfig } from "@/lib/site-config";
import { openPreparedLink } from "@/lib/whatsapp";

const HERO_IMAGE = "/hero/carrier-midea-red-sea-hero.webp";
const SERVICES_RETURN_KEY = "carrier-midea-return-to-services";

export function SiteExperience({ initialLocale }: { initialLocale: Locale }) {
  const locale = initialLocale;
  const t = content[locale];

  useEffect(() => {
    const flagged = window.sessionStorage.getItem(SERVICES_RETURN_KEY) === "1";
    window.sessionStorage.removeItem(SERVICES_RETURN_KEY);
    const hashedToServices = window.location.hash === "#services";
    if (!flagged && !hashedToServices) return;
    if (window.location.hash && !hashedToServices) return;

    // Take manual control so the framework's own scroll-to-top-on-navigate
    // (or the browser's native restore) can't race this and win.
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const scrollToServices = () => document.getElementById("services")?.scrollIntoView();
    scrollToServices();
    const retry = window.setTimeout(scrollToServices, 120);
    return () => { window.clearTimeout(retry); window.history.scrollRestoration = previousRestoration; };
  }, []);

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await openPreparedLink(leadProvider.submitServiceRequest({ locale, customerName: String(data.get("name") ?? ""), telephone: String(data.get("phone") ?? ""), area: String(data.get("area") ?? ""), service: String(data.get("need") ?? ""), notes: String(data.get("details") ?? "") }));
  }

  return (
    <div className="site home-site" dir={t.dir}>
      <SiteHeader locale={locale} />

      <main id="main-content">
        <section className="hero">
          <div className="hero-image" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
          <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
          <HeroProductShowcase locale={locale} />
          <div className="hero-content">
            <OfferBanner locale={locale} />
            <p className="eyebrow"><span />{t.eyebrow}</p>
            <h1>{t.titleA}<br /><em>{t.titleB}</em></h1>
            <p className="hero-copy">{t.intro}</p>
            <div className="hero-actions">
              <Link className="btn primary" href={`/${locale}/products`} prefetch={false}>{t.buy}<span>↗</span></Link>
              <a className="btn whatsapp" href="#contact"><span className="btn-label"><span className="whatsapp-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="#25D366" d="M16.5 14.2c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-.9-1-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.3-.4.1-.1.1-.2.2-.4 0-.1 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c.1.1 1.7 2.6 4.1 3.6.6.3 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1 .1-1.2-.1-.1-.2-.1-.4-.2Z"/></svg></span>{t.service}</span><span>↗</span></a>
            </div>
          </div>
          <div className="hero-note"><span>24/7</span><p>{locale === "ar" ? "دعم سريع للحالات العاجلة" : "Fast support for urgent cases"}</p></div>
          <a className="scroll-cue" href="#best-selling-products" aria-label={locale === "ar" ? "انتقل إلى المنتجات الأكثر مبيعًا" : "Scroll to best-selling air conditioners"}><span>↓</span>{locale === "ar" ? "اكتشف" : "DISCOVER"}</a>
        </section>

        <SummerPromoBanner locale={locale} />

        <section className="trust-strip" aria-label="Our promises">
          {t.trust.map((item, i) => <div key={item}><span>{["◷", "◇", "✓", "◎"][i]}</span>{item}</div>)}
        </section>

        <BestSellingProducts locale={locale} />

        <FeaturedProductFamilies locale={locale} />

        <AdvisorCheckpoint locale={locale} />

        <section className="services-section" id="services">
          <div className="section services-inner">
            <div className="services-intro"><p className="kicker light">{t.servicesKicker}</p><h2>{t.servicesTitle}</h2><p>{t.servicesSub}</p><a className="text-link" href="#contact">{t.service} <span>↗</span></a></div>
            <div className="service-list">{services.map((item) => <Link key={item.id} href={`/${locale}/services/${item.slug}`} prefetch={false} onClick={() => window.sessionStorage.setItem(SERVICES_RETURN_KEY, "1")}><span>{item.number}</span><div><h3>{item.title[locale]}</h3><p>{item.summary[locale]}</p></div><b>↗</b></Link>)}</div>
          </div>
        </section>

        <section className="section territory" id="coverage">
          <div className="territory-copy"><p className="kicker">{locale === "ar" ? "نطاق خدماتنا" : "OUR SERVICE COVERAGE"}</p><h2>{locale === "ar" ? "نغطي خليج السويس وساحل البحر الأحمر" : "Coverage across the Gulf of Suez and Red Sea"}</h2><p>{locale === "ar" ? "تغطي خدمات البيع والتركيب والصيانة مواقع مختارة على امتداد خليج السويس وساحل البحر الأحمر، بمواعيد منظمة واستجابة واضحة." : "Our sales, installation and maintenance services cover selected locations along the Gulf of Suez and Red Sea coast, with organized scheduling and clear response times."}</p><div className="cities">{t.cities.map(city => <span key={city}>● {city}</span>)}</div></div>
          <ServiceAreaMap locale={locale} />
        </section>

        <FacebookFollowSection locale={locale} />

        <section className="quote-section" id="contact">
          <div className="quote-copy"><p className="kicker light">{t.quoteKicker}</p><h2>{t.quoteTitle}</h2><p>{t.quoteText}</p><div className="contact-chips">{siteConfig.phoneTel && <a href={`tel:${siteConfig.phoneTel}`} dir="ltr">☎ {siteConfig.phoneDisplay || t.call}</a>}{siteConfig.email && <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>}</div></div>
          <form className="lead-form" onSubmit={submitLead}>
            <label>{t.name}<input name="name" required placeholder={t.placeholderName} /></label>
            <label>{t.phone}<input name="phone" required inputMode="tel" placeholder={t.placeholderPhone} /></label>
            <label>{t.area}<input name="area" required placeholder={t.placeholderArea} /></label>
            <label>{t.need}<select name="need">{t.needOptions.map(x => <option key={x}>{x}</option>)}</select></label>
            <label className="full">{t.details}<textarea name="details" rows={3} placeholder={t.details} /></label>
            <button className="full" type="submit" disabled={!siteConfig.whatsappNumber}>{t.send}<span>↗</span></button>
            {!siteConfig.whatsappNumber && <p className="form-unavailable full" role="status">{locale === "ar" ? "خدمة واتساب غير متاحة حالياً." : "WhatsApp is currently unavailable."}{siteConfig.phoneTel && <> <a href={`tel:${siteConfig.phoneTel}`} dir="ltr">{siteConfig.phoneDisplay || siteConfig.phoneTel}</a></>}{siteConfig.email && <> <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></>}</p>}
          </form>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
