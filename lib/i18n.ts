import type { Locale } from "@/content/site";

export const locales: Locale[] = ["ar", "en"];
export const isLocale = (value: string): value is Locale => locales.includes(value as Locale);
export const pick = (locale: Locale, ar: string, en: string) => locale === "ar" ? ar : en;
export const localeDirection = (locale: Locale) => locale === "ar" ? "rtl" as const : "ltr" as const;
