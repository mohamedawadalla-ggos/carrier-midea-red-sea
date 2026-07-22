begin;

create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin','management','accounts','sales','operations','marketing','auditor');
create type public.record_status as enum ('draft','pending_approval','approved','published','rejected','archived');
create type public.discount_type as enum ('percentage','fixed_amount');
create type public.setting_value_type as enum ('text','url','phone','boolean','number','json');

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalog_products (
  model_code text primary key,
  family_id text not null,
  family_name_ar text not null,
  family_name_en text not null,
  brand text not null check (brand in ('carrier','midea')),
  capacity_hp numeric(4,2) not null check (capacity_hp > 0),
  cooling_mode text not null check (cooling_mode in ('cool-only','heat-pump')),
  refrigerant text not null,
  active boolean not null default true,
  source_reference text not null default 'Carrier and Midea Price List 7th June 2026',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_price_entries (
  id uuid primary key default gen_random_uuid(),
  model_code text not null references public.catalog_products(model_code) on update cascade on delete restrict,
  currency char(3) not null default 'EGP' check (currency ~ '^[A-Z]{3}$'),
  end_user_price_minor bigint not null check (end_user_price_minor >= 0),
  dealer_cost_minor bigint not null check (dealer_cost_minor >= 0),
  minimum_price_minor bigint check (minimum_price_minor is null or minimum_price_minor >= dealer_cost_minor),
  tax_included boolean not null default true,
  effective_from date not null,
  expires_at date check (expires_at is null or expires_at >= effective_from),
  source_reference text not null,
  status public.record_status not null default 'draft',
  created_by uuid not null default auth.uid() references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(model_code, effective_from, source_reference)
);

create table public.published_product_prices (
  model_code text primary key references public.catalog_products(model_code) on update cascade on delete restrict,
  currency char(3) not null default 'EGP' check (currency ~ '^[A-Z]{3}$'),
  list_price_minor bigint not null check (list_price_minor >= 0),
  sale_price_minor bigint not null check (sale_price_minor >= 0 and sale_price_minor <= list_price_minor),
  discount_label_ar text,
  discount_label_en text,
  effective_from date not null,
  expires_at date check (expires_at is null or expires_at >= effective_from),
  published boolean not null default false,
  published_by uuid not null default auth.uid() references auth.users(id),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discount_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,40}$'),
  title_ar text not null,
  title_en text not null,
  discount_type public.discount_type not null,
  discount_value_minor_or_bps bigint not null check (discount_value_minor_or_bps > 0),
  constraint discount_value_matches_type check ((discount_type = 'percentage' and discount_value_minor_or_bps <= 10000) or discount_type = 'fixed_amount'),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status public.record_status not null default 'draft',
  approval_reference text,
  terms_ar text,
  terms_en text,
  created_by uuid not null default auth.uid() references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discount_campaign_products (
  campaign_id uuid not null references public.discount_campaigns(id) on delete cascade,
  model_code text not null references public.catalog_products(model_code) on update cascade on delete cascade,
  primary key (campaign_id, model_code)
);

create table public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_.-]+$'),
  category text not null,
  label_ar text not null,
  label_en text not null,
  value_json jsonb not null,
  value_type public.setting_value_type not null,
  is_public boolean not null default true,
  status public.record_status not null default 'draft',
  created_by uuid default auth.uid() references auth.users(id),
  approved_by uuid references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_ar text not null,
  name_en text not null,
  governorate_ar text not null,
  governorate_en text not null,
  active boolean not null default true,
  sales_available boolean not null default true,
  delivery_available boolean not null default true,
  installation_available boolean not null default true,
  maintenance_available boolean not null default true,
  mobilization_required boolean not null default true,
  requires_inspection boolean not null default false,
  response_time_text_ar text,
  response_time_text_en text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  display_order integer not null default 0,
  status public.record_status not null default 'draft',
  created_by uuid default auth.uid() references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{2,30}$'),
  name_ar text not null,
  name_en text not null,
  city_id uuid references public.service_locations(id) on delete set null,
  active boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  table_name text not null,
  row_id text,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index product_price_entries_model_status_idx on public.product_price_entries(model_code, status);
