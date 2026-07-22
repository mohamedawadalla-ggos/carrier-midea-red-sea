# Implemented control-panel scope

## Working modules

1. Overview dashboard
2. Price book and public sale prices
3. Discount campaigns
4. Public contact and feature settings
5. Cities and service availability
6. Warehouses
7. Audit log

## Roles

- `super_admin`: full access
- `management`: approval and publishing
- `accounts`: price drafts and warehouse management
- `marketing`: discount and public-setting drafts
- `operations`: location and warehouse operational updates
- `sales`: read catalog/prices/discounts
- `auditor`: read audit history

## Approval rules

- Accounts may create and update price entries only while they are draft or pending approval.
- Marketing may create discount and setting drafts.
- Operations may create location drafts.
- Operational changes to published locations are stored as revisions; the last approved version remains public until Management or Super Admin publishes the replacement.
- Management or Super Admin publishes public values.
- Anonymous reads are restricted to explicit public columns and expose no approval references, internal user UUIDs, or dealer costs.

## Not yet included

- Payment provider integration
- Orders and checkout
- Stock movement ledger and reservation engine
- Installation quotations
- Refund processing
- File/image uploads
- User invitation UI
