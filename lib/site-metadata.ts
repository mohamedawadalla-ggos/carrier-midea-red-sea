import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { company } from "@/content/site";

export const siteMetadata: Metadata = {
  metadataBase: siteConfig.siteUrl ? new URL(siteConfig.siteUrl) : undefined,
  title: `${company.name.en} | Sales, Installation & Service`,
  description: "Integrated Carrier and Midea air-conditioning sales, installation, maintenance and after-sales service across Ain Sokhna and the Red Sea.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "64x56" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.png",
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: { title: "Carrier–Midea Red Sea", description: "Exceptional comfort. Every season.", images: siteConfig.siteUrl ? [{ url: "/share-icon.png", width: 512, height: 512, alt: "Carrier–Midea Red Sea" }] : undefined },
  twitter: { card: "summary", title: "Carrier–Midea Red Sea", description: "Exceptional comfort. Every season.", images: siteConfig.siteUrl ? ["/share-icon.png"] : undefined },
};
