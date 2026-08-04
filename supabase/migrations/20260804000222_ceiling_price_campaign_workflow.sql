-- Production migration ledger version: 20260804000222.
begin;

alter table public.discount_campaigns
  alter column discount_value_minor_or_bps drop not null;

alter table public.discount_campaigns
  drop constraint discount_campaigns_discount_value_minor_or_bps_check,
  drop constraint discount_value_matches_type;

alter table public.discount_campaigns
  add constraint discount_value_matches_type check (
    (discount_type = 'percentage' and discount_value_minor_or_bps > 0 and discount_value_minor_or_bps <= 10000)
    or (discount_type = 'fixed_amount' and discount_value_minor_or_bps > 0)
    or (discount_type = 'ceiling_price' and discount_value_minor_or_bps is null)
  );

alter table public.discount_campaign_products
  add column campaign_sale_price_minor bigint,
  add constraint ceiling_campaign_sale_price_positive
    check (campaign_sale_price_minor is null or campaign_sale_price_minor > 0);

create unique index discount_campaigns_one_published_idx
  on public.discount_campaigns ((status))
  where status = 'published';

create trigger discount_campaign_products_audit
after insert or update or delete on public.discount_campaign_products
for each row execute function private.write_audit_log();

grant update (campaign_sale_price_minor) on public.discount_campaign_products to authenticated;

drop policy discount_products_management_insert on public.discount_campaign_products;
create policy discount_products_management_insert on public.discount_campaign_products
for insert to authenticated
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and exists (
    select 1 from public.discount_campaigns campaign
    where campaign.id = campaign_id
      and (
        campaign.discount_type <> 'ceiling_price'
        or (select private.current_staff_role()) = 'super_admin'
      )
  )
);

create policy discount_products_management_update on public.discount_campaign_products
for update to authenticated
using (
  exists (
    select 1 from public.discount_campaigns campaign
    where campaign.id = campaign_id
      and campaign.status in ('draft','pending_approval')
      and (
        (campaign.discount_type = 'ceiling_price' and (select private.current_staff_role()) = 'super_admin')
        or (
          campaign.discount_type <> 'ceiling_price'
          and (select private.has_any_role(array['super_admin','management']::public.app_role[]))
        )
      )
  )
)
with check (
  exists (
    select 1 from public.discount_campaigns campaign
    where campaign.id = campaign_id
      and campaign.status in ('draft','pending_approval')
      and (
        (campaign.discount_type = 'ceiling_price' and (select private.current_staff_role()) = 'super_admin')
        or (
          campaign.discount_type <> 'ceiling_price'
          and (select private.has_any_role(array['super_admin','management']::public.app_role[]))
        )
      )
  )
);

create function private.validate_campaign_publication()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (
    (tg_op = 'DELETE' and old.discount_type = 'ceiling_price')
    or (tg_op <> 'DELETE' and new.discount_type = 'ceiling_price')
  ) and (select private.current_staff_role()) is distinct from 'super_admin' then
    raise exception 'Only a super admin can manage ceiling-price campaigns.';
  end if;

  if tg_op = 'DELETE' then return old; end if;

  if new.status = 'published'
    and (tg_op = 'INSERT' or old.status is distinct from 'published')
    and pg_catalog.current_setting('app.campaign_publish_authorized', true) is distinct from 'true'
  then
    raise exception 'Campaigns must be published through publish_discount_campaign().';
  end if;

  if tg_op = 'UPDATE' and old.status = 'published' and new.status = 'published' then
    raise exception 'Archive a published campaign before changing it.';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_campaign_publication() from public, anon, authenticated;

create trigger discount_campaigns_validate_publication
before insert or update or delete on public.discount_campaigns
for each row execute function private.validate_campaign_publication();

