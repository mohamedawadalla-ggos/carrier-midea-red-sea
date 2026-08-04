-- Aligns production pricing to the explicitly approved master workbook.
-- Source: Carrier_Midea_Price_Master_Template.xlsx
-- SHA256: B38A1AB5DF577D7D0A73CBDDEAFF0B51539E8F8C23C655BA390DC28577B88981
-- Approved business outcome: use the workbook customer prices and archive SUMMER10_2026.
-- Production migration ledger version: 20260803232047.
-- No schema, RLS, grant, or private-field exposure changes.
begin;

create temporary table approved_price_master (
  model_code text primary key,
  dealer_cost_minor bigint not null,
  target_list_price_minor bigint not null,
  previous_list_price_minor bigint not null
) on commit drop;

insert into approved_price_master
  (model_code, dealer_cost_minor, target_list_price_minor, previous_list_price_minor)
values
('53QHABT30DN-708F', 7955000, 8594000, 8840000),
    ('53QHABT36DN-708F', 9140000, 9875000, 10160000),
    ('53KHEFT12DN8-708F', 2755000, 3039000, 3065000),
    ('53QHEFT12DN8-708F', 3004000, 3310500, 3340000),
    ('53KHEFT18DN8-708F', 4112500, 4491000, 4570000),
    ('53QHEFT18DN8-708F', 4447000, 4856500, 4945000),
    ('53KHEFT24DN8-708F', 4669500, 5099500, 5190000),
    ('53QHEFT24DN8-708F', 5049500, 5514000, 5615000),
    ('53KHCT12N-708', 2416500, 2641500, 2685000),
    ('53QHCT12N-708F', 2622000, 2863000, 2915000),
    ('53KHCT18N-708', 3433500, 3732500, 3815000),
    ('53QHCT18N-708F', 3749500, 4073000, 4170000),
    ('53KHCT24N-708', 4114000, 4470500, 4575000),
    ('53QHCT24N-708F', 4438500, 4820000, 4935000),
    ('53QHABT30N-708F', 7080000, 7646000, 7870000),
    ('53QHABT36N-708F', 8133000, 8785000, 9040000),
    ('53KHEFT12N8-708F', 2416500, 2641500, 2685000),
    ('53QHEFT12N8-708F', 2622000, 2863000, 2915000),
    ('53KHEFT18N8-708F', 3495000, 3793500, 3885000),
    ('53QHEFT18N8-708F', 3810500, 4134500, 4235000),
    ('53KHEFT24N8-708F', 4195500, 4552000, 4665000),
    ('53QHEFT24N8-708F', 4520000, 4901500, 5025000),
    ('53QDMA6T18DN-728', 5713500, 6430000, 6430000),
    ('53QDMA6T24DN-728', 6582000, 7408500, 7408500),
    ('53QDMA6T36DN-728', 9709000, 10927000, 10927000),
    ('53QDHTGT48DN-528', 12710000, 14305000, 14305000),
    ('53QDHTGT60DN-528', 14026500, 15786000, 15786000),
    ('53QDMA6T12N-728', 3640000, 4126000, 4126000),
    ('53QDMA6T18N-728', 4763500, 5365500, 5365500),
    ('53QDMA6T24N-728', 5723000, 6438500, 6438500),
    ('53QDMA6T30N-728', 7348000, 8270500, 8270500),
    ('53QDMA6T36N-728', 8449500, 9505500, 9505500),
    ('53QDMA6T48N-528', 11052000, 12433500, 12433500),
    ('53QDMA6T60N-528', 12200500, 13730000, 13730000),
    ('53QCDT36DN-708', 11907000, 13101000, 13230000),
    ('53QCDT48DN-508', 13094000, 14407000, 14550000),
    ('53QFGDT60DN-508', 15145500, 16664000, 16830000),
    ('53QFMT36N-708', 10382500, 11426500, 11540000),
    ('53KFGDT60N-508', 13184000, 14506000, 14650000),
    ('M1SEFT-12CRDN8F-Q8', 2495500, 2752500, 2775000),
    ('M1SEFT-12HRDN8F-Q8', 2727500, 2999000, 3035000),
    ('M1SEFT-18CRDN8F-Q8', 3711000, 4051000, 4125000),
    ('M1SEFT-18HRDN8F-Q8', 4017500, 4381500, 4465000),
    ('M1SEFT-24CRDN8F-Q8', 4218500, 4605000, 4690000),
    ('M1SEFT-24HRDN8F-Q8', 4564500, 4980000, 5075000),
    ('M1SABT-30HRDNF-Q8', 7266500, 7872500, 8075000),
    ('M1SABT-36HRDNF-Q8', 8351000, 9049500, 9280000),
    ('M1SCT-12CRN-Q8', 2130500, 2343000, 2370000),
    ('M1SCT-12HRNF-Q8', 2317000, 2543500, 2575000),
    ('M1SCT-18CRN-Q8', 3168500, 3459500, 3525000),
    ('M1SCT-18HRNF-Q8', 3490500, 3806000, 3880000),
    ('M1SCT-24CRN-Q8', 3884500, 4234500, 4320000),
    ('M1SCT-24HRNF-Q8', 4176000, 4553500, 4640000),
    ('M1SABT-30HRNF-Q8', 6479500, 7023500, 7200000),
    ('M1SABT-36HRNF-Q8', 7448000, 8069000, 8280000),
    ('M1SEFT-12CRN8F-Q8', 2130500, 2343000, 2370000),
    ('M1SEFT-12HRN8F-Q8', 2317000, 2543500, 2575000),
    ('M1SEFT-18CRN8F-Q8', 3229500, 3521000, 3590000),
    ('M1SEFT-18HRN8F-Q8', 3552000, 3867000, 3950000),
    ('M1SEFT-24CRN8F-Q8', 3966000, 4316000, 4410000),
    ('M1SEFT-24HRN8F-Q8', 4258000, 4635000, 4735000);

