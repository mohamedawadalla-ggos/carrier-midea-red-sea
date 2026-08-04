-- Functional rollback for the ceiling-price campaign workflow.
-- The enum label remains because PostgreSQL cannot safely remove enum values in place.
begin;

update public.discount_campaigns
set status = 'archived'
where discount_type = 'ceiling_price' and status = 'published';

drop trigger if exists discount_campaigns_validate_publication on public.discount_campaigns;
drop function if exists private.validate_campaign_publication();
drop function if exists public.publish_discount_campaign(uuid);
drop function if exists public.save_ceiling_campaign_products(uuid, jsonb);
drop index if exists public.discount_campaigns_one_published_idx;

-- Keep the audited per-model column and enum value as inactive history. Reapply
-- 20260725070000_harden_campaign_pricing_helper.sql before deploying the previous
-- storefront build so the public projection returns to percentage/fixed logic.

commit;
