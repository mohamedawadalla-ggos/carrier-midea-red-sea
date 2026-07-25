"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/content/site";
import { usePublicStock } from "@/components/pricing/PublicStockProvider";
import { getPublicStock } from "@/lib/public-stock";
import { submitStockNotifyRequest } from "@/lib/notify-me";

export function PublicStockBadge({ modelCode, locale }: { modelCode: string; locale: Locale }) {
  const snapshot = usePublicStock();
  const ar = locale === "ar";
  const [formOpen, setFormOpen] = useState(false);
  const [state, setState] = useState<{ status: "idle" | "submitting" | "success" | "error"; message: string }>({ status: "idle", message: "" });

  if (!snapshot.enabled) return null;
  if (getPublicStock(snapshot, modelCode) !== "out_of_stock") return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState({ status: "submitting", message: "" });
    const result = await submitStockNotifyRequest({
      modelCode,
      customerName: String(data.get("name") ?? ""),
      contact: String(data.get("contact") ?? ""),
      locale,
    });
    setState(result.ok
      ? { status: "success", message: ar ? "سنخبرك عند توفر الجهاز." : "We'll let you know when it's back in stock." }
      : { status: "error", message: result.error });
  }

  return <div className="stock-badge-wrap">
    <span className="stock-badge">{ar ? "غير متوفر حاليًا" : "Currently out of stock"}</span>
    {state.status !== "success" && (formOpen
      ? <form className="notify-me-form" onSubmit={submit}>
          <label>{ar ? "الاسم" : "Name"}<input name="name" required /></label>
          <label>{ar ? "رقم الهاتف أو البريد" : "Phone or email"}<input name="contact" required /></label>
          <button type="submit" disabled={state.status === "submitting"}>
            {state.status === "submitting" ? (ar ? "جارٍ الإرسال…" : "Sending…") : (ar ? "أعلمني" : "Notify me")}
          </button>
        </form>
      : <button type="button" className="notify-me-toggle" onClick={() => setFormOpen(true)}>
          {ar ? "أعلمني عند التوفر" : "Notify me when available"}
        </button>)}
    {state.status === "error" && <p role="alert" className="notify-me-error">{state.message}</p>}
    {state.status === "success" && <p role="status" className="notify-me-success">{state.message}</p>}
  </div>;
}
