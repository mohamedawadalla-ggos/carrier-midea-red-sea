import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { OrderStatusLookup } from "@/components/orders/OrderStatusLookup";
import { isLocale, locales } from "@/lib/i18n";
import { localizedAlternates } from "@/lib/seo";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; if (!isLocale(locale)) return {};
  const ar = locale === "ar";
  return {
    title: ar ? "حالة الطلب | كاريير ميديا البحر الأحمر" : "Order Status | Carrier–Midea Red Sea",
    description: ar ? "تحقق من حالة طلبك والدفع." : "Check your order and payment status.",
    alternates: localizedAlternates(locale, "/order-status"),
  };
}

export default async function OrderStatusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const ar = locale === "ar";

  return <div className="site catalog-site">
    <SiteHeader locale={locale} />
    <main id="main-content" className="catalog-main">
      <section className="catalog-hero">
        <p className="kicker light">{ar ? "طلبك" : "YOUR ORDER"}</p>
        <h1>{ar ? "حالة الطلب والدفع" : "Order and payment status"}</h1>
        <p>{ar ? "أدخل رقم الطلب ورقم الهاتف المستخدم عند الطلب للتحقق من الحالة الحالية." : "Enter your order number and the phone number used when ordering to check the current status."}</p>
      </section>
      <section className="section" aria-label={ar ? "التحقق من حالة الطلب" : "Order status lookup"}>
        <OrderStatusLookup locale={locale} />
      </section>
    </main>
    <SiteFooter locale={locale} />
  </div>;
}
