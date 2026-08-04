# Approved price-master reconciliation

Status: applied to Supabase production and verified on 4 August 2026 Cairo time.

## Approved source

- Workbook: `Carrier_Midea_Price_Master_Template.xlsx`
- SHA256: `B38A1AB5DF577D7D0A73CBDDEAFF0B51539E8F8C23C655BA390DC28577B88981`
- Sheet and range: `Price Master!A1:F62`
- Business effective date: 4 August 2026 Cairo time
- Database effective date: 3 August 2026 UTC, allowing immediate visibility during
  the UTC/Cairo date boundary

The workbook contains 61 unique catalog model codes. All 61 dealer costs match the
reviewed production snapshot. Customer list prices change for 49 models and remain
unchanged for 12 models. The total of the 49 per-model list-price reductions is EGP
51,295; this total is a reconciliation checksum, not a sales or inventory total.

## Exact production change prepared

Migrations:

- `supabase/migrations/20260803232047_align_prices_to_approved_master.sql`
- `supabase/migrations/20260803232205_activate_approved_master_prices_immediately.sql`

The transaction:

1. Loads the 61 approved rows into a temporary transaction-local table.
2. Aborts unless the catalog, current published prices, latest approved dealer costs,
   active campaign, active super-admin owner, and expected 49 campaign-floor conflicts
   still match the reviewed state.
3. Archives the active `SUMMER10_2026` campaign. A 10% discount applied to the approved
   master list prices would fall below dealer cost for 49 models.
4. Inserts 61 new `published` price-history rows using the workbook hash as the source
   reference. Existing price history remains intact.
5. Updates `published_product_prices` so list and sale price both equal the workbook's
   Customer Price. No discount label is retained.
6. Verifies all 61 public price rows and all 61 auditable history rows before commit.
7. Advances the UTC database effective date for those exact 61 source-tagged entries
   so the approved Cairo-date prices become publicly visible immediately.

## Roles and data affected

- Public/anonymous visitors: customer-visible prices change to the workbook values and
  the Summer 10% campaign label/strike-through presentation ends.
- Accounts: dealer costs remain unchanged and continue to be readable only through the
  existing authenticated staff policy.
- Management and super admin: see a new published price version and the archived
  campaign in the existing admin workflows.
- Audit: inserts and updates continue through the existing audit triggers.

There are no schema, RLS, grant, view, function, authentication, environment-variable,
or hosting changes. Dealer costs are not added to a public table, view, bundle, or log.

## Rollback

`docs/phase2/PRICE_MASTER_RECONCILIATION_ROLLBACK.sql` restores the exact previous 61
published list/sale prices, archives the new workbook-sourced price-history entries,
and republishes `SUMMER10_2026` only if its original time window is still active.

## Required production verification

Production verification completed after application:

1. Confirm 61 published prices match the workbook in minor units.
2. Confirm 61 new price-history entries carry the exact workbook SHA256.
3. Confirm `SUMMER10_2026` is archived and no other published campaign unexpectedly
   affects these products.
4. Query the safe public pricing view for representative Carrier and Midea models.
5. Verify Arabic and English storefront cards show the workbook price without a stale
   campaign label.
6. Confirm dealer cost remains absent from public responses.

Observed verification: 61 public price rows, identical list and sale totals of EGP
3,894,765, zero campaign-applied rows, and all approved customer prices above dealer
cost. The production migration ledger records versions `20260803232047` and
`20260803232205`.
