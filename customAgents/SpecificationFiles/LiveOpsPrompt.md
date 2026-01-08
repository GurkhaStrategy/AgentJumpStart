Build “OpenTickets Dashboard v2” — a modern organizer analytics + live ops + finance dashboard for single events and tours. Recreate all widgets from my screenshots, but with better UX, deeper drilldowns, and tour + Stripe payout auditing.

PRIMARY GOAL
- CSV/XLSX-first analytics dashboard for OpenTickets events (during + after event)
- Tour-ready: compare multiple events/cities and aggregate performance
- Stripe-ready: enrich payments by PaymentID to determine routing destination + payout deposit details
- Support-ready: fast customer/transaction lookup and resolution

DATA INPUT (MVP: XLSX/CSV UPLOAD)
Users upload one or more files:
- Single event: one file
- Tour: multiple files (one per event/city) OR one file with multiple EventName values
Accept .xlsx and .csv.

On upload:
1) Parse rows
2) Show “Data Health” summary (missing columns, invalid dates, duplicates)
3) Auto-map fields using known export schema
4) Render dashboard immediately
5) Persist upload state in session (MVP)

KNOWN EXPORT SCHEMA (AUTO-MAP THESE COLUMNS)
Use these as default mappings (from my export):
SN
EventName
ticketId
Name
Email
Phone
TicketTypes
TotalTickets
TotalAmount
PurchaseDate
PurchaseFrom
IsRefunded
RefundedRemarks
IsValid
IsDisputed
ReferralCode
ReferralCodeDiscount
ReferralCodeDiscountType
PaymentMethod
PaymentID
TotalScanCount
TotalTicketRedeemed
TicketWasLastScannedTime
TicketRedemptionDateTime
PlatformFee
PaymentProviderFee
TaxFee
OrganizerAmount

If fields are missing, hide dependent widgets and show “Not available in this dataset”.

NORMALIZATION (IMPORTANT)
TicketTypes, PurchaseFrom, ReferralCode may be inconsistent strings. Implement:
- Trim + lowercase normalization
- Alias mapping UI: merge “general tickets” and “general admission” etc.
- Dedupe buyers by Email then Phone then Name
- Detect duplicate ticketId rows
- Support multi-type purchases if TicketTypes contains multiple values (split safely)

DERIVED METRICS (CORE)
Treat each row as a transaction/purchase and derive:
- Tickets sold = SUM(TotalTickets)
- Orders count = row count
- Gross revenue = SUM(TotalAmount)
- Fees:
  - Platform fees = SUM(PlatformFee)
  - Payment provider fees = SUM(PaymentProviderFee)
  - Tax = SUM(TaxFee)
- Organizer net (booked) = SUM(OrganizerAmount)
- Refund count/rate = COUNT(IsRefunded)/COUNT(rows)
- Refund $ = SUM(TotalAmount where IsRefunded true)
- Dispute count/rate = COUNT(IsDisputed)/COUNT(rows)
- Valid rate = COUNT(IsValid true)/COUNT(rows)
- Scans = SUM(TotalScanCount)
- Redeemed tickets = SUM(TotalTicketRedeemed)
- Redemption rate = Redeemed / Tickets sold
- Scan rate (if meaningful) = Scans / Tickets sold

Time series aggregations:
- By hour/day/week over PurchaseDate
- By redemption over TicketRedemptionDateTime
Add granularity toggle: hour/day/week

INFORMATION ARCHITECTURE (NAV)
Left sidebar (collapsible) + top header + sticky global filters.
Nav items:
- Dashboard (Executive summary)
- Live Ops (during event)
- Customers
- Transactions
- Referrals
- Redemption
- Sources
- Refunds
- Disputes
- Deposits & Payouts (Stripe)
- Tour Overview (if multi-event)
- Diagnostics (data health & audit)
- Config / Settings

GLOBAL FILTERS (STICKY)
- Event selector (EventName) single or multi-select for tours
- Date range picker + mode toggle:
  - PurchaseDate
  - RedemptionDateTime
