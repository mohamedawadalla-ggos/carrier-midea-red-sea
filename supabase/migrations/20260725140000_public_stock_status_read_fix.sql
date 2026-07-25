begin;

-- public_stock_status is security_invoker = true, so an anon query against
-- it is evaluated using anon's own RLS visibility on the underlying
-- product_stock_status table — which, until now, only allowed staff roles.
-- Result: the view silently returned zero rows to anon regardless of data,
-- even though the same view returns all rows correctly under an
-- unrestricted role. This policy grants exactly the same visibility the
-- view's own join already filters for (active products only), so it does
-- not widen exposure beyond what was intended — it just makes the existing
-- filter actually reachable by anon.
create policy stock_status_public_read on public.product_stock_status for select to anon, authenticated
  using (exists (
    select 1 from public.catalog_products c
    where c.model_code = product_stock_status.model_code and c.active = true
  ));

commit;
