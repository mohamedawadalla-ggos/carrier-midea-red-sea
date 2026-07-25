begin;

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
  v_stock public.stock_status;
  v_line_total bigint;
  v_item_count integer;
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
    status, requires_inspection, terms_version, terms_accepted_at
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

    select status into v_stock from public.product_stock_status where model_code = v_model_code;
    if v_stock = 'out_of_stock' then
      raise exception 'Model % is currently out of stock', v_model_code;
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
        requires_inspection = v_requires_inspection
    where id = v_order_id;
  -- status intentionally stays 'pending_payment' here — Phase 4's real payment
  -- confirmation (or, until then, a staff "confirm payment received offline"
  -- action) is what advances it to inspection_pending/inspection_not_required.

  return query select v_order_number;
end;
$function$;

comment on function public.create_order(jsonb, text, text, text, text, uuid, text) is
  'Anon-callable order creation. Re-validates price, stock, and inspection requirement server-side from live tables; never trusts client-submitted amounts.';

revoke all on function public.create_order(jsonb, text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, text, text, text, text, uuid, text) to anon, authenticated;

commit;
