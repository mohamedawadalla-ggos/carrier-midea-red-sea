"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { content, type Locale } from "@/content/site";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=85";

export function SiteExperience({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = content[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = t.dir;
  }, [locale, t.dir]);

  function changeLocale(next: Locale) {
    setLocale(next);
    window.history.replaceState({}, "", `/${next}`);
  }

  function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = locale === "ar"
      ? `طلب جديد من الموقع\n\nالعميل: ${data.get("name")}\nالهاتف: ${data.get("phone")}\nالمنطقة: ${data.get("area")}\nالطلب: ${data.get("need")}\nالتفاصيل: ${data.get("details")}`
      : `New website request\n\nCustomer: ${data.get("name")}\nPhone: ${data.get("phone")}\nArea: ${data.get("area")}\nRequest: ${data.get("need")}\nDetails: ${data.get("details")}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="site" dir={t.dir}>
      <header className="header">
        <a className="brand" href="#top" aria-label="Carrier Midea Red Sea home">
          <Image className="brand-image" src="/og.png" alt="Carrier–Midea Red Sea" width={120} height={63} priority />
          <span>{locale === "ar" ? "كاريير ميديا البحر الأحمر" : "CARRIER–MIDEA RED SEA"}<small>{locale === "ar" ? "مبيعات وتركيب وصيانة" : "SALES • INSTALLATION • SERVICE"}</small></span>
        </a>
        <nav className={menuOpen ? "nav open" : "nav"} aria-label="Primary navigation">
          {t.nav.map((item, index) => <a key={item} href={index === 0 ? "#top" : index === 1 ? "#solutions" : index === 2 ? "#services" : index === 3 ? "#coverage" : "#contact"} onClick={() => setMenuOpen(false)}>{item}</a>)}
        </nav>
        <div className="header-actions">
          <button className="lang" onClick={() => changeLocale(locale === "ar" ? "en" : "ar")}>{locale === "ar" ? "EN" : "عربي"}</button>
          <a className="header-cta" href="#contact">{t.service}</a>
          <button className="menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-image" style={{ backgroundImage: `linear-gradient(90deg, rgba(3,23,45,.98) 0%, rgba(3,23,45,.82) 48%, rgba(3,23,45,.12) 100%), url(${HERO_IMAGE})` }} />
          <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
          <div className="hero-content">
            <p className="eyebrow"><span />{t.eyebrow}</p>
            <h1>{t.titleA}<br /><em>{t.titleB}</em></h1>
            <p className="hero-copy">{t.intro}</p>
            <div className="hero-actions">
              <a className="btn primary" href="#solutions">{t.buy}<span>↗</span></a>
              <a className="btn glass" href="#contact">{t.service}<span>↗</span></a>
            </div>
          </div>
          <div className="hero-note"><span>24/7</span><p>{locale === "ar" ? "دعم سريع للحالات العاجلة" : "Fast support for urgent cases"}</p></div>
          <a className="scroll-cue" href="#solutions" aria-label="Scroll to solutions"><span>↓</span>{locale === "ar" ? "اكتشف" : "DISCOVER"}</a>
        </section>

        <section className="trust-strip" aria-label="Our promises">
          {t.trust.map((item, i) => <div key={item}><span>{["◷", "◇", "✓", "◎"][i]}</span>{item}</div>)}
        </section>

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

        <section className="services-section" id="services">
          <div className="section services-inner">
            <div className="services-intro"><p className="kicker light">{t.servicesKicker}</p><h2>{t.servicesTitle}</h2><p>{t.servicesSub}</p><a className="text-link" href="#contact">{t.service} <span>↗</span></a></div>
            <div className="service-list">{t.services.map(([n, title, desc]) => <article key={n}><span>{n}</span><div><h3>{title}</h3><p>{desc}</p></div><b>↗</b></article>)}</div>
          </div>
        </section>

        <section className="section territory" id="coverage">
          <div className="territory-copy"><p className="kicker">{t.territoryKicker}</p><h2>{t.territoryTitle}</h2><p>{t.territoryText}</p><div className="cities">{t.cities.map(city => <span key={city}>● {city}</span>)}</div></div>
          <div className="map-art" aria-label="Stylized Red Sea service map"><div className="sea-shape"><span>RED SEA</span></div>{t.cities.map((city, i) => <i key={city} style={{ top: `${9 + i * 12}%`, left: `${39 + (i % 2) * 20}%` }}><b />{city}</i>)}</div>
        </section>

        <section className="quote-section" id="contact">
          <div className="quote-copy"><p className="kicker light">{t.quoteKicker}</p><h2>{t.quoteTitle}</h2><p>{t.quoteText}</p><div className="contact-chips"><a href="tel:+20">☎ {t.call}</a><a href="https://www.facebook.com/share/14hpez3ACkd/" target="_blank" rel="noreferrer">f Facebook</a></div></div>
          <form className="lead-form" onSubmit={submitLead}>
            <label>{t.name}<input name="name" required placeholder={t.placeholderName} /></label>
            <label>{t.phone}<input name="phone" required inputMode="tel" placeholder={t.placeholderPhone} /></label>
            <label>{t.area}<input name="area" required placeholder={t.placeholderArea} /></label>
            <label>{t.need}<select name="need">{t.needOptions.map(x => <option key={x}>{x}</option>)}</select></label>
            <label className="full">{t.details}<textarea name="details" rows={3} placeholder={t.details} /></label>
            <button className="full" type="submit">{t.send}<span>↗</span></button>
          </form>
        </section>
      </main>

      <footer>
        <div className="footer-brand"><Image className="footer-logo" src="/og.png" alt="Carrier–Midea Red Sea" width={120} height={63} /><div><strong>{locale === "ar" ? "كاريير ميديا البحر الأحمر" : "CARRIER–MIDEA RED SEA"}</strong><span>{t.footerText}</span></div></div>
        <div className="footer-cities">{t.cities.slice(0, 5).map(x => <span key={x}>{x}</span>)}</div>
        <p>© 2026 {t.rights}</p>
      </footer>
      <a className="floating-wa" href="#contact" aria-label="WhatsApp"><span>◉</span></a>
    </div>
  );
}
