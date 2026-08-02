begin;

revoke all privileges
on table public.catalog_families
from anon;

revoke all privileges
on table public.catalog_storefront_deployment_state
from anon;

revoke all privileges
on table public.catalog_families
from authenticated;

grant select, insert, update
on table public.catalog_families
to authenticated;

revoke all privileges
on table public.catalog_storefront_deployment_state
from authenticated;

grant select, update
on table public.catalog_storefront_deployment_state
to authenticated;

create index catalog_families_created_by_idx
  on public.catalog_families(created_by);

create index catalog_families_approved_by_idx
  on public.catalog_families(approved_by);

create index catalog_storefront_deployment_state_updated_by_idx
  on public.catalog_storefront_deployment_state(updated_by);

commit;
