# Bootstrap and deployment notes

## First administrator

Create the user in Supabase Authentication, then run the following once in the SQL editor, replacing the UUID and name:

```sql
insert into public.staff_profiles (user_id, full_name, role, active)
values ('00000000-0000-0000-0000-000000000000', 'Nael', 'super_admin', true)
on conflict (user_id) do update
set full_name = excluded.full_name,
    role = excluded.role,
    active = true;
```

Do not create a public sign-up page. Staff accounts should be invited or created administratively.

## Recommended deployment

- Storefront: keep the existing Cloudflare Pages static deployment.
- Control panel: deploy `admin-panel/out` as a separate Cloudflare Pages project, preferably on a restricted subdomain such as `admin.example.com`.
- Supabase Auth redirect URLs: add the exact control-panel production and preview URLs.
- Enable MFA for `super_admin`, `management`, and `accounts` users before live prices are entered.

## Storefront integration

The current storefront should later read these anonymous-safe views:

- `public_site_settings`
- `public_service_locations`
- `public_product_prices`

The storefront should retain its current static fallback values if Supabase is unavailable. Dealer costs must never be queried by the storefront.
