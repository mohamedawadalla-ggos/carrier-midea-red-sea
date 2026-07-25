// Supabase Edge Function: create-payment-intent
//
// Called by the storefront after `create_order` succeeds. Re-derives the
// authoritative amount from the database (never trusts a client-submitted
// total), creates a Paymob payment intention using the merchant secret key
// (held only in this function's environment, never shipped to the browser),
// and returns a hosted Unified Checkout URL.
//
// IMPORTANT — before this goes live:
// 1. Confirm the exact Intention API request/response field names and the
//    active `payment_methods` integration IDs against Paymob's current
//    dashboard/docs for this merchant account — this was written from
//    Paymob's publicly documented Intention API shape, but was not verified
//    against a live merchant sandbox in this session.
// 2. Test end-to-end against Paymob's SANDBOX credentials only. Do not point
//    this at production Paymob credentials until a full sandbox run succeeds.
//
// Required secrets (set via `supabase secrets set`, never committed):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (usually auto-injected)
//   PAYMOB_SECRET_KEY       — server-side API secret key
//   PAYMOB_PUBLIC_KEY       — public key used to build the checkout URL
//   PAYMOB_INTEGRATION_IDS  — comma-separated integration IDs to offer
//     (cards, Apple Pay, and each enabled BNPL/installment provider each has
//     its own integration ID once approved by Paymob for this merchant)
//   PAYMOB_NOTIFICATION_URL — this function's own public URL is NOT it; set
//     this to the deployed `paymob-webhook` function URL
//   PAYMOB_REDIRECTION_URL  — storefront URL the customer returns to

import { createClient } from "npm:@supabase/supabase-js@2";

const PAYMOB_BASE_URL = "https://accept.paymob.com";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const orderNumber = isObject(body) && typeof body.order_number === "string" ? body.order_number : null;
  if (!orderNumber) {
    return jsonResponse({ error: "order_number is required" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const paymobSecretKey = Deno.env.get("PAYMOB_SECRET_KEY");
  const paymobPublicKey = Deno.env.get("PAYMOB_PUBLIC_KEY");
  const integrationIds = (Deno.env.get("PAYMOB_INTEGRATION_IDS") ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean).map(Number);
  const notificationUrl = Deno.env.get("PAYMOB_NOTIFICATION_URL");
  const redirectionUrl = Deno.env.get("PAYMOB_REDIRECTION_URL");

  if (!supabaseUrl || !serviceRoleKey || !paymobSecretKey || !paymobPublicKey || !integrationIds.length) {
    return jsonResponse({ error: "Payment provider is not configured yet." }, 503);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, phone, email, locale, currency, total_minor, status")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (orderError || !order) {
    return jsonResponse({ error: "Order not found." }, 404);
  }
  if (order.status !== "pending_payment") {
    return jsonResponse({ error: `Order is not awaiting payment (status: ${order.status}).` }, 409);
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("model_code, quantity, unit_price_minor, line_total_minor")
    .eq("order_id", order.id);
  if (itemsError || !items?.length) {
    return jsonResponse({ error: "Order has no items." }, 409);
  }

  const [firstName, ...restName] = order.customer_name.split(" ");

  let intentionResponse: Response;
  try {
    intentionResponse = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${paymobSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: order.total_minor,
        currency: order.currency,
        payment_methods: integrationIds,
        items: items.map((item) => ({
          name: item.model_code,
          amount: item.unit_price_minor,
          quantity: item.quantity,
        })),
        billing_data: {
          first_name: firstName || "Customer",
          last_name: restName.join(" ") || "Customer",
          phone_number: order.phone,
          email: order.email || "no-email@example.com",
          country: "EG",
          city: "NA",
          street: "NA",
          building: "NA",
          floor: "NA",
          apartment: "NA",
        },
        special_reference: order.order_number,
        notification_url: notificationUrl,
        redirection_url: redirectionUrl,
        extras: { order_number: order.order_number },
      }),
    });
  } catch {
    return jsonResponse({ error: "Could not reach the payment provider." }, 502);
  }

  const intentionPayload: unknown = await intentionResponse.json().catch(() => null);
  if (!intentionResponse.ok || !isObject(intentionPayload) || typeof intentionPayload.client_secret !== "string") {
    return jsonResponse({ error: "The payment provider rejected the request." }, 502);
  }

  const providerTransactionId = typeof intentionPayload.id === "string" || typeof intentionPayload.id === "number"
    ? String(intentionPayload.id)
    : order.order_number;

  const { error: insertError } = await supabase.from("payment_transactions").insert({
    order_id: order.id,
    provider: "paymob",
    provider_transaction_id: providerTransactionId,
    method: "card",
    amount_minor: order.total_minor,
    currency: order.currency,
    status: "initiated",
  });
  if (insertError) {
    return jsonResponse({ error: "Could not record the payment attempt." }, 500);
  }

  const checkoutUrl = `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${encodeURIComponent(paymobPublicKey)}&clientSecret=${encodeURIComponent(intentionPayload.client_secret)}`;

  return jsonResponse({ checkout_url: checkoutUrl });
});

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
