begin;

-- Safe anon-callable order/payment status lookup for the real-time card
-- checkout flow, mirroring the existing check_payment_proof_status two-factor
-- pattern (order_number + phone) used by the manual-payment flow. Needed
-- because `orders`/`order_items`/`payment_transactions` intentionally have
-- zero anon grants -- a customer returning from Paymob's hosted checkout has
-- no other safe way to see their own order's status.

create or replace function public.check_order_payment_status(
  order_number text,
  phone text
)
returns table (
  order_status public.order_status,
  total_minor bigint,
  currency char(3),
  payment_method public.order_payment_method,
  latest_payment_status public.payment_status,
  latest_payment_provider public.payment_provider
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_order record;
  v_payment record;
begin
  if order_number is null or phone is null then
    raise exception 'Missing required fields';
  end if;

  select o.id, o.status, o.total_minor, o.currency, o.payment_method into v_order
    from public.orders o
    where o.order_number = check_order_payment_status.order_number
      and o.phone = check_order_payment_status.phone;
  if not found then
    raise exception 'Order not found';
  end if;

  select pt.status, pt.provider into v_payment
    from public.payment_transactions pt
    where pt.order_id = v_order.id
    order by pt.created_at desc
    limit 1;

  return query select
    v_order.status,
    v_order.total_minor,
    v_order.currency,
    v_order.payment_method,
    v_payment.status,
    v_payment.provider;
end;
$function$;

revoke all on function public.check_order_payment_status(text, text) from public, anon, authenticated;
grant execute on function public.check_order_payment_status(text, text) to anon, authenticated;

commit;
