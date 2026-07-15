/* eslint-disable @next/next/no-img-element -- static export uses the approved local logo derivative. */
"use client";

import { useState } from "react";
import { company, type Locale } from "@/content/site";
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
        <img className="brand-image" src="/brand/logo-manufacturers.png" alt="Carrier and Midea" width={720} height={164} />
        <span>{company.name[locale]}<small>{company.status[locale]}</small></span>
      </a>
      <nav className={menuOpen ? "nav open" : "nav"} aria-label={locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
        {nav[locale].map(([label, path]) => <a key={label} aria-current={path === currentPath ? "page" : undefined} href={localize(path)} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <FacebookLink className="nav-facebook" href={siteConfig.facebookPageUrl} event="facebook_header_click"><span className="facebook-icon" aria-hidden="true">f</span>{locale === "ar" ? "تابعنا على فيسبوك" : "Follow us on Facebook"}</FacebookLink>
      </nav>
      <div className="header-actions">
        <FacebookLink className="header-facebook" href={siteConfig.facebookPageUrl} event="facebook_header_click"><span className="facebook-icon" aria-hidden="true">f</span><span>{locale === "ar" ? "تابعنا على فيسبوك" : "Follow us on Facebook"}</span></FacebookLink>
        <button className="cart-indicator" type="button" onClick={toggleCart} aria-label={locale === "ar" ? `فتح طلب الأجهزة، ${itemCount} عناصر` : `Open AC request, ${itemCount} items`}><span aria-hidden="true">▣</span><b>{itemCount}</b><small>{locale === "ar" ? "الطلب" : "Request"}</small></button>
        <a className="lang" href={`/${otherLocale}${currentPath}`}>{locale === "ar" ? "EN" : "عربي"}</a>
        <a className="header-cta" href={`/${locale}#contact`}>{locale === "ar" ? "اطلب خدمة" : "Request service"}</a>
        <button className="menu" type="button" aria-label={locale === "ar" ? "فتح القائمة" : "Toggle navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      </div>
    </header></>
  );
}
