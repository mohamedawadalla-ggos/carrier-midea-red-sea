/* eslint-disable @next/next/no-img-element -- static export uses the approved local logo derivative. */
"use client";

import { useState } from "react";
import type { Locale } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { FacebookLink } from "@/components/social/FacebookLink";
import { useRequestCart } from "@/components/cart/RequestCartProvider";

const nav = {
  ar: [
    ["التكييفات", "/products"], ["الرئيسية", ""], ["خدماتنا", "#services"], ["نطاق خدماتنا", "#coverage"], ["عن الشركة", "#contact"],
  ],
  en: [
    ["Products", "/products"], ["Home", ""], ["Services", "#services"], ["Our Service Coverage", "#coverage"], ["About", "#contact"],
  ],
} as const;

export function SiteHeader({ locale, currentPath = "" }: { locale: Locale; currentPath?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, toggleCart } = useRequestCart();
  const otherLocale = locale === "ar" ? "en" : "ar";
  const localize = (path: string) => path.startsWith("#") ? `/${locale}${path}` : `/${locale}${path}`;

  return (
    <><a className="skip-link" href="#main-content">{locale === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}</a><header className="header">
      <a className="brand" href={`/${locale}`} aria-label="Carrier Midea Red Sea home">
        <span className="brand-lockups">
          <span className="dealer-logo-plate dealer-logo-plate-solo">
            <img className="dealer-logo-image" src="/brand/logo-client-header.png" alt={locale === "ar" ? "كاريير ميديا البحر الأحمر" : "Carrier–Midea Red Sea"} width={387} height={115} />
          </span>
        </span>
      </a>
      <nav className={menuOpen ? "nav open" : "nav"} aria-label={locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
        {nav[locale].map(([label, path]) => <a key={label} aria-current={path === currentPath ? "page" : undefined} href={localize(path)} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <FacebookLink className="nav-facebook" href={siteConfig.facebookPageUrl} event="facebook_header_click"><span className="facebook-icon" aria-hidden="true">f</span>{locale === "ar" ? "تابعنا على فيسبوك" : "Follow us on Facebook"}</FacebookLink>
      </nav>
      <div className="header-actions">
        <FacebookLink className="header-facebook" href={siteConfig.facebookPageUrl} event="facebook_header_click"><span className="facebook-icon" aria-hidden="true">f</span><span>{locale === "ar" ? "تابعنا على فيسبوك" : "Follow us on Facebook"}</span></FacebookLink>
        <button className="cart-indicator" type="button" onClick={toggleCart} aria-label={locale === "ar" ? `فتح طلب الأجهزة، ${itemCount} عناصر` : `Open AC request, ${itemCount} items`}>
          <span className="cart-indicator-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
            <b className="cart-indicator-badge">{itemCount}</b>
          </span>
          <small>{locale === "ar" ? "الطلب" : "Request"}</small>
        </button>
        <a className="lang" href={`/${otherLocale}${currentPath}`}>{locale === "ar" ? "EN" : "عربي"}</a>
        <a className="header-cta" href={`/${locale}#contact`}><span className="whatsapp-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="#25D366" d="M16.5 14.2c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-.9-1-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.3-.4.1-.1.1-.2.2-.4 0-.1 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c.1.1 1.7 2.6 4.1 3.6.6.3 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1 .1-1.2-.1-.1-.2-.1-.4-.2Z"/></svg></span>{locale === "ar" ? "اطلب خدمة" : "Request service"}</a>
        <button className="menu" type="button" aria-label={locale === "ar" ? "فتح القائمة" : "Toggle navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      </div>
    </header></>
  );
}
