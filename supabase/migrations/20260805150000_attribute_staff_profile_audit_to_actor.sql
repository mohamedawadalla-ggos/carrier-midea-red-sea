-- manage-staff-users (the only writer of staff_profiles) runs entirely on
-- the service_role key, so auth.uid() is null for every write it makes --
-- write_audit_log() then records actor_user_id as null, which the admin
-- panel's Audit tab renders as "System". That's a real accountability gap
-- specifically on the one panel whose whole purpose is tracking who did
-- what: deactivating a staff member (including, as found during UAT,
-- another super admin) shows up in the log with no attributable actor.
--
-- Fix: route staff_profiles writes through two new security definer RPCs
-- that set a transaction-local app.acting_user_id before writing, and teach
-- write_audit_log() to fall back to that when auth.uid() is null. Both the
-- RPC and the write happen in the same function call/transaction, so the
-- config is guaranteed visible to the trigger -- unlike trying to set it in
-- a separate PostgREST request, which would not reliably survive to a
-- later call.
begin;

create or replace function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_identifier text;
  acting_user uuid;
begin
  acting_user := coalesce(
    (select auth.uid()),
    nullif(pg_catalog.current_setting('app.acting_user_id', true), '')::uuid
  );
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
  values (acting_user, tg_table_name, row_identifier, tg_op,
    case when tg_op in ('UPDATE','DELETE') then pg_catalog.to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then pg_catalog.to_jsonb(new) else null end);
  return coalesce(new, old);
end;
$$;

create or replace function private.admin_insert_staff_profile(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_full_name text,
  p_role public.app_role,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.set_config('app.acting_user_id', p_actor_user_id::text, true);
  insert into public.staff_profiles (user_id, full_name, role, active)
  values (p_target_user_id, p_full_name, p_role, p_active);
end;
$$;

create or replace function private.admin_update_staff_profile(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_full_name text,
  p_role public.app_role,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.set_config('app.acting_user_id', p_actor_user_id::text, true);
  update public.staff_profiles
    set full_name = p_full_name, role = p_role, active = p_active
    where user_id = p_target_user_id;
end;
$$;

-- service_role (the only caller, via the edge function) bypasses grants,
-- so these are intentionally not granted to anon/authenticated.
revoke all on function private.admin_insert_staff_profile(uuid, uuid, text, public.app_role, boolean) from public, anon, authenticated;
revoke all on function private.admin_update_staff_profile(uuid, uuid, text, public.app_role, boolean) from public, anon, authenticated;

commit;
