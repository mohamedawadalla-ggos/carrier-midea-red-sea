# Control panel application

## Commands

```bash
npm install
# Review and retain the generated package-lock.json before commit.
npm run typecheck
npm run lint
npm run build
npm test
```

The build produces a static `out/` directory. Authentication persists in the browser and every database operation is protected by Supabase RLS.

## Staff onboarding

There is intentionally no self-registration. Create or invite users in Supabase Auth, then insert or update their `staff_profiles` row.

Exact dependency versions are pinned in `package.json`. This offline package intentionally does not include a fabricated or unresolved lockfile.
