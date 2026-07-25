begin;

-- This owner-rights helper is a security barrier between private price floors
-- and the public API. It projects customer-facing fields only: neither the
-- approved minimum nor dealer cost can leave the helper.
create or replace view public._campaign_aware_public_price_rows
with (security_barrier = true)
as
select
  p.model_code,
  c.family_id,
  c.family_name_ar,
  c.family_name_en,
  c.brand,
  c.capacity_hp,
  p.currency,
  p.list_price_minor,
  coalesce(campaign.sale_price_minor, p.sale_price_minor) as sale_price_minor,
  case when campaign.id is null then p.discount_label_ar else null end as discount_label_ar,
  case when campaign.id is null then p.discount_label_en else null end as discount_label_en,
  p.effective_from,
  p.expires_at,
  p.published_at,
  campaign.code as campaign_code,
  campaign.title_ar as campaign_title_ar,
  campaign.title_en as campaign_title_en,
  campaign.discount_type as campaign_discount_type,
  campaign.discount_value_minor_or_bps as campaign_discount_value,
  campaign.starts_at as campaign_starts_at,
  campaign.ends_at as campaign_ends_at,
  (campaign.id is not null) as campaign_applied
from public.published_product_prices p
join public.catalog_products c using (model_code)
left join lateral (
  select e.minimum_price_minor
  from public.product_price_entries e
  where e.model_code = p.model_code
    and e.currency = p.currency
    and e.end_user_price_minor = p.list_price_minor
    and e.effective_from = p.effective_from
    and e.expires_at is not distinct from p.expires_at
    and e.status in ('approved', 'published')
    and e.minimum_price_minor is not null
  order by e.updated_at desc, e.id
  limit 1
) source_price on true
left join lateral (
  select
    d.id,
    d.code,
    d.title_ar,
    d.title_en,
    d.discount_type,
    d.discount_value_minor_or_bps,
    d.starts_at,
    d.ends_at,
    calculated.sale_price_minor
  from public.discount_campaign_products link
  join public.discount_campaigns d on d.id = link.campaign_id
  cross join lateral (
    select case
      when d.discount_type = 'percentage' then
        p.list_price_minor - floor(
          (p.list_price_minor::numeric * d.discount_value_minor_or_bps::numeric) / 10000
        )::bigint
      when d.discount_type = 'fixed_amount' then
        p.list_price_minor - d.discount_value_minor_or_bps
    end as sale_price_minor
  ) calculated
  where link.model_code = p.model_code
    and d.status = 'published'
    and d.starts_at <= now()
    and d.ends_at >= now()
    and d.discount_value_minor_or_bps > 0
    and calculated.sale_price_minor >= 0
    and calculated.sale_price_minor <= p.list_price_minor
    and calculated.sale_price_minor <= p.sale_price_minor
    and calculated.sale_price_minor >= source_price.minimum_price_minor
  order by calculated.sale_price_minor, d.starts_at, d.id
  limit 1
) campaign on true
where p.published = true
  and p.effective_from <= current_date
  and (p.expires_at is null or p.expires_at >= current_date)
  and c.active = true;

comment on view public._campaign_aware_public_price_rows is
  'Security-barrier projection for public campaign pricing. It excludes dealer cost, minimum price, source references, approval identities, and unpublished records.';

revoke all on public._campaign_aware_public_price_rows from public, anon, authenticated;
grant select on public._campaign_aware_public_price_rows to anon, authenticated;

create or replace view public.public_product_prices
with (security_invoker = true)
as
select
  model_code,
  family_id,
  family_name_ar,
  family_name_en,
  brand,
  capacity_hp,
  currency,
  list_price_minor,
  sale_price_minor,
  discount_label_ar,
  discount_label_en,
  effective_from,
  expires_at,
  published_at,
  campaign_code,
  campaign_title_ar,
  campaign_title_en,
  campaign_discount_type,
  campaign_discount_value,
  campaign_starts_at,
  campaign_ends_at,
  campaign_applied
from public._campaign_aware_public_price_rows;

comment on view public.public_product_prices is
  'Safe public customer prices. Private cost, minimum floor, source, and approval fields are intentionally excluded.';

revoke all on public.public_product_prices from public, anon, authenticated;
grant select on public.public_product_prices to anon, authenticated;

commit;