create index product_price_entries_effective_idx on public.product_price_entries(effective_from desc);
create index published_product_prices_active_idx on public.published_product_prices(published, effective_from, expires_at);
create index discount_campaigns_status_period_idx on public.discount_campaigns(status, starts_at, ends_at);
create index service_locations_public_idx on public.service_locations(status, active, display_order);
create index audit_log_created_idx on public.audit_log(created_at desc);
create index audit_log_actor_idx on public.audit_log(actor_user_id, created_at desc);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.current_staff_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.staff_profiles
  where user_id = (select auth.uid()) and active = true
$$;
revoke all on function private.current_staff_role() from public, anon, authenticated;
grant execute on function private.current_staff_role() to authenticated;

create or replace function private.has_any_role(allowed public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.current_staff_role()) = any(allowed), false)
$$;
revoke all on function private.has_any_role(public.app_role[]) from public, anon, authenticated;
grant execute on function private.has_any_role(public.app_role[]) to authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public, anon, authenticated;

create or replace function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_identifier text;
begin
  row_identifier := coalesce(
    pg_catalog.to_jsonb(new)->>'id',
    pg_catalog.to_jsonb(old)->>'id',
    pg_catalog.to_jsonb(new)->>'model_code',
    pg_catalog.to_jsonb(old)->>'model_code',
    pg_catalog.to_jsonb(new)->>'key',
    pg_catalog.to_jsonb(old)->>'key',
    pg_catalog.to_jsonb(new)->>'user_id',
    pg_catalog.to_jsonb(old)->>'user_id'
  );
  insert into public.audit_log(actor_user_id, table_name, row_id, action, old_data, new_data)
  values ((select auth.uid()), tg_table_name, row_identifier, tg_op,
    case when tg_op in ('UPDATE','DELETE') then pg_catalog.to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then pg_catalog.to_jsonb(new) else null end);
  return coalesce(new, old);
end;
$$;
revoke all on function private.write_audit_log() from public, anon, authenticated;

create trigger staff_profiles_touch before update on public.staff_profiles for each row execute function private.touch_updated_at();
create trigger catalog_products_touch before update on public.catalog_products for each row execute function private.touch_updated_at();
create trigger product_price_entries_touch before update on public.product_price_entries for each row execute function private.touch_updated_at();
create trigger published_product_prices_touch before update on public.published_product_prices for each row execute function private.touch_updated_at();
create trigger discount_campaigns_touch before update on public.discount_campaigns for each row execute function private.touch_updated_at();
create trigger site_settings_touch before update on public.site_settings for each row execute function private.touch_updated_at();
create trigger service_locations_touch before update on public.service_locations for each row execute function private.touch_updated_at();
create trigger warehouses_touch before update on public.warehouses for each row execute function private.touch_updated_at();

create trigger product_price_entries_audit after insert or update or delete on public.product_price_entries for each row execute function private.write_audit_log();
create trigger published_product_prices_audit after insert or update or delete on public.published_product_prices for each row execute function private.write_audit_log();
create trigger discount_campaigns_audit after insert or update or delete on public.discount_campaigns for each row execute function private.write_audit_log();
create trigger site_settings_audit after insert or update or delete on public.site_settings for each row execute function private.write_audit_log();
create trigger service_locations_audit after insert or update or delete on public.service_locations for each row execute function private.write_audit_log();
create trigger warehouses_audit after insert or update or delete on public.warehouses for each row execute function private.write_audit_log();

alter table public.staff_profiles enable row level security;
alter table public.catalog_products enable row level security;
alter table public.product_price_entries enable row level security;
alter table public.published_product_prices enable row level security;
alter table public.discount_campaigns enable row level security;
alter table public.discount_campaign_products enable row level security;
alter table public.site_settings enable row level security;
alter table public.service_locations enable row level security;
alter table public.warehouses enable row level security;
alter table public.audit_log enable row level security;

