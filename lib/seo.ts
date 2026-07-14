import type { Metadata } from "next";
import { productFamilies } from "@/content/product-families";
import { productTypes } from "@/content/catalog-types";
import { company, content, type Locale } from "@/content/site";
import { locales } from "@/lib/i18n";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

const trailingSlashPath = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" || normalized.endsWith("/") ? normalized : `${normalized}/`;
};

export const canonicalUrl = (path: string) => absoluteUrl(trailingSlashPath(path));
export const organizationId = absoluteUrl("/#organization");
export const websiteId = absoluteUrl("/#website");

export function localizedPath(locale: Locale, suffix = "") {
  return trailingSlashPath(`/${locale}${suffix}`);
}

export function localizedAlternates(locale: Locale, suffix = ""): NonNullable<Metadata["alternates"]> {
  return {
    canonical: canonicalUrl(localizedPath(locale, suffix)),
    languages: {
      ar: canonicalUrl(localizedPath("ar", suffix)),
      en: canonicalUrl(localizedPath("en", suffix)),
    },
  };
}

export const defaultArabicAlternates: NonNullable<Metadata["alternates"]> = {
  canonical: canonicalUrl(localizedPath("ar")),
  languages: {
    ar: canonicalUrl(localizedPath("ar")),
    en: canonicalUrl(localizedPath("en")),
  },
};

const canonicalSuffixes = [
  "",
  "/products",
  ...productTypes.map((type) => `/products/${type.id}`),
  ...productFamilies.map((family) => `/products/${family.productType}/${family.slug}`),
];

export const canonicalSitePaths = locales.flatMap((locale) => canonicalSuffixes.map((suffix) => localizedPath(locale, suffix)));

export function getSiteStructuredData() {
  const hasMap = siteConfig.googleMapsUrl || siteConfig.googleBusinessUrl || undefined;
  const sameAs = [siteConfig.facebookPageUrl].filter(Boolean);

  const hvacBusiness = {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    "@id": organizationId,
    name: company.name.en,
    alternateName: company.name.ar,
    url: canonicalUrl("/"),
    logo: absoluteUrl("/brand/logo-full.png"),
    description: content.en.intro,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address.ar.streetAddress,
      addressLocality: company.address.ar.addressLocality,
      addressRegion: company.address.ar.addressRegion,
      addressCountry: company.address.addressCountry,
    },
    areaServed: [
      { "@type": "City", name: "Ain Sokhna" },
      { "@type": "AdministrativeArea", name: "Red Sea Governorate" },
    ],
    ...(siteConfig.phoneTel ? { telephone: siteConfig.phoneTel } : {}),
    ...(siteConfig.email ? { email: siteConfig.email } : {}),
    ...(hasMap ? { hasMap } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    url: canonicalUrl("/"),
    name: company.name.en,
    alternateName: company.name.ar,
    description: content.en.intro,
    inLanguage: ["ar", "en"],
    publisher: { "@id": organizationId },
  };

  return [website, hvacBusiness] as const;
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
