begin;

revoke select on public.catalog_products, public.published_product_prices, public.discount_campaigns,
  public.discount_campaign_products, public.site_settings, public.service_locations from anon;
grant select (model_code, family_id, family_name_ar, family_name_en, brand, capacity_hp, active) on public.catalog_products to anon;
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
  id uuid primary key default gen_random_uuid(), location_id uuid not null references public.service_locations(id) on delete cascade,
  active boolean not null, sales_available boolean not null, delivery_available boolean not null,
  installation_available boolean not null, maintenance_available boolean not null, mobilization_required boolean not null,
  requires_inspection boolean not null, status public.record_status not null default 'pending_approval'
    check (status in ('pending_approval','published','rejected')),
  created_by uuid not null default auth.uid() references auth.users(id), approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(), reviewed_at timestamptz
);
create unique index service_location_revisions_pending_idx on public.service_location_revisions(location_id) where status = 'pending_approval';
create trigger service_location_revisions_audit after insert or update or delete on public.service_location_revisions
  for each row execute function private.write_audit_log();
alter table public.service_location_revisions enable row level security;
create policy location_revisions_staff_read on public.service_location_revisions for select to authenticated using ((select private.current_staff_role()) is not null);
create policy location_revisions_operations_insert on public.service_location_revisions for insert to authenticated
  with check ((select private.current_staff_role()) = 'operations' and created_by = (select auth.uid()) and approved_by is null and status = 'pending_approval');
create policy location_revisions_management_insert on public.service_location_revisions for insert to authenticated
  with check ((select private.has_any_role(array['super_admin','management']::public.app_role[])) and created_by = (select auth.uid()) and approved_by is null and status = 'pending_approval');
create policy location_revisions_management_update on public.service_location_revisions for update to authenticated
  using ((select private.has_any_role(array['super_admin','management']::public.app_role[])) and status = 'pending_approval')
  with check ((select private.has_any_role(array['super_admin','management']::public.app_role[])) and status in ('published','rejected') and approved_by = (select auth.uid()) and reviewed_at is not null);
drop policy locations_operations_update on public.service_locations;

create or replace function private.enforce_published_location_revision() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.status = 'published' and not exists (
    select 1 from public.service_locations location where location.id = new.location_id and location.status = 'published'
      and location.active = new.active and location.sales_available = new.sales_available
      and location.delivery_available = new.delivery_available and location.installation_available = new.installation_available
      and location.maintenance_available = new.maintenance_available
      and location.mobilization_required = new.mobilization_required and location.requires_inspection = new.requires_inspection
  ) then raise exception 'Published revision does not match the public location'; end if;
  return new;
end;
$$;
revoke all on function private.enforce_published_location_revision() from public, anon, authenticated;
create constraint trigger service_location_revision_consistency after insert or update on public.service_location_revisions
  deferrable initially deferred for each row execute function private.enforce_published_location_revision();

create or replace function public.publish_service_location_revision(revision_id uuid) returns void language plpgsql security invoker set search_path = '' as $$
declare revision public.service_location_revisions%rowtype;
begin
  if not (select private.has_any_role(array['super_admin','management']::public.app_role[])) then raise exception 'Not authorized'; end if;
  select * into revision from public.service_location_revisions where id = revision_id and status = 'pending_approval' for update;
  if not found then raise exception 'Pending revision not found'; end if;
  update public.service_locations set active=revision.active, sales_available=revision.sales_available,
    delivery_available=revision.delivery_available, installation_available=revision.installation_available,
    maintenance_available=revision.maintenance_available, mobilization_required=revision.mobilization_required,
    requires_inspection=revision.requires_inspection, status='published', approved_by=(select auth.uid()) where id=revision.location_id;
  update public.service_location_revisions set status='published', approved_by=(select auth.uid()), reviewed_at=pg_catalog.now() where id=revision.id;
end;
$$;
revoke all on function public.publish_service_location_revision(uuid) from public, anon, authenticated;
grant execute on function public.publish_service_location_revision(uuid) to authenticated;
grant select, insert, update (status, approved_by, reviewed_at) on public.service_location_revisions to authenticated;

commit;