- TicketTypes multi-select
- PurchaseFrom multi-select
- Flags: Refunded, Disputed, Valid (toggle chips)
- ReferralCode filter
- Search: Name, Email, Phone, ticketId, PaymentID

TOP HEADER (MATCH SCREENSHOTS)
- Title: “{EventName} | {City if available}”
- Last updated timestamp (upload time)
- Actions (top right):
  - Send All User Ticket Email (MVP stub + toast; later API)
  - QR Code Generate (generate QR for selected ticketId / PaymentID or per-row)
  - Download Transactions (export filtered CSV)
  - Share (placeholder)

DASHBOARD (RECREATE + IMPROVE)
1) Highlights (Executive KPIs)
Show KPI cards:
- Tickets sold
- Orders
- Gross revenue
- Organizer net (booked)
- Redeemed tickets + redemption rate
- Refunds (count + $ + rate)
- Disputes (count + rate)
- Online vs boxOffice share
Include trend deltas if comparing period is enabled (this week vs last week, etc.).

2) Financial Waterfall (NEW, MUST-HAVE)
A “Money Waterfall” widget:
Gross (TotalAmount)
- Refunds (TotalAmount where refunded)
- PaymentProviderFee
- PlatformFee
- TaxFee (if treated as pass-through, still display)
= OrganizerAmount (booked net)
Then when Stripe payout is enabled:
Show Paid Out vs Pending for OrganizerAmount and/or routed amounts.

3) Tickets Sold by Category (TicketTypes)
- Donut: sold vs capacity (if capacity is unknown, show sold-only and remove sold-out labels)
- Right side category cards:
  - Tickets sold
  - Redeemed
  - Refund count
  - Revenue
  - Avg revenue per ticket (fallback “price”)
- Do NOT hardcode ticket type names.

4) Ticket Redeemed by Category
- Donut: redeemed vs sold
- Category cards: redeemed counts + redemption %

5) Ticket Issue Source (PurchaseFrom)
- Donut and cards (online, boxOffice, other)
- Include revenue per source + refund/dispute rate per source

6) Referrals (as in screenshots, improved)
- Checking by Referral donut: redeemed/scans per ReferralCode
- Tickets Sold by Referral donut: tickets sold per ReferralCode
- Referral Codes list:
  - code
  - discount + type
  - tickets sold + revenue
  - refund/dispute rate via that code
  - copy button
  - active status: infer active = has sales in date range

7) Recent Activities (Transactions)
- Table: Name, Email, Event, TotalScanCount, TotalAmount, PurchaseDate, Actions
- Add quick filters and export

8) Overview Charts (improve current charts)
Time range toggle: Week / Month / Year / All Time + custom range
Granularity toggle: hour/day/week
Metric toggle: orders/tickets/revenue/net
Charts:
- Sales count (orders or tickets)
- Revenue over time (gross + net)
- Category sales over time (stacked)
- Category redemption over time (stacked)

LIVE OPS TAB (NEW, MUST-HAVE)
Designed for door staff + event ops:
Widgets:
- Live Scan Velocity (scans per 5/15/30 minutes)
- Peak entry window (top 1–2 time windows)
- Redeemed vs Unredeemed live counter
- Unredeemed by TicketType list (what remains)
- Alerts:
  - Duplicate scan spikes (if ticketId repeats with redemption timestamps)
  - Invalid scans (if IsValid false)
  - High refund/dispute purchases attempting redemption (if possible)
Tables:
- “Recently Redeemed” feed sorted by TicketRedemptionDateTime
- “At-risk” list: disputed/refunded purchases with redemption attempts (if timestamps exist)

CUSTOMERS PAGE (RECREATE + FIX DUPES)
Customers table (deduped view by Email/Phone):
Columns:
- Customer Name (best available)
- Email
- Phone
- First Purchase Date
- Last Purchase Date
- Total Orders
- Total Tickets
- Total Spent
- Redeemed Tickets
- Flags: refunded/disputed
Search + date filter + pagination
Customer detail drawer:
- all transactions for that buyer
- totals, refund/dispute history, redemption timeline

