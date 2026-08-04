-- Activates the approved price master immediately in UTC-based production.
-- Production migration ledger version: 20260803232205.
begin;

do $$
declare
  source_count integer;
  published_count integer;
begin
  select count(*) into source_count
  from public.product_price_entries
  where source_reference =
    'Carrier_Midea_Price_Master_Template.xlsx SHA256 B38A1AB5DF577D7D0A73CBDDEAFF0B51539E8F8C23C655BA390DC28577B88981'
    and effective_from = date '2026-08-04'
    and status = 'published';

  select count(*) into published_count
  from public.published_product_prices
  where effective_from = date '2026-08-04'
    and published = true;

  if source_count <> 61 or published_count <> 61 then
    raise exception
      'Activation guard failed: source entries %, published rows %',
      source_count,
      published_count;
  end if;
end
$$;

update public.product_price_entries
set effective_from = current_date
where source_reference =
  'Carrier_Midea_Price_Master_Template.xlsx SHA256 B38A1AB5DF577D7D0A73CBDDEAFF0B51539E8F8C23C655BA390DC28577B88981'
  and effective_from = date '2026-08-04'
  and status = 'published';

update public.published_product_prices
set effective_from = current_date,
    updated_at = now()
where effective_from = date '2026-08-04'
  and published = true;

do $$
declare
  public_count integer;
begin
  select count(*) into public_count
  from public.public_product_prices;

  if public_count <> 61 then
    raise exception
      'Expected 61 immediately visible public prices, found %',
      public_count;
  end if;
end
$$;

commit;
