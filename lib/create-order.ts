import { siteConfig } from "@/lib/site-config";
import type { Locale } from "@/content/site";

export type CreateOrderItem = Readonly<{ modelCode: string; quantity: number }>;

export type CreateOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function createOrder(input: {
  items: readonly CreateOrderItem[];
  customerName: string;
  phone: string;
  email: string;
  locale: Locale;
  termsVersion: string;
}): Promise<CreateOrderResult> {
  const config = siteConfig.publicSupabase;
  if (!config.url || !config.publishableKey) {
    return { ok: false, error: "Online ordering is not configured yet." };
  }
  if (!input.items.length) {
    return { ok: false, error: "Your request list is empty." };
  }

  try {
    const response = await fetch(new URL("/rest/v1/rpc/create_order", config.url), {
      method: "POST",
      headers: {
        apikey: config.publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: input.items.map((item) => ({ model_code: item.modelCode, quantity: item.quantity })),
        customer_name: input.customerName,
        phone: input.phone,
        email: input.email || null,
        locale: input.locale,
        area_location_id: null,
        terms_version: input.termsVersion,
      }),
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message = isObject(payload) && typeof payload.message === "string"
        ? payload.message
        : "Could not place the order. Please try again or use WhatsApp.";
      return { ok: false, error: message };
    }

    if (!Array.isArray(payload) || payload.length !== 1 || !isObject(payload[0]) || typeof payload[0].order_number !== "string") {
      return { ok: false, error: "Unexpected response while placing the order." };
    }

    return { ok: true, orderNumber: payload[0].order_number };
  } catch {
    return { ok: false, error: "Could not reach the ordering service. Please try again or use WhatsApp." };
  }
}
