"use client";

import { FormEvent } from "react";
import Link from "next/link";
import { content, type Locale } from "@/content/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FeaturedProductFamilies } from "@/components/home/FeaturedProductFamilies";
import { FacebookFollowSection } from "@/components/home/FacebookFollowSection";
import { ServiceAreaMap } from "@/components/home/ServiceAreaMap";
import { AdvisorCheckpoint } from "@/components/home/AdvisorCheckpoint";
import { HeroProductShowcase } from "@/components/home/HeroProductShowcase";
import { OfferBanner } from "@/components/offers/OfferBanner";
import { leadProvider } from "@/services/leads/whatsapp-provider";
import { siteConfig } from "@/lib/site-config";
import { openPreparedLink } from "@/lib/whatsapp";

const HERO_IMAGE = "/hero/carrier-midea-red-sea-hero.webp";

export function SiteExperience({ initialLocale }: { initialLocale: Locale }) {
  const locale = initialLocale;
  const t = content[locale];

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
              <a className="btn glass" href="#contact">{t.service}<span>↗</span></a>
            </div>
          </div>
          <div className="hero-note"><span>24/7</span><p>{locale === "ar" ? "دعم سريع للحالات العاجلة" : "Fast support for urgent cases"}</p></div>
          <a className="scroll-cue" href="#solutions" aria-label="Scroll to solutions"><span>↓</span>{locale === "ar" ? "اكتشف" : "DISCOVER"}</a>
        </section>

        <section className="trust-strip" aria-label="Our promises">
          {t.trust.map((item, i) => <div key={item}><span>{["◷", "◇", "✓", "◎"][i]}</span>{item}</div>)}
        </section>

        <FeaturedProductFamilies locale={locale} />

        <section className="section solutions" id="solutions">
          <div className="section-heading"><p className="kicker">{locale === "ar" ? "حلولنا" : "OUR SOLUTIONS"}</p><h2>{t.pathTitle}</h2><p>{t.pathSub}</p></div>
          <div className="path-grid">
            <article className="path-card sales-card">
              <div className="path-number">01</div><div className="path-icon">❄</div><h3>{t.salesTitle}</h3><p>{t.salesText}</p>
              <ul>{t.salesItems.map(x => <li key={x}><span>✓</span>{x}</li>)}</ul><a href="#contact">{t.explore}<span>↗</span></a>
              <div className="product-visual"><div className="ac-unit"><span className="brand-line">CARRIER</span><i /></div><div className="cold-line l1" /><div className="cold-line l2" /><div className="cold-line l3" /></div>
            </article>
            <article className="path-card service-card">
              <div className="path-number">02</div><div className="path-icon">⌁</div><h3>{t.serviceTitle}</h3><p>{t.serviceText}</p>
              <ul>{t.serviceItems.map(x => <li key={x}><span>✓</span>{x}</li>)}</ul><a href="#contact">{t.explore}<span>↗</span></a>
              <div className="service-rings"><i /><i /><i /></div>
            </article>
          </div>
        </section>

        <AdvisorCheckpoint locale={locale} />

        <section className="services-section" id="services">
          <div className="section services-inner">
            <div className="services-intro"><p className="kicker light">{t.servicesKicker}</p><h2>{t.servicesTitle}</h2><p>{t.servicesSub}</p><a className="text-link" href="#contact">{t.service} <span>↗</span></a></div>
            <div className="service-list">{t.services.map(([n, title, desc]) => <article key={n}><span>{n}</span><div><h3>{title}</h3><p>{desc}</p></div><b>↗</b></article>)}</div>
          </div>
        </section>

        <section className="section territory" id="coverage">
          <div className="territory-copy"><p className="kicker">{locale === "ar" ? "نطاق خدماتنا" : "OUR SERVICE COVERAGE"}</p><h2>{locale === "ar" ? "نغطي خليج السويس وساحل البحر الأحمر" : "Coverage across the Gulf of Suez and Red Sea"}</h2><p>{locale === "ar" ? "تغطي خدمات البيع والتركيب والصيانة مواقع مختارة على امتداد خليج السويس وساحل البحر الأحمر، بمواعيد منظمة واستجابة واضحة." : "Our sales, installation and maintenance services cover selected locations along the Gulf of Suez and Red Sea coast, with organized scheduling and clear response times."}</p><div className="cities">{t.cities.map(city => <span key={city}>● {city}</span>)}</div></div>
          <ServiceAreaMap locale={locale} />
        </section>

        <FacebookFollowSection locale={locale} />

        <section className="quote-section" id="contact">
          <div className="quote-copy"><p className="kicker light">{t.quoteKicker}</p><h2>{t.quoteTitle}</h2><p>{t.quoteText}</p><div className="contact-chips">{siteConfig.phoneTel && <a href={`tel:${siteConfig.phoneTel}`}>☎ {siteConfig.phoneDisplay || t.call}</a>}{siteConfig.email && <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>}</div></div>
          <form className="lead-form" onSubmit={submitLead}>
            <label>{t.name}<input name="name" required placeholder={t.placeholderName} /></label>
            <label>{t.phone}<input name="phone" required inputMode="tel" placeholder={t.placeholderPhone} /></label>
            <label>{t.area}<input name="area" required placeholder={t.placeholderArea} /></label>
            <label>{t.need}<select name="need">{t.needOptions.map(x => <option key={x}>{x}</option>)}</select></label>
            <label className="full">{t.details}<textarea name="details" rows={3} placeholder={t.details} /></label>
            <button className="full" type="submit" disabled={!siteConfig.whatsappNumber}>{t.send}<span>↗</span></button>
            {!siteConfig.whatsappNumber && <p className="form-unavailable full" role="status">{locale === "ar" ? "خدمة واتساب غير متاحة حالياً." : "WhatsApp is currently unavailable."}{siteConfig.phoneTel && <> <a href={`tel:${siteConfig.phoneTel}`}>{siteConfig.phoneDisplay || siteConfig.phoneTel}</a></>}{siteConfig.email && <> <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></>}</p>}
          </form>
        </section>
      </main>

      <SiteFooter locale={locale} />
      {siteConfig.whatsappNumber && <a className="floating-wa" href="#contact" aria-label="WhatsApp"><span>◉</span></a>}
    </div>
  );
}
