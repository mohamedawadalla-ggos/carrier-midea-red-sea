begin;

do $$
begin
  if to_regtype('public.app_role') is null
     or to_regtype('public.record_status') is null
     or to_regprocedure('private.has_any_role(public.app_role[])') is null
     or to_regprocedure('private.current_staff_role()') is null
     or to_regprocedure('private.touch_updated_at()') is null
     or to_regprocedure('private.write_audit_log()') is null then
    raise exception 'Catalog management prerequisites are missing';
  end if;
  if to_regclass('public.catalog_products') is null
     or to_regclass('public.warehouses') is null then
    raise exception 'Catalog or warehouse base table is missing';
  end if;
end $$;

create table public.catalog_families (
  id text primary key check (id ~ '^[a-z0-9-]{3,80}$'),
  slug text not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  brand text not null check (brand in ('carrier','midea')),
  name_ar text not null check (length(trim(name_ar)) between 2 and 120),
  name_en text not null check (length(trim(name_en)) between 2 and 120),
  product_type text not null check (product_type in ('wall-mounted-split','concealed-ducted','ceiling-cassette','floor-standing')),
  market_segments text[] not null default '{}' check (market_segments <@ array['residential','commercial','projects']::text[]),
  technology text not null check (technology in ('inverter','fixed-speed')),
  refrigerant text not null check (refrigerant in ('R32','R410A')),
  description_ar text not null default '',
  description_en text not null default '',
  highlights_ar text[] not null default '{}',
  highlights_en text[] not null default '{}',
  family_image_path text,
  asset_authorization text not null default 'pending' check (asset_authorization in ('approved','pending')),
  featured boolean not null default false,
  display_order integer not null default 0 check (display_order >= 0),
  visible boolean not null default false,
  status public.record_status not null default 'draft',
  source_reference text not null,
  created_by uuid default auth.uid() references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand, slug)
);

