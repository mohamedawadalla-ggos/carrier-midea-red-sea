-- Operations can toggle a service capability flag on a city that's already
-- live without silently unpublishing it. Previously any operations edit
-- unconditionally forced status to 'pending_approval', which immediately
-- hid the city from public reads (locations_public_read requires
-- status = 'published') as a side effect of touching an unrelated flag
-- like requires_inspection.
--
-- Operations still cannot use this path to newly publish a city that
-- wasn't already live — the trigger below blocks any transition into
-- 'published' from a non-published status for that role, so publishing
-- for the first time still requires Management or Super Admin.
begin;

create or replace function private.prevent_operations_location_republish()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select private.current_staff_role()) = 'operations'
     and new.status = 'published'
     and old.status is distinct from 'published' then
    raise exception 'Operations cannot publish a service location; only Management or Super Admin can.';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_operations_location_republish() from public, anon, authenticated;

create trigger service_locations_prevent_operations_republish
before update on public.service_locations
for each row execute function private.prevent_operations_location_republish();

drop policy if exists locations_operations_update on public.service_locations;
create policy locations_operations_update on public.service_locations for update to authenticated
using (
  (select private.current_staff_role()) = 'operations'
  and status in ('draft','pending_approval','published')
)
with check (
  (select private.current_staff_role()) = 'operations'
  and (
    (approved_by is null and status in ('draft','pending_approval'))
    or status = 'published'
  )
);

commit;
