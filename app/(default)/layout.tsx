import type { Metadata } from "next";
import "../globals.css";
import { siteMetadata } from "@/lib/site-metadata";
import { CoolPetAdvisor } from "@/components/advisor/CoolPetAdvisor";
import { SiteStructuredData } from "@/components/seo/SiteStructuredData";
import { RequestCartProvider } from "@/components/cart/RequestCartProvider";
import { PublicPricingProvider } from "@/components/pricing/PublicPricingProvider";
import { PublicStockProvider } from "@/components/pricing/PublicStockProvider";
import { PublicCatalogVisibilityProvider } from "@/components/catalog/PublicCatalogVisibilityProvider";

export const metadata: Metadata = siteMetadata;
export default function DefaultRootLayout({ children }: { children: React.ReactNode }) { return <html lang="ar" dir="rtl"><body><SiteStructuredData /><PublicCatalogVisibilityProvider><PublicPricingProvider><PublicStockProvider><RequestCartProvider locale="ar">{children}<CoolPetAdvisor locale="ar" /></RequestCartProvider></PublicStockProvider></PublicPricingProvider></PublicCatalogVisibilityProvider></body></html>; }