create policy staff_self_select on public.staff_profiles for select to authenticated
using ((select auth.uid()) = user_id or (select private.has_any_role(array['super_admin','management','auditor']::public.app_role[])));
create policy staff_admin_insert on public.staff_profiles for insert to authenticated
with check ((select private.has_any_role(array['super_admin']::public.app_role[])));
create policy staff_admin_update on public.staff_profiles for update to authenticated
using ((select private.has_any_role(array['super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['super_admin']::public.app_role[])));
create policy staff_admin_delete on public.staff_profiles for delete to authenticated
using ((select private.has_any_role(array['super_admin']::public.app_role[])));

create policy catalog_public_read on public.catalog_products for select to anon, authenticated using (active = true);
create policy catalog_management_insert on public.catalog_products for insert to authenticated
with check ((select private.has_any_role(array['super_admin','management']::public.app_role[])));
create policy catalog_management_update on public.catalog_products for update to authenticated
using ((select private.has_any_role(array['super_admin','management']::public.app_role[])))
with check ((select private.has_any_role(array['super_admin','management']::public.app_role[])));
create policy catalog_management_delete on public.catalog_products for delete to authenticated
using ((select private.has_any_role(array['super_admin']::public.app_role[])));

create policy private_prices_staff_read on public.product_price_entries for select to authenticated
using ((select private.has_any_role(array['super_admin','management','accounts']::public.app_role[])));
create policy private_prices_accounts_insert on public.product_price_entries for insert to authenticated
with check (
  (select private.current_staff_role()) = 'accounts'
  and created_by = (select auth.uid())
  and approved_by is null
  and status in ('draft','pending_approval')
);
create policy private_prices_management_insert on public.product_price_entries for insert to authenticated
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and created_by = (select auth.uid())
  and approved_by is null
  and status in ('draft','pending_approval')
);
create policy private_prices_accounts_update on public.product_price_entries for update to authenticated
using (
  (select private.current_staff_role()) = 'accounts'
  and created_by = (select auth.uid())
  and status in ('draft','pending_approval')
)
with check (
  (select private.current_staff_role()) = 'accounts'
  and created_by = (select auth.uid())
  and approved_by is null
  and status in ('draft','pending_approval')
);
create policy private_prices_management_update on public.product_price_entries for update to authenticated
using (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and status in ('draft','pending_approval')
)
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and created_by is not null
  and (
    (status in ('draft','pending_approval') and approved_by is null)
    or (status in ('approved','published') and approved_by = (select auth.uid()))
    or status in ('rejected','archived')
  )
);
create policy private_prices_management_delete on public.product_price_entries for delete to authenticated
using (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and status in ('draft','pending_approval','rejected','archived')
);

create policy published_prices_public_read on public.published_product_prices for select to anon, authenticated
using (published = true and effective_from <= current_date and (expires_at is null or expires_at >= current_date));
create policy published_prices_staff_read on public.published_product_prices for select to authenticated
using ((select private.current_staff_role()) is not null);
create policy published_prices_management_insert on public.published_product_prices for insert to authenticated
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and published_by = (select auth.uid())
);
create policy published_prices_management_update on public.published_product_prices for update to authenticated
using ((select private.has_any_role(array['super_admin','management']::public.app_role[])))
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and published_by = (select auth.uid())
);
create policy published_prices_management_delete on public.published_product_prices for delete to authenticated
using ((select private.has_any_role(array['super_admin','management']::public.app_role[])));

