import { siteConfig } from "@/lib/site-config";

export type OrderPaymentStatusResult =
  | {
      ok: true;
      orderStatus: string;
      totalMinor: number;
      currency: string;
      paymentMethod: string;
      latestPaymentStatus: string | null;
      latestPaymentProvider: string | null;
    }
  | { ok: false; error: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function checkOrderPaymentStatus(orderNumber: string, phone: string): Promise<OrderPaymentStatusResult> {
  const config = siteConfig.publicSupabase;
  if (!config.url || !config.publishableKey) {
    return { ok: false, error: "Order status lookup is not configured yet." };
  }

  try {
    const response = await fetch(new URL("/rest/v1/rpc/check_order_payment_status", config.url), {
      method: "POST",
      headers: {
        apikey: config.publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_number: orderNumber, phone }),
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message = isObject(payload) && typeof payload.message === "string"
        ? payload.message
        : "Order not found. Check the order number and phone number.";
      return { ok: false, error: message };
    }

    if (!Array.isArray(payload) || payload.length !== 1 || !isObject(payload[0])) {
      return { ok: false, error: "Unexpected response while checking order status." };
    }

    const row = payload[0];
    if (typeof row.order_status !== "string" || typeof row.total_minor !== "number" || typeof row.currency !== "string" || typeof row.payment_method !== "string") {
      return { ok: false, error: "Unexpected response while checking order status." };
    }

    return {
      ok: true,
      orderStatus: row.order_status,
      totalMinor: row.total_minor,
      currency: row.currency,
      paymentMethod: row.payment_method,
      latestPaymentStatus: typeof row.latest_payment_status === "string" ? row.latest_payment_status : null,
      latestPaymentProvider: typeof row.latest_payment_provider === "string" ? row.latest_payment_provider : null,
    };
  } catch {
    return { ok: false, error: "Could not reach the ordering service. Please try again or use WhatsApp." };
  }
}