TRANSACTIONS PAGE (SUPPORT-FIRST)
Transaction table columns:
- PurchaseDate
- Name
- Email
- TicketTypes
- TotalTickets
- TotalAmount
- OrganizerAmount
- PurchaseFrom
- ReferralCode
- IsRefunded
- IsDisputed
- IsValid
- PaymentMethod
- PaymentID
Add column chooser, sorting, export.
Transaction detail drawer (Support View):
- copy buttons: ticketId, PaymentID, Email
- show fees breakdown, redemption timestamps
- quick actions placeholders:
  - resend ticket email
  - generate QR
  - add internal note (MVP local)
  - open Stripe (when Stripe is enabled)

REFUNDS PAGE (NEW)
- KPI cards: refund count, refund $, refund rate
- Breakdowns:
  - by TicketTypes
  - by PurchaseFrom
  - by ReferralCode
- Refund table: PurchaseDate, Buyer, Amount, Remarks (RefundedRemarks), PaymentID

DISPUTES PAGE (NEW)
- KPI cards: dispute count, dispute rate, disputed $
- Breakdown by source/referral/ticket type
- Disputes table: PurchaseDate, Buyer, Amount, PaymentID

SOURCES x REFERRAL MATRIX (NEW)
Create a matrix widget:
Rows: PurchaseFrom
Columns: ReferralCode (top N) + “No referral”
Cells show tickets sold + revenue, clickable to filter transactions.

TOUR MODE (MULTI-EVENT) — REQUIRED
If multiple EventName values:
Create “Tour Overview” page:
- KPI table per EventName:
  tickets sold, orders, gross, net (OrganizerAmount), redemption rate, refund rate, dispute rate, online share
- Ranking and best/worst callouts
- Charts:
  - Gross by event/city
  - Net by event/city
  - Sold vs redeemed by event
  - Refund/dispute rate by event
- Sales curve normalization:
  - Align events by “days since first on-sale purchase” and compare trajectories

CAPACITY SETTINGS (OPTIONAL BUT IMPORTANT)
If capacity isn’t in the file:
Add Config > Event Settings:
- Event capacity (total)
- Optional capacity per TicketType
Enable “SOLD OUT” labels only when capacity exists.

DIAGNOSTICS (DATA HEALTH & AUDIT) — MUST HAVE
Diagnostics page shows:
- Missing PaymentID rows
- TotalTickets = 0 but TotalAmount > 0
- Redeemed > Sold anomalies
- Invalid/missing PurchaseDate or RedemptionDateTime
- Duplicate ticketId
- TicketTypes parsing issues
- Buyers with inconsistent identifiers (same email different names)
Provide exportable list of problematic rows.

INSIGHTS ENGINE (AUTO CALLOUTS)
Add “Insights” module (5–10 bullets) with numbers:
- Top ticket type by revenue
- Top referral by tickets/revenue
- Online vs boxOffice contribution
- Highest refund rate ticket type
- Highest dispute rate source/referral
- Peak purchase hour/day
- Avg time from purchase to redemption (if redemption timestamp exists)
Each insight is clickable to apply filters.

ROLE-READY (FUTURE)
Define role presets for when API arrives:
- Owner/Organizer: all data
- Door staff: Live Ops only (hide money)
- Finance: Financials + Stripe routing/payout

========================
SECONDARY FEATURE (INCLUDED NOW): STRIPE ROUTING + PAYOUT DEPOSIT TRACE
========================

Goal:
Using PaymentID (Stripe) determine:
- Was the payment routed to Platform Stripe account or a Connected account?
- Name both Platform account and Connected account
- Summarize per EventName: how much went to each connected account and how much stayed on platform
- ALSO show: which bank account it was deposited to (masked) and the deposit date (arrival date), with payout status