create policy discounts_staff_read on public.discount_campaigns for select to authenticated using ((select private.current_staff_role()) is not null);
create policy discounts_public_read on public.discount_campaigns for select to anon
using (status = 'published' and starts_at <= now() and ends_at >= now());
create policy discounts_marketing_insert on public.discount_campaigns for insert to authenticated
with check (
  (select private.current_staff_role()) = 'marketing'
  and created_by = (select auth.uid())
  and approved_by is null
  and status in ('draft','pending_approval')
);
create policy discounts_management_insert on public.discount_campaigns for insert to authenticated
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and created_by = (select auth.uid())
  and (
    (status in ('draft','pending_approval') and approved_by is null)
    or (status in ('approved','published') and approved_by = (select auth.uid()))
  )
);
create policy discounts_marketing_update on public.discount_campaigns for update to authenticated
using (
  (select private.current_staff_role()) = 'marketing'
  and created_by = (select auth.uid())
  and status in ('draft','pending_approval')
)
with check (
  (select private.current_staff_role()) = 'marketing'
  and created_by = (select auth.uid())
  and approved_by is null
  and status in ('draft','pending_approval')
);
create policy discounts_management_update on public.discount_campaigns for update to authenticated
using ((select private.has_any_role(array['super_admin','management']::public.app_role[])))
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and (
    (status in ('draft','pending_approval') and approved_by is null)
    or (status in ('approved','published') and approved_by = (select auth.uid()))
    or status in ('rejected','archived')
  )
);
create policy discounts_marketing_delete on public.discount_campaigns for delete to authenticated
using (
  (select private.current_staff_role()) = 'marketing'
  and created_by = (select auth.uid())
  and status = 'draft'
);
create policy discounts_management_delete on public.discount_campaigns for delete to authenticated
using (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and status not in ('approved','published')
);
create policy discount_products_public_read on public.discount_campaign_products for select to anon
using (exists (select 1 from public.discount_campaigns c where c.id = campaign_id and c.status = 'published' and c.starts_at <= now() and c.ends_at >= now()));
create policy discount_products_staff_read on public.discount_campaign_products for select to authenticated
using ((select private.current_staff_role()) is not null);
create policy discount_products_marketing_insert on public.discount_campaign_products for insert to authenticated
with check (
  (select private.current_staff_role()) = 'marketing'
  and exists (
    select 1 from public.discount_campaigns c
    where c.id = campaign_id
      and c.created_by = (select auth.uid())
      and c.status in ('draft','pending_approval')
  )
);
create policy discount_products_management_insert on public.discount_campaign_products for insert to authenticated
with check ((select private.has_any_role(array['super_admin','management']::public.app_role[])));
create policy discount_products_marketing_delete on public.discount_campaign_products for delete to authenticated
using (
  (select private.current_staff_role()) = 'marketing'
  and exists (
    select 1 from public.discount_campaigns c
    where c.id = campaign_id
      and c.created_by = (select auth.uid())
      and c.status in ('draft','pending_approval')
  )
);
create policy discount_products_management_delete on public.discount_campaign_products for delete to authenticated
using ((select private.has_any_role(array['super_admin','management']::public.app_role[])));

create policy settings_public_read on public.site_settings for select to anon
using (is_public = true and status = 'published');
create policy settings_staff_read on public.site_settings for select to authenticated using ((select private.current_staff_role()) is not null);
create policy settings_marketing_insert on public.site_settings for insert to authenticated
with check (
  (select private.current_staff_role()) = 'marketing'
  and created_by = (select auth.uid())
  and approved_by is null
  and published_at is null
  and status in ('draft','pending_approval')
);
create policy settings_management_insert on public.site_settings for insert to authenticated
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and (
    (status in ('draft','pending_approval') and approved_by is null and published_at is null)
    or (status = 'approved' and approved_by = (select auth.uid()))
    or (status = 'published' and approved_by = (select auth.uid()) and published_at is not null)
    or status in ('rejected','archived')
  )
);
create policy settings_marketing_update on public.site_settings for update to authenticated
using (
  (select private.current_staff_role()) = 'marketing'
  and status in ('draft','pending_approval')
)
with check (
  (select private.current_staff_role()) = 'marketing'
  and approved_by is null
  and published_at is null
  and status in ('draft','pending_approval')
);
create policy settings_management_update on public.site_settings for update to authenticated
using ((select private.has_any_role(array['super_admin','management']::public.app_role[])))
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and (
    (status in ('draft','pending_approval') and approved_by is null and published_at is null)
    or (status = 'approved' and approved_by = (select auth.uid()))
    or (status = 'published' and approved_by = (select auth.uid()) and published_at is not null)
    or status in ('rejected','archived')
  )
);

create policy locations_public_read on public.service_locations for select to anon
using (active = true and status = 'published');
create policy locations_staff_read on public.service_locations for select to authenticated using ((select private.current_staff_role()) is not null);
create policy locations_operations_insert on public.service_locations for insert to authenticated
with check (
  (select private.current_staff_role()) = 'operations'
  and created_by = (select auth.uid())
  and approved_by is null
  and status in ('draft','pending_approval')
);
create policy locations_management_insert on public.service_locations for insert to authenticated
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and (
    (status in ('draft','pending_approval') and approved_by is null)
    or (status in ('approved','published') and approved_by = (select auth.uid()))
    or status in ('rejected','archived')
  )
);
create policy locations_management_update on public.service_locations for update to authenticated
using ((select private.has_any_role(array['super_admin','management']::public.app_role[])))
with check (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and (
    (status in ('draft','pending_approval') and approved_by is null)
    or (status in ('approved','published') and approved_by = (select auth.uid()))
    or status in ('rejected','archived')
  )
);
create policy locations_operations_delete on public.service_locations for delete to authenticated
using (
  (select private.current_staff_role()) = 'operations'
  and created_by = (select auth.uid())
  and status = 'draft'
);
create policy locations_management_delete on public.service_locations for delete to authenticated
using (
  (select private.has_any_role(array['super_admin','management']::public.app_role[]))
  and status not in ('approved','published')
);

