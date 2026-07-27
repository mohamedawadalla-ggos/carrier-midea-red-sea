"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/content/site";
import { formatHorsepower } from "@/lib/catalog-filtering";
import { openPreparedLink } from "@/lib/whatsapp";
import { leadProvider } from "@/services/leads/whatsapp-provider";
import { createOrder } from "@/lib/create-order";
import { createPaymentIntent } from "@/lib/create-payment-intent";
import type { RequestCartContextValue } from "@/components/cart/RequestCartProvider";
import { usePublicPricing } from "@/components/pricing/PublicPricingProvider";
import { formatPublicMoney, getPublicPrice } from "@/lib/public-pricing";

const ORDER_TERMS_VERSION = "checkout-draft-v1";
// Online payment is temporarily hidden until the checkout flow is fully
// verified in production -- flip back to true to re-enable "Place order
// online" without removing any of the underlying order/payment code.
const ONLINE_PAYMENT_ENABLED = false;

export function RequestCartPanel({ locale, cart }: { locale: Locale; cart: RequestCartContextValue }) {
  const [unavailable, setUnavailable] = useState(false);
  const [agreeToContact, setAgreeToContact] = useState(false);
  const [orderState, setOrderState] = useState<{ status: "idle" | "submitting" | "error" | "success"; message: string }>({ status: "idle", message: "" });
  const formRef = useRef<HTMLFormElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const ar = locale === "ar";
  const { isOpen, closeCart } = cart;
  const pricing = usePublicPricing();

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); closeCart(); } };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("keydown", closeOnEscape); opener?.focus(); };
  }, [closeCart, isOpen]);

  if (!isOpen) return null;

  const lineTotals = cart.resolvedItems.map(({ variant, quantity }) => {
    const price = getPublicPrice(pricing, variant.modelCode);
    return price ? price.salePriceMinor * quantity : null;
  });
  const cartTotalMinor = lineTotals.every((value): value is number => value !== null)
    ? lineTotals.reduce((sum, value) => sum + value, 0)
    : null;

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

  async function payOnline() {
    if (!formRef.current || !cart.resolvedItems.length) return;
    if (!agreeToContact) {
      setOrderState({ status: "error", message: ar ? "يرجى الموافقة على التواصل لإتمام الطلب أونلاين." : "Please agree to be contacted before placing an online order." });
      return;
    }
    const data = new FormData(formRef.current);
    setOrderState({ status: "submitting", message: "" });
    const result = await createOrder({
      items: cart.resolvedItems.map(({ variant, quantity }) => ({ modelCode: variant.modelCode, quantity })),
      customerName: String(data.get("name") ?? "").trim(),
      phone: String(data.get("telephone") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      locale,
      termsVersion: ORDER_TERMS_VERSION,
    });
    if (!result.ok) {
      setOrderState({ status: "error", message: result.error });
      return;
    }

    const intent = await createPaymentIntent(result.orderNumber);
    if (intent.ok) {
      cart.clearCart();
      window.location.href = intent.checkoutUrl;
      return;
    }

    // Online payment isn't available right now (not configured, provider
    // unreachable, etc.) -- the order itself was created successfully, so
    // fall back to the manual-arrangement message instead of losing the order.
    setOrderState({
      status: "success",
      message: ar
        ? `تم استلام طلبك برقم ${result.orderNumber}. الدفع الإلكتروني غير متاح حاليًا — سيتواصل معك فريقنا لتأكيد الطلب واستكمال الدفع.`
        : `Your order was received — order number ${result.orderNumber}. Online payment isn't available right now; our team will contact you to confirm the order and arrange payment.`,
    });
    cart.clearCart();
  }

  return <div className="request-cart-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) cart.closeCart(); }}>
    <section className="request-cart-panel" role="dialog" aria-modal="true" aria-labelledby="request-cart-title" dir={ar ? "rtl" : "ltr"}>
      <div className="request-cart-heading">
        <h2 id="request-cart-title">{ar ? "طلب أجهزة التكييف" : "AC request"}</h2>
        <button ref={closeButtonRef} type="button" onClick={cart.closeCart} aria-label={ar ? "إغلاق الطلب" : "Close request"}>×</button>
      </div>
      {cart.resolvedItems.length === 0 ? <p>{ar ? "لم تضف أجهزة إلى الطلب بعد." : "No units have been added yet."}</p> : <>
        <ul className="request-cart-items">
          {cart.resolvedItems.map(({ family, variant, quantity }, index) => <li key={variant.id}>
            <div><strong>{family.name[locale]}</strong><span>{formatHorsepower(locale, variant.capacityHp)}</span>{lineTotals[index] !== null && <span className="request-cart-line-total">{formatPublicMoney(lineTotals[index]!, locale)}</span>}</div>
            <label>{ar ? "الكمية" : "Quantity"}<input type="number" min={1} max={99} inputMode="numeric" value={quantity} onChange={(event) => cart.updateQuantity(variant.id, Number(event.target.value))} /></label>
            <button type="button" onClick={() => cart.removeItem(variant.id)}>{ar ? "إزالة" : "Remove"}</button>
          </li>)}
        </ul>
        {cartTotalMinor !== null && <p className="request-cart-total">{ar ? "الإجمالي التقديري" : "Estimated total"}<strong>{formatPublicMoney(cartTotalMinor, locale)}</strong></p>}
        <button type="button" onClick={cart.clearCart}>{ar ? "مسح الطلب" : "Clear request"}</button>
        <form ref={formRef} className="request-cart-form" onSubmit={submit}>
          <label>{ar ? "الاسم" : "Name"}<input name="name" autoComplete="name" required /></label>
          <label>{ar ? "رقم الهاتف" : "Telephone"}<input name="telephone" type="tel" autoComplete="tel" required /></label>
          <label>{ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}<input name="email" type="email" autoComplete="email" /></label>
          <label>{ar ? "المنطقة" : "Area"}<input name="area" autoComplete="address-level2" required /></label>
          <label>{ar ? "هل تحتاج إلى التركيب؟" : "Installation required?"}<select name="installation" defaultValue="yes"><option value="yes">{ar ? "نعم" : "Yes"}</option><option value="no">{ar ? "لا" : "No"}</option></select></label>
          <label className="request-cart-full">{ar ? "ملاحظات" : "Notes"}<textarea name="notes" rows={3} /></label>
          <p className="request-cart-disclaimer">{ar ? "يتم تأكيد الأسعار والتوافر وتكلفة التركيب بعد مراجعة الطلب." : "Prices, availability, and installation costs are confirmed after reviewing the request."}</p>
          <button type="submit">{ar ? "إرسال الطلب عبر واتساب" : "Send request via WhatsApp"}</button>
          {unavailable && <p role="alert">{ar ? "واتساب غير متاح حاليًا. اتصل بنا لإرسال الطلب." : "WhatsApp is currently unavailable. Please call us to send the request."}</p>}
          {ONLINE_PAYMENT_ENABLED && <>
            <label className="request-cart-terms"><input type="checkbox" checked={agreeToContact} onChange={(event) => setAgreeToContact(event.target.checked)} />{ar ? "أوافق على أن يتواصل معي الفريق لإتمام هذا الطلب." : "I agree to be contacted to complete this order."}</label>
            <button type="button" disabled={orderState.status === "submitting"} onClick={payOnline}>
              {orderState.status === "submitting" ? (ar ? "جارٍ الإرسال…" : "Placing order…") : (ar ? "اطلب أونلاين" : "Place order online")}
            </button>
            {orderState.status !== "idle" && orderState.message && (
              <p role="status" className={`request-cart-message request-cart-message-${orderState.status}`}>{orderState.message}</p>
            )}
          </>}
        </form>
      </>}
    </section>
  </div>;
}
