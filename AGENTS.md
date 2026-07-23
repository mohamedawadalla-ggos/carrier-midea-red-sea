# Carrier–Midea Red Sea Project Rules

## Product identity

Build and maintain a production-ready bilingual platform for:

- Carrier–Midea Red Sea
- كاريير ميديا البحر الأحمر
- Exclusive Dealer for Carrier and Midea
- Territory: Ain Sokhna and Red Sea Governorate
- Business balance: 50% product sales and 50% services

## Project phases and boundaries

### Phase 1 — Public storefront

Phase 1 is the public sales and lead-generation website in the repository root.

It includes:

- Arabic RTL and English LTR
- Product catalog
- Product detail pages
- Services
- Projects
- Offers
- Contact
- WhatsApp product inquiries
- WhatsApp service requests
- Facebook follower-conversion links
- SEO
- Static export

The public storefront must remain static-export compatible and must not depend on privileged database access, private admin sessions, or server-only secrets.

Do not add to the public storefront without explicit approval:

- Customer accounts
- Customer portal
- Technician portal
- Online payments
- Transactional inventory
- AI chatbot
- Private dealer costs
- Unpublished prices, discounts, or operational data

### Phase 2 — Internal control panel

Phase 2 is the authenticated internal control panel under `admin-panel/`.

It may include, within the approved scope:

- Supabase authentication
- Role-based access control
- Row Level Security
- Product price management
- Private dealer cost management
- Discount and publication controls
- Settings
- Locations and warehouses
- Audit history
- Super-admin account security

Phase 2 must remain isolated from the public storefront build, runtime, and public data surface.

Rules:

- Never expose private dealer costs through public pages, public views, static exports, client bundles, logs, or analytics.
- Public reads must use explicitly approved, safe fields or views.
- Authentication and authorization must be enforced by Supabase policies, not only by UI checks.
- Database schema, migration, policy, seed, or production-data changes require a separate explicit approval.
- Admin deployment requires a separate explicit approval from storefront deployment.
- Do not treat the existence of an admin control as permission to publish its data publicly.

## Existing design

The existing public design is approved.

Do not redesign:

- Header
- Hero
- Brand colors
- Typography
- Homepage structure
- Footer
- General visual language

New catalog and Facebook components must match the existing design.

Admin-panel improvements should preserve the established control-panel visual language unless a redesign is explicitly approved.

## Product-data rules

- Do not describe models as best-selling unless Nael confirms this.
- Do not invent prices, discounts, availability or stock.
- Do not copy another retailer's price.
- Use “Request Price” and “اطلب السعر” unless public price publication is explicitly approved and safely implemented.
- Store products in typed content files or approved database structures for their phase.
- Do not hard-code product data inside presentation components.
- Preserve model codes exactly.
- Every product record must contain source and verification information.
- Mark uncertain information as requiring client confirmation.
- Product data must support Arabic and English.
- Nael must approve the final public product list before publication.
- Private dealer costs and internal notes must never be included in public product records or exports.

## Image rules

- Do not permanently hotlink external images.
- Do not download images until the source and intended file path are listed for approval.
- Prefer official manufacturer or authorized distributor media.
- Do not scrape arbitrary shops or marketplaces.
- Record the source URL for each downloaded image.
- Preserve image transparency.
- Do not crop or distort product units.
- Do not modify official Carrier or Midea logos.
- Final manufacturer asset usage requires client authorization.
- Use temporary placeholders where authorization is uncertain.

## Facebook rules

The Facebook page is intended to receive legitimate local followers.

Allowed:

- Clearly visible Facebook links
- Follow-us sections
- Product and project sharing buttons
- Open Graph metadata
- Click-event tracking
- Real project and offer previews
- Local campaign landing links

Prohibited:

- Fake followers
- Bots
- Automated mass engagement
- Fake reviews
- Engagement manipulation
- Scraping Facebook user data
- Misleading follow-completion claims

Facebook calls to action must not visually compete with:

1. Buy Air Conditioner
2. Request Service
3. WhatsApp

## Configuration

Centralize public configuration through:

- `.env.example`
- `.env.local`
- `lib/site-config.ts`

