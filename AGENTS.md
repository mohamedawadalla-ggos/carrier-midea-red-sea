# Carrier–Midea Red Sea Project Rules

## Product identity

Build a production-ready bilingual website for:

- Carrier–Midea Red Sea
- كاريير ميديا البحر الأحمر
- Exclusive Dealer for Carrier and Midea
- Territory: Ain Sokhna and Red Sea Governorate
- Business balance: 50% product sales and 50% services

## Current phase

Phase 1 is a public sales and lead-generation website.

Phase 2 authorization: the repository may also contain the separately deployed control-panel and Supabase foundation documented in `docs/phase2/IMPLEMENTATION_SCOPE.md`. This authorization is limited to staff authentication, role-based administration of prices, discounts, public settings, service locations, warehouses, and audit metadata. Phase 2 remains subject to the approval, security, migration, and no-deployment rules below.

Include:

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

Do not build in the public Phase 1 application:

- CRM
- Database or authentication features outside the approved Phase 2 foundation
- An admin dashboard outside the separately scoped Phase 2 control panel
- Customer portal
- Technician portal
- Inventory
- Online payments
- AI chatbot

## Existing design

The existing design is approved.

Do not redesign:

- Header
- Hero
- Brand colors
- Typography
- Homepage structure
- Footer
- General visual language

New catalog and Facebook components must match the existing design.

## Product-data rules

- Do not describe models as best-selling unless Nael confirms this.
- Do not invent prices, discounts, availability or stock.
- Do not copy another retailer's price.
- Use “Request Price” and “اطلب السعر”.
- Store products in typed content files.
- Do not hard-code product data inside components.
- Preserve model codes exactly.
- Every product record must contain source and verification information.
- Mark uncertain information as requiring client confirmation.
- Product data must support Arabic and English.
- Nael must approve the final product list before publication.

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

- .env.example
- .env.local
- lib/site-config.ts

Required variables:

- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_FACEBOOK_PAGE_URL
- NEXT_PUBLIC_WHATSAPP_NUMBER
- NEXT_PUBLIC_PHONE_TEL
- NEXT_PUBLIC_PHONE_DISPLAY
- NEXT_PUBLIC_EMAIL
- NEXT_PUBLIC_GOOGLE_MAPS_URL
- NEXT_PUBLIC_GOOGLE_BUSINESS_URL
- NEXT_PUBLIC_META_PIXEL_ID
- NEXT_PUBLIC_GA_MEASUREMENT_ID

Rules:

- Never commit .env.local.
- Never expose private keys using NEXT_PUBLIC_.
- Hide optional UI elements when their variable is empty.
- Access environment variables explicitly.
- WhatsApp numbers must contain digits only, including Egypt country code.
- Environment-variable changes require a new build.

## Architecture

- Next.js App Router
- TypeScript strict mode
- Static-export compatible
- Mobile-first
- Arabic RTL and English LTR
- Typed content modules
- Business logic outside presentation components
- No unnecessary dependencies
- Preserve future CRM extensibility
- Product and service forms must use the LeadProvider abstraction

## Deployment

Do not deploy or publish unless explicitly instructed.

Do not change:

- Production environment variables
- Domain settings
- Hosting configuration
- DNS
- Analytics production IDs

without explicit approval.

## Quality gates

Before claiming completion, run:

- npm run lint
- npm run build
- TypeScript validation
- Static-export verification

Test:

- /ar and /en
- RTL and LTR
- Product filters
- Product detail routes
- WhatsApp messages
- Facebook links
- Missing optional environment variables
- Mobile layout
- Keyboard navigation
- Browser console

## Working process

Before editing:

1. Inspect the repository.
2. Read AGENTS.md.
3. Explain the plan.
4. List files to be changed.
5. List external sources and downloads.
6. Identify risks.
7. Wait for approval.

After editing:

1. Summarize every changed file.
2. Report downloaded assets and their sources.
3. Run all quality checks.
4. Report warnings honestly.
5. Do not deploy automatically.
