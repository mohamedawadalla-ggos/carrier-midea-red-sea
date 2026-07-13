import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { company } from "@/content/site";

export const siteMetadata: Metadata = {
  metadataBase: siteConfig.siteUrl ? new URL(siteConfig.siteUrl) : undefined,
  title: `${company.name.en} | Sales, Installation & Service`,
  description: "Integrated Carrier and Midea air-conditioning sales, installation, maintenance and after-sales service across Ain Sokhna and the Red Sea.",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "Carrier–Midea Red Sea", description: "Exceptional comfort. Every season.", images: siteConfig.siteUrl ? [{ url: "/og.png", width: 1200, height: 630 }] : undefined },
  twitter: { card: "summary_large_image", title: "Carrier–Midea Red Sea", description: "Exceptional comfort. Every season.", images: siteConfig.siteUrl ? ["/og.png"] : undefined },
};
