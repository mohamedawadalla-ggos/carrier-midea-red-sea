import { notFound } from "next/navigation";
import { SiteExperience } from "@/components/SiteExperience";
import { isLocale, locales } from "@/lib/i18n";
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <SiteExperience initialLocale={locale} />; }
