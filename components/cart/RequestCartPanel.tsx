"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/content/site";
import { formatHorsepower } from "@/lib/catalog-filtering";
import { openPreparedLink } from "@/lib/whatsapp";
import { leadProvider } from "@/services/leads/whatsapp-provider";
import type { RequestCartContextValue } from "@/components/cart/RequestCartProvider";

export function RequestCartPanel({ locale, cart }: { locale: Locale; cart: RequestCartContextValue }) {
  const [unavailable, setUnavailable] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const ar = locale === "ar";
  const { isOpen, closeCart } = cart;

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); closeCart(); } };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("keydown", closeOnEscape); opener?.focus(); };
  }, [closeCart, isOpen]);

  if (!isOpen) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.resolvedItems.length) return;
    const data = new FormData(event.currentTarget);
    const opened = await openPreparedLink(leadProvider.submitRequestCart({
      locale,
      items: cart.resolvedItems,
      customerName: String(data.get("name") ?? "").trim(),
      telephone: String(data.get("telephone") ?? "").trim(),
      area: String(data.get("area") ?? "").trim(),
      installationRequired: data.get("installation") === "yes",
      notes: String(data.get("notes") ?? "").trim(),
    }));
    setUnavailable(!opened);
  }

  return <div className="request-cart-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) cart.closeCart(); }}>
    <section className="request-cart-panel" role="dialog" aria-modal="true" aria-labelledby="request-cart-title" dir={ar ? "rtl" : "ltr"}>
      <div className="request-cart-heading">
        <h2 id="request-cart-title">{ar ? "طلب أجهزة التكييف" : "AC request"}</h2>
        <button ref={closeButtonRef} type="button" onClick={cart.closeCart} aria-label={ar ? "إغلاق الطلب" : "Close request"}>×</button>
      </div>
      {cart.resolvedItems.length === 0 ? <p>{ar ? "لم تضف أجهزة إلى الطلب بعد." : "No units have been added yet."}</p> : <>
        <ul className="request-cart-items">
          {cart.resolvedItems.map(({ family, variant, quantity }) => <li key={variant.id}>
            <div><strong>{family.name[locale]}</strong><span>{formatHorsepower(locale, variant.capacityHp)}</span></div>
            <label>{ar ? "الكمية" : "Quantity"}<input type="number" min={1} max={99} inputMode="numeric" value={quantity} onChange={(event) => cart.updateQuantity(variant.id, Number(event.target.value))} /></label>
            <button type="button" onClick={() => cart.removeItem(variant.id)}>{ar ? "إزالة" : "Remove"}</button>
          </li>)}
        </ul>
        <button type="button" onClick={cart.clearCart}>{ar ? "مسح الطلب" : "Clear request"}</button>
        <form className="request-cart-form" onSubmit={submit}>
          <label>{ar ? "الاسم" : "Name"}<input name="name" autoComplete="name" required /></label>
          <label>{ar ? "رقم الهاتف" : "Telephone"}<input name="telephone" type="tel" autoComplete="tel" required /></label>
          <label>{ar ? "المنطقة" : "Area"}<input name="area" autoComplete="address-level2" required /></label>
          <label>{ar ? "هل تحتاج إلى التركيب؟" : "Installation required?"}<select name="installation" defaultValue="yes"><option value="yes">{ar ? "نعم" : "Yes"}</option><option value="no">{ar ? "لا" : "No"}</option></select></label>
          <label>{ar ? "ملاحظات" : "Notes"}<textarea name="notes" rows={3} /></label>
          <p className="request-cart-disclaimer">{ar ? "يتم تأكيد الأسعار والتوافر وتكلفة التركيب بعد مراجعة الطلب." : "Prices, availability, and installation costs are confirmed after reviewing the request."}</p>
          <button type="submit">{ar ? "إرسال الطلب عبر واتساب" : "Send request via WhatsApp"}</button>
          {unavailable && <p role="alert">{ar ? "واتساب غير متاح حاليًا. اتصل بنا لإرسال الطلب." : "WhatsApp is currently unavailable. Please call us to send the request."}</p>}
        </form>
      </>}
    </section>
  </div>;
}
