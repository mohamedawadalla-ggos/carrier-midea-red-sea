# Session Handoff — Carrier × Midea Red Sea

**Purpose:** this repo is being worked on by multiple Claude/AI sessions in relay — a cloud session (Claude Code on the web) and a local session (Claude Desktop on Mohamed's laptop), handing work back and forth. This file is the shared source of truth between them. **Read this fully before doing anything. Update the "Session log" section at the bottom before handing off, and commit it.**

If you're picking this up cold: this is a Carrier/Midea AC dealer's storefront + admin control panel for the Red Sea region (Egypt). Next.js/Cloudflare Pages storefront, a separate Next.js/Vercel admin panel, Supabase (Postgres + Auth + Edge Functions) as the backend. GitHub repo: `mohamedawadalla-ggos/carrier-midea-red-sea`.

---

## 1. Current repo state (verify this yourself — don't trust it blind)

```
git log origin/main --oneline -5
```
As of this writing, `main` is at `33e0e2f` (merged #31, session log + J: partition note) — check it's still current before acting on anything below. All work in this project has gone through PR branches (`claude/...` or `codex/...`) merged to `main`; there is no long-lived feature branch.

**⚠ Local working directory has moved.** The laptop checkout is no longer at `C:\projects\RED SEA AC` — it moved to the **J: partition**. If you're picking this up on Desktop: confirm the new path there before doing anything, don't assume the old `C:\projects\RED SEA AC` path is still valid or still current, and `git pull` (or re-clone, if the old folder wasn't carried over) before continuing work. Every reference to `C:\projects\RED SEA AC` elsewhere in this doc is the *old* path — kept as-is below since the commands/fixes documented under it (execution policy, `allow-scripts`) still apply, just at the new location.

## 2. What's already done (merged to `main`)

In order, most recent first:
- **#31** `docs: log PR #30 merge, flag local folder moved to J: partition` — session log entry + the J: partition warning now in §1.
- **#30** `docs: close out credential-file check, add local Windows setup notes` — closed the `.branch2_*_tmp` item in §3 (confirmed not present on the laptop) and documented the Chocolatey/execution-policy/`allow-scripts` local setup steps in §5.
- **#28** `chore: gitignore the local delivery-docs draft` — see §4 below, the two-versions handover-doc situation.
- **#27** `ci: add manual-trigger workflow to deploy pending Supabase changes` — `.github/workflows/deploy-supabase.yml`, a `workflow_dispatch` button that runs `supabase db push` + redeploys all 3 Edge Functions. Secrets were added and it was run for the first time 2026-08-04 — see the §3 Supabase bullet below, it failed at the `db push` step due to pre-existing migration drift (not a bug in this workflow itself).
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
- ~~A credential file, something like `.branch2_*_tmp`, reported in `C:\projects\RED SEA AC`~~ — **checked 2026-08-04, does not exist.** `Get-ChildItem -Force -Recurse -Filter ".branch2_*"` on that machine turned up nothing. Dead end / stale report from the earlier "Codex" session; no credential to rotate. Closed, don't re-flag it.
- Whatever local files a prior "Codex" session produced at that same path, including a second copy of the Arabic delivery-docs package (see §4).

### Needs Supabase dashboard or CLI access
- ~~Migration-history drift blocking `supabase db push`~~ — **resolved 2026-08-04.** Full story: `SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF` secrets were added, the `Deploy Supabase` workflow (PR #27) ran for the first time and failed at `db push` with 6 unrecognized remote migration timestamps (`20260726000000` through `20260726193441`) — old ad-hoc changes from the pre-handoff "Codex" era, never committed as files. From Mohamed's laptop (now with Supabase CLI installed via Scoop): confirmed those 6 had no real local counterpart and repaired them `--status reverted` (safe, bookkeeping only — doesn't undo whatever schema changes they made, just stops the CLI expecting matching files). A 7th, `20260726200000` (`check_order_payment_status.sql`), was verified to already exist live (`select proname from pg_proc where proname = 'check_order_payment_status'` returned a row) before marking it `--status applied`. The last two, `20260804180000` and `20260804190000` (the operations-edit and order-abuse-guard fixes), were **never** marked applied by hand — they went through a real `supabase db push`, which applied them for real. Re-ran the `Deploy Supabase` workflow afterward: `db push` (no-op, confirming clean history) and all 3 Edge Function redeploys (`manage-staff-users`, `paymob-webhook`, `create-payment-intent`) succeeded. **Both fixes are now live in production**, migration history is fully reconciled, and the deploy pipeline (PR #27) is proven working end-to-end for the first time.
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
- **Local Windows setup, if starting from scratch** (e.g. Mohamed's laptop at `C:\projects\RED SEA AC`): Node install via `choco install nodejs-lts -y` works, but two things trip people up afterward — (1) PowerShell blocks `npm.ps1` by default (`running scripts is disabled`); fix with `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. (2) npm's `allow-scripts` guard blocks `sharp`/`esbuild`/`workerd`/`unrs-resolver` postinstall scripts (needed for their native binaries — `sharp` in particular breaks Next.js image handling if skipped); approve them by name (`npm approve-scripts sharp`, etc., shown per-package in the warning output) then re-run `npm install` so the scripts actually execute. Root wants Node `22.x`; `v24.19.0` throws an `EBADENGINE` warning but installs and builds fine anyway.

---

## Session log

*(Newest entry on top. Whoever picks up next: read everything above, do your work, then add an entry here before committing and handing off again.)*

### 2026-08-04 — Claude Code (cloud) + Mohamed (Desktop), migration drift resolved and deploy completed
Picking up from the failed deploy attempt below: Mohamed installed the Supabase CLI on his laptop (via Scoop — `npm install -g supabase` doesn't work, Supabase blocks that), ran `supabase login` + `supabase link`, then worked through the drift interactively together — repairing the 6 phantom old migrations as `reverted`, confirming `20260726200000` was already live before repairing it `applied`, and explicitly *not* repair-marking the two real pending ones. Ran `supabase db push` for real, which applied `20260804180000` and `20260804190000` — both are now genuinely live, not just marked as such. Re-ran the `Deploy Supabase` GitHub Actions workflow afterward and it went fully green: `db push` no-op, all 3 Edge Functions redeployed. See the rewritten §3 Supabase bullet for the full detail. This closes out the deploy-drift item entirely — PR #27's pipeline is now proven working.

### 2026-08-04 — Claude Code (cloud), first live deploy attempt
Mohamed added the `SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF` repo secrets and asked me to trigger PR #27's `Deploy Supabase` workflow — its first ever run. `supabase link` succeeded, but `supabase db push` failed cleanly (no changes applied) because the live database's migration history contains 6 timestamps with no matching file in this repo — see the updated §3 Supabase bullet for the full error and the six IDs. This is real, previously-invisible drift between the live DB and this repo, not a mistake in tonight's work. Left it alone rather than guessing at a repair — flagged as the next thing whoever has Supabase CLI/dashboard access needs to look at (`supabase db pull` first, to see what's actually there). (Note: PR #32, adding the prior session-log entry, was still open/unmerged as of this entry — check whether it landed before assuming `main` has it.)

### 2026-08-04 — Claude Code (cloud), handing off to Desktop
Opened, watched through CI, and merged PR #30 (credential-file check + local setup notes) — `main` is now at `de2a567`. Mohamed is picking up work from his Desktop/laptop session next. **Two things for whoever's on Desktop:** (1) pull the latest `main` into your local checkout before doing anything — don't build on a stale copy. (2) The project's local folder has moved to the **J: partition** (was `C:\projects\RED SEA AC`) — confirm you're working out of the new location, not the old one, before running any of the setup steps documented in §5. See the ⚠ note in §1 for more.

### 2026-08-04 — Claude Code (cloud), continued
Got Mohamed's laptop (`C:\projects\RED SEA AC`) to a working local dev environment: Node 24.19/npm 11.17 installed via Chocolatey, PowerShell execution-policy and npm `allow-scripts` blockers resolved (see §5), `npm install` clean in both root and `admin-panel/`, `typecheck` clean in both, `admin-panel` production build succeeds. Checked the flagged `.branch2_*_tmp` credential file from §3 — does not exist on that machine, closed as a dead end. Remaining §3 items are unchanged and still need Supabase dashboard, Paymob dashboard, or Mohamed's own decision to close.

### 2026-08-04 — Claude Code (cloud), session ending
Merged PRs #10, #22–#28 as described in §2. Verified #26 (stock-drain fix) against a real local Postgres instance, not just code review. Wrote this handoff file per Mohamed's request, to relay to Claude Desktop on his laptop. Everything in §3 is still open exactly as listed — no local/dashboard/Paymob access from this session to close any of it further.
