# Payment Edge Functions

Two Supabase Edge Functions implement the Paymob integration for Phase 4. Neither
has been deployed — this documents what deployment requires once real Paymob
credentials exist.

## Functions

- `create-payment-intent/` — called by the storefront after an order is created
  (`pending_payment`). Re-derives the amount from the database, creates a Paymob
  payment intention, records a `payment_transactions` row, and returns a hosted
  Unified Checkout URL.
- `paymob-webhook/` — receives Paymob's transaction callback, verifies its HMAC
  signature, and is the only thing allowed to move an order out of
  `pending_payment`. Fails closed: if signature verification fails or the
  payload shape doesn't match, the webhook is rejected rather than trusted.

## Required secrets (set via `supabase secrets set`, never commit real values)

| Secret | Used by | Notes |
|---|---|---|
| `PAYMOB_SECRET_KEY` | create-payment-intent | Server-side API secret from the Paymob dashboard |
| `PAYMOB_PUBLIC_KEY` | create-payment-intent | Used to build the Unified Checkout URL |
| `PAYMOB_INTEGRATION_IDS` | create-payment-intent | Comma-separated integration IDs — one per enabled payment method (cards, Apple Pay, each approved BNPL/installment provider) |
| `PAYMOB_NOTIFICATION_URL` | create-payment-intent | The deployed `paymob-webhook` function's public URL |
| `PAYMOB_REDIRECTION_URL` | create-payment-intent | Storefront URL the customer returns to after paying |
| `PAYMOB_HMAC_SECRET` | paymob-webhook | HMAC secret from the Paymob dashboard, used to verify callbacks |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to
Edge Functions by Supabase — do not set these manually.

## Before this can go live

1. Verify the exact Intention API request/response field names and the
   transaction-callback HMAC field order against Paymob's current live
   reference for this merchant account — both were written from Paymob's
   publicly documented shape but were **not** confirmed against a live
   sandbox response in this session.
2. Confirm which of the requested BNPL/installment providers (valU, Aman,
   Forsa, Souhoola, HSBC installments) are actually available for this
   merchant category before enabling their integration IDs.
3. Test exclusively against Paymob **sandbox** credentials end-to-end —
   order creation, checkout redirect, webhook received and verified, order
   status transitions correctly — before requesting production credentials.
4. Only after a successful sandbox run should the storefront's "Place order
   online" flow be wired to actually call `create-payment-intent` and
   redirect to the returned checkout URL. It is intentionally not wired yet.

## Deployment (not run in this session — requires Supabase CLI project link)

```bash
supabase functions deploy create-payment-intent
supabase functions deploy paymob-webhook
supabase secrets set PAYMOB_SECRET_KEY=... PAYMOB_PUBLIC_KEY=... PAYMOB_INTEGRATION_IDS=... PAYMOB_NOTIFICATION_URL=... PAYMOB_REDIRECTION_URL=... PAYMOB_HMAC_SECRET=...
```
