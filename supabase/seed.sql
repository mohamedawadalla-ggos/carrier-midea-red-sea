begin;

insert into public.catalog_products
(model_code, family_id, family_name_ar, family_name_en, brand, capacity_hp, cooling_mode, refrigerant, active)
values
('53KHEFT12DN8-708F','carrier-xcool-inverter','XCOOL إنفرتر','XCOOL Inverter','carrier',1.5,'cool-only','R32',true),
('53KHEFT18DN8-708F','carrier-xcool-inverter','XCOOL إنفرتر','XCOOL Inverter','carrier',2.25,'cool-only','R32',true),
('53KHEFT24DN8-708F','carrier-xcool-inverter','XCOOL إنفرتر','XCOOL Inverter','carrier',3,'cool-only','R32',true),
('53QHEFT12DN8-708F','carrier-xcool-inverter','XCOOL إنفرتر','XCOOL Inverter','carrier',1.5,'heat-pump','R32',true),
('53QHEFT18DN8-708F','carrier-xcool-inverter','XCOOL إنفرتر','XCOOL Inverter','carrier',2.25,'heat-pump','R32',true),
('53QHEFT24DN8-708F','carrier-xcool-inverter','XCOOL إنفرتر','XCOOL Inverter','carrier',3,'heat-pump','R32',true),
('53QHABT30DN-708F','carrier-optimax-inverter','Optimax إنفرتر','Optimax Inverter','carrier',4,'heat-pump','R410A',true),
('53QHABT36DN-708F','carrier-optimax-inverter','Optimax إنفرتر','Optimax Inverter','carrier',5,'heat-pump','R410A',true),
('53KHCT12N-708','carrier-optimax-pro','Optimax Pro','Optimax Pro','carrier',1.5,'cool-only','R410A',true),
('53KHCT18N-708','carrier-optimax-pro','Optimax Pro','Optimax Pro','carrier',2.25,'cool-only','R410A',true),
('53KHCT24N-708','carrier-optimax-pro','Optimax Pro','Optimax Pro','carrier',3,'cool-only','R410A',true),
('53QHCT12N-708F','carrier-optimax-pro','Optimax Pro','Optimax Pro','carrier',1.5,'heat-pump','R410A',true),
('53QHCT18N-708F','carrier-optimax-pro','Optimax Pro','Optimax Pro','carrier',2.25,'heat-pump','R410A',true),
('53QHCT24N-708F','carrier-optimax-pro','Optimax Pro','Optimax Pro','carrier',3,'heat-pump','R410A',true),
('53QHABT30N-708F','carrier-optimax-pro','Optimax Pro','Optimax Pro','carrier',4,'heat-pump','R410A',true),
('53QHABT36N-708F','carrier-optimax-pro','Optimax Pro','Optimax Pro','carrier',5,'heat-pump','R410A',true),
('53KHEFT12N8-708F','carrier-xcool','XCOOL','XCOOL','carrier',1.5,'cool-only','R32',true),
('53KHEFT18N8-708F','carrier-xcool','XCOOL','XCOOL','carrier',2.25,'cool-only','R32',true),
('53KHEFT24N8-708F','carrier-xcool','XCOOL','XCOOL','carrier',3,'cool-only','R32',true),
('53QHEFT12N8-708F','carrier-xcool','XCOOL','XCOOL','carrier',1.5,'heat-pump','R32',true),
('53QHEFT18N8-708F','carrier-xcool','XCOOL','XCOOL','carrier',2.25,'heat-pump','R32',true),
('53QHEFT24N8-708F','carrier-xcool','XCOOL','XCOOL','carrier',3,'heat-pump','R32',true),
('53QDMA6T18DN-728','carrier-classicool-inverter','ClassiCool إنفرتر','ClassiCool Inverter','carrier',2.25,'heat-pump','R410A',true),
('53QDMA6T24DN-728','carrier-classicool-inverter','ClassiCool إنفرتر','ClassiCool Inverter','carrier',3,'heat-pump','R410A',true),
('53QDMA6T36DN-728','carrier-classicool-inverter','ClassiCool إنفرتر','ClassiCool Inverter','carrier',5,'heat-pump','R410A',true),
('53QDHTGT48DN-528','carrier-classicool-inverter','ClassiCool إنفرتر','ClassiCool Inverter','carrier',6,'heat-pump','R410A',true),
('53QDHTGT60DN-528','carrier-classicool-inverter','ClassiCool إنفرتر','ClassiCool Inverter','carrier',7.5,'heat-pump','R410A',true),
('53QDMA6T12N-728','carrier-classicool-pro','ClassiCool Pro','ClassiCool Pro','carrier',1.5,'heat-pump','R410A',true),
('53QDMA6T18N-728','carrier-classicool-pro','ClassiCool Pro','ClassiCool Pro','carrier',2.25,'heat-pump','R410A',true),
('53QDMA6T24N-728','carrier-classicool-pro','ClassiCool Pro','ClassiCool Pro','carrier',3,'heat-pump','R410A',true),
('53QDMA6T30N-728','carrier-classicool-pro','ClassiCool Pro','ClassiCool Pro','carrier',4,'heat-pump','R410A',true),
('53QDMA6T36N-728','carrier-classicool-pro','ClassiCool Pro','ClassiCool Pro','carrier',5,'heat-pump','R410A',true),
('53QDMA6T48N-528','carrier-classicool-pro','ClassiCool Pro','ClassiCool Pro','carrier',6,'heat-pump','R410A',true),
('53QDMA6T60N-528','carrier-classicool-pro','ClassiCool Pro','ClassiCool Pro','carrier',7.5,'heat-pump','R410A',true),
('53QCDT36DN-708','carrier-decor-inverter','DÉCOR إنفرتر','DÉCOR Inverter','carrier',5,'heat-pump','R410A',true),
('53QCDT48DN-508','carrier-decor-inverter','DÉCOR إنفرتر','DÉCOR Inverter','carrier',6,'heat-pump','R410A',true),
('53QFGDT60DN-508','carrier-elegant-inverter','Elegant إنفرتر','Elegant Inverter','carrier',7.5,'heat-pump','R410A',true),
('53QFMT36N-708','carrier-elegant-pro','Elegant Pro','Elegant Pro','carrier',5,'heat-pump','R410A',true),
('53KFGDT60N-508','carrier-elegant-pro','Elegant Pro','Elegant Pro','carrier',7.5,'cool-only','R410A',true),
('M1SEFT-12CRDN8F-Q8','midea-ai-ecomaster-inverter','AI ECOMASTER إنفرتر','AI ECOMASTER Inverter','midea',1.5,'cool-only','R32',true),
('M1SEFT-18CRDN8F-Q8','midea-ai-ecomaster-inverter','AI ECOMASTER إنفرتر','AI ECOMASTER Inverter','midea',2.25,'cool-only','R32',true),
('M1SEFT-24CRDN8F-Q8','midea-ai-ecomaster-inverter','AI ECOMASTER إنفرتر','AI ECOMASTER Inverter','midea',3,'cool-only','R32',true),
('M1SEFT-12HRDN8F-Q8','midea-ai-ecomaster-inverter','AI ECOMASTER إنفرتر','AI ECOMASTER Inverter','midea',1.5,'heat-pump','R32',true),
('M1SEFT-18HRDN8F-Q8','midea-ai-ecomaster-inverter','AI ECOMASTER إنفرتر','AI ECOMASTER Inverter','midea',2.25,'heat-pump','R32',true),
('M1SEFT-24HRDN8F-Q8','midea-ai-ecomaster-inverter','AI ECOMASTER إنفرتر','AI ECOMASTER Inverter','midea',3,'heat-pump','R32',true),
('M1SABT-30HRDNF-Q8','midea-mission-inverter','Mission إنفرتر','Mission Inverter','midea',4,'heat-pump','R410A',true),
('M1SABT-36HRDNF-Q8','midea-mission-inverter','Mission إنفرتر','Mission Inverter','midea',5,'heat-pump','R410A',true),
('M1SEFT-12CRN8F-Q8','midea-xtreme-pro','XTreme Pro','XTreme Pro','midea',1.5,'cool-only','R32',true),
('M1SEFT-18CRN8F-Q8','midea-xtreme-pro','XTreme Pro','XTreme Pro','midea',2.25,'cool-only','R32',true),
('M1SEFT-24CRN8F-Q8','midea-xtreme-pro','XTreme Pro','XTreme Pro','midea',3,'cool-only','R32',true),
('M1SEFT-12HRN8F-Q8','midea-xtreme-pro','XTreme Pro','XTreme Pro','midea',1.5,'heat-pump','R32',true),
('M1SEFT-18HRN8F-Q8','midea-xtreme-pro','XTreme Pro','XTreme Pro','midea',2.25,'heat-pump','R32',true),
('M1SEFT-24HRN8F-Q8','midea-xtreme-pro','XTreme Pro','XTreme Pro','midea',3,'heat-pump','R32',true),
('M1SCT-12CRN-Q8','midea-mission-pro','Mission Pro','Mission Pro','midea',1.5,'cool-only','R410A',true),
('M1SCT-18CRN-Q8','midea-mission-pro','Mission Pro','Mission Pro','midea',2.25,'cool-only','R410A',true),
('M1SCT-24CRN-Q8','midea-mission-pro','Mission Pro','Mission Pro','midea',3,'cool-only','R410A',true),
('M1SCT-12HRNF-Q8','midea-mission-pro','Mission Pro','Mission Pro','midea',1.5,'heat-pump','R410A',true),
('M1SCT-18HRNF-Q8','midea-mission-pro','Mission Pro','Mission Pro','midea',2.25,'heat-pump','R410A',true),
('M1SCT-24HRNF-Q8','midea-mission-pro','Mission Pro','Mission Pro','midea',3,'heat-pump','R410A',true),
('M1SABT-30HRNF-Q8','midea-mission-pro','Mission Pro','Mission Pro','midea',4,'heat-pump','R410A',true),
('M1SABT-36HRNF-Q8','midea-mission-pro','Mission Pro','Mission Pro','midea',5,'heat-pump','R410A',true)
on conflict (model_code) do update set
  family_id = excluded.family_id,
  family_name_ar = excluded.family_name_ar,
  family_name_en = excluded.family_name_en,
  brand = excluded.brand,
  capacity_hp = excluded.capacity_hp,
  cooling_mode = excluded.cooling_mode,
  refrigerant = excluded.refrigerant,
  active = excluded.active;

