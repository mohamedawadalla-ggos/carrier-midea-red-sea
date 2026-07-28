# Staff user management proposal

## Scope

Add a super-admin-only Owner Panel screen backed by the authenticated
`manage-staff-users` Edge Function. The function validates the caller against
`public.staff_profiles` before using the server-only service-role credential for
Supabase Auth Admin operations.

Supported actions:

- list Auth users that have staff profiles;
- invite by email and create the matching active staff profile;
- edit email, full name, and role;
- deactivate/reactivate access (no user deletion);
- block self-demotion/self-deactivation and loss of the last active super admin.

## Exact database change

File: `supabase/migrations/20260727203309_harden_staff_user_management.sql`

```sql
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

create trigger staff_profiles_preserve_super_admin
before update of role, active on public.staff_profiles
for each row execute function private.prevent_last_active_super_admin_loss();

drop policy if exists staff_admin_delete on public.staff_profiles;

drop trigger if exists staff_profiles_audit on public.staff_profiles;
create trigger staff_profiles_audit
after insert or update or delete on public.staff_profiles
for each row execute function private.write_audit_log();

commit;
```

## Production preflight

Run read-only and require every row to be `true` before applying:

```sql
select
  to_regclass('public.staff_profiles') is not null as staff_profiles_exists,
  to_regprocedure('private.write_audit_log()') is not null as audit_function_exists,
  to_regprocedure('private.current_staff_role()') is not null as active_role_helper_exists,
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'current_staff_role'
      and pg_get_functiondef(p.oid) ilike '%active = true%'
  ) as role_helper_checks_active,
  exists (
    select 1 from public.staff_profiles
    where role = 'super_admin' and active = true
  ) as active_super_admin_exists;
```

## Roles and data

- `super_admin`: gains the UI/Edge Function workflow, subject to server-side
  authorization and lockout guards.
- Other roles: no new table grants or policies.
- `anon`: no access.
- `service_role`: remains inside the Edge Function; it is never returned to or
  bundled with the browser.
- `staff_profiles`: destructive DELETE through the authenticated Data API is
  removed; INSERT/UPDATE continue under existing super-admin policies.
- `audit_log`: records staff-profile INSERT/UPDATE events through the existing
  private audit function.

Deactivation updates `staff_profiles.active = false` and bans the Auth user.
Existing RLS helpers immediately return no role because they require
`active = true`. Supabase documents that already-issued access JWTs remain valid
until expiry even after session revocation; the RLS active check is therefore the
immediate authorization boundary.

## Rollback

```sql
begin;

drop trigger if exists staff_profiles_audit on public.staff_profiles;
drop trigger if exists staff_profiles_preserve_super_admin on public.staff_profiles;
drop function if exists private.prevent_last_active_super_admin_loss();

create policy staff_admin_delete on public.staff_profiles
for delete to authenticated
using ((select private.has_any_role(array['super_admin']::public.app_role[])));

commit;
```

Rollback restores the prior delete policy. It does not delete Auth users, remove
staff profiles, unban deactivated accounts, or reverse audit rows.

## Verification

1. Run `supabase/tests/staff_user_management_assertions.sql`.
2. Run Security Advisor and confirm no new anonymous exposure.
3. As a super admin, invite a disposable local user and confirm its profile.
4. Confirm management/accounts cannot invoke the function.
5. Confirm self-demotion/self-deactivation is rejected.
6. Confirm the last active super admin cannot be demoted or deactivated.
   Repeat with two concurrent transactions against two super admins and confirm
   the advisory lock prevents both removals from succeeding.
7. Deactivate the disposable user; confirm its database writes fail immediately
   and a new sign-in is rejected.
8. Reactivate it and confirm sign-in/access follow the assigned role.
9. Confirm the staff-profile changes appear in `audit_log`.
