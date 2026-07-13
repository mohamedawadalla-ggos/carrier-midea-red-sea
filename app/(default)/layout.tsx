import type { Metadata } from "next";
import "../globals.css";
import { siteMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = siteMetadata;
export default function DefaultRootLayout({ children }: { children: React.ReactNode }) { return <html lang="ar" dir="rtl"><body>{children}</body></html>; }
