import type { Metadata } from "next";
import "../globals.css";
import { siteMetadata } from "@/lib/site-metadata";
import { CoolPetAdvisor } from "@/components/advisor/CoolPetAdvisor";

export const metadata: Metadata = siteMetadata;
export default function DefaultRootLayout({ children }: { children: React.ReactNode }) { return <html lang="ar" dir="rtl"><body>{children}<CoolPetAdvisor locale="ar" /></body></html>; }
