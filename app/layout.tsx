import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carrier–Midea Red Sea | Sales, Installation & Service",
  description:
    "Integrated Carrier and Midea air-conditioning sales, installation, maintenance and after-sales service across Ain Sokhna and the Red Sea.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Carrier–Midea Red Sea",
    description: "Exceptional comfort. Every season.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carrier–Midea Red Sea",
    description: "Exceptional comfort. Every season.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar">
      <body>{children}</body>
    </html>
  );
}
