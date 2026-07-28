do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'staff_profiles'
      and cmd = 'DELETE'
  ) then
    raise exception 'staff_profiles must not expose a DELETE policy';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.staff_profiles'::regclass
      and tgname = 'staff_profiles_audit'
      and not tgisinternal
  ) then
    raise exception 'staff_profiles audit trigger is missing';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.staff_profiles'::regclass
      and tgname = 'staff_profiles_preserve_super_admin'
      and not tgisinternal
  ) then
    raise exception 'last-active-super-admin trigger is missing';
  end if;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'prevent_last_active_super_admin_loss'
      and p.prosecdef = false
      and pg_get_functiondef(p.oid) ilike '%set search_path to ''''%'
      and pg_get_functiondef(p.oid) ilike '%pg_advisory_xact_lock%'
  ) then
    raise exception 'last-active-super-admin function is missing or unsafe';
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'current_staff_role'
      and pg_get_functiondef(p.oid) ilike '%active = true%'
  ) then
    raise exception 'privileged role resolution must reject inactive staff';
  end if;
end
$$;