insert into public.site_settings
(key, category, label_ar, label_en, value_json, value_type, is_public, status, published_at)
values
('contact.whatsapp_number','contact','رقم واتساب','WhatsApp number',to_jsonb('201099055854'::text),'phone',true,'published',now()),
('contact.phone_display','contact','رقم الهاتف المعروض','Displayed telephone',to_jsonb('+20 109 905 5854'::text),'phone',true,'published',now()),
('contact.phone_tel','contact','رابط الاتصال','Telephone link',to_jsonb('+201099055854'::text),'phone',true,'published',now()),
('contact.email','contact','البريد الإلكتروني','Public email',to_jsonb(''::text),'text',true,'draft',null),
('social.facebook_url','social','صفحة فيسبوك','Facebook page URL',to_jsonb(''::text),'url',true,'draft',null),
('social.instagram_url','social','صفحة إنستجرام','Instagram URL',to_jsonb(''::text),'url',true,'draft',null),
('feature.request_cart_enabled','features','تفعيل سلة الطلب','Request Cart enabled','true'::jsonb,'boolean',true,'published',now()),
('feature.mr_cool_enabled','features','تفعيل مستر كول','Mr. Cool enabled','true'::jsonb,'boolean',true,'published',now()),
('commerce.public_prices_enabled','commerce','تفعيل الأسعار العامة','Public prices enabled','false'::jsonb,'boolean',true,'published',now()),
('commerce.currency','commerce','العملة','Currency',to_jsonb('EGP'::text),'text',true,'published',now()),
('business.working_hours_ar','business','مواعيد العمل بالعربية','Arabic working hours',to_jsonb('يتم تأكيد المواعيد عند التواصل'::text),'text',true,'published',now()),
('business.working_hours_en','business','مواعيد العمل بالإنجليزية','English working hours',to_jsonb('Working hours are confirmed when contacted'::text),'text',true,'published',now())
on conflict (key) do nothing;

insert into public.service_locations
(slug,name_ar,name_en,governorate_ar,governorate_en,active,sales_available,delivery_available,installation_available,maintenance_available,mobilization_required,requires_inspection,display_order,status)
values
('ain-sokhna','العين السخنة','Ain Sokhna','السويس','Suez',true,true,true,true,true,true,false,1,'published'),
('ras-ghareb','رأس غارب','Ras Gharib','البحر الأحمر','Red Sea',true,true,true,true,true,false,false,2,'published'),
('hurghada','الغردقة','Hurghada','البحر الأحمر','Red Sea',true,true,true,true,true,false,false,3,'published'),
('el-gouna','الجونة','El Gouna','البحر الأحمر','Red Sea',true,true,true,true,true,true,false,4,'published'),
('safaga','سفاجا','Safaga','البحر الأحمر','Red Sea',true,true,true,true,true,true,false,5,'published'),
('quseir','القصير','Quseir','البحر الأحمر','Red Sea',true,true,true,true,true,true,true,6,'published'),
('marsa-alam','مرسى علم','Marsa Alam','البحر الأحمر','Red Sea',true,true,true,true,true,true,true,7,'published')
on conflict (slug) do nothing;

commit;
