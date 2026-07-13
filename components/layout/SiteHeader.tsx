"use client";

import { useState } from "react";
import { company, type Locale } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { FacebookLink } from "@/components/social/FacebookLink";

const nav = {
  ar: [
    ["الرئيسية", ""], ["التكييفات", "/products"], ["خدماتنا", "#services"], ["مشروعاتنا", "#coverage"], ["عن الشركة", "#contact"],
  ],
  en: [
    ["Home", ""], ["Products", "/products"], ["Services", "#services"], ["Projects", "#coverage"], ["About", "#contact"],
  ],
} as const;

export function SiteHeader({ locale, currentPath = "" }: { locale: Locale; currentPath?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const otherLocale = locale === "ar" ? "en" : "ar";
  const localize = (path: string) => path.startsWith("#") ? `/${locale}${path}` : `/${locale}${path}`;

  return (
    <><a className="skip-link" href="#main-content">{locale === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}</a><header className="header">
      <a className="brand" href={`/${locale}`} aria-label="Carrier Midea Red Sea home">
        <span className="brand-image" role="img" aria-label="Carrier–Midea Red Sea" />
        <span>{company.name[locale]}<small>{locale === "ar" ? "مبيعات وتركيب وصيانة" : "SALES • INSTALLATION • SERVICE"}</small></span>
      </a>
      <nav className={menuOpen ? "nav open" : "nav"} aria-label={locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
        {nav[locale].map(([label, path]) => <a key={label} aria-current={path === currentPath ? "page" : undefined} href={localize(path)} onClick={() => setMenuOpen(false)}>{label}</a>)}
      </nav>
      <div className="header-actions">
        <FacebookLink className="header-facebook" href={siteConfig.facebookPageUrl} event="facebook_header_click"><span aria-hidden="true">f</span><span className="sr-only">Facebook</span></FacebookLink>
        <a className="lang" href={`/${otherLocale}${currentPath}`}>{locale === "ar" ? "EN" : "عربي"}</a>
        <a className="header-cta" href={`/${locale}#contact`}>{locale === "ar" ? "اطلب خدمة" : "Request service"}</a>
        <button className="menu" type="button" aria-label={locale === "ar" ? "فتح القائمة" : "Toggle navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      </div>
    </header></>
  );
}
