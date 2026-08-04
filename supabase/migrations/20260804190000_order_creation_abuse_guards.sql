-- create_order is anon-callable and reserves stock (decrements
-- quantity_on_hand) the instant an order is created, before any payment.
-- Nothing previously bounded how many pending_payment orders a single
-- caller could create, and stock was only ever restored when an order
-- reached cancelled_refunded/refunded — an abandoned or automated flood
-- of unpaid orders could hold stock indefinitely.
--
-- Two independent guards, both schema-only (no cron/external scheduler
-- required, since Supabase Edge Function/cron deploys in this project
-- have repeatedly gone unconfirmed as actually applied):
--
-- 1. A lazy expiry sweep runs at the start of every create_order call,
--    cancelling any pending_payment order older than 48 hours. That
--    threshold is deliberately generous: this business currently
--    confirms payment manually offline (bank transfer, cash — see
--    create_order_function.sql's comment on Phase 4), so a real
--    customer's order can legitimately sit pending for a while before
--    staff mark it paid. The sweep reuses the existing
--    restore_stock_on_order_reversal trigger to release stock, it does
--    not duplicate that logic.
-- 2. A per-phone-number rate limit blocks a caller from holding more
--    than 3 pending_payment orders at once, independent of the expiry
--    window — this is what actually stops a rapid automated flood,
--    since an attacker would need to fabricate a new phone number for
--    every few orders rather than just repeating calls.
begin;

create or replace function private.expire_stale_pending_orders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
    set status = 'cancelled_refunded'
    where status = 'pending_payment'
      and created_at < now() - interval '48 hours';
end;
$$;

revoke all on function private.expire_stale_pending_orders() from public, anon, authenticated;

create or replace function public.create_order(
  items jsonb,
  customer_name text,
  phone text,
  email text,
  locale text,
  area_location_id uuid,
  terms_version text
)
returns table (order_number text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal bigint := 0;
  v_requires_inspection boolean := false;
  v_item jsonb;
  v_model_code text;
  v_quantity integer;
  v_family_ar text;
  v_family_en text;
  v_unit_price bigint;
  v_item_inspection boolean;
  v_line_total bigint;
  v_item_count integer;
  v_updated_rows integer;
  v_phone text;
  v_open_orders integer;
begin
  perform private.expire_stale_pending_orders();

  if customer_name is null or length(trim(customer_name)) < 2 then
    raise exception 'A valid customer name is required';
  end if;
  if phone is null or length(trim(phone)) < 5 then
    raise exception 'A valid phone number is required';
  end if;
  if locale not in ('ar', 'en') then
    raise exception 'Invalid locale';
  end if;

  v_phone := trim(phone);
  select count(*) into v_open_orders
    from public.orders
    where orders.phone = v_phone and status = 'pending_payment';
  if v_open_orders >= 3 then
    raise exception 'This phone number already has % unpaid orders awaiting payment. Please complete or contact us about a previous order before placing another.', v_open_orders;
  end if;

  v_item_count := jsonb_array_length(items);
  if v_item_count is null or v_item_count = 0 then
    raise exception 'Cart is empty';
  end if;
  if v_item_count > 20 then
    raise exception 'Too many distinct items in one order';
  end if;

  v_order_number := 'RS' || to_char(now(), 'YYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (
    order_number, customer_name, phone, email, locale, area_location_id,
    currency, subtotal_minor, discount_minor, total_minor,
    status, requires_inspection_snapshot, terms_version, terms_accepted_at
  ) values (
    v_order_number, trim(customer_name), v_phone, nullif(trim(email), ''), locale, area_location_id,
    'EGP', 0, 0, 0, 'pending_payment', false, terms_version, now()
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(items)
  loop
    v_model_code := v_item->>'model_code';
    v_quantity := (v_item->>'quantity')::integer;

    if v_model_code is null or v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Invalid cart item';
    end if;

    select p.sale_price_minor, p.family_name_ar, p.family_name_en
      into v_unit_price, v_family_ar, v_family_en
      from public.public_product_prices p
      where p.model_code = v_model_code;
    if not found then
      raise exception 'Model % is not currently available for online purchase', v_model_code;
    end if;

    select c.requires_inspection into v_item_inspection
      from public.catalog_products c
      where c.model_code = v_model_code and c.active = true;
    if not found then
      raise exception 'Model % is not currently available', v_model_code;
    end if;

    -- Atomic, race-safe decrement: only succeeds if enough stock remains at the
    -- moment of the update. Two concurrent checkouts for the last unit cannot
    -- both succeed — Postgres row locking serializes them.
    update public.product_stock_status
      set quantity_on_hand = quantity_on_hand - v_quantity
      where model_code = v_model_code and quantity_on_hand >= v_quantity;
    get diagnostics v_updated_rows = row_count;
    if v_updated_rows = 0 then
      raise exception 'Model % does not have enough stock for the requested quantity', v_model_code;
    end if;

    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
    v_requires_inspection := v_requires_inspection or coalesce(v_item_inspection, false);

    insert into public.order_items (
      order_id, model_code, family_name_ar, family_name_en,
      quantity, unit_price_minor, requires_inspection_snapshot, line_total_minor
    ) values (
      v_order_id, v_model_code, v_family_ar, v_family_en,
      v_quantity, v_unit_price, coalesce(v_item_inspection, false), v_line_total
    );
  end loop;

  update public.orders
    set subtotal_minor = v_subtotal,
        total_minor = v_subtotal,
        requires_inspection_snapshot = v_requires_inspection
    where id = v_order_id;

  return query select v_order_number;
end;
$function$;

comment on function public.create_order(jsonb, text, text, text, text, uuid, text) is
  'Anon-callable order creation. Re-validates price, stock, and inspection requirement server-side from live tables; never trusts client-submitted amounts. Sweeps expired pending orders and rate-limits by phone number before reserving stock.';

commit;
