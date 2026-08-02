# Catalog management and storefront visibility proposal

Status: local implementation only; not approved for production application.

## Scope

- Add editable warehouse cards without changing existing warehouse permissions.
- Add catalog family master data and separate `visible` from operational `active`.
- Add management-only family/product editors with draft, pending, published, and archived states.
- Produce a safe public catalog snapshot at build time. OpenAI Sites deployment remains manual.
- Track whether the latest catalog edit has been included in a confirmed manual storefront deployment.

## Affected roles and data

- `super_admin` and `management`: create/update catalog families and products, control visibility, and mark a manual storefront deployment complete.
- `accounts` and `operations`: retain existing warehouse edit permission.
- Other active staff: read catalog master data only through the existing authenticated panel.
- `anon`: may read only `public.public_catalog_rows`. It contains no prices, dealer costs, minimum prices, source references, staff identifiers, or unpublished/hidden rows.
- Existing 13 families are seeded from the reviewed storefront content. Existing 61 products remain operationally active and visible.

## Production preflight

Run and compare before application:

```sql
select count(*) as product_count, count(distinct family_id) as family_count
from public.catalog_products;
-- Expected: 61 products, 13 families.

select family_id, count(*) from public.catalog_products
group by family_id order by family_id;
-- Every family_id must match one of the 13 IDs in the migration.

select to_regtype('public.app_role') is not null as app_role_exists,
       to_regtype('public.record_status') is not null as record_status_exists,
       to_regprocedure('private.has_any_role(public.app_role[])') is not null as has_any_role_exists,
       to_regprocedure('private.current_staff_role()') is not null as current_staff_role_exists,
       to_regprocedure('private.touch_updated_at()') is not null as touch_exists,
       to_regprocedure('private.write_audit_log()') is not null as audit_exists;
-- Expected: all true.

select to_regclass('public.catalog_families') is null as families_absent,
       to_regclass('public.catalog_storefront_deployment_state') is null as deployment_state_absent,
       to_regclass('public.public_catalog_rows') is null as public_snapshot_absent;
-- Expected before first application: all true.
```

If any expected value differs, stop and reconcile rather than applying.

## Verification

1. Run `supabase/tests/admin_catalog_management_assertions.sql`.
2. Confirm 13 family rows and all catalog products have a valid family FK.
3. As `anon`, query `public_catalog_rows`; confirm only safe fields are returned.
4. Hide every model in one family inside a transaction; confirm that family returns zero public rows; roll back.
5. As management, edit a family name and confirm its denormalized product names synchronize and audit rows are written.
6. Confirm accounts/operations can still update a warehouse but cannot update catalog visibility.
7. Build the storefront with production public Supabase variables and confirm generated routes exclude hidden families/models.

## Rollback

Rollback is intentionally separate and must be reviewed before use:

```sql
begin;
drop view if exists public.public_catalog_rows;
drop function if exists catalog_private.public_catalog_rows();
drop schema if exists catalog_private;
drop trigger if exists catalog_families_sync_products on public.catalog_families;
drop function if exists private.sync_catalog_family_to_products();
drop trigger if exists catalog_storefront_deployment_state_audit on public.catalog_storefront_deployment_state;
drop trigger if exists catalog_storefront_deployment_state_touch on public.catalog_storefront_deployment_state;
drop trigger if exists catalog_families_audit on public.catalog_families;
drop trigger if exists catalog_families_touch on public.catalog_families;
alter table public.catalog_products drop constraint if exists catalog_products_supported_hp_check;
alter table public.catalog_products drop constraint if exists catalog_products_family_fk;
alter table public.catalog_products drop column if exists catalog_status;
alter table public.catalog_products drop column if exists display_order;
alter table public.catalog_products drop column if exists energy_class;
alter table public.catalog_products drop column if exists capacity_btu;
alter table public.catalog_products drop column if exists visible;
drop table if exists public.catalog_storefront_deployment_state;
drop table if exists public.catalog_families;
drop policy if exists catalog_staff_read on public.catalog_products;
commit;
```

After rollback, restore the previous static storefront build. No product, price, order, stock, or warehouse row is deleted by this rollback.
