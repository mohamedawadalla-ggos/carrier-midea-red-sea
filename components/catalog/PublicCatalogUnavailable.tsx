import type { Locale } from "@/content/site";
import { siteConfig } from "@/lib/site-config";

export function PublicCatalogUnavailable({ locale, loading = false, compact = false }: { locale: Locale; loading?: boolean; compact?: boolean }) {
  const ar = locale === "ar";
  const whatsappHref = siteConfig.whatsappNumber
    ? `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(ar ? "مرحبًا، أريد الاستفسار عن أجهزة التكييف المتاحة حاليًا." : "Hello, I would like to ask about the air conditioners currently available.")}`
    : "";
  return <div className={`catalog-live-state${compact ? " catalog-live-state-compact" : ""}`} role={loading ? "status" : "alert"} aria-live="polite">
    <h2>{loading ? (ar ? "جارٍ تحديث الكتالوج…" : "Updating the catalog…") : (ar ? "الكتالوج غير متاح مؤقتًا" : "Catalog temporarily unavailable")}</h2>
    <p>{loading ? (ar ? "نتحقق من المنتجات المتاحة حاليًا." : "We are checking the products currently available.") : (ar ? "تواصل معنا لمعرفة الموديلات المتاحة وسنساعدك فورًا." : "Contact us for the currently available models and we will help you right away.")}</p>
    {!loading && whatsappHref && <a className="btn primary" href={whatsappHref} target="_blank" rel="noreferrer">{ar ? "تواصل عبر واتساب" : "Contact us on WhatsApp"}</a>}
    {!loading && !whatsappHref && siteConfig.phoneTel && <a className="btn primary" href={`tel:${siteConfig.phoneTel}`}>{siteConfig.phoneDisplay || siteConfig.phoneTel}</a>}
  </div>;
}
