do $$
declare
  family_count integer;
  product_count integer;
  unsafe_columns integer;
begin
  if has_table_privilege('anon', 'public.catalog_products', 'select') then
    raise exception 'anon must not read catalog_products directly';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'catalog_products'
      and policyname = 'catalog_public_read'
  ) then
    raise exception 'legacy catalog_public_read policy must be removed';
  end if;

  if to_regclass('public.catalog_families') is null then
    raise exception 'catalog_families is missing';
  end if;
  if to_regclass('public.catalog_storefront_deployment_state') is null then
    raise exception 'catalog_storefront_deployment_state is missing';
  end if;

  select count(*) into family_count from public.catalog_families;
  if family_count <> 13 then
    raise exception 'Expected 13 seeded families, got %', family_count;
  end if;

  select count(*) into product_count from public.catalog_products p
  join public.catalog_families f on f.id = p.family_id;
  if product_count <> (select count(*) from public.catalog_products) then
    raise exception 'A product is not linked to a catalog family';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_families' and c.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on catalog_families';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'sync_catalog_family_to_products'
      and not p.prosecdef and p.proconfig @> array['search_path=""']
  ) then
    raise exception 'Family synchronization must be locked SECURITY INVOKER';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'catalog_private' and p.proname = 'public_catalog_rows'
      and p.prosecdef and p.proconfig @> array['search_path=""']
  ) then
    raise exception 'public_catalog_rows must be locked SECURITY DEFINER';
  end if;

  select count(*) into unsafe_columns
  from information_schema.columns
  where table_schema = 'public' and table_name = 'public_catalog_rows'
    and column_name in ('dealer_cost_minor','minimum_price_minor','source_reference','created_by','approved_by');
  if unsafe_columns <> 0 then
    raise exception 'Public catalog view exposes a private column';
  end if;

  if has_table_privilege('anon', 'public.catalog_families', 'SELECT') then
    raise exception 'anon must not read catalog_families directly';
  end if;
  if not has_table_privilege('anon', 'public.public_catalog_rows', 'SELECT') then
    raise exception 'anon cannot read the safe public catalog view';
  end if;
  if not has_schema_privilege('anon', 'catalog_private', 'USAGE')
     or not has_function_privilege('anon', 'catalog_private.public_catalog_rows()', 'EXECUTE') then
    raise exception 'anon cannot execute the safe catalog snapshot helper';
  end if;

  if exists (
    select 1
    from public.catalog_families f
    where f.visible and f.status = 'published'
      and not exists (
        select 1 from public.catalog_products p
        where p.family_id = f.id and p.visible and p.active and p.catalog_status = 'published'
      )
      and exists (select 1 from public.public_catalog_rows r where r.family_id = f.id)
  ) then
    raise exception 'A family without visible products leaked into the public catalog view';
  end if;
end $$;
