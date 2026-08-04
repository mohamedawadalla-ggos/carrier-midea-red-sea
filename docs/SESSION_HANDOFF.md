# Session Handoff — Carrier × Midea Red Sea

**Purpose:** this repo is being worked on by multiple Claude/AI sessions in relay — a cloud session (Claude Code on the web) and a local session (Claude Desktop on Mohamed's laptop), handing work back and forth. This file is the shared source of truth between them. **Read this fully before doing anything. Update the "Session log" section at the bottom before handing off, and commit it.**

If you're picking this up cold: this is a Carrier/Midea AC dealer's storefront + admin control panel for the Red Sea region (Egypt). Next.js/Cloudflare Pages storefront, a separate Next.js/Vercel admin panel, Supabase (Postgres + Auth + Edge Functions) as the backend. GitHub repo: `mohamedawadalla-ggos/carrier-midea-red-sea`.

---

## 1. Current repo state (verify this yourself — don't trust it blind)

```
git log origin/main --oneline -5
```
As of this writing, `main` is at `cebb787` — check it's still current before acting on anything below. All work in this project has gone through PR branches (`claude/...` or `codex/...`) merged to `main`; there is no long-lived feature branch.

## 2. What's already done (merged to `main`)

In order, most recent first:
- **#28** `chore: gitignore the local delivery-docs draft` — see §4 below, the two-versions handover-doc situation.
- **#27** `ci: add manual-trigger workflow to deploy pending Supabase changes` — `.github/workflows/deploy-supabase.yml`, a `workflow_dispatch` button that runs `supabase db push` + redeploys all 3 Edge Functions. **Not usable yet** — needs `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` added as GitHub repo secrets first (Settings → Secrets and variables → Actions).
- **#26** `fix(orders): rate-limit and auto-expire pending orders in create_order` — closes a stock-drain gap (anonymous checkout could hold inventory forever via abandoned unpaid orders). Migration: `supabase/migrations/20260804190000_order_creation_abuse_guards.sql`. Verified end-to-end against a local throwaway Postgres (not just read) — see the PR body for the test transcript.
- **#25** `fix(admin): stop operations edits from silently unpublishing live cities` — an `operations`-role staff member editing any flag on a service location used to force it back to `pending_approval`, instantly hiding it from the live storefront. Migration: `supabase/migrations/20260804180000_preserve_published_location_on_operations_edit.sql`.
- **#24** `fix(admin): confirm before deactivating, reactivating, or reassigning a staff role` — Users panel now confirms before consequential changes, matching every other panel's pattern.
- **#23** `fix(admin): gray out visibility toggle for non-published products` — Catalog Visibility panel toggle could report "success" for a product that wouldn't actually show live.
- **#22** hero section changes (address/promo badges, scroll-offset fix, FB ad carousel).
- **#10** dependency-vulnerability patches (storefront 13→6 high, admin 12→4 high as of the last recheck), added `.github/workflows/ci.yml` (typecheck/lint/build/test on push+PR, **no deploy step** — Vercel/Cloudflare's own GitHub Apps seem to auto-deploy previews on every push already; never confirmed whether that extends to production on merge), fixed a critical bug where re-inviting an already-pending staff member deleted their account (`supabase/functions/manage-staff-users/index.ts`).
- **#11–#21** (not done by a Claude Code cloud session — landed via `codex/...` branches and local desktop work before this handoff pattern started): admin password-recovery handling, a whole new **Catalog Management** + **Catalog Visibility** admin feature, approved pricing/ceiling-price campaigns, several bug fixes to campaign save error messages and comma-formatted price paste.

**Current verified numbers** (root/storefront): 86/86 tests passing, typecheck/lint clean. (admin-panel): 21/21 tests passing, typecheck/lint clean, build succeeds. Re-verify these yourself — `npm test` in each of `/` and `/admin-panel` (root needs `NEXT_PUBLIC_SITE_URL=https://carrier-midea-red-sea.pages.dev` set, or the SEO tests fail).

## 3. What's still open — sorted by who can actually do it

### Needs local/laptop access (probably why you're reading this on Desktop)
- **A credential file, something like `.branch2_*_tmp`, reported in a local working directory** (`C:\projects\RED SEA AC` per an earlier report from a "Codex" session) — contains what looks like a database connection string. **Never confirmed whether it's live/active.** If you have access to that machine: check it, and if the credential is real, rotate it and delete the file. It is **not** in this git repo or any branch — confirmed by exhaustive `git log --all` search from the cloud session.
- Whatever local files a prior "Codex" session produced at that same path, including a second copy of the Arabic delivery-docs package (see §4).

### Needs Supabase dashboard or CLI access
- Run the deploy from PR #27 (once its secrets are added) — or manually: `supabase db push` and `supabase functions deploy manage-staff-users / paymob-webhook / create-payment-intent`. **Three migrations are merged to `main` and unconfirmed as actually applied to the live database**, going back to PR #10.
- Toggle "Leaked Password Protection" on in Supabase Auth settings (one click, flagged as disabled in an earlier audit, never reconfirmed).
- Look up staff roles in the Users tab of the admin panel itself (no separate Supabase access needed, but flagging it here since it's still open): `Adel Mina`'s role was `management`, unclear if that's intended vs. `accounts`; a `Dev TESTER` test account (`abuloji007@live.com`) was created during earlier debugging and should probably be deactivated now.

### Needs Paymob dashboard access
- Two orders, `RS2607264A8EE0` and `RS26072647AFF8`, were flagged with payment status `captured` in production. Never confirmed whether these are Paymob sandbox transactions or real money. Each still holds a reserved stock unit.

### Needs a decision from Mohamed (project owner)
- **Two competing versions of the Arabic delivery-handover package exist**: one built by a Claude Code cloud session (`docs/delivery/*.md`, `.docx`, `.pdf` — now gitignored, not committed, still on whichever machine generated them), and one built by "Codex" locally at `C:\projects\RED SEA AC\docs\delivery\...`. Mohamed said the Codex/local one is the working candidate; neither has been committed to git; both are pending review by Nael before one is chosen and formally saved. **Don't just pick one — ask, or check for a newer instruction in this file's session log below.**
- Cloudflare Pages / Vercel project names + policy (manual-trigger vs. auto-deploy-on-merge) for a proper CI deploy step — currently there is none in `ci.yml`, though native Vercel/Cloudflare GitHub-App integration appears to already auto-deploy preview builds (visible as bot comments on every PR); whether that also covers production-on-merge was never confirmed.

### Needs Nael (and the accountant)
- Full UAT hasn't started yet: prices, discounts, orders, payment, stock, locations, users, both languages.

## 4. Known, deliberately-not-yet-fixed things

- **Nothing else is deliberately deferred** as of this writing — every code-level issue found during review (across every admin panel, checked one by one) has a merged fix. If you find something that looks like a leftover bug, it's new, not something previously triaged and skipped.

## 5. How this project actually gets things done — patterns to follow

- **Everything goes through a PR**, even trivial one-line changes (e.g. #28, a `.gitignore` addition). Branch naming: `claude/<short-description>`. Always run the repo's own checks before opening a PR: root needs `npm run typecheck && npm run lint && npm test` (with `NEXT_PUBLIC_SITE_URL` set) and `admin-panel/` needs the same four (`typecheck`, `lint`, `build`, `test`).
- **Supabase migrations get written but not auto-deployed.** If you add one, say so explicitly — merging to GitHub does not apply it.
- **RLS is the real security boundary, not the UI.** Every admin panel talks to Supabase directly from the client; permission checks in `admin-panel/lib/access.ts` are UX only. When adding or reviewing a feature, always check the matching RLS policy in `supabase/migrations/`, not just the component code.
- **This business confirms payment manually/offline** (bank transfer, cash) — there's no live online payment flow yet ("Phase 4" per an old code comment), so don't assume order-status transitions happen automatically.
- **No hard deletes anywhere in the admin panel** — always archive/deactivate. This is deliberate, for audit-trail integrity.

---

## Session log

*(Newest entry on top. Whoever picks up next: read everything above, do your work, then add an entry here before committing and handing off again.)*

### 2026-08-04 — Claude Code (cloud), session ending
Merged PRs #10, #22–#28 as described in §2. Verified #26 (stock-drain fix) against a real local Postgres instance, not just code review. Wrote this handoff file per Mohamed's request, to relay to Claude Desktop on his laptop. Everything in §3 is still open exactly as listed — no local/dashboard/Paymob access from this session to close any of it further.
