begin;

create or replace function private.prevent_last_active_super_admin_loss()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.role = 'super_admin'
     and old.active = true
     and not (new.role = 'super_admin' and new.active = true) then
    -- Serialize every operation that can remove an active super admin so two
    -- concurrent updates cannot both observe the other row and leave zero.
    perform pg_catalog.pg_advisory_xact_lock(730124867);

    if not exists (
      select 1
      from public.staff_profiles
      where user_id <> old.user_id
        and role = 'super_admin'
        and active = true
    ) then
      raise exception using
        errcode = '23514',
        message = 'The last active super admin cannot be demoted or deactivated.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_last_active_super_admin_loss()
  from public, anon, authenticated;

drop trigger if exists staff_profiles_preserve_super_admin on public.staff_profiles;
create trigger staff_profiles_preserve_super_admin
before update of role, active on public.staff_profiles
for each row execute function private.prevent_last_active_super_admin_loss();

-- The Owner Panel uses deactivation rather than destructive staff-profile
-- deletion, preserving audit history and foreign-key ownership records.
drop policy if exists staff_admin_delete on public.staff_profiles;

drop trigger if exists staff_profiles_audit on public.staff_profiles;
create trigger staff_profiles_audit
after insert or update or delete on public.staff_profiles
for each row execute function private.write_audit_log();

commit;