create function public.save_ceiling_campaign_products(p_campaign_id uuid, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invalid_count integer;
  item_count integer;
begin
  if not exists (
    select 1 from public.staff_profiles
    where user_id = (select auth.uid()) and active = true and role = 'super_admin'
  ) then
    raise exception 'Only a super admin can edit ceiling campaign prices.';
  end if;

  if not exists (
    select 1 from public.discount_campaigns
    where id = p_campaign_id
      and discount_type = 'ceiling_price'
      and status in ('draft','pending_approval')
  ) then
    raise exception 'Editable ceiling campaign not found.';
  end if;

  if pg_catalog.jsonb_typeof(p_items) <> 'array' then
    raise exception 'Campaign prices must be a JSON array.';
  end if;

  create temporary table ceiling_items (
    model_code text primary key,
    sale_price_minor bigint not null check (sale_price_minor > 0)
  ) on commit drop;

  insert into ceiling_items (model_code, sale_price_minor)
  select item.model_code, item.sale_price_minor
  from pg_catalog.jsonb_to_recordset(p_items) as item(model_code text, sale_price_minor bigint);

  get diagnostics item_count = row_count;
  if item_count = 0 then raise exception 'Enter at least one campaign price.'; end if;

  select count(*) into invalid_count
  from ceiling_items item
  left join public.catalog_products product using (model_code)
  where product.model_code is null or not product.active;
  if invalid_count <> 0 then
    raise exception 'Campaign contains % unknown or inactive models.', invalid_count;
  end if;

  delete from public.discount_campaign_products where campaign_id = p_campaign_id;
  insert into public.discount_campaign_products (campaign_id, model_code, campaign_sale_price_minor)
  select p_campaign_id, model_code, sale_price_minor from ceiling_items;
end;
$$;

revoke all on function public.save_ceiling_campaign_products(uuid, jsonb) from public, anon;
grant execute on function public.save_ceiling_campaign_products(uuid, jsonb) to authenticated;

create function public.publish_discount_campaign(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role public.app_role;
  campaign public.discount_campaigns%rowtype;
  invalid_count integer;
  item_count integer;
begin
  select role into caller_role
  from public.staff_profiles
  where user_id = (select auth.uid()) and active = true;

  if caller_role is null or caller_role not in ('super_admin', 'management') then
    raise exception 'You do not have permission to publish campaigns.';
  end if;

  lock table public.discount_campaigns in share row exclusive mode;

  select * into campaign
  from public.discount_campaigns
  where id = p_campaign_id
  for update;

  if campaign.id is null then raise exception 'Campaign not found.'; end if;
  if campaign.status not in ('draft','pending_approval','approved') then
    raise exception 'Only draft, pending, or approved campaigns can be published.';
  end if;
  if campaign.discount_type = 'ceiling_price' and caller_role <> 'super_admin' then
    raise exception 'Only a super admin can publish a ceiling-price campaign.';
  end if;

  select count(*) into item_count
  from public.discount_campaign_products
  where campaign_id = campaign.id;
  if item_count = 0 then raise exception 'Campaign has no products.'; end if;

  if campaign.discount_type = 'ceiling_price' then
    select count(*) into invalid_count
    from public.discount_campaign_products link
    join public.published_product_prices published using (model_code)
    join public.catalog_products product using (model_code)
    left join lateral (
      select entry.minimum_price_minor
      from public.product_price_entries entry
      where entry.model_code = published.model_code
        and entry.currency = published.currency
        and entry.end_user_price_minor = published.list_price_minor
        and entry.effective_from = published.effective_from
        and entry.expires_at is not distinct from published.expires_at
        and entry.status in ('approved','published')
      order by entry.updated_at desc, entry.id
      limit 1
    ) floor_price on true
    where link.campaign_id = campaign.id
      and (
        link.campaign_sale_price_minor is null
        or not published.published
        or not product.active
        or published.effective_from > current_date
        or (published.expires_at is not null and published.expires_at < current_date)
        or floor_price.minimum_price_minor is null
        or link.campaign_sale_price_minor >= published.list_price_minor
        or link.campaign_sale_price_minor < floor_price.minimum_price_minor
      );

    if invalid_count <> 0 then
      raise exception 'Ceiling campaign contains % invalid or unsafe product prices.', invalid_count;
    end if;
  else
    select count(*) into invalid_count
    from public.discount_campaign_products link
    left join public.published_product_prices published using (model_code)
    left join public.catalog_products product using (model_code)
    left join lateral (
      select entry.minimum_price_minor
      from public.product_price_entries entry
      where entry.model_code = published.model_code
        and entry.currency = published.currency
        and entry.end_user_price_minor = published.list_price_minor
        and entry.effective_from = published.effective_from
        and entry.expires_at is not distinct from published.expires_at
        and entry.status in ('approved','published')
      order by entry.updated_at desc, entry.id
      limit 1
    ) floor_price on true
    cross join lateral (
      select case
        when campaign.discount_type = 'percentage' then
          published.list_price_minor - pg_catalog.floor(
            (published.list_price_minor::numeric * campaign.discount_value_minor_or_bps::numeric) / 10000
          )::bigint
        when campaign.discount_type = 'fixed_amount' then
          published.list_price_minor - campaign.discount_value_minor_or_bps
      end as sale_price_minor
    ) calculated
    where link.campaign_id = campaign.id
      and (
        published.model_code is null
        or not published.published
        or product.model_code is null
        or not product.active
        or floor_price.minimum_price_minor is null
        or calculated.sale_price_minor is null
        or calculated.sale_price_minor >= published.list_price_minor
        or calculated.sale_price_minor < floor_price.minimum_price_minor
      );

    if invalid_count <> 0 then
      raise exception 'Campaign contains % invalid or unsafe product discounts.', invalid_count;
    end if;
  end if;

  perform pg_catalog.set_config('app.campaign_publish_authorized', 'true', true);
  update public.discount_campaigns
  set status = 'archived'
  where status = 'published' and id <> campaign.id;

  update public.discount_campaigns
  set status = 'published', approved_by = (select auth.uid())
  where id = campaign.id;
end;
$$;

revoke all on function public.publish_discount_campaign(uuid) from public, anon;
grant execute on function public.publish_discount_campaign(uuid) to authenticated;

create or replace function pricing_private.campaign_aware_public_price_rows()
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
    case when campaign.id is null then p.discount_label_ar else null end,
    case when campaign.id is null then p.discount_label_en else null end,
    p.effective_from,
    p.expires_at,
    p.published_at,
    campaign.code,
    campaign.title_ar,
    campaign.title_en,
    campaign.discount_type,
    campaign.public_discount_value,
    campaign.starts_at,
    campaign.ends_at,
    (campaign.id is not null)
  from public.published_product_prices p
  join public.catalog_products c using (model_code)
  left join lateral (
    select entry.minimum_price_minor
    from public.product_price_entries entry
    where entry.model_code = p.model_code
      and entry.currency = p.currency
      and entry.end_user_price_minor = p.list_price_minor
      and entry.effective_from = p.effective_from
      and entry.expires_at is not distinct from p.expires_at
      and entry.status in ('approved','published')
      and entry.minimum_price_minor is not null
    order by entry.updated_at desc, entry.id
    limit 1
  ) source_price on true
  left join lateral (
    select
      d.id,
      d.code,
      d.title_ar,
      d.title_en,
      d.discount_type,
      case
        when d.discount_type = 'ceiling_price' then
          pg_catalog.floor(((p.list_price_minor - calculated.sale_price_minor)::numeric * 10000) / p.list_price_minor)::bigint
        else d.discount_value_minor_or_bps
      end as public_discount_value,
      d.starts_at,
      d.ends_at,
      calculated.sale_price_minor
    from public.discount_campaign_products link
    join public.discount_campaigns d on d.id = link.campaign_id
    cross join lateral (
      select case
        when d.discount_type = 'percentage' then
          p.list_price_minor - pg_catalog.floor(
            (p.list_price_minor::numeric * d.discount_value_minor_or_bps::numeric) / 10000
          )::bigint
        when d.discount_type = 'fixed_amount' then
          p.list_price_minor - d.discount_value_minor_or_bps
        when d.discount_type = 'ceiling_price' then link.campaign_sale_price_minor
      end as sale_price_minor
    ) calculated
    where link.model_code = p.model_code
      and d.status = 'published'
      and d.starts_at <= now()
      and d.ends_at >= now()
      and calculated.sale_price_minor is not null
      and calculated.sale_price_minor >= 0
      and calculated.sale_price_minor < p.list_price_minor
      and calculated.sale_price_minor <= p.sale_price_minor
      and calculated.sale_price_minor >= source_price.minimum_price_minor
    limit 1
  ) campaign on true
  where p.published = true
    and p.effective_from <= current_date
    and (p.expires_at is null or p.expires_at >= current_date)
    and c.active = true;
$function$;

comment on function pricing_private.campaign_aware_public_price_rows() is
  'Safe single-campaign customer pricing. Ceiling prices are checked against private floors without exposing those floors.';

commit;