create policy warehouses_staff_read on public.warehouses for select to authenticated
using ((select private.has_any_role(array['super_admin','management','accounts','operations','auditor']::public.app_role[])));
create policy warehouses_staff_insert on public.warehouses for insert to authenticated
with check (
  (select private.has_any_role(array['super_admin','management','accounts','operations']::public.app_role[]))
  and created_by = (select auth.uid())
);
create policy warehouses_staff_update on public.warehouses for update to authenticated
using ((select private.has_any_role(array['super_admin','management','accounts','operations']::public.app_role[])))
with check ((select private.has_any_role(array['super_admin','management','accounts','operations']::public.app_role[])));
create policy warehouses_management_delete on public.warehouses for delete to authenticated
using ((select private.has_any_role(array['super_admin','management']::public.app_role[])));

create policy audit_authorized_read on public.audit_log for select to authenticated
using ((select private.has_any_role(array['super_admin','management','auditor']::public.app_role[])));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.catalog_products to authenticated;
grant select on public.published_product_prices to authenticated;
grant select on public.discount_campaigns to authenticated;
grant select on public.discount_campaign_products to authenticated;
grant select on public.site_settings to authenticated;
grant select on public.service_locations to authenticated;
grant select, insert, update, delete on public.staff_profiles to authenticated;
grant select, insert, update, delete on public.product_price_entries to authenticated;
grant select, insert, update, delete on public.published_product_prices to authenticated;
grant insert, update, delete on public.discount_campaigns to authenticated;
grant insert, delete on public.discount_campaign_products to authenticated;
grant insert, update on public.site_settings to authenticated;
grant insert, update, delete on public.service_locations to authenticated;
grant select, insert, update, delete on public.warehouses to authenticated;
grant select (id, actor_user_id, table_name, row_id, action, created_at) on public.audit_log to authenticated;

create or replace view public.public_product_prices
with (security_invoker = true)
as
select p.model_code, c.family_id, c.family_name_ar, c.family_name_en, c.brand, c.capacity_hp,
       p.currency, p.list_price_minor, p.sale_price_minor, p.discount_label_ar, p.discount_label_en,
       p.effective_from, p.expires_at, p.published_at
from public.published_product_prices p
join public.catalog_products c using (model_code)
where p.published = true and p.effective_from <= current_date and (p.expires_at is null or p.expires_at >= current_date) and c.active = true;

create or replace view public.public_site_settings
with (security_invoker = true)
as select key, category, value_json, value_type, updated_at
from public.site_settings where is_public = true and status = 'published';

create or replace view public.public_service_locations
with (security_invoker = true)
as select slug, name_ar, name_en, governorate_ar, governorate_en, sales_available, delivery_available,
          installation_available, maintenance_available, mobilization_required, requires_inspection,
          response_time_text_ar, response_time_text_en, latitude, longitude, display_order
from public.service_locations where active = true and status = 'published';

grant select on public.public_product_prices, public.public_site_settings, public.public_service_locations to anon, authenticated;

-- Anonymous clients receive only the columns required by the public views. RLS
-- remains responsible for row visibility; these grants enforce column visibility.
revoke select on public.catalog_products, public.published_product_prices, public.discount_campaigns,
  public.discount_campaign_products, public.site_settings, public.service_locations from anon;
grant select (model_code, family_id, family_name_ar, family_name_en, brand, capacity_hp, active)
  on public.catalog_products to anon;
grant select (model_code, currency, list_price_minor, sale_price_minor, discount_label_ar, discount_label_en,
  effective_from, expires_at, published, published_at) on public.published_product_prices to anon;
