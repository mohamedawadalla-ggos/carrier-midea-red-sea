import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carrier–Midea Red Sea Control Panel",
  description: "Protected commercial control panel for prices, discounts, settings and service locations.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
