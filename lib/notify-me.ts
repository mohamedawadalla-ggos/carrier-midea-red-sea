import { siteConfig } from "@/lib/site-config";
import type { Locale } from "@/content/site";

export type NotifyMeResult = { ok: true } | { ok: false; error: string };

export async function submitStockNotifyRequest(input: {
  modelCode: string;
  customerName: string;
  contact: string;
  locale: Locale;
}): Promise<NotifyMeResult> {
  const config = siteConfig.publicSupabase;
  if (!config.url || !config.publishableKey) {
    return { ok: false, error: "This request could not be sent right now. Please try again later." };
  }
  if (!input.customerName.trim() || !input.contact.trim()) {
    return { ok: false, error: "Please enter your name and a way to contact you." };
  }

  try {
    const response = await fetch(new URL("/rest/v1/stock_notify_requests", config.url), {
      method: "POST",
      headers: {
        apikey: config.publishableKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        model_code: input.modelCode,
        customer_name: input.customerName.trim(),
        contact: input.contact.trim(),
        locale: input.locale,
      }),
    });
    if (!response.ok) {
      return { ok: false, error: "Could not save your request. Please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}