grant select (id, code, title_ar, title_en, discount_type, discount_value_minor_or_bps, starts_at, ends_at,
  status, terms_ar, terms_en) on public.discount_campaigns to anon;
grant select (campaign_id, model_code) on public.discount_campaign_products to anon;
grant select (key, category, value_json, value_type, is_public, status, updated_at) on public.site_settings to anon;
grant select (slug, name_ar, name_en, governorate_ar, governorate_en, active, sales_available,
  delivery_available, installation_available, maintenance_available, mobilization_required,
  requires_inspection, response_time_text_ar, response_time_text_en, latitude, longitude, display_order, status)
  on public.service_locations to anon;

create table public.service_location_revisions (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.service_locations(id) on delete cascade,
  active boolean not null,
  sales_available boolean not null,
  delivery_available boolean not null,
  installation_available boolean not null,
  maintenance_available boolean not null,
  mobilization_required boolean not null,
  requires_inspection boolean not null,
  status public.record_status not null default 'pending_approval' check (status in ('pending_approval','published','rejected')),
  created_by uuid not null default auth.uid() references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create unique index service_location_revisions_pending_idx on public.service_location_revisions(location_id)
  where status = 'pending_approval';
create trigger service_location_revisions_audit after insert or update or delete on public.service_location_revisions
  for each row execute function private.write_audit_log();
alter table public.service_location_revisions enable row level security;
create policy location_revisions_staff_read on public.service_location_revisions for select to authenticated
  using ((select private.current_staff_role()) is not null);
create policy location_revisions_operations_insert on public.service_location_revisions for insert to authenticated
  with check ((select private.current_staff_role()) = 'operations' and created_by = (select auth.uid())
    and approved_by is null and status = 'pending_approval');
create policy location_revisions_management_insert on public.service_location_revisions for insert to authenticated
  with check ((select private.has_any_role(array['super_admin','management']::public.app_role[]))
    and created_by = (select auth.uid()) and approved_by is null and status = 'pending_approval');
create policy location_revisions_management_update on public.service_location_revisions for update to authenticated
  using ((select private.has_any_role(array['super_admin','management']::public.app_role[]))
    and status = 'pending_approval')
  with check ((select private.has_any_role(array['super_admin','management']::public.app_role[]))
    and status in ('published','rejected') and approved_by = (select auth.uid()) and reviewed_at is not null);

create or replace function private.enforce_published_location_revision()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'published' and not exists (
    select 1 from public.service_locations location
    where location.id = new.location_id and location.status = 'published'
      and location.active = new.active
      and location.sales_available = new.sales_available
      and location.delivery_available = new.delivery_available
      and location.installation_available = new.installation_available
      and location.maintenance_available = new.maintenance_available
      and location.mobilization_required = new.mobilization_required
      and location.requires_inspection = new.requires_inspection
  ) then
    raise exception 'Published revision does not match the public location';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_published_location_revision() from public, anon, authenticated;
create constraint trigger service_location_revision_consistency
  after insert or update on public.service_location_revisions
  deferrable initially deferred for each row
  execute function private.enforce_published_location_revision();

create or replace function public.publish_service_location_revision(revision_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  revision public.service_location_revisions%rowtype;
begin
  if not (select private.has_any_role(array['super_admin','management']::public.app_role[])) then
    raise exception 'Not authorized';
  end if;
  select * into revision from public.service_location_revisions
    where id = revision_id and status = 'pending_approval' for update;
  if not found then raise exception 'Pending revision not found'; end if;
  update public.service_locations set
    active = revision.active,
    sales_available = revision.sales_available,
    delivery_available = revision.delivery_available,
    installation_available = revision.installation_available,
    maintenance_available = revision.maintenance_available,
    mobilization_required = revision.mobilization_required,
    requires_inspection = revision.requires_inspection,
    status = 'published', approved_by = (select auth.uid())
  where id = revision.location_id;
  update public.service_location_revisions set status = 'published', approved_by = (select auth.uid()),
    reviewed_at = pg_catalog.now() where id = revision.id;
end;
$$;
revoke all on function public.publish_service_location_revision(uuid) from public, anon, authenticated;
grant execute on function public.publish_service_location_revision(uuid) to authenticated;
grant select, insert, update (status, approved_by, reviewed_at) on public.service_location_revisions to authenticated;

commit;
