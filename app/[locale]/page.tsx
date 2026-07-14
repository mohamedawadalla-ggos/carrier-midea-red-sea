import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteExperience } from "@/components/SiteExperience";
import { content } from "@/content/site";
import { isLocale, locales } from "@/lib/i18n";
import { localizedAlternates } from "@/lib/seo";
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; if (!isLocale(locale)) return {}; return { title: locale === "ar" ? "كاريير ميديا البحر الأحمر | بيع وتركيب وصيانة التكييفات" : "Carrier–Midea Red Sea | Sales, Installation & Service", description: content[locale].intro, alternates: localizedAlternates(locale) }; }
export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <SiteExperience initialLocale={locale} />; }
