SECONDARY FEATURE (BUT INCLUDED IN UI + PROMPT): STRIPE ROUTING / DESTINATION ACCOUNT AUDIT

Context:
Each transaction row includes PaymentID (from Stripe). We need to enrich the dashboard by querying Stripe to determine where the payment funds were routed:
- Platform Stripe account (OpenTickets platform)
- Stripe connected account (client/organizer connected account)

We must display:
1) Whether each payment was routed to Platform or Connected
2) Connected account name (and connected account ID) when applicable
3) Platform account display name + platform account ID
4) Per-event summary totals: how much money went to each destination account

ASSUMPTIONS / IDENTIFIERS
- PaymentID will match either:
  - PaymentIntent ID: starts with "pi_"
  - Charge ID: starts with "ch_"
- The export also includes OrganizerAmount, PlatformFee, PaymentProviderFee, TaxFee and TotalAmount.
- The Stripe routing truth must come from Stripe API (not inferred from OrganizerAmount).

DATA ADAPTERS
Create a StripeEnrichment service with two modes:
A) OFF (default): dashboard runs fully on uploaded XLSX/CSV without Stripe calls.
B) ON (user enables): dashboard requests Stripe API credentials and enriches rows.

STRIPE AUTH OPTIONS (UI)
Provide a Settings > Integrations > Stripe section:
- Platform Stripe Secret Key input (stored securely; for MVP store in session only)
- Optional: “Use OAuth later” placeholder
- Toggle: “Enable Stripe Routing Audit”
- Button: “Test connection”

ENRICHMENT FLOW
When enabled:
- For each unique PaymentID in current filtered dataset:
  1) If PaymentID starts with "pi_": retrieve the PaymentIntent.
  2) If PaymentID starts with "ch_": retrieve the Charge; if it has payment_intent, also fetch PI.
  3) Determine routing outcome using Stripe Connect fields:
     - destination (destination charge) OR transfer_data.destination OR on_behalf_of
     - transfer / balance transaction details as needed
  4) Resolve destination account:
     - If destination / transfer destination exists => Connected Account route
     - Else => Platform route
  5) Fetch readable names:
     - Platform account name (Stripe Account retrieve for platform)
     - Connected account name:
       - Prefer Stripe Account’s `business_profile.name` or `settings.dashboard.display_name`
       - Fallback to `id` if name missing
  6) Cache results in memory keyed by PaymentID to avoid repeated calls.

IMPORTANT PERFORMANCE RULES
- Rate-limit Stripe requests and batch where possible.
- Cache results for the session.
- Provide progress indicator: “Enriching 42 payments…”

DATA MODEL (NEW FIELDS)
Add derived/enriched columns to each transaction row:
- stripeRouteType: "platform" | "connected"
- stripePlatformAccountId
- stripePlatformAccountName
- stripeDestinationAccountId (nullable)
- stripeDestinationAccountName (nullable)
- stripeChargeId (nullable)
- stripePaymentIntentId (nullable)
- stripeBalanceTransactionId (nullable)
- stripeTransferId (nullable)
- stripeApplicationFeeAmount (nullable, if available)
- stripeNetAmount (nullable, if available)

UI: WHERE THIS APPEARS
1) Transactions Table (add optional columns)
- Stripe Route (badge: Platform / Connected)
- Destination Account (name + short id)
- Platform Account (name)
- Stripe IDs (drawer only)
Include a “View in Stripe” link in the row detail drawer (future placeholder if no dashboard links).

2) Event Summary: “Payout Routing” Card (NEW)
Add a card on the Dashboard overview:
- “Routed to Platform” amount
- “Routed to Connected Accounts” amount
- “# Connected Accounts involved” count
- “Unresolved Stripe lookups” count (if any)

3) NEW PAGE: “Stripe Routing”
A dedicated page/tab:
- Top summary:
  - Total routed to platform vs connected
  - Total application fees (if available)
  - Total net (if available)
- Breakdown table grouped by destination:
  Columns:
  - Destination Account Name (or Platform)
  - Stripe Account ID
  - Total Amount (sum of TotalAmount from rows that routed there)
  - OrganizerAmount sum (from export)
  - PlatformFee sum (from export)
  - Count of Payments
- Add drilldown: click an account to filter transactions

4) TOUR MODE: per-event routing summary (REQUIRED)
On Tour Overview:
- Add a “Routing Summary” section with a table:
  Rows: each EventName
  Columns:
    - Platform routed amount
    - Connected routed amount
    - Top connected account (by amount)
    - # connected accounts
    - unresolved count

ERROR HANDLING / EDGE CASES
- Some PaymentIDs may not exist or may be from a different Stripe environment:
  - Mark as “Unresolved” with reason
- Some payments may be split or involve transfers:
  - Always classify by Stripe’s destination/transfer fields, not by OrganizerAmount
- If Stripe key missing, keep the feature hidden and show “Connect Stripe to enable”.

DONE CRITERIA FOR THIS FEATURE
- Toggle on Stripe Routing Audit
- Dashboard enriches payments using Stripe API
- Transactions show Platform vs Connected + account name
- Event-level totals show how much routed to platform vs each connected account
- Tour overview shows routing totals per event


