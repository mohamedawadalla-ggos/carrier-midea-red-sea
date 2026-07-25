begin;

drop view public.public_product_prices;
drop view public._campaign_aware_public_price_rows;

create schema if not exists pricing_private;

revoke all on schema pricing_private from public, anon, authenticated, service_role;
grant usage on schema pricing_private to anon, authenticated;

create function pricing_private.campaign_aware_public_price_rows()
returns table (
  model_code text,
  family_id text,
  family_name_ar text,
  family_name_en text,
  brand text,
  capacity_hp numeric,
  currency character(3),
  list_price_minor bigint,
  sale_price_minor bigint,
  discount_label_ar text,
  discount_label_en text,
  effective_from date,
  expires_at date,
  published_at timestamptz,
  campaign_code text,
  campaign_title_ar text,
  campaign_title_en text,
  campaign_discount_type public.discount_type,
  campaign_discount_value bigint,
  campaign_starts_at timestamptz,
  campaign_ends_at timestamptz,
  campaign_applied boolean
)
language sql
stable
security definer
set search_path = ''
as $function$
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
$function$;

comment on function pricing_private.campaign_aware_public_price_rows() is
  'Hardened owner-rights helper for the safe public campaign-price projection. The schema is intentionally excluded from the PostgREST API.';

revoke all on function pricing_private.campaign_aware_public_price_rows()
  from public, anon, authenticated, service_role;
grant execute on function pricing_private.campaign_aware_public_price_rows()
  to anon, authenticated;

create view public.public_product_prices
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
from pricing_private.campaign_aware_public_price_rows();

comment on view public.public_product_prices is
  'Safe public customer prices. Private cost, minimum floor, source, and approval fields are intentionally excluded.';

revoke all on public.public_product_prices from public, anon, authenticated;
grant select on public.public_product_prices to anon, authenticated;

create index if not exists discount_campaign_products_model_campaign_idx
  on public.discount_campaign_products (model_code, campaign_id);

commit;
