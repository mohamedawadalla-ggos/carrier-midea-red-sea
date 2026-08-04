-- Manual rollback for the approved-master migrations 20260803232047 and 20260803232205.
-- Run only after confirming the active campaign period is still valid.
begin;

create temporary table previous_published_prices (
  model_code text primary key,
  previous_list_price_minor bigint not null
) on commit drop;

insert into previous_published_prices (model_code, previous_list_price_minor)
values
('53QHABT30DN-708F', 8840000),
    ('53QHABT36DN-708F', 10160000),
    ('53KHEFT12DN8-708F', 3065000),
    ('53QHEFT12DN8-708F', 3340000),
    ('53KHEFT18DN8-708F', 4570000),
    ('53QHEFT18DN8-708F', 4945000),
    ('53KHEFT24DN8-708F', 5190000),
    ('53QHEFT24DN8-708F', 5615000),
    ('53KHCT12N-708', 2685000),
    ('53QHCT12N-708F', 2915000),
    ('53KHCT18N-708', 3815000),
    ('53QHCT18N-708F', 4170000),
    ('53KHCT24N-708', 4575000),
    ('53QHCT24N-708F', 4935000),
    ('53QHABT30N-708F', 7870000),
    ('53QHABT36N-708F', 9040000),
    ('53KHEFT12N8-708F', 2685000),
    ('53QHEFT12N8-708F', 2915000),
    ('53KHEFT18N8-708F', 3885000),
    ('53QHEFT18N8-708F', 4235000),
    ('53KHEFT24N8-708F', 4665000),
    ('53QHEFT24N8-708F', 5025000),
    ('53QDMA6T18DN-728', 6430000),
    ('53QDMA6T24DN-728', 7408500),
    ('53QDMA6T36DN-728', 10927000),
    ('53QDHTGT48DN-528', 14305000),
    ('53QDHTGT60DN-528', 15786000),
    ('53QDMA6T12N-728', 4126000),
    ('53QDMA6T18N-728', 5365500),
    ('53QDMA6T24N-728', 6438500),
    ('53QDMA6T30N-728', 8270500),
    ('53QDMA6T36N-728', 9505500),
    ('53QDMA6T48N-528', 12433500),
    ('53QDMA6T60N-528', 13730000),
    ('53QCDT36DN-708', 13230000),
    ('53QCDT48DN-508', 14550000),
    ('53QFGDT60DN-508', 16830000),
    ('53QFMT36N-708', 11540000),
    ('53KFGDT60N-508', 14650000),
    ('M1SEFT-12CRDN8F-Q8', 2775000),
    ('M1SEFT-12HRDN8F-Q8', 3035000),
    ('M1SEFT-18CRDN8F-Q8', 4125000),
    ('M1SEFT-18HRDN8F-Q8', 4465000),
    ('M1SEFT-24CRDN8F-Q8', 4690000),
    ('M1SEFT-24HRDN8F-Q8', 5075000),
    ('M1SABT-30HRDNF-Q8', 8075000),
    ('M1SABT-36HRDNF-Q8', 9280000),
    ('M1SCT-12CRN-Q8', 2370000),
    ('M1SCT-12HRNF-Q8', 2575000),
    ('M1SCT-18CRN-Q8', 3525000),
    ('M1SCT-18HRNF-Q8', 3880000),
    ('M1SCT-24CRN-Q8', 4320000),
    ('M1SCT-24HRNF-Q8', 4640000),
    ('M1SABT-30HRNF-Q8', 7200000),
    ('M1SABT-36HRNF-Q8', 8280000),
    ('M1SEFT-12CRN8F-Q8', 2370000),
    ('M1SEFT-12HRN8F-Q8', 2575000),
    ('M1SEFT-18CRN8F-Q8', 3590000),
    ('M1SEFT-18HRN8F-Q8', 3950000),
    ('M1SEFT-24CRN8F-Q8', 4410000),
    ('M1SEFT-24HRN8F-Q8', 4735000);

do $$
begin
  if (select count(*) from previous_published_prices) <> 61 then
    raise exception 'Rollback must contain exactly 61 unique models';
  end if;

  if (select count(*) from public.published_product_prices p
      join previous_published_prices source using (model_code)) <> 61 then
    raise exception 'Rollback model preflight failed';
  end if;
end
$$;

with owner as (
  select user_id
  from public.staff_profiles
  where role = 'super_admin' and active = true
  order by created_at
  limit 1
)
update public.published_product_prices published
set list_price_minor = source.previous_list_price_minor,
    sale_price_minor = source.previous_list_price_minor,
    discount_label_ar = null,
    discount_label_en = null,
    effective_from = date '2026-06-07',
    expires_at = null,
    published = true,
    published_by = owner.user_id,
    published_at = now(),
    updated_at = now()
from previous_published_prices source
cross join owner
where published.model_code = source.model_code;

update public.product_price_entries
set status = 'archived',
    updated_at = now()
where source_reference =
  'Carrier_Midea_Price_Master_Template.xlsx SHA256 B38A1AB5DF577D7D0A73CBDDEAFF0B51539E8F8C23C655BA390DC28577B88981'
  and effective_from = date '2026-08-03'
  and status = 'published';

update public.discount_campaigns
set status = 'published',
    updated_at = now()
where code = 'SUMMER10_2026'
  and status = 'archived'
  and starts_at <= now()
  and ends_at >= now();

commit;
