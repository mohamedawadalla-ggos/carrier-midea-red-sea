import type { Metadata } from "next";
import "../globals.css";
import { notFound } from "next/navigation";
import { isLocale, localeDirection, locales } from "@/lib/i18n";
import { siteMetadata } from "@/lib/site-metadata";
import { CoolPetAdvisor } from "@/components/advisor/CoolPetAdvisor";
import { SiteStructuredData } from "@/components/seo/SiteStructuredData";
import { RequestCartProvider } from "@/components/cart/RequestCartProvider";

export const metadata: Metadata = siteMetadata;
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export default async function LocaleRootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <html lang={locale} dir={localeDirection(locale)}><body><SiteStructuredData /><RequestCartProvider locale={locale}>{children}<CoolPetAdvisor locale={locale} /></RequestCartProvider></body></html>; }
