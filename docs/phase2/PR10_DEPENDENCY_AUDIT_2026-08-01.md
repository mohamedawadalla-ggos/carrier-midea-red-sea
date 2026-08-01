# PR #10 dependency audit — 2026-08-01

PR #10's non-breaking dependency updates were installed and verified after
rebasing on current `main` (the rebase was a no-op because the branch was already
current). No `npm audit fix --force` or dependency downgrade was used.

## Storefront

- Before PR #10: 18 findings (13 high, 4 moderate, 1 low).
- After PR #10: 11 findings (6 high, 4 moderate, 1 low).
- Next.js, React Server Components, Vite, Wrangler, and the Cloudflare toolchain
  are on the approved patched versions in this PR.

Remaining findings:

- `drizzle-kit` / `@esbuild-kit/*` / the nested legacy `esbuild`: npm only
  proposes the separate, potentially breaking downgrade to `drizzle-kit 0.18.1`.
  This chain is intentionally unchanged pending a dedicated decision.
- The current advisory database still flags `next`/`postcss`/`sharp` and proposes
  an old major-version downgrade rather than a safe forward update. No automatic
  downgrade was accepted.
- `brace-expansion`, `fast-uri`, `js-yaml`, and `@babel/core` remain transitive;
  npm reports fixes, but they require a separately-reviewed lockfile refresh so
  they are not silently mixed with the approved direct-package patch.

## Admin panel

- After PR #10: 4 high findings.
- They are the transitive `brace-expansion` finding plus the same
  `next`/`postcss`/`sharp` advisory chain for which npm proposes an unsafe old
  major downgrade.

## Verification

- Root: typecheck passed; lint passed with two pre-existing warnings; 76/76 tests
  passed using the CI `NEXT_PUBLIC_SITE_URL`; Next and vinext/static builds passed.
- Admin: typecheck, lint, 11/11 tests, and static production build passed.
- Local runner used Node 24 and emitted the expected engine warning because CI is
  pinned to Node 22. The existing GitHub checks run on Node 22 and are green.
