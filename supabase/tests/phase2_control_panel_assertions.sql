-- Run after the Phase 2 migration and seed on a disposable verification database.
do $$
declare
  phase2_table text;
  product_count integer;
  policy_using text;
  policy_check text;
  executable_helpers text[];
begin
  select count(*) into product_count from public.catalog_products;
  if product_count <> 61 then
    raise exception 'Expected 61 products, found %', product_count;
  end if;

  -- Every exposed Phase 2 table must have RLS enabled.
  foreach phase2_table in array array[
    'staff_profiles',
    'catalog_products',
    'product_price_entries',
    'published_product_prices',
    'discount_campaigns',
    'discount_campaign_products',
    'site_settings',
    'service_locations',
    'warehouses',
    'audit_log'
  ]
  loop
    if not exists (
      select 1
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = phase2_table
        and c.relkind in ('r', 'p')
        and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', phase2_table;
    end if;
  end loop;

  -- Public views must be invoker-secured and contain no private price fields.
  if exists (
    select 1
    from pg_catalog.pg_views
    where schemaname = 'public'
      and viewname like 'public\_%' escape '\'
      and lower(definition) ~ '(dealer_cost|dealer_price|private[^[:space:],)]*cost)'
  ) or exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name like 'public\_%' escape '\'
      and lower(column_name) ~ '(dealer_cost|dealer_price|private.*cost)'
  ) then
    raise exception 'A public view exposes a private price field';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and c.relname like 'public\_%' escape '\'
      and not (coalesce(c.reloptions, array[]::text[]) @> array['security_invoker=true'])
  ) then
    raise exception 'Every public-facing view must use security_invoker=true';
  end if;

  -- PUBLIC and anon must not execute private authorization or trigger functions.
  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    cross join lateral pg_catalog.aclexplode(
      coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
    ) acl
    where n.nspname = 'private'
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) then
    raise exception 'PUBLIC retains EXECUTE on a private function';
  end if;

  if pg_catalog.has_schema_privilege('anon', 'private', 'USAGE') then
    raise exception 'anon must not have USAGE on the private schema';
  end if;
  if not pg_catalog.has_schema_privilege('authenticated', 'private', 'USAGE') then
    raise exception 'authenticated requires private schema USAGE for approved RLS helpers';
  end if;

  select coalesce(array_agg(p.proname::text order by p.proname::text), array[]::text[])
  into executable_helpers
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE');

  if executable_helpers <> array['current_staff_role', 'has_any_role']::text[] then
    raise exception 'Unexpected authenticated private EXECUTE set: %', executable_helpers;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
  ) then
    raise exception 'anon can execute a private function';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and coalesce(array_to_string(p.proconfig, ','), '') !~ 'search_path='
  ) then
    raise exception 'A private function lacks a fixed search_path';
  end if;

  -- Marketing may insert only non-final discounts without approval metadata.
  select pg_catalog.pg_get_expr(polwithcheck, polrelid)
  into policy_check
  from pg_catalog.pg_policy
  where polname = 'discounts_marketing_insert'
    and polrelid = 'public.discount_campaigns'::regclass;

  if policy_check is null
    or lower(policy_check) not like '%marketing%'
    or lower(policy_check) not like '%draft%'
    or lower(policy_check) not like '%pending_approval%'
    or lower(policy_check) not like '%approved_by is null%'
    or position('published' in lower(policy_check)) > 0
  then
    raise exception 'Marketing discount INSERT policy permits an invalid final state';
  end if;

  -- Marketing may update only existing draft/pending discounts into draft/pending.
  select pg_catalog.pg_get_expr(polqual, polrelid),
         pg_catalog.pg_get_expr(polwithcheck, polrelid)
  into policy_using, policy_check
  from pg_catalog.pg_policy
  where polname = 'discounts_marketing_update'
    and polrelid = 'public.discount_campaigns'::regclass;

  if policy_using is null or policy_check is null
    or lower(policy_using) not like '%draft%'
    or lower(policy_using) not like '%pending_approval%'
    or lower(policy_check) not like '%approved_by is null%'
    or position('published' in lower(policy_using)) > 0
    or position('published' in lower(policy_check)) > 0
  then
    raise exception 'Marketing discount UPDATE policy can publish or edit a final record';
  end if;

  -- Marketing settings policies must reject direct publication and approval metadata.
  select pg_catalog.pg_get_expr(polwithcheck, polrelid)
  into policy_check
  from pg_catalog.pg_policy
  where polname = 'settings_marketing_insert'
    and polrelid = 'public.site_settings'::regclass;

  if policy_check is null
    or lower(policy_check) not like '%draft%'
    or lower(policy_check) not like '%pending_approval%'
    or lower(policy_check) not like '%approved_by is null%'
    or lower(policy_check) not like '%published_at is null%'
    or position('published' in replace(lower(policy_check), 'published_at', '')) > 0
  then
    raise exception 'Marketing setting INSERT policy can publish directly';
  end if;

  select pg_catalog.pg_get_expr(polqual, polrelid),
         pg_catalog.pg_get_expr(polwithcheck, polrelid)
  into policy_using, policy_check
  from pg_catalog.pg_policy
  where polname = 'settings_marketing_update'
    and polrelid = 'public.site_settings'::regclass;

  if policy_using is null or policy_check is null
    or lower(policy_using) not like '%draft%'
    or lower(policy_using) not like '%pending_approval%'
    or lower(policy_check) not like '%approved_by is null%'
    or lower(policy_check) not like '%published_at is null%'
    or position('published' in replace(lower(policy_check), 'published_at', '')) > 0
  then
    raise exception 'Marketing setting UPDATE policy can publish directly';
  end if;

  -- Accounts may create/edit/submit drafts, but never approve or publish them.
  select pg_catalog.pg_get_expr(polwithcheck, polrelid)
  into policy_check
  from pg_catalog.pg_policy
  where polname = 'private_prices_accounts_insert'
    and polrelid = 'public.product_price_entries'::regclass;

  if policy_check is null
    or lower(policy_check) not like '%accounts%'
    or lower(policy_check) not like '%draft%'
    or lower(policy_check) not like '%pending_approval%'
    or lower(policy_check) not like '%approved_by is null%'
    or replace(lower(policy_check), 'approved_by', '') ~ '(^|[^a-z_])approved([^a-z_]|$)'
    or position('published' in lower(policy_check)) > 0
  then
    raise exception 'Accounts price INSERT policy permits approval or publication';
  end if;

  select pg_catalog.pg_get_expr(polqual, polrelid),
         pg_catalog.pg_get_expr(polwithcheck, polrelid)
  into policy_using, policy_check
  from pg_catalog.pg_policy
  where polname = 'private_prices_accounts_update'
    and polrelid = 'public.product_price_entries'::regclass;

  if policy_using is null or policy_check is null
    or lower(policy_using) not like '%draft%'
    or lower(policy_using) not like '%pending_approval%'
    or lower(policy_check) not like '%approved_by is null%'
    or replace(lower(policy_using), 'approved_by', '') ~ '(^|[^a-z_])approved([^a-z_]|$)'
    or replace(lower(policy_check), 'approved_by', '') ~ '(^|[^a-z_])approved([^a-z_]|$)'
    or position('published' in lower(policy_check)) > 0
  then
    raise exception 'Accounts can update an approved price or approve their own price';
  end if;

  -- Management/Super Admin must retain the explicit approval transition.
  select pg_catalog.pg_get_expr(polqual, polrelid),
         pg_catalog.pg_get_expr(polwithcheck, polrelid)
  into policy_using, policy_check
  from pg_catalog.pg_policy
  where polname = 'private_prices_management_update'
    and polrelid = 'public.product_price_entries'::regclass;

  if policy_using is null or policy_check is null
    or lower(policy_check) not like '%management%'
    or lower(policy_check) not like '%super_admin%'
    or lower(policy_check) not like '%approved%'
    or lower(policy_check) not like '%published%'
    or lower(policy_check) not like '%approved_by%auth.uid%'
  then
    raise exception 'Management/Super Admin approval capability is missing or unsafe';
  end if;

  -- Approved/published price history is append-only for every normal workflow role.
  if exists (
    select 1
    from pg_catalog.pg_policy
    where polrelid = 'public.product_price_entries'::regclass
      and polcmd = 'd'
      and lower(pg_catalog.pg_get_expr(polqual, polrelid)) like '%accounts%'
  ) then
    raise exception 'Accounts have a price-history DELETE policy';
  end if;

  select pg_catalog.pg_get_expr(polqual, polrelid)
  into policy_using
  from pg_catalog.pg_policy
  where polname = 'private_prices_management_delete'
    and polrelid = 'public.product_price_entries'::regclass;

  if policy_using is null
    or lower(policy_using) not like '%draft%'
    or lower(policy_using) ~ '(^|[^a-z_])approved([^a-z_]|$)'
    or position('published' in lower(policy_using)) > 0
  then
    raise exception 'Approved/published price history is deletable';
  end if;

  -- Every UPDATE policy must define both old-row and new-row predicates.
  if exists (
    select 1
    from pg_catalog.pg_policy p
    join pg_catalog.pg_class c on c.oid = p.polrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and p.polcmd = 'w'
      and (polqual is null or polwithcheck is null)
  ) then
    raise exception 'An UPDATE policy is missing USING or WITH CHECK';
  end if;

  -- Audit records are trigger-written, append-only, and expose metadata only.
  if exists (
    select 1
    from pg_catalog.pg_policy
    where polrelid = 'public.audit_log'::regclass
      and polcmd <> 'r'
  ) or pg_catalog.has_table_privilege('authenticated', 'public.audit_log', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_log', 'UPDATE')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_log', 'DELETE')
  then
    raise exception 'Audit records are not append-only for staff clients';
  end if;

  if pg_catalog.has_column_privilege('authenticated', 'public.audit_log', 'old_data', 'SELECT')
    or pg_catalog.has_column_privilege('authenticated', 'public.audit_log', 'new_data', 'SELECT')
  then
    raise exception 'Authenticated clients can read private audit payloads';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_trigger
    where not tgisinternal
      and tgname in (
        'product_price_entries_audit',
        'published_product_prices_audit',
        'discount_campaigns_audit',
        'site_settings_audit',
        'service_locations_audit',
        'warehouses_audit'
      )
  ) <> 6 then
    raise exception 'A required sensitive-table audit trigger is missing';
  end if;

  -- Anonymous users must not receive private-table access.
  if pg_catalog.has_table_privilege('anon', 'public.product_price_entries', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.staff_profiles', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.warehouses', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.audit_log', 'SELECT')
  then
    raise exception 'anon can read a private Phase 2 table';
  end if;

  select pg_catalog.pg_get_expr(polqual, polrelid)
  into policy_using
  from pg_catalog.pg_policy
  where polname = 'settings_public_read'
    and polrelid = 'public.site_settings'::regclass;

  if policy_using is null
    or lower(policy_using) not like '%is_public%'
    or lower(policy_using) not like '%published%'
  then
    raise exception 'Anonymous users can read unpublished settings';
  end if;

  -- Authorization must not depend on user-editable metadata.
  if exists (
    select 1
    from pg_catalog.pg_policy
    where coalesce(pg_catalog.pg_get_expr(polqual, polrelid), '') ~* 'user_metadata|raw_user_meta_data'
       or coalesce(pg_catalog.pg_get_expr(polwithcheck, polrelid), '') ~* 'user_metadata|raw_user_meta_data'
  ) or exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and case
        when p.prokind = 'f' then pg_catalog.pg_get_functiondef(p.oid)
        else ''
      end ~* 'user_metadata|raw_user_meta_data'
  ) then
    raise exception 'Authorization references user-editable metadata';
  end if;

  -- No private-schema tables or table grants may be exposed to API roles.
  if exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'private'
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
  ) then
    raise exception 'The private helper schema contains an API-exposable relation';
  end if;
end
$$;

select key, value_json from public.site_settings where key = 'contact.whatsapp_number';
select count(*) as seeded_locations from public.service_locations;
