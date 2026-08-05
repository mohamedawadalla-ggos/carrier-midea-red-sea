-- public_stock_status is a security_invoker view that joins catalog_products
-- to filter to active products only (20260725120000). Its anon/authenticated
-- read access relied on the catalog_public_read policy + a direct SELECT
-- grant on catalog_products. Both were removed by
-- 20260802094555_admin_catalog_management.sql when it moved public catalog
-- reads behind catalog_private.public_catalog_rows() instead -- an
-- unintended side effect on this unrelated view, which started failing
-- closed with "permission denied for table catalog_products" the moment
-- that migration landed. Live symptom: the storefront's stock-badge fetch
-- fails, is caught, and silently falls back to treating every model as
-- in_stock (see lib/public-stock.ts) -- an out-of-stock model would show as
-- available with no visible error.
--
-- Fix follows the same pattern already established for public_catalog_rows:
-- move the catalog_products-dependent filtering into a security definer
-- function (catalog_private schema) so anon only ever needs EXECUTE on a
-- narrow function, never a direct grant on catalog_products itself.
begin;

create or replace function catalog_private.public_stock_status_rows()
returns table (model_code text, status public.stock_status, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.model_code, s.status, s.updated_at
  from public.product_stock_status s
  join public.catalog_products c using (model_code)
  where c.active = true
$$;

revoke all on function catalog_private.public_stock_status_rows() from public, anon, authenticated, service_role;
grant execute on function catalog_private.public_stock_status_rows() to anon, authenticated;

drop policy if exists stock_status_public_read on public.product_stock_status;

create or replace view public.public_stock_status with (security_invoker = true) as
select * from catalog_private.public_stock_status_rows();

revoke all on public.public_stock_status from public, anon, authenticated;
grant select on public.public_stock_status to anon, authenticated;

comment on view public.public_stock_status is
  'Safe public stock badge. Exposes only the derived in_stock/out_of_stock label, never quantity_on_hand. Reads via a security definer function so anon needs no direct grant on catalog_products.';

commit;
