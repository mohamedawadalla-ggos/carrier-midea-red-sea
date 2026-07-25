begin;

-- catalog_products predates this PR and has RLS policies for insert/update/
-- delete restricted to super_admin/management (catalog_management_insert,
-- catalog_management_update, catalog_management_delete), but the base
-- table-level grant to `authenticated` for those operations was never added
-- — only `grant select` exists. Postgres requires the base grant before RLS
-- policies are even evaluated, so those roles could never actually write to
-- this table at all until now. This was latent because, before this PR, no
-- admin UI ever attempted to write to catalog_products; the new
-- requires_inspection toggle is what exposed it during branch validation.
grant insert, update, delete on public.catalog_products to authenticated;

-- catalog_products also never had a write_audit_log() trigger, unlike every
-- other admin-editable table in this schema.
create trigger catalog_products_audit after insert or update or delete on public.catalog_products
  for each row execute function private.write_audit_log();

commit;
