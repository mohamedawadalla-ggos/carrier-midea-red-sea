# Ceiling-price campaigns

Status: database migrations applied to Supabase production; application deployments
are not applied.

## Business rule

A ceiling-price campaign takes the current published customer list price as the
crossed-out price. The super admin enters the final offer price per model. The
percentage is derived for review and public metadata; it is never an editable source
of truth.

Only one campaign of any type may be `published`. Publishing uses
`publish_discount_campaign(uuid)`, locks the campaign table, validates every linked
model against its current customer price and private approved floor, archives the
current campaign, and publishes the replacement in one transaction.

## Security and roles

- Only an active `super_admin` may create, change, save model prices for, or publish a
  `ceiling_price` campaign.
- Management may continue publishing percentage or fixed-amount campaigns.
- Public pricing exposes customer list price, final offer price, and derived campaign
  metadata only. Dealer cost and the approved minimum stay inside the owner-rights
  pricing function.
- Campaign-product changes are added to the existing audit mechanism.

## Migration order

1. `20260804000215_add_ceiling_price_campaign_type.sql`
2. `20260804000222_ceiling_price_campaign_workflow.sql`
3. Deploy the admin panel.
4. Deploy the storefront only after its public parser supports `ceiling_price`.

The enum addition is intentionally separate because PostgreSQL requires a new enum
value to commit before a later migration uses it.

## Rollback

Use `CEILING_PRICE_CAMPAIGNS_ROLLBACK.sql`. It archives any ceiling campaign, removes
the public RPC entry points and single-campaign index, and disables ceiling-price
links. PostgreSQL enum values are not safely removable in-place; the inactive
`ceiling_price` enum label remains as harmless schema history after rollback.
