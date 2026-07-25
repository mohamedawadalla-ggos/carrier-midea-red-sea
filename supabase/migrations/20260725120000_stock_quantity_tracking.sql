begin;

drop view if exists public.public_stock_status;

alter table public.product_stock_status drop column status;
alter table public.product_stock_status add column quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0);
alter table public.product_stock_status add column status public.stock_status generated always as (
  case when quantity_on_hand > 0 then 'in_stock'::public.stock_status else 'out_of_stock'::public.stock_status end
) stored;

create or replace view public.public_stock_status with (security_invoker = true) as
select s.model_code, s.status, s.updated_at
from public.product_stock_status s
join public.catalog_products c using (model_code)
where c.active = true;

comment on view public.public_stock_status is
  'Safe public stock badge. Exposes only the derived in_stock/out_of_stock label, never quantity_on_hand.';

grant select on public.public_stock_status to anon, authenticated;

-- Seed starting stock: 20 units for every currently active catalog product.
-- do nothing on conflict: re-running this migration must never reset a
-- quantity staff has since adjusted back to the seed value.
insert into public.product_stock_status (model_code, quantity_on_hand)
select model_code, 20 from public.catalog_products
on conflict (model_code) do nothing;

-- Disambiguate the order-time snapshot from the live catalog flag it was
-- copied from, matching order_items.requires_inspection_snapshot's naming.
alter table public.orders rename column requires_inspection to requires_inspection_snapshot;

-- Replace create_order: stock check becomes an atomic, race-safe decrement.
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
begin
  if customer_name is null or length(trim(customer_name)) < 2 then
    raise exception 'A valid customer name is required';
  end if;
  if phone is null or length(trim(phone)) < 5 then
    raise exception 'A valid phone number is required';
  end if;
  if locale not in ('ar', 'en') then
    raise exception 'Invalid locale';
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
    v_order_number, trim(customer_name), trim(phone), nullif(trim(email), ''), locale, area_location_id,
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

-- Restore stock when an order is fully cancelled or refunded, so an
-- abandoned or reversed order doesn't permanently consume inventory.
-- Deliberately excludes partial_refund: it's ambiguous whether goods were
-- actually returned, so that case is left to a manual quantity adjustment.
create or replace function private.restore_stock_on_order_reversal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status in ('cancelled_refunded', 'refunded') and old.status not in ('cancelled_refunded', 'refunded') then
    update public.product_stock_status s
      set quantity_on_hand = s.quantity_on_hand + oi.quantity
      from public.order_items oi
      where oi.order_id = new.id and s.model_code = oi.model_code;
  end if;
  return new;
end;
$function$;

revoke all on function private.restore_stock_on_order_reversal() from public, anon, authenticated;

create trigger orders_restore_stock_on_reversal
  after update on public.orders
  for each row execute function private.restore_stock_on_order_reversal();

commit;
