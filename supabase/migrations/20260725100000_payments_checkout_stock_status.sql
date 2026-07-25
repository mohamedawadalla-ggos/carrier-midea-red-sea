begin;

-- Stock status ---------------------------------------------------------

create type public.stock_status as enum ('in_stock', 'out_of_stock');

create table public.product_stock_status (
  model_code text primary key references public.catalog_products(model_code) on update cascade on delete cascade,
  status public.stock_status not null default 'in_stock',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create trigger product_stock_status_touch before update on public.product_stock_status
  for each row execute function private.touch_updated_at();
create trigger product_stock_status_audit after insert or update or delete on public.product_stock_status
  for each row execute function private.write_audit_log();

alter table public.product_stock_status enable row level security;

create policy stock_status_staff_read on public.product_stock_status for select to authenticated
  using ((select private.has_any_role(array['super_admin','management','accounts','operations']::public.app_role[])));
create policy stock_status_ops_write on public.product_stock_status for update to authenticated
  using ((select private.has_any_role(array['super_admin','management','accounts','operations']::public.app_role[])))
  with check ((select private.has_any_role(array['super_admin','management','accounts','operations']::public.app_role[])) and updated_by = (select auth.uid()));
create policy stock_status_ops_insert on public.product_stock_status for insert to authenticated
  with check ((select private.has_any_role(array['super_admin','management','accounts','operations']::public.app_role[])) and updated_by = (select auth.uid()));

create or replace view public.public_stock_status with (security_invoker = true) as
select s.model_code, s.status, s.updated_at
from public.product_stock_status s
join public.catalog_products c using (model_code)
where c.active = true;

comment on view public.public_stock_status is
  'Safe public stock badge. Excludes updated_by and any internal fields.';

-- Stock notify requests (storefront''s first public WRITE) --------------

create type public.notify_request_status as enum ('pending', 'notified', 'cancelled');

create table public.stock_notify_requests (
  id uuid primary key default gen_random_uuid(),
  model_code text not null references public.catalog_products(model_code) on update cascade on delete cascade,
  customer_name text not null check (length(trim(customer_name)) between 2 and 120),
  contact text not null check (length(trim(contact)) between 5 and 120),
  locale text not null check (locale in ('ar','en')),
  status public.notify_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  notified_by uuid references auth.users(id)
);

create trigger stock_notify_requests_audit after insert or update or delete on public.stock_notify_requests
  for each row execute function private.write_audit_log();

alter table public.stock_notify_requests enable row level security;

create policy notify_requests_public_insert on public.stock_notify_requests for insert to anon, authenticated
  with check (status = 'pending' and notified_at is null and notified_by is null);
create policy notify_requests_staff_read on public.stock_notify_requests for select to authenticated
  using ((select private.has_any_role(array['super_admin','management','sales','marketing','operations']::public.app_role[])));
create policy notify_requests_staff_update on public.stock_notify_requests for update to authenticated
  using ((select private.has_any_role(array['super_admin','management','sales','marketing','operations']::public.app_role[])))
  with check ((select private.has_any_role(array['super_admin','management','sales','marketing','operations']::public.app_role[])));

-- requires_inspection: the single authoritative checkout gate -----------

alter table public.catalog_products add column requires_inspection boolean not null default false;

-- Orders / order items / payment transactions (staff-only, no anon access at all) ----

create type public.order_status as enum (
  'pending_payment','payment_failed',
  'paid',
  'inspection_not_required','inspection_pending','inspection_scheduled',
  'inspection_passed','inspection_failed_needs_action',
  'reconfigured_awaiting_customer_approval','paid_adjusted',
  'fulfillment_processing','fulfilled','closed',
  'refund_requested','refunded','partial_refund','cancelled_refunded'
);
create type public.payment_provider as enum ('paymob');
create type public.payment_method as enum ('card','apple_pay','valu','aman','forsa','souhoola','hsbc_installment');
create type public.payment_status as enum ('initiated','pending','authorized','captured','failed','refunded','partial_refund');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null check (length(trim(customer_name)) between 2 and 120),
  phone text not null check (length(trim(phone)) between 5 and 30),
  email text,
  locale text not null check (locale in ('ar','en')),
  area_location_id uuid references public.service_locations(id),
  currency char(3) not null default 'EGP',
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  status public.order_status not null default 'pending_payment',
  requires_inspection boolean not null,
  inspection_status text,
  terms_version text not null,
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  model_code text not null references public.catalog_products(model_code),
  family_name_ar text not null,
  family_name_en text not null,
  quantity integer not null check (quantity > 0 and quantity <= 99),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  requires_inspection_snapshot boolean not null,
  line_total_minor bigint not null check (line_total_minor >= 0),
  created_at timestamptz not null default now()
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider public.payment_provider not null default 'paymob',
  provider_transaction_id text not null,
  method public.payment_method not null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency char(3) not null default 'EGP',
  status public.payment_status not null default 'initiated',
  raw_webhook_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_transaction_id)
);

create trigger orders_touch before update on public.orders for each row execute function private.touch_updated_at();
create trigger orders_audit after insert or update or delete on public.orders for each row execute function private.write_audit_log();
create trigger order_items_audit after insert or update or delete on public.order_items for each row execute function private.write_audit_log();
create trigger payment_transactions_touch before update on public.payment_transactions for each row execute function private.touch_updated_at();
create trigger payment_transactions_audit after insert or update or delete on public.payment_transactions for each row execute function private.write_audit_log();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_transactions enable row level security;

-- No anon/authenticated write policies at all beyond staff reads below: the checkout
-- app and its Edge Functions use the service-role key (server-side only) to write these.
create policy orders_staff_read on public.orders for select to authenticated
  using ((select private.has_any_role(array['super_admin','management','accounts','operations','sales','auditor']::public.app_role[])));
create policy orders_staff_update_status on public.orders for update to authenticated
  using ((select private.has_any_role(array['super_admin','management','operations','accounts']::public.app_role[])))
  with check ((select private.has_any_role(array['super_admin','management','operations','accounts']::public.app_role[])));
create policy order_items_staff_read on public.order_items for select to authenticated
  using ((select private.has_any_role(array['super_admin','management','accounts','operations','sales','auditor']::public.app_role[])));
create policy payment_transactions_staff_read on public.payment_transactions for select to authenticated
  using ((select private.has_any_role(array['super_admin','management','accounts','auditor']::public.app_role[])));

grant select on public.public_stock_status to anon, authenticated;
grant insert on public.stock_notify_requests to anon, authenticated;
grant select, update on public.stock_notify_requests to authenticated;
grant select on public.product_stock_status to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items, public.payment_transactions to authenticated;

commit;