SECONDARY FEATURE (BUT INCLUDED IN UI + PROMPT): STRIPE ROUTING / DESTINATION ACCOUNT AUDIT

Context:
Each transaction row includes PaymentID (from Stripe). We need to enrich the dashboard by querying Stripe to determine where the payment funds were routed:
- Platform Stripe account (OpenTickets platform)
- Stripe connected account (client/organizer connected account)

We must display:
1) Whether each payment was routed to Platform or Connected
2) Connected account name (and connected account ID) when applicable
3) Platform account display name + platform account ID
4) Per-event summary totals: how much money went to each destination account

ASSUMPTIONS / IDENTIFIERS
- PaymentID will match either:
  - PaymentIntent ID: starts with "pi_"
  - Charge ID: starts with "ch_"
- The export also includes OrganizerAmount, PlatformFee, PaymentProviderFee, TaxFee and TotalAmount.
- The Stripe routing truth must come from Stripe API (not inferred from OrganizerAmount).

DATA ADAPTERS
Create a StripeEnrichment service with two modes:
A) OFF (default): dashboard runs fully on uploaded XLSX/CSV without Stripe calls.
B) ON (user enables): dashboard requests Stripe API credentials and enriches rows.

STRIPE AUTH OPTIONS (UI)
Provide a Settings > Integrations > Stripe section:
- Platform Stripe Secret Key input (stored securely; for MVP store in session only)
- Optional: “Use OAuth later” placeholder
- Toggle: “Enable Stripe Routing Audit”
- Button: “Test connection”

ENRICHMENT FLOW
When enabled:
- For each unique PaymentID in current filtered dataset:
  1) If PaymentID starts with "pi_": retrieve the PaymentIntent.
  2) If PaymentID starts with "ch_": retrieve the Charge; if it has payment_intent, also fetch PI.
  3) Determine routing outcome using Stripe Connect fields:
     - destination (destination charge) OR transfer_data.destination OR on_behalf_of
     - transfer / balance transaction details as needed
  4) Resolve destination account:
     - If destination / transfer destination exists => Connected Account route
     - Else => Platform route
  5) Fetch readable names:
     - Platform account name (Stripe Account retrieve for platform)
     - Connected account name:
       - Prefer Stripe Account’s `business_profile.name` or `settings.dashboard.display_name`
       - Fallback to `id` if name missing
  6) Cache results in memory keyed by PaymentID to avoid repeated calls.

IMPORTANT PERFORMANCE RULES
- Rate-limit Stripe requests and batch where possible.
- Cache results for the session.
- Provide progress indicator: “Enriching 42 payments…”

DATA MODEL (NEW FIELDS)
Add derived/enriched columns to each transaction row:
- stripeRouteType: "platform" | "connected"
- stripePlatformAccountId
- stripePlatformAccountName
- stripeDestinationAccountId (nullable)
- stripeDestinationAccountName (nullable)
- stripeChargeId (nullable)
- stripePaymentIntentId (nullable)
- stripeBalanceTransactionId (nullable)
- stripeTransferId (nullable)
- stripeApplicationFeeAmount (nullable, if available)
- stripeNetAmount (nullable, if available)

UI: WHERE THIS APPEARS
1) Transactions Table (add optional columns)
- Stripe Route (badge: Platform / Connected)
- Destination Account (name + short id)
- Platform Account (name)
- Stripe IDs (drawer only)
Include a “View in Stripe” link in the row detail drawer (future placeholder if no dashboard links).

2) Event Summary: “Payout Routing” Card (NEW)
Add a card on the Dashboard overview:
- “Routed to Platform” amount
- “Routed to Connected Accounts” amount
- “# Connected Accounts involved” count
- “Unresolved Stripe lookups” count (if any)

3) NEW PAGE: “Stripe Routing”
A dedicated page/tab:
- Top summary:
  - Total routed to platform vs connected
  - Total application fees (if available)
  - Total net (if available)
- Breakdown table grouped by destination:
  Columns:
  - Destination Account Name (or Platform)
  - Stripe Account ID
  - Total Amount (sum of TotalAmount from rows that routed there)
  - OrganizerAmount sum (from export)
  - PlatformFee sum (from export)
  - Count of Payments
- Add drilldown: click an account to filter transactions

4) TOUR MODE: per-event routing summary (REQUIRED)
On Tour Overview:
- Add a “Routing Summary” section with a table:
  Rows: each EventName
  Columns:
    - Platform routed amount
    - Connected routed amount
    - Top connected account (by amount)
    - # connected accounts
    - unresolved count

ERROR HANDLING / EDGE CASES
- Some PaymentIDs may not exist or may be from a different Stripe environment:
  - Mark as “Unresolved” with reason
- Some payments may be split or involve transfers:
  - Always classify by Stripe’s destination/transfer fields, not by OrganizerAmount
- If Stripe key missing, keep the feature hidden and show “Connect Stripe to enable”.

DONE CRITERIA FOR THIS FEATURE
- Toggle on Stripe Routing Audit
- Dashboard enriches payments using Stripe API
- Transactions show Platform vs Connected + account name
- Event-level totals show how much routed to platform vs each connected account
- Tour overview shows routing totals per event