create table public.catalog_storefront_deployment_state (
  singleton boolean primary key default true check (singleton),
  last_deployed_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.catalog_storefront_deployment_state (singleton) values (true);

insert into public.catalog_families
  (id, slug, brand, name_ar, name_en, product_type, market_segments, technology, refrigerant,
   description_ar, description_en, family_image_path, asset_authorization, featured, display_order,
   visible, status, source_reference)
values
  ('carrier-xcool-inverter','xcool-inverter','carrier','XCOOL إنفرتر','XCOOL Inverter','wall-mounted-split',array['residential'],'inverter','R32','عائلة سبليت حائطية بتقنية الإنفرتر ومبرد R32.','Wall-mounted split family with inverter technology and R32 refrigerant.','/products/catalog/carrier/xcool-inverter.webp','approved',true,1,true,'published','Storefront catalog snapshot'),
  ('carrier-optimax-inverter','optimax-inverter','carrier','Optimax إنفرتر','Optimax Inverter','wall-mounted-split',array['residential','commercial'],'inverter','R410A','عائلة سبليت حائطية إنفرتر بمبرد R410A.','Wall-mounted inverter family using R410A refrigerant.','/products/catalog/carrier/optimax-inverter.webp','approved',false,2,true,'published','Storefront catalog snapshot'),
  ('carrier-optimax-pro','optimax-pro','carrier','Optimax Pro','Optimax Pro','wall-mounted-split',array['residential','commercial'],'fixed-speed','R410A','عائلة سبليت حائطية ثابتة السرعة بمبرد R410A.','Fixed-speed wall-mounted split family using R410A refrigerant.','/products/catalog/carrier/optimax-pro.webp','approved',true,3,true,'published','Storefront catalog snapshot'),
  ('carrier-xcool','xcool','carrier','XCOOL','XCOOL','wall-mounted-split',array['residential'],'fixed-speed','R32','عائلة سبليت حائطية ثابتة السرعة بمبرد R32.','Wall-mounted split family using R32 refrigerant.',null,'pending',false,4,true,'published','Storefront catalog snapshot'),
  ('carrier-classicool-inverter','classicool-inverter','carrier','ClassiCool إنفرتر','ClassiCool Inverter','concealed-ducted',array['commercial','projects'],'inverter','R410A','عائلة تكييف مخفي ودكت بتقنية الإنفرتر.','Concealed ducted family with inverter technology.','/products/catalog/carrier/classicool-inverter.webp','approved',true,5,true,'published','Storefront catalog snapshot'),
  ('carrier-classicool-pro','classicool-pro','carrier','ClassiCool Pro','ClassiCool Pro','concealed-ducted',array['commercial','projects'],'fixed-speed','R410A','عائلة تكييف مخفي ودكت ثابتة السرعة.','Fixed-speed concealed ducted family.','/products/catalog/carrier/classicool-pro.webp','approved',false,6,true,'published','Storefront catalog snapshot'),
  ('carrier-decor-inverter','decor-inverter','carrier','DÉCOR إنفرتر','DÉCOR Inverter','ceiling-cassette',array['commercial','projects'],'inverter','R410A','عائلة كاسيت سقفية بتقنية الإنفرتر.','Ceiling cassette family with inverter technology.','/products/catalog/carrier/decor-inverter.webp','approved',false,7,true,'published','Storefront catalog snapshot'),
  ('carrier-elegant-inverter','elegant-inverter','carrier','Elegant إنفرتر','Elegant Inverter','floor-standing',array['commercial','projects'],'inverter','R410A','عائلة تكييف دولابي بتقنية الإنفرتر.','Floor-standing family with inverter technology.','/products/catalog/carrier/elegant-inverter.webp','approved',false,8,true,'published','Storefront catalog snapshot'),
  ('carrier-elegant-pro','elegant-pro','carrier','Elegant Pro','Elegant Pro','floor-standing',array['commercial','projects'],'fixed-speed','R410A','عائلة تكييف دولابي ثابتة السرعة.','Fixed-speed floor-standing family.',null,'pending',false,9,true,'published','Storefront catalog snapshot'),
  ('midea-ai-ecomaster-inverter','ai-ecomaster-inverter','midea','AI ECOMASTER إنفرتر','AI ECOMASTER Inverter','wall-mounted-split',array['residential'],'inverter','R32','عائلة سبليت حائطية بتقنية الإنفرتر ومبرد R32.','Wall-mounted split family with inverter technology and R32 refrigerant.','/products/catalog/midea/ai-ecomaster-inverter.webp','approved',true,10,true,'published','Storefront catalog snapshot'),
  ('midea-mission-inverter','mission-inverter','midea','Mission إنفرتر','Mission Inverter','wall-mounted-split',array['residential','commercial'],'inverter','R410A','عائلة سبليت حائطية إنفرتر بمبرد R410A.','Wall-mounted inverter family using R410A refrigerant.','/products/catalog/midea/mission-inverter.webp','approved',false,11,true,'published','Storefront catalog snapshot'),
  ('midea-xtreme-pro','xtreme-pro','midea','XTreme Pro','XTreme Pro','wall-mounted-split',array['residential'],'fixed-speed','R32','عائلة سبليت حائطية ثابتة السرعة بمبرد R32.','Wall-mounted split family using R32 refrigerant.','/products/catalog/midea/xtreme-pro.webp','approved',true,12,true,'published','Storefront catalog snapshot'),
  ('midea-mission-pro','mission-pro','midea','Mission Pro','Mission Pro','wall-mounted-split',array['residential','commercial'],'fixed-speed','R410A','عائلة سبليت حائطية ثابتة السرعة بمبرد R410A.','Fixed-speed wall-mounted split family using R410A refrigerant.',null,'pending',true,13,true,'published','Storefront catalog snapshot');

update public.catalog_families
set highlights_ar = array['موديلات متعددة داخل العائلة','السعر الحالي متاح عند الطلب'],
    highlights_en = array['Multiple model configurations','Current price available on request'];

do $$
begin
  if exists (
    select 1 from public.catalog_products p
    left join public.catalog_families f on f.id = p.family_id
    where f.id is null
  ) then
    raise exception 'A catalog product references a family absent from the storefront snapshot';
  end if;
end $$;

alter table public.catalog_products
  add column visible boolean not null default true,
  add column capacity_btu integer check (capacity_btu is null or capacity_btu > 0),
  add column energy_class text,
  add column display_order integer not null default 0 check (display_order >= 0),
  add column catalog_status public.record_status not null default 'published';

alter table public.catalog_products alter column visible set default false;
alter table public.catalog_products alter column catalog_status set default 'draft';

alter table public.catalog_products
  add constraint catalog_products_family_fk foreign key (family_id)
  references public.catalog_families(id) on update cascade on delete restrict;
alter table public.catalog_products
  add constraint catalog_products_supported_hp_check
  check (capacity_hp in (1.5, 2.25, 3, 4, 5, 6, 7.5));

create index catalog_families_visibility_idx on public.catalog_families(status, visible, display_order);
create index catalog_products_family_visibility_idx on public.catalog_products(family_id, catalog_status, visible, display_order);

create trigger catalog_families_touch before update on public.catalog_families
  for each row execute function private.touch_updated_at();
create trigger catalog_families_audit after insert or update or delete on public.catalog_families
  for each row execute function private.write_audit_log();

create or replace function private.sync_catalog_family_to_products()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (new.name_ar, new.name_en, new.brand, new.refrigerant)
     is distinct from (old.name_ar, old.name_en, old.brand, old.refrigerant) then
    update public.catalog_products
    set family_name_ar = new.name_ar,
        family_name_en = new.name_en,
        brand = new.brand,
        refrigerant = new.refrigerant
    where family_id = new.id;
  end if;
  return new;
end
$$;
revoke all on function private.sync_catalog_family_to_products() from public, anon, authenticated;
create trigger catalog_families_sync_products after update of name_ar, name_en, brand, refrigerant on public.catalog_families
  for each row execute function private.sync_catalog_family_to_products();
create trigger catalog_storefront_deployment_state_touch before update on public.catalog_storefront_deployment_state
  for each row execute function private.touch_updated_at();
create trigger catalog_storefront_deployment_state_audit after update on public.catalog_storefront_deployment_state
  for each row execute function private.write_audit_log();

alter table public.catalog_families enable row level security;
alter table public.catalog_storefront_deployment_state enable row level security;

-- Public catalog reads must use public.public_catalog_rows below. The legacy
-- policy exposed every active catalog row directly, including draft/hidden
-- rows, so remove that bypass before granting the safe view.
drop policy if exists catalog_public_read on public.catalog_products;
revoke select on public.catalog_products from anon;

create policy catalog_families_staff_read on public.catalog_families for select to authenticated
  using ((select private.current_staff_role()) is not null);
create policy catalog_families_management_insert on public.catalog_families for insert to authenticated
  with check (
    (select private.has_any_role(array['super_admin','management']::public.app_role[]))
    and created_by = (select auth.uid())
    and approved_by is null
    and status = 'draft'
    and visible = false
  );
create policy catalog_families_management_update on public.catalog_families for update to authenticated
  using ((select private.has_any_role(array['super_admin','management']::public.app_role[])))
  with check ((select private.has_any_role(array['super_admin','management']::public.app_role[])));

create policy catalog_deployment_state_staff_read on public.catalog_storefront_deployment_state for select to authenticated
  using ((select private.current_staff_role()) is not null);
create policy catalog_deployment_state_management_update on public.catalog_storefront_deployment_state for update to authenticated
  using ((select private.has_any_role(array['super_admin','management']::public.app_role[])))
  with check (
    (select private.has_any_role(array['super_admin','management']::public.app_role[]))
    and singleton = true and updated_by = (select auth.uid())
  );

create policy catalog_staff_read on public.catalog_products for select to authenticated
  using ((select private.current_staff_role()) is not null);

grant select, insert, update on public.catalog_families to authenticated;
grant select, update on public.catalog_storefront_deployment_state to authenticated;
grant select, insert, update on public.catalog_products to authenticated;
revoke delete on public.catalog_families from anon, authenticated;

create schema if not exists catalog_private;
revoke all on schema catalog_private from public, anon, authenticated, service_role;
grant usage on schema catalog_private to anon, authenticated;

create or replace function catalog_private.public_catalog_rows()
returns table (
  family_id text, family_slug text, brand text, family_name_ar text, family_name_en text,
  product_type text, market_segments text[], technology text, refrigerant text,
  description_ar text, description_en text, highlights_ar text[], highlights_en text[], family_image_path text,
  asset_authorization text, featured boolean, family_display_order integer,
  model_code text, capacity_hp numeric, capacity_btu integer, cooling_mode text,
  energy_class text, product_display_order integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    f.id, f.slug, f.brand, f.name_ar, f.name_en, f.product_type,
    f.market_segments, f.technology, f.refrigerant, f.description_ar,
    f.description_en, f.highlights_ar, f.highlights_en, f.family_image_path, f.asset_authorization,
    f.featured, f.display_order, p.model_code, p.capacity_hp,
    p.capacity_btu, p.cooling_mode, p.energy_class, p.display_order
  from public.catalog_families f
  join public.catalog_products p on p.family_id = f.id
  where f.status = 'published' and f.visible = true
    and p.catalog_status = 'published' and p.visible = true and p.active = true
  order by f.display_order, p.display_order, p.capacity_hp, p.model_code
$$;

revoke all on function catalog_private.public_catalog_rows() from public, anon, authenticated, service_role;
grant execute on function catalog_private.public_catalog_rows() to anon, authenticated;

create view public.public_catalog_rows with (security_invoker = true) as
select * from catalog_private.public_catalog_rows();

revoke all on public.public_catalog_rows from public, anon, authenticated;
grant select on public.public_catalog_rows to anon, authenticated;

comment on view public.public_catalog_rows is
  'Safe public catalog snapshot. Excludes source references, staff IDs, prices, costs, and unpublished/hidden rows.';

commit;
