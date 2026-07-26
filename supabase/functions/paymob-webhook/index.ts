// Supabase Edge Function: paymob-webhook
//
// Receives Paymob's transaction callback and is the SOURCE OF TRUTH for
// payment status — redirects to the storefront are for UX only and must
// never be trusted to mark an order paid.
//
// IMPORTANT — before this goes live:
// 1. The HMAC field list/order below was confirmed correct against a real
//    Paymob sandbox card-payment callback on 2026-07-26 (a card charge
//    verified successfully on the first attempt). Not yet confirmed for
//    BNPL/installment methods, which may use a different transaction shape.
// 2. The Paymob payment-method identifier -> our `payment_method` enum
//    mapping in `mapPaymentMethod` is confirmed correct for `card`
//    (source_data.sub_type "Visa" correctly falls through to "card") but
//    still a best guess for valU/Aman/Forsa/Souhoola/HSBC installments —
//    correct each once a real sandbox callback for that method is observed.
// 3. Test only against Paymob SANDBOX credentials until every enabled
//    method has been confirmed this way at least once.
//
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYMOB_HMAC_SECRET

import { createClient } from "npm:@supabase/supabase-js@2";

// Classic Paymob transaction-callback HMAC field order.
const HMAC_FIELD_ORDER = [
  "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction",
  "id", "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded",
  "is_standalone_payment", "is_voided", "order.id", "owner", "pending",
  "source_data.pan", "source_data.sub_type", "source_data.type", "success",
] as const;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const hmacFromQuery = url.searchParams.get("hmac");

  const rawBody = await req.text();
  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    payload = null;
  }

  const transaction = isObject(payload) && isObject(payload.obj) ? payload.obj : isObject(payload) ? payload : null;
  const providedHmac = hmacFromQuery ?? (isObject(payload) && typeof payload.hmac === "string" ? payload.hmac : null);

  if (!transaction || !providedHmac) {
    return new Response("Malformed callback", { status: 400 });
  }

  const hmacSecret = Deno.env.get("PAYMOB_HMAC_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!hmacSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response("Webhook is not configured", { status: 503 });
  }

  const verified = await verifyHmac(transaction, providedHmac, hmacSecret);
  if (!verified) {
    // Fail closed — reject rather than guess. Orders simply stay in
    // pending_payment until this is fixed; that is the safe direction.
    return new Response("Signature verification failed", { status: 401 });
  }

  const providerTransactionId = String(readPath(transaction, "id") ?? "");
  const specialReference = readSpecialReference(transaction);
  const success = readPath(transaction, "success") === true || readPath(transaction, "success") === "true";

  if (!providerTransactionId || !specialReference) {
    return new Response("Missing transaction reference", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, requires_inspection_snapshot")
    .eq("order_number", specialReference)
    .maybeSingle();
  if (orderError || !order) {
    return new Response("Order not found", { status: 404 });
  }

  // Matched by order_id, not provider_transaction_id: create-payment-intent
  // stores the Intention's own id (e.g. "pi_test_...") at creation time, but
  // the webhook's transaction carries a different, later-assigned numeric
  // transaction id. Matching by order_id is the reliable link; the real
  // transaction id is backfilled onto the row below for future idempotency.
  const { data: existingTransaction } = await supabase
    .from("payment_transactions")
    .select("id, status")
    .eq("provider", "paymob")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Idempotency: a webhook already fully processed for this transaction should not be reapplied.
  if (existingTransaction && ["captured", "failed", "refunded", "partial_refund"].includes(existingTransaction.status)) {
    return new Response("Already processed", { status: 200 });
  }

  const nextTransactionStatus = success ? "captured" : "failed";
  const method = mapPaymentMethod(transaction);

  if (existingTransaction) {
    await supabase.from("payment_transactions").update({
      status: nextTransactionStatus,
      method,
      provider_transaction_id: providerTransactionId,
      raw_webhook_payload: transaction,
    }).eq("id", existingTransaction.id);
  } else {
    await supabase.from("payment_transactions").insert({
      order_id: order.id,
      provider: "paymob",
      provider_transaction_id: providerTransactionId,
      method,
      amount_minor: Number(readPath(transaction, "amount_cents") ?? 0),
      status: nextTransactionStatus,
      raw_webhook_payload: transaction,
    });
  }

  if (order.status === "pending_payment") {
    const nextOrderStatus = success
      ? (order.requires_inspection_snapshot ? "inspection_pending" : "inspection_not_required")
      : "payment_failed";
    await supabase.from("orders").update({ status: nextOrderStatus }).eq("id", order.id);
  }

  return new Response("OK", { status: 200 });
});

async function verifyHmac(transaction: Record<string, unknown>, providedHmac: string, secret: string): Promise<boolean> {
  const concatenated = HMAC_FIELD_ORDER.map((path) => stringifyForHmac(readPath(transaction, path))).join("");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(concatenated));
  const computedHex = Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(computedHex, providedHmac.toLowerCase());
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function stringifyForHmac(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function readPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((accumulator, key) => (isObject(accumulator) ? accumulator[key] : undefined), source);
}

function readSpecialReference(transaction: Record<string, unknown>): string | null {
  // Confirmed against a real sandbox callback: Paymob echoes the
  // special_reference sent at intent-creation time back as
  // order.merchant_order_id, not as special_reference/extras on the
  // transaction object itself. Kept the old guesses as fallbacks in case a
  // different payment method's callback shapes this differently.
  const direct = readPath(transaction, "order.merchant_order_id")
    ?? readPath(transaction, "payment_key_claims.extra.order_number")
    ?? readPath(transaction, "special_reference")
    ?? readPath(transaction, "extras.order_number")
    ?? readPath(transaction, "order.special_reference");
  return typeof direct === "string" ? direct : null;
}

function mapPaymentMethod(transaction: Record<string, unknown>): "card" | "apple_pay" | "valu" | "aman" | "forsa" | "souhoola" | "hsbc_installment" {
  const subType = String(readPath(transaction, "source_data.sub_type") ?? "").toLowerCase();
  if (subType.includes("valu")) return "valu";
  if (subType.includes("aman")) return "aman";
  if (subType.includes("forsa")) return "forsa";
  if (subType.includes("souhoola")) return "souhoola";
  if (subType.includes("installment") || subType.includes("hsbc")) return "hsbc_installment";
  if (subType.includes("applepay") || subType.includes("apple_pay")) return "apple_pay";
  return "card";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
