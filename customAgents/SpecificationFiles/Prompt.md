Build “OpenTickets Dashboard v2” — a modern organizer analytics dashboard for single events and tours.

PRIMARY GOAL
Recreate and improve the existing OpenTickets dashboard experience shown in my screenshots, but make it more intuitive, faster to scan, and tour-ready. The dashboard must work TODAY with CSV/XLSX uploads and be API-ready later (same UI, different data adapter).

DATA INPUT (MVP: XLSX/CSV UPLOAD)
Users upload one or more files:
- Single event: one file
- Tour: multiple files (one per city/event) OR one file with multiple EventName values

Support .xlsx and .csv.
On upload:
1) Parse rows
2) Show a “Data Health” summary (missing columns, invalid dates, empty values)
3) Auto-map fields using known export schema
4) Render dashboard immediately

KNOWN EXPORT SCHEMA (AUTO-MAP THESE COLUMNS)
My current export contains these columns (use them as your default mapping):
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

If a future file is missing some fields, the UI must gracefully hide or soften dependent widgets with “Not available in this dataset”.

DATA MODEL (DERIVED)
Treat each row as a “Ticket Transaction / Buyer Purchase” and derive:
- Tickets sold = SUM(TotalTickets)
- Gross revenue = SUM(TotalAmount)
- Organizer net = SUM(OrganizerAmount)
- Fees = SUM(PlatformFee + PaymentProviderFee + TaxFee) when available
- Refunds = COUNT(IsRefunded = true), refunded gross = SUM(TotalAmount where refunded)
- Disputes = COUNT(IsDisputed = true)
- Valid tickets ratio = COUNT(IsValid = true) / total rows (or by tickets if possible)
- Scans = SUM(TotalScanCount)
- Redeemed tickets = SUM(TotalTicketRedeemed)
- Redemption rate = Redeemed / Sold
- Scan rate = Scans / Sold (if scans represent ticket-level)
Also derive time-series aggregations:
- By day/hour (PurchaseDate)
- By redemption time (TicketRedemptionDateTime)

INFORMATION ARCHITECTURE (MATCH SCREENSHOTS BUT BETTER)
Use a clean dark theme (OpenTickets vibe) with higher readability (less neon, better contrast).
Layout:
- Left sidebar nav (collapsible) + top header bar.
- Global filters are sticky at top.

NAV ITEMS (BASED ON CURRENT UI)
Dashboard
Customers
Transactions
Referrals
Redemption
Sources
Disputes
Config / Settings
(Keep placeholders if not in dataset yet)

GLOBAL FILTERS (STICKY)
- Event selector (EventName) with multi-select for Tour view
- Date range picker with toggle:
  - PurchaseDate mode
  - RedemptionDateTime mode
- TicketTypes multi-select
- PurchaseFrom filter (online / boxOffice / other values)
- Flags: Refunded / Disputed / Valid (toggle chips)
- ReferralCode filter
- Search (Name, Email, Phone, ticketId, PaymentID)

TOP HEADER (FROM SCREENSHOTS)
- Title: “{EventName} | {City if available}”
- Timestamp “Last updated” (for upload mode: time of upload)
- Primary actions (top right):
  - “Send All User Ticket Email” (MVP: UI stub + toast, later API)
  - “QR Code Generate” (MVP: generate QR for ticketId or PaymentID selection)
  - “Download All Transactions” (export filtered table to CSV)

DASHBOARD WIDGETS TO RECREATE (FROM SCREENSHOTS)
1) Highlights card:
   - Total Revenue (Gross)
   - Organizer Net
   - Tickets Sold
   - Redeemed
   - Refund count + refunded $
   - Disputes count
   - Optional: Avg ticket price, AOV (derived)
2) Tickets Sold by Category (TicketTypes)
   - Donut: sold vs capacity (capacity may be missing; if missing show sold only)
   - Right-side “category cards” (one per TicketTypes) showing:
     - Tickets sold
     - Price (if can be inferred; if not, show Avg revenue per ticket for that type)
     - “SOLD OUT” label only if capacity exists and sold >= capacity
3) Ticket Redeemed by Category
   - Donut: redeemed vs sold
   - Category cards showing redeemed counts
4) Ticket Issue Source (PurchaseFrom)
   - Donut of sources + cards:
     - online count
     - boxOffice count
5) Referral section (from screenshots)
   - “Checking by Referral” donut = tickets scanned/redeemed per ReferralCode
   - “Tickets Sold by Referral” donut = tickets sold per ReferralCode
   - “Referral Codes” list cards:
     - code name
     - discount (ReferralCodeDiscount + DiscountType)
     - usage count (tickets sold via code)
     - copy button
     - active status:
       - If no explicit “active”, infer active = has sales in selected date range
6) Customers page (from screenshots)
   - Table columns:
     - SN, Name, Email, Phone Number, Registration Date (PurchaseDate), Actions (view)
   - Search input + date filter
   - Pagination
   - Row click opens a detail drawer:
     - all purchases for that Email/Phone
     - totals (tickets, amount, redeemed, refunded)
7) Recent Activities / Transactions (from screenshots)
   - Table with:
     - Avatar (initials), Name, Email, EventName, Number Scanned (TotalScanCount),
       Total (TotalAmount), Date/Time (PurchaseDate), Actions menu
   - Provide export button
8) Overview charts (from screenshots)
   - Time range toggle: Week / Month / Year / All Time
   - Sales Count (line chart) = number of tickets sold (or orders) over time
   - Category Redemption (multi-line or stacked area) by TicketTypes over time (redemptions)
   - Category Sales (stacked bar or line) by TicketTypes over time (sales)

TOUR MODE (KEY REQUIREMENT)
If multiple EventName values exist (or multiple files uploaded):
- Add a “Tour Overview” page:
  - KPI comparison table per EventName:
    tickets sold, gross, organizer net, redemption rate, refund rate, dispute rate, online vs boxOffice mix
  - Charts:
    - Gross by city/event
    - Sold vs Redeemed by event
    - Top ticket type per event
  - “Best/Worst performers” insight callouts

INSIGHTS PANEL (AUTO-GENERATED)
Add a right-side or top “Insights” module that outputs 5–10 bullets based on filtered data:
- Top ticket type by revenue
- Highest refund rate ticket type
- Which referral code drives most sales
- Online vs boxOffice share
- Peak purchase hour/day
- Redemption lag (avg time from purchase to redemption) if both timestamps exist
Each insight must show numbers (not vague statements).

UX IMPROVEMENTS (IMPORTANT)
- Make the dashboard feel less “empty” when data is small:
  - Show meaningful empty states + explanations
- Improve readability:
  - Better spacing, typography scale, consistent card padding
- Tables:
  - sticky header, sortable columns, column chooser, quick filters, export
- Use drilldowns:
  - Clicking a chart segment filters the tables automatically

ENGINEERING REQUIREMENTS (MVP)
- React dashboard with modular components
- Data adapter pattern: UploadAdapter now, ApiAdapter later
- Avoid hardcoded ticket type names (derive from TicketTypes)
- Handle large datasets (virtualize tables if needed)
- All filtering should be client-side for MVP; keep an interface ready for server-side later

DONE CRITERIA
After I upload an XLSX/CSV, I can:
- Select an event (or tour)
- See the same widgets as current screenshots (but better UI)
- Drill down into customers, referrals, transactions
- Export filtered transactions
- Switch Week/Month/Year/All Time and see charts update
- Use PurchaseFrom, Refund, Dispute, Valid filters and see everything react