FEATURE FLAG
Default OFF.
Settings > Integrations > Stripe:
- Platform Stripe Secret Key (session-only storage for MVP)
- Toggle: Enable Stripe Routing + Deposits Audit
- Test connection
Placeholder: “OAuth later”

StripeEnrichment Service (Adapter)
- OFF: dashboard runs purely on upload
- ON: enriches PaymentID with Stripe API calls + caching + rate limiting

PaymentID Handling
- PaymentIntent id: "pi_..."
- Charge id: "ch_..."
Fetch PI and/or Charge accordingly.

Routing Determination (Connect)
Classify route type using Stripe Connect fields:
- destination charge: transfer_data.destination / destination / on_behalf_of
- transfer-based: transfer / transfer_group where identifiable
If destination/connected id exists => connected route
Else => platform route

Add enriched fields per row:
- stripeRouteType: platform|connected
- stripePlatformAccountId + Name
- stripeDestinationAccountId + Name
- stripePaymentIntentId, stripeChargeId
- stripeBalanceTransactionId, stripeTransferId

Per-event Routing Summary (Dashboard + Tour)
- Routed to Platform: sum of TotalAmount for platform-routed payments
- Routed to Connected Accounts: sum of TotalAmount for connected-routed payments
- Breakdown table grouped by destination account:
  destination name, acct id, total amount, count of payments, organizerAmount sum, fees sums
Include unresolved count.

Deposits / Bank Account / Deposit Date (Payout Trace)
IMPORTANT: Stripe payouts bundle many charges; trace via balance transactions.

For each payment (best-effort trace):
- From Charge -> balance_transaction
- If balance_transaction.payout exists:
  retrieve payout:
    payout.created, payout.arrival_date, payout.status, payout.destination
  retrieve external account (bank/card) for payout.destination to get:
    bank_name + last4 (masked)
- If payout is null:
  show “Not yet paid out / not traceable”
  fallback to balance_transaction.available_on if present (availability proxy)

Connected route payout trace:
- If connected account id known:
  query connected context ("Stripe-Account: acct_xxx")
  attempt to retrieve payout and external account there
If access missing, show “Requires connected access” and keep platform routing visible.

UI ADDITIONS FOR STRIPE
1) Transactions table: add columns (toggleable)
- Stripe Route (Platform/Connected badge)
- Destination Account
- Deposit Status
- Deposit Date (arrival_date)
- Deposit Bank (bank name + last4)
2) Transaction drawer: show all Stripe + payout details + copy IDs
3) New page: “Deposits & Payouts”
- Group by payout:
  payout created, arrival date, status, account name, bank masked, amount, transaction count
Click payout filters transactions.
4) Dashboard card: “Deposits”
- Deposited amount (paid)
- Pending amount
- Failed amount
- Next arrival date (min pending arrival_date)
5) Tour Overview: deposit health per event
- deposited vs pending
- earliest arrival date
- # bank destinations involved

ENGINEERING REQUIREMENTS (MVP)
- React dashboard with modular components
- Data adapter pattern: UploadAdapter now, ApiAdapter later
- StripeEnrichment service with caching + progress indicator
- Avoid hardcoded ticket type names; derive from TicketTypes
- Tables: sortable, sticky header, column chooser, export
- Large dataset ready (virtualize tables)
- All charts + tables react to global filters
- Clicking any chart segment applies filters and updates tables

DONE CRITERIA
After upload:
- I can view a single event dashboard matching my screenshots (but better)
- I can drill into Customers, Transactions, Referrals, Refunds, Disputes
- I can run Live Ops during event (scan velocity + alerts + recent redemptions)
- I can switch time range + granularity + metric toggles and see charts update
- Tour mode works with multi-event comparisons and rollups
If Stripe enabled:
- For each PaymentID, show routed destination (platform vs connected), account names
- Show bank deposit destination (masked) + deposit arrival date + payout status where traceable
- Summarize routing and deposits per event and per connected account
