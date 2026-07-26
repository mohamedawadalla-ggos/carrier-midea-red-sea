import { siteConfig } from "@/lib/site-config";

export type CreatePaymentIntentResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function createPaymentIntent(orderNumber: string): Promise<CreatePaymentIntentResult> {
  const config = siteConfig.publicSupabase;
  if (!config.url || !config.publishableKey) {
    return { ok: false, error: "Online payment is not configured yet." };
  }

  try {
    const response = await fetch(new URL("/functions/v1/create-payment-intent", config.url), {
      method: "POST",
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_number: orderNumber }),
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok || !isObject(payload) || typeof payload.checkout_url !== "string") {
      const message = isObject(payload) && typeof payload.error === "string"
        ? payload.error
        : "Could not start online payment. Please try again or use WhatsApp.";
      return { ok: false, error: message };
    }

    return { ok: true, checkoutUrl: payload.checkout_url };
  } catch {
    return { ok: false, error: "Could not reach the payment service. Please try again or use WhatsApp." };
  }
}