do $$
declare
  mismatch_count integer;
  campaign_count integer;
  below_floor_count integer;
begin
  if (select count(*) from approved_price_master) <> 61 then
    raise exception 'Price master must contain exactly 61 unique models';
  end if;

  if exists (
    select 1 from approved_price_master
    where target_list_price_minor < dealer_cost_minor
  ) then
    raise exception 'Price master contains a customer price below dealer cost';
  end if;

  select count(*) into mismatch_count
  from approved_price_master source
  left join public.catalog_products product on product.model_code = source.model_code
  where product.model_code is null;
  if mismatch_count <> 0 then
    raise exception 'Price master contains % unknown catalog models', mismatch_count;
  end if;

  select count(*) into mismatch_count
  from approved_price_master source
  left join public.published_product_prices published on published.model_code = source.model_code
  where published.model_code is null
     or published.published is not true
     or published.list_price_minor <> source.previous_list_price_minor
     or published.sale_price_minor <> source.previous_list_price_minor;
  if mismatch_count <> 0 then
    raise exception 'Production published-price preflight failed for % models', mismatch_count;
  end if;

  select count(*) into mismatch_count
  from approved_price_master source
  left join lateral (
    select entry.dealer_cost_minor
    from public.product_price_entries entry
    where entry.model_code = source.model_code
      and entry.status in ('approved', 'published')
    order by entry.updated_at desc, entry.created_at desc
    limit 1
  ) latest on true
  where latest.dealer_cost_minor is null
     or latest.dealer_cost_minor <> source.dealer_cost_minor;
  if mismatch_count <> 0 then
    raise exception 'Production dealer-cost preflight failed for % models', mismatch_count;
  end if;

  select count(*) into campaign_count
  from public.discount_campaigns
  where code = 'SUMMER10_2026'
    and status = 'published'
    and starts_at <= now()
    and ends_at >= now();
  if campaign_count <> 1 then
    raise exception 'Expected exactly one active SUMMER10_2026 campaign, found %', campaign_count;
  end if;

  select count(*) into below_floor_count
  from approved_price_master
  where (target_list_price_minor * 9000 / 10000) < dealer_cost_minor;
  if below_floor_count <> 49 then
    raise exception 'Expected 49 master prices to conflict with a 10 percent campaign floor, found %', below_floor_count;
  end if;

  if not exists (
    select 1 from public.staff_profiles
    where role = 'super_admin' and active = true
  ) then
    raise exception 'No active super admin is available to own the approved price entries';
  end if;
end
$$;

update public.discount_campaigns
set status = 'archived',
    updated_at = now()
where code = 'SUMMER10_2026'
  and status = 'published';

with owner as (
  select user_id
  from public.staff_profiles
  where role = 'super_admin' and active = true
  order by created_at
  limit 1
)
insert into public.product_price_entries (
  model_code,
  currency,
  end_user_price_minor,
  dealer_cost_minor,
  minimum_price_minor,
  tax_included,
  effective_from,
  expires_at,
  source_reference,
  status,
  created_by,
  approved_by
)
select
  source.model_code,
  'EGP',
  source.target_list_price_minor,
  source.dealer_cost_minor,
  source.dealer_cost_minor,
  true,
  date '2026-08-04',
  null,
  'Carrier_Midea_Price_Master_Template.xlsx SHA256 B38A1AB5DF577D7D0A73CBDDEAFF0B51539E8F8C23C655BA390DC28577B88981',
  'published',
  owner.user_id,
  owner.user_id
from approved_price_master source
cross join owner;

with owner as (
  select user_id
  from public.staff_profiles
  where role = 'super_admin' and active = true
  order by created_at
  limit 1
)
insert into public.published_product_prices (
  model_code,
  currency,
  list_price_minor,
  sale_price_minor,
  discount_label_ar,
  discount_label_en,
  effective_from,
  expires_at,
  published,
  published_by
)
select
  source.model_code,
  'EGP',
  source.target_list_price_minor,
  source.target_list_price_minor,
  null,
  null,
  date '2026-08-04',
  null,
  true,
  owner.user_id
from approved_price_master source
cross join owner
on conflict (model_code) do update set
  currency = excluded.currency,
  list_price_minor = excluded.list_price_minor,
  sale_price_minor = excluded.sale_price_minor,
  discount_label_ar = null,
  discount_label_en = null,
  effective_from = excluded.effective_from,
  expires_at = null,
  published = true,
  published_by = excluded.published_by,
  published_at = now(),
  updated_at = now();

do $$
declare
  mismatch_count integer;
begin
  select count(*) into mismatch_count
  from approved_price_master source
  join public.published_product_prices published using (model_code)
  where published.published = true
    and published.list_price_minor = source.target_list_price_minor
    and published.sale_price_minor = source.target_list_price_minor;
  if mismatch_count <> 61 then
    raise exception 'Post-update verification matched only % of 61 published prices', mismatch_count;
  end if;

  if exists (
    select 1 from public.discount_campaigns
    where code = 'SUMMER10_2026' and status = 'published'
  ) then
    raise exception 'SUMMER10_2026 remained published after reconciliation';
  end if;

  select count(*) into mismatch_count
  from public.product_price_entries
  where source_reference =
    'Carrier_Midea_Price_Master_Template.xlsx SHA256 B38A1AB5DF577D7D0A73CBDDEAFF0B51539E8F8C23C655BA390DC28577B88981'
    and effective_from = date '2026-08-04'
    and status = 'published';
  if mismatch_count <> 61 then
    raise exception 'Expected 61 auditable master price entries, found %', mismatch_count;
  end if;
end
$$;

commit;