Required public variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FACEBOOK_PAGE_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_PHONE_TEL`
- `NEXT_PUBLIC_PHONE_DISPLAY`
- `NEXT_PUBLIC_EMAIL`
- `NEXT_PUBLIC_GOOGLE_MAPS_URL`
- `NEXT_PUBLIC_GOOGLE_BUSINESS_URL`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

Rules:

- Never commit `.env.local`.
- Never expose private keys using `NEXT_PUBLIC_`.
- Hide optional UI elements when their variable is empty.
- Access environment variables explicitly.
- WhatsApp numbers must contain digits only, including Egypt country code.
- Environment-variable changes require a new build.
- Never commit Supabase service-role keys or other privileged credentials.
- Public Supabase URL and publishable/anonymous keys may be used only where their exposure is intended and protected by RLS.
- Production environment-variable changes require explicit approval.

## Architecture

### Public storefront

- Next.js App Router
- TypeScript strict mode
- Static-export compatible
- Mobile-first
- Arabic RTL and English LTR
- Typed content modules
- Business logic outside presentation components
- No unnecessary dependencies
- Preserve future CRM extensibility
- Product and service forms must use the `LeadProvider` abstraction

### Admin panel

- Located under `admin-panel/`
- Kept isolated from root TypeScript, ESLint, build output, and deployment configuration unless intentionally configured
- Uses typed data-access boundaries
- Enforces role and publication rules in both application logic and database policies
- Avoids privileged secrets in browser code
- Records sensitive administrative changes in the approved audit mechanism

## Protected files and generated output

- Never modify, move, delete, extract, replace, commit, or repackage `coolpet-review.zip`.
- Treat `output/` as untracked generated/review material unless its inclusion is explicitly approved.
- Do not commit generated build directories such as `.next/`, `out/`, `.vercel/`, or equivalent deployment output.
- Do not broaden ignore rules or delete existing untracked material without explaining the reason and receiving approval.

## Deployment

Do not deploy or publish unless explicitly instructed.

Do not change without explicit approval:

- Production environment variables
- Domain settings
- Hosting configuration
- Build root or output settings
- DNS
- Analytics production IDs

Storefront and admin deployments are separate approval gates. A successful preview deployment is not approval to publish production changes.

## Database and Supabase

Do not perform database actions without a separate explicit approval.

This includes:

- Applying or editing migrations
- Changing tables, views, functions, triggers, or indexes
- Changing RLS policies or grants
- Seeding or modifying production data
- Changing authentication settings
- Creating service-role workflows

Before any approved database action:

1. List the exact SQL or dashboard change.
2. Explain affected roles and data.
3. Identify rollback steps.
4. Verify that no private field becomes publicly readable.
5. Wait for the database-specific approval.

## Quality gates

Before claiming completion, run the checks relevant to every changed project.

### Root storefront

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`
- Static-export verification

Test:

- `/ar` and `/en`
- RTL and LTR
- Product filters
- Product detail routes
- WhatsApp messages
- Facebook links
- Missing optional environment variables
- Mobile layout
- Keyboard navigation
- Browser console

### Admin panel

Run the scripts defined in `admin-panel/package.json`, including the available equivalents of:

- TypeScript validation
- ESLint
- Automated tests
- Production build/static export

Also verify:

- Authentication flows
- Role boundaries
- RLS-backed reads and writes
- Publication safeguards
- Private-cost confidentiality
- Account-security behavior
- Mobile navigation
- Browser console

Report existing warnings separately from new errors. Never hide failed checks behind generated-output noise; exclude or remove generated build directories before rerunning lint.

## Approval gates

Treat each of these as a separate action requiring explicit approval:

1. Editing files after presenting the plan
2. Creating a commit
3. Pushing a branch
4. Creating or materially updating a pull request
5. Merging a pull request
6. Deploying or publishing
7. Changing Cloudflare, Vercel, DNS, domains, or production environment variables
8. Applying database, Supabase Auth, RLS, policy, or production-data changes
9. Downloading or permanently adding external assets

Approval for one gate does not imply approval for later gates.

## Working process

Before editing:

1. Inspect the repository.
2. Read `AGENTS.md`.
3. Explain the plan.
4. List files to be changed.
5. List external sources and downloads.
6. Identify risks.
7. Wait for approval.

During editing:

1. Change only the approved files and scope.
2. Preserve the public static storefront boundary.
3. Keep private admin data private.
4. Do not touch `coolpet-review.zip`.
5. Leave unrelated untracked files, including `output/`, unchanged.

After editing:

1. Summarize every changed file.
2. Report downloaded assets and their sources.
3. Run all relevant quality checks.
4. Report warnings honestly.
5. Show the diff and repository status.
6. Do not commit, push, merge, deploy, or change the database automatically.
