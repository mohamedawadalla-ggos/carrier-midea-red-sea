"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/content/site";
import { checkOrderPaymentStatus, type OrderPaymentStatusResult } from "@/lib/check-order-status";

function readInitialOrderNumber(): string {
  if (typeof window === "undefined") return "";
  const query = new URLSearchParams(window.location.search);
  return query.get("order") ?? query.get("merchant_order_id") ?? query.get("special_reference") ?? "";
}

const orderStatusLabels: Record<string, { ar: string; en: string }> = {
  pending_payment: { ar: "بانتظار الدفع", en: "Awaiting payment" },
  payment_failed: { ar: "فشلت عملية الدفع", en: "Payment failed" },
  paid: { ar: "تم الدفع", en: "Paid" },
  inspection_not_required: { ar: "تم الدفع — لا تلزم معاينة", en: "Paid — no inspection required" },
  inspection_pending: { ar: "بانتظار المعاينة", en: "Awaiting inspection" },
  inspection_scheduled: { ar: "تم تحديد موعد المعاينة", en: "Inspection scheduled" },
  inspection_passed: { ar: "تمت المعاينة بنجاح", en: "Inspection passed" },
  inspection_failed_needs_action: { ar: "تتطلب المعاينة إجراءً إضافيًا", en: "Inspection needs action" },
  reconfigured_awaiting_customer_approval: { ar: "بانتظار موافقتك على التعديل", en: "Awaiting your approval on changes" },
  paid_adjusted: { ar: "تم تعديل الدفع", en: "Payment adjusted" },
  fulfillment_processing: { ar: "جارٍ تجهيز الطلب", en: "Order being processed" },
  fulfilled: { ar: "تم التوريد", en: "Fulfilled" },
  closed: { ar: "مغلق", en: "Closed" },
  refund_requested: { ar: "تم طلب استرداد المبلغ", en: "Refund requested" },
  refunded: { ar: "تم استرداد المبلغ", en: "Refunded" },
  partial_refund: { ar: "تم استرداد جزء من المبلغ", en: "Partially refunded" },
  cancelled_refunded: { ar: "تم الإلغاء والاسترداد", en: "Cancelled and refunded" },
};

function formatMoney(minor: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function OrderStatusLookup({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [orderNumber, setOrderNumber] = useState(readInitialOrderNumber);
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "error" | "success"; result?: OrderPaymentStatusResult; error?: string }>({ status: "idle" });

  async function lookup(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;
    setState({ status: "loading" });
    const result = await checkOrderPaymentStatus(orderNumber.trim(), phone.trim());
    if (result.ok) setState({ status: "success", result });
    else setState({ status: "error", error: result.error });
  }

  return <div className="order-status-lookup">
    <form className="order-status-form" onSubmit={lookup}>
      <label>
        {ar ? "رقم الطلب" : "Order number"}
        <input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} required />
      </label>
      <label>
        {ar ? "رقم الهاتف المستخدم في الطلب" : "Phone number used on the order"}
        <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" required />
      </label>
      <button type="submit" disabled={state.status === "loading"}>
        {state.status === "loading" ? (ar ? "جارٍ التحقق…" : "Checking…") : (ar ? "تحقق من حالة الطلب" : "Check order status")}
      </button>
    </form>
    {state.status === "error" && <p role="alert" className="order-status-message order-status-error">{state.error}</p>}
    {state.status === "success" && state.result?.ok && (
      <dl className="order-status-details">
        <dt>{ar ? "حالة الطلب" : "Order status"}</dt>
        <dd>{orderStatusLabels[state.result.orderStatus]?.[locale] ?? state.result.orderStatus}</dd>
        <dt>{ar ? "الإجمالي" : "Total"}</dt>
        <dd>{formatMoney(state.result.totalMinor, state.result.currency, locale)}</dd>
        {state.result.latestPaymentStatus && <>
          <dt>{ar ? "حالة الدفع" : "Payment status"}</dt>
          <dd>{state.result.latestPaymentStatus}</dd>
        </>}
      </dl>
    )}
  </div>;
}
