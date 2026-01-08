# OpenTickets Analytics Dashboard V2 - Technical Implementation Plan

## Project Overview

Build a React-based analytics dashboard for OpenTickets event ticket data with CSV/XLSX upload support. The dashboard provides organizers with KPI tracking, customer insights, transaction management, referral analytics, live operations monitoring, and Stripe payout routing audits. Desktop-first but tablet/mobile responsive.

---

## Tech Stack

| Category | Technology | Rationale |
|----------|-----------|-----------|
| **Build Tool** | Vite + React 18 + TypeScript | Fast dev experience, instant HMR, excellent for SPAs |
| **UI Framework** | Tailwind CSS + shadcn/ui | Beautiful dark mode, highly customizable, copy-paste components, great accessibility |
| **Charts** | Recharts | Free, React-native, great for donuts/lines/bars, easy customization |
| **Tables** | TanStack Table v8 | Headless, virtualization-ready for 8k+ rows, sorting/filtering built-in |
| **File Parsing** | SheetJS (xlsx) | Client-side XLSX/CSV parsing, free community edition |
| **State Management** | Zustand | Simple, lightweight, no boilerplate, scales well |
| **Routing** | React Router v6 | Standard, simple for SPA |
| **Date Handling** | date-fns + date-fns-tz | Lightweight, UTC→EST conversion, formatting |
| **Icons** | Lucide React | Free, clean, pairs with shadcn |
| **Form Handling** | React Hook Form + Zod | Lightweight validation for config forms |

---

## Data Schema (27 Columns)

Each row represents a single ticket purchase/transaction:

```typescript
interface TicketTransaction {
  SN: number;
  EventName: string;
  ticketId: string;
  Name: string;
  Email: string;
  Phone: string;
  TicketTypes: string;
  TotalTickets: number;
  TotalAmount: number;
  PurchaseDate: string; // UTC timestamp, convert to EST
  PurchaseFrom: string; // 'online' | 'boxOffice' | other
  IsRefunded: boolean;
  RefundedRemarks: string | null;
  IsValid: boolean;
  IsDisputed: boolean;
  ReferralCode: string | null;
  ReferralCodeDiscount: number | null;
  ReferralCodeDiscountType: string | null; // '%' | '$'
  PaymentMethod: string;
  PaymentID: string; // Stripe payment ID (pi_* or ch_*)
  TotalScanCount: number;
  TotalTicketRedeemed: number;
  TicketWasLastScannedTime: string | null;
  TicketRedemptionDateTime: string | null;
  PlatformFee: number;
  PaymentProviderFee: number;
  TaxFee: number;
  OrganizerAmount: number;
  
  // Enriched Stripe fields (when enabled)
  stripeRouteType?: 'platform' | 'connected';
  stripePlatformAccountId?: string;
  stripePlatformAccountName?: string;
  stripeDestinationAccountId?: string | null;
  stripeDestinationAccountName?: string | null;
  stripeChargeId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeBalanceTransactionId?: string | null;
  stripeTransferId?: string | null;
  stripeApplicationFeeAmount?: number | null;
  stripeNetAmount?: number | null;
  depositStatus?: 'paid' | 'pending' | 'failed' | 'not_traceable';
  depositDate?: string | null; // arrival_date
  depositBankName?: string | null;
  depositBankLast4?: string | null;
}
```

---

## Derived Metrics

```typescript
interface DerivedMetrics {
  // Core KPIs
  ticketsSold: number; // SUM(TotalTickets)
  ordersCount: number; // COUNT(rows)
  grossRevenue: number; // SUM(TotalAmount)
  organizerNet: number; // SUM(OrganizerAmount)
  totalFees: number; // SUM(PlatformFee + PaymentProviderFee + TaxFee)
  
  // Refunds
  refundCount: number;
  refundAmount: number;
  refundRate: number; // refundCount / ordersCount
  
  // Disputes
  disputeCount: number;
  disputeRate: number;
  
  // Validity
  validTicketsCount: number;
  validRate: number; // COUNT(IsValid) / COUNT(rows)
  
  // Redemption
  totalScans: number; // SUM(TotalScanCount)
  redeemedTickets: number; // SUM(TotalTicketRedeemed)
  redemptionRate: number; // redeemedTickets / ticketsSold
  
  // Sources
  onlineCount: number;
  boxOfficeCount: number;
  onlineShare: number; // percentage
  
  // Time-based
  avgTicketPrice: number; // grossRevenue / ticketsSold
  avgOrderValue: number; // grossRevenue / ordersCount
  avgRedemptionLag: number; // avg(TicketRedemptionDateTime - PurchaseDate) in hours
  peakPurchaseHour: number;
  peakPurchaseDay: string;
}
```

---

## Project Structure

```
opentickets-dashboard-v2/
├── .env.local (gitignored - for Stripe keys)
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── public/
│   └── favicon.ico
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── vite-env.d.ts
    │
    ├── components/
    │   ├── ui/ (shadcn/ui components)
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   ├── dialog.tsx
    │   │   ├── drawer.tsx
    │   │   ├── table.tsx
    │   │   ├── badge.tsx
    │   │   ├── tooltip.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   └── ...
    │   │
    │   ├── layout/
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   ├── GlobalFilters.tsx
    │   │   └── Shell.tsx
    │   │
    │   ├── dashboard/
    │   │   ├── HighlightsCard.tsx
    │   │   ├── FinancialWaterfall.tsx
    │   │   ├── TicketsSoldByCategory.tsx
    │   │   ├── TicketRedeemedByCategory.tsx
    │   │   ├── TicketIssueSource.tsx
    │   │   ├── ReferralDonuts.tsx
    │   │   ├── ReferralCodesList.tsx
    │   │   └── RecentActivities.tsx
    │   │
    │   ├── live-ops/
    │   │   ├── ScanVelocity.tsx
    │   │   ├── RedemptionCounter.tsx
    │   │   ├── UnredeemedByType.tsx
    │   │   ├── Alerts.tsx
    │   │   └── RecentlyRedeemed.tsx
    │   │
    │   ├── customers/
    │   │   ├── CustomersTable.tsx
    │   │   └── CustomerDetailDrawer.tsx
    │   │
    │   ├── transactions/
    │   │   ├── TransactionsTable.tsx
    │   │   └── TransactionDetailDrawer.tsx
    │   │
    │   ├── charts/
    │   │   ├── SalesCountChart.tsx
    │   │   ├── CategoryRedemptionChart.tsx
    │   │   ├── CategorySalesChart.tsx
    │   │   └── TimeRangeToggle.tsx
    │   │
    │   ├── tour/
    │   │   ├── TourComparisonTable.tsx
    │   │   ├── TourCharts.tsx
    │   │   └── BestWorstCallouts.tsx
    │   │
    │   ├── stripe/
    │   │   ├── StripeSettingsForm.tsx
    │   │   ├── PayoutRoutingCard.tsx
    │   │   ├── DepositsCard.tsx
    │   │   └── StripeRoutingPage.tsx
    │   │
    │   ├── diagnostics/
    │   │   ├── DataHealthSummary.tsx
    │   │   └── AnomaliesTable.tsx
    │   │
    │   └── insights/
    │       └── InsightsPanel.tsx
    │
    ├── pages/
    │   ├── DashboardPage.tsx
    │   ├── LiveOpsPage.tsx
    │   ├── CustomersPage.tsx
    │   ├── TransactionsPage.tsx
    │   ├── ReferralsPage.tsx
    │   ├── RedemptionPage.tsx
    │   ├── SourcesPage.tsx
    │   ├── RefundsPage.tsx
    │   ├── DisputesPage.tsx
    │   ├── DepositsPayoutsPage.tsx
    │   ├── TourOverviewPage.tsx
    │   ├── DiagnosticsPage.tsx
    │   ├── OverviewChartsPage.tsx
    │   └── SettingsPage.tsx
    │
    ├── stores/
    │   ├── useDataStore.ts (Zustand: transactions, events, customers)
    │   ├── useFilterStore.ts (Zustand: global filters)
    │   ├── useStripeStore.ts (Zustand: Stripe enrichment state)
    │   └── useUIStore.ts (Zustand: sidebar, drawers, modals)
    │
    ├── services/
    │   ├── dataAdapter.ts (interface)
    │   ├── UploadAdapter.ts (XLSX/CSV parsing)
    │   ├── ApiAdapter.ts (future)
    │   ├── StripeEnrichmentService.ts (Stripe API calls)
    │   └── MetricsCalculator.ts (derived metrics)
    │
    ├── lib/
    │   ├── utils.ts (cn, formatters, etc.)
    │   ├── dateHelpers.ts (UTC→EST, formatting)
    │   ├── exportHelpers.ts (CSV export)
    │   └── qrGenerator.ts (QR code generation)
    │
    ├── types/
    │   ├── transaction.ts
    │   ├── metrics.ts
    │   ├── filters.ts
    │   └── stripe.ts
    │
    └── hooks/
        ├── useFilteredTransactions.ts
        ├── useDerivedMetrics.ts
        ├── useTimeSeriesData.ts
        ├── useCustomerDeduplication.ts
        └── useStripeEnrichment.ts
```

---

## Implementation Tasks

### **Phase 1: Project Setup & Foundation**

#### 1.1 Initialize Project
- [ ] Run `npm create vite@latest opentickets-dashboard-v2 -- --template react-ts`
- [ ] Install dependencies:
  ```bash
  npm install react-router-dom zustand
  npm install xlsx date-fns date-fns-tz
  npm install @tanstack/react-table
  npm install recharts
  npm install lucide-react
  npm install react-hook-form zod @hookform/resolvers
  npm install qrcode.react
  ```
- [ ] Install Tailwind CSS:
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] Configure `tailwind.config.js` for dark mode
- [ ] Initialize shadcn/ui:
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Add shadcn components:
  ```bash
  npx shadcn-ui@latest add button card input select dialog drawer table badge tooltip dropdown-menu
  ```

#### 1.2 Environment & Git Setup
- [ ] Create `.env.local` with:
  ```
  VITE_STRIPE_PLATFORM_KEY=
  ```
- [ ] Add `.env.local` to `.gitignore`
- [ ] Initialize git repo
- [ ] Create `.gitignore` (include `.env.local`, `node_modules`, `dist`)

#### 1.3 Folder Structure
- [ ] Create all folders from structure above
- [ ] Create barrel exports (`index.ts`) for each folder

---

### **Phase 2: Data Layer & State Management**

#### 2.1 TypeScript Interfaces
- [ ] Create `src/types/transaction.ts` with `TicketTransaction` interface
- [ ] Create `src/types/metrics.ts` with `DerivedMetrics` interface
- [ ] Create `src/types/filters.ts` with filter types
- [ ] Create `src/types/stripe.ts` with Stripe enrichment types

#### 2.2 Data Parsing (UploadAdapter)
- [ ] Build `src/services/UploadAdapter.ts`:
  - [ ] XLSX parsing using SheetJS
  - [ ] CSV parsing fallback
  - [ ] Auto-map columns to schema (handle variations like `ticketId` vs `ticket_id`)
  - [ ] Date parsing (detect format, convert UTC→EST using `date-fns-tz`)
  - [ ] Normalize strings (trim, lowercase for TicketTypes, PurchaseFrom, ReferralCode)
  - [ ] Validation: detect missing required fields, invalid dates, empty values
  - [ ] Return parsed transactions + validation report

#### 2.3 Metrics Calculator
- [ ] Build `src/services/MetricsCalculator.ts`:
  - [ ] Calculate all derived metrics from transactions array
  - [ ] Time-series aggregation (by hour/day/week)
  - [ ] Group by TicketTypes, PurchaseFrom, ReferralCode
  - [ ] Support filtered subsets

#### 2.4 Zustand Stores
- [ ] **useDataStore.ts**:
  - [ ] State: `transactions`, `events` (deduplicated EventName list), `uploadTimestamp`
  - [ ] Actions: `setTransactions`, `clearData`, `addEvent`
  
- [ ] **useFilterStore.ts**:
  - [ ] State: `selectedEvents`, `dateRange`, `dateMode`, `selectedTicketTypes`, `selectedSources`, `flags`, `referralCode`, `searchQuery`
  - [ ] Actions: `setFilter`, `clearFilters`, `resetFilters`
  
- [ ] **useStripeStore.ts**:
  - [ ] State: `isEnabled`, `apiKey`, `enrichmentProgress`, `enrichedTransactions`
  - [ ] Actions: `setApiKey`, `toggleEnabled`, `enrichTransaction`
  
- [ ] **useUIStore.ts**:
  - [ ] State: `sidebarCollapsed`, `activeDrawer`, `activeModal`
  - [ ] Actions: `toggleSidebar`, `openDrawer`, `closeDrawer`, `openModal`, `closeModal`

#### 2.5 Custom Hooks
- [ ] **useFilteredTransactions.ts**: Apply all filters from `useFilterStore` to transactions
- [ ] **useDerivedMetrics.ts**: Calculate metrics for filtered transactions
- [ ] **useTimeSeriesData.ts**: Generate time-series data for charts (hour/day/week granularity)
- [ ] **useCustomerDeduplication.ts**: Dedupe transactions by Email→Phone→Name
- [ ] **useStripeEnrichment.ts**: Manage Stripe API calls (skeleton for now, frontend-only)

---

### **Phase 3: UI Shell & Navigation**

#### 3.1 Layout Components
- [ ] **Sidebar.tsx**:
  - [ ] Collapsible sidebar (mobile drawer on small screens)
  - [ ] Active nav items:
    - Dashboard, Live Ops, Customers, Transactions, Referrals, Redemption, Sources, Refunds, Disputes, Deposits & Payouts, Tour Overview, Diagnostics, Settings
  - [ ] Disabled nav items (sub-nav, greyed out):
    - Business, Event, Unverified Events, Archives, Box Office, Lucky, Blogs, Physical Ticket
  - [ ] Highlight active route
  - [ ] Logo/branding at top

- [ ] **Header.tsx**:
  - [ ] Event title: `{EventName} | {City}`
  - [ ] Last updated timestamp
  - [ ] Action buttons (top right):
    - Send All User Ticket Email (toast stub)
    - QR Code Generate (dialog)
    - Download Transactions (CSV export)
    - Share (placeholder)

- [ ] **GlobalFilters.tsx**:
  - [ ] Event selector (multi-select for tour mode)
  - [ ] Date range picker with mode toggle (PurchaseDate / RedemptionDateTime)
  - [ ] TicketTypes multi-select
  - [ ] PurchaseFrom multi-select
  - [ ] Toggle chips: Refunded, Disputed, Valid
  - [ ] ReferralCode filter input
  - [ ] Global search (Name, Email, Phone, ticketId, PaymentID)
  - [ ] Make sticky at top

- [ ] **Shell.tsx**:
  - [ ] Combine Sidebar + Header + GlobalFilters + main content area
  - [ ] Dark theme colors (less neon, better contrast)

#### 3.2 Routing Setup
- [ ] Configure React Router v6 in `App.tsx`
- [ ] Routes:
  - `/` → DashboardPage
  - `/live-ops` → LiveOpsPage
  - `/customers` → CustomersPage
  - `/transactions` → TransactionsPage
  - `/referrals` → ReferralsPage
  - `/redemption` → RedemptionPage
  - `/sources` → SourcesPage
  - `/refunds` → RefundsPage
  - `/disputes` → DisputesPage
  - `/deposits-payouts` → DepositsPayoutsPage
  - `/tour-overview` → TourOverviewPage
  - `/diagnostics` → DiagnosticsPage
  - `/overview-charts` → OverviewChartsPage
  - `/settings` → SettingsPage

#### 3.3 Upload Flow
- [ ] **HomePage (before data loaded)**:
  - [ ] Drag-and-drop zone for XLSX/CSV
  - [ ] File picker button
  - [ ] Support multiple files (tour mode)
- [ ] **Data Health Modal**:
  - [ ] Show validation report after parsing
  - [ ] Missing columns, invalid dates, empty values, duplicates
  - [ ] "Warn but allow proceed" approach
  - [ ] Button: "Continue to Dashboard"

---

### **Phase 4: Dashboard Page Widgets**

#### 4.1 Highlights Card
- [ ] Display KPIs:
  - Tickets Sold, Orders, Gross Revenue, Organizer Net, Redeemed Tickets + Redemption Rate, Refunds (count + $ + rate), Disputes (count + rate), Online vs boxOffice share
- [ ] Optional: trend deltas (future)
- [ ] Click KPI → filter or open financial drawer

#### 4.2 Financial Waterfall (NEW)
- [ ] Waterfall chart/widget:
  - Gross → subtract Refunds → subtract Fees → = Organizer Net
- [ ] When Stripe enabled: show Paid Out vs Pending

#### 4.3 Tickets Sold by Category
- [ ] Donut chart: sold (no capacity for MVP)
- [ ] Right-side category cards:
  - Tickets sold, Redeemed, Refund count, Revenue, Avg revenue per ticket (inferred price)
- [ ] Dynamic: derive ticket types from data (no hardcoded names)
- [ ] Click donut segment → filter to that TicketType

#### 4.4 Ticket Redeemed by Category
- [ ] Donut: redeemed vs sold
- [ ] Category cards: redeemed counts + redemption %
- [ ] Click → filter

#### 4.5 Ticket Issue Source
- [ ] Donut: PurchaseFrom breakdown
- [ ] Cards: online count, boxOffice count, other
- [ ] Include revenue per source + refund/dispute rate per source
- [ ] Click → filter

#### 4.6 Referrals Section
- [ ] **Checking by Referral** donut: redeemed/scans per ReferralCode
- [ ] **Tickets Sold by Referral** donut: tickets sold per ReferralCode
- [ ] **Referral Codes List** (cards):
  - Code name
  - Discount (amount + type)
  - Tickets sold + revenue
  - Refund/dispute rate via code
  - Copy button
  - Active status (infer: has sales in date range)
- [ ] Click code → filter

#### 4.7 Recent Activities Table
- [ ] Columns: Avatar (initials), Name, Email, EventName, Number Scanned, Total, Date/Time, Actions (kebab menu)
- [ ] Export button
- [ ] Pagination
- [ ] Click row → open transaction drawer

---

### **Phase 5: Live Ops Page (NEW)**

#### 5.1 Widgets
- [ ] **Live Scan Velocity**: scans per 5/15/30 minutes (line chart)
- [ ] **Peak Entry Window**: top 1–2 time windows (callout cards)
- [ ] **Redeemed vs Unredeemed Counter**: live counters
- [ ] **Unredeemed by TicketType**: list with counts
- [ ] **Alerts**:
  - Duplicate scan spikes (ticketId repeats)
  - Invalid scans (IsValid false)
  - High refund/dispute purchases attempting redemption

#### 5.2 Tables
- [ ] **Recently Redeemed Feed**: sorted by TicketRedemptionDateTime (real-time feel)
- [ ] **At-Risk List**: disputed/refunded purchases with redemption attempts

---

### **Phase 6: Data Tables & Detail Pages**

#### 6.1 Customers Page
- [ ] **CustomersTable.tsx** (TanStack Table with virtualization):
  - [ ] Deduplicated view by Email→Phone
  - [ ] Columns: Name, Email, Phone, First Purchase Date, Last Purchase Date, Total Orders, Total Tickets, Total Spent, Redeemed Tickets, Flags (refunded/disputed badges)
  - [ ] Search + date filter
  - [ ] Pagination
  - [ ] Sortable columns
  - [ ] Column chooser
  - [ ] Export to CSV
- [ ] **CustomerDetailDrawer.tsx**:
  - [ ] All transactions for that buyer
  - [ ] Totals: orders, tickets, spent, redeemed
  - [ ] Refund/dispute history
  - [ ] Redemption timeline

#### 6.2 Transactions Page (Support-First)
- [ ] **TransactionsTable.tsx**:
  - [ ] Columns: PurchaseDate, Name, Email, TicketTypes, TotalTickets, TotalAmount, OrganizerAmount, PurchaseFrom, ReferralCode, IsRefunded, IsDisputed, IsValid, PaymentMethod, PaymentID
  - [ ] Optional Stripe columns (toggleable): Stripe Route, Destination Account, Deposit Status, Deposit Date, Deposit Bank
  - [ ] Sortable, sticky header, column chooser
  - [ ] Quick filters (refunded, disputed, valid)
  - [ ] Export
- [ ] **TransactionDetailDrawer.tsx**:
  - [ ] Copy buttons: ticketId, PaymentID, Email
  - [ ] Fees breakdown
  - [ ] Redemption timestamps
  - [ ] Quick actions (placeholders):
    - Resend ticket email (toast stub)
    - Generate QR (download QR code for ticketId)
    - Add internal note (local state for MVP)
    - Open Stripe (link placeholder when Stripe enabled)

#### 6.3 Referrals Page
- [ ] Combine referral donuts + codes list from Dashboard
- [ ] Add detailed referral table: code, tickets sold, revenue, refund rate, dispute rate

#### 6.4 Redemption Page
- [ ] Redeemed tickets KPIs
- [ ] Redemption rate by TicketType
- [ ] Redemption timeline chart (by hour/day)
- [ ] Redeemed transactions table

#### 6.5 Sources Page
- [ ] PurchaseFrom breakdown (donut + table)
- [ ] Sources x Referral Matrix (NEW):
  - Rows: PurchaseFrom
  - Columns: ReferralCode (top N) + "No referral"
  - Cells: tickets sold + revenue (clickable to filter)

#### 6.6 Refunds Page (NEW)
- [ ] KPI cards: refund count, refund $, refund rate
- [ ] Breakdowns: by TicketTypes, by PurchaseFrom, by ReferralCode
- [ ] Refund table: PurchaseDate, Buyer, Amount, Remarks, PaymentID

#### 6.7 Disputes Page (NEW)
- [ ] KPI cards: dispute count, dispute rate, disputed $
- [ ] Breakdown by source/referral/ticket type
- [ ] Disputes table: PurchaseDate, Buyer, Amount, PaymentID

---

### **Phase 7: Charts & Overview Page**

#### 7.1 Time Range Controls
- [ ] **TimeRangeToggle.tsx**: Week / Month / Year / All Time + custom range picker
- [ ] **Granularity Toggle**: hour / day / week
- [ ] **Metric Toggle**: orders / tickets / revenue / net

#### 7.2 Charts (Recharts)
- [ ] **SalesCountChart.tsx**: Line chart (orders or tickets over time)
- [ ] **CategoryRedemptionChart.tsx**: Multi-line or stacked area (redemptions by TicketType over time)
- [ ] **CategorySalesChart.tsx**: Stacked bar or line (sales by TicketType over time)
- [ ] **RevenueOverTimeChart.tsx**: Line chart (gross + net)
- [ ] All charts react to time range, granularity, and metric toggles
- [ ] Click chart point/segment → filter date range + TicketType

#### 7.3 Overview Charts Page
- [ ] Combine all charts on one page
- [ ] Add toggle controls at top

---

### **Phase 8: Tour Mode (Multi-Event)**

#### 8.1 Tour Detection
- [ ] On data load, check if multiple EventName values exist
- [ ] If yes: show "Tour Overview" nav item
- [ ] If no: hide Tour Overview

#### 8.2 Tour Overview Page
- [ ] **KPI Comparison Table**:
  - Rows: each EventName
  - Columns: Tickets Sold, Orders, Gross, Net, Redemption Rate, Refund Rate, Dispute Rate, Online Share
- [ ] **Ranking Callouts**: Best/Worst performers (by gross, redemption rate, etc.)
- [ ] **Charts**:
  - Gross by event/city (bar chart)
  - Net by event/city (bar chart)
  - Sold vs Redeemed by event (grouped bar)
  - Refund/dispute rate by event (line or bar)
- [ ] **Sales Curve Normalization** (NEW):
  - Align events by "days since first on-sale purchase"
  - Overlay sales trajectories to compare pacing
- [ ] **Routing Summary** (when Stripe enabled):
  - Rows: each EventName
  - Columns: Platform routed $, Connected routed $, Top connected account, # connected accounts, unresolved count

---

### **Phase 9: Stripe UI Shell (Frontend Only - MVP)**

> ✅ **THIS IS MVP SCOPE**: Build UI components with empty states and placeholders only.
> ❌ **NO BACKEND CALLS**: Do not implement actual Stripe API integration in MVP.

#### 9.1 Settings > Integrations > Stripe
- [ ] **StripeSettingsForm.tsx**:
  - [ ] Input: Platform Stripe Secret Key (password field, session storage for MVP)
  - [ ] Toggle: "Enable Stripe Routing Audit" (UI only, does nothing in MVP)
  - [ ] Button: "Test Connection" (MVP: stub that shows toast "Connection successful" after 2 second delay)
#### 9.2 Dashboard Cards (Stripe Placeholders - MVP)
- [ ] **PayoutRoutingCard.tsx** (Dashboard):
  - **MVP**: Always show empty state (even when "enabled" in settings)
  - Empty state message: "Connect Stripe to enable routing audit (Coming in Phase 2)"
  - Include icon + "Learn More" link (opens modal with Phase 2 roadmap)
  
- [ ] **DepositsCard.tsx** (Dashboard):
  - **MVP**: Always show empty state
  - Empty state message: "Deposit tracking available in Phase 2"
  - Show sample screenshot/mockup of what it will look like
    - Pending amount
    - Failed amount
    - Next arrival date
  - Empty state when disabled

#### 9.3 Stripe Routing Page
- [ ] **StripeRoutingPage.tsx**:
  - [ ] Top summary: Total routed to platform vs connected, Total application fees, Total net
  - [ ] Breakdown table grouped by destination:
    - Columns: Destination Account Name, Stripe Account ID, Total Amount, OrganizerAmount sum, PlatformFee sum, Count of Payments
  - [ ] Click account → filter transactions
#### 9.3 Stripe Routing Page (MVP - Empty State Only)
- [ ] **StripeRoutingPage.tsx**:
  - [ ] **MVP**: Full-page empty state with illustration
  - [ ] Message: "Stripe Routing Audit (Phase 2 Feature)"
  - [ ] Subtext: "This page will show where payments were routed (Platform vs Connected accounts) once Stripe integration is complete."
  - [ ] Include mockup/wireframe of future table layout
  - [ ] "Back to Dashboard" button

#### 9.4 Deposits & Payouts Page (MVP - Empty State Only)
- [ ] **DepositsPayoutsPage.tsx**:
  - [ ] **MVP**: Full-page empty state
  - [ ] Message: "Deposits & Payouts Tracking (Phase 2 Feature)"
  - [ ] Subtext: "Track bank deposits, payout schedules, and arrival dates once Stripe integration is enabled."
  - [ ] Include mockup of future grouped-by-payout table
  - [ ] "Back to Dashboard" button

#### 9.5 Transaction Table: Stripe Columns (MVP - Hidden)
- [ ] **MVP**: Add column definitions but keep hidden by default
- [ ] Columns to add (not shown in MVP):
  - Stripe Route (badge: Platform / Connected)
  - Destination Account
  - Deposit Status
  - Deposit Date
  - Deposit Bank (name + last4)
- [ ] Column chooser shows these options greyed out with tooltip: "Available in Phase 2"
- [ ] Transaction drawer: Reserve space for Stripe section but show "Stripe details available in Phase 2"d NOT be implemented now.
> 
> Phase 9 (above) creates the UI shell only with empty states and placeholders. This section (9B) documents the full Stripe API integration for **future reference** when the MVP is complete and tested.
> 
> **For MVP**: Skip this entire Phase 9B section. Focus on Phases 1-15 (excluding 9B).
> 
> This section details the actual Stripe API integration logic for when backend is ready.

#### 9B.1 Stripe Service Architecture

**Core Algorithm: Account Ownership Detection**

The primary challenge: given a PaymentIntent ID (`pi_...`), determine which Stripe account owns it (Platform vs Connected).

**Detection Algorithm** (from `STRIPE_API_CALLS_AND_ACCOUNT_DETECTION.md`):

1. **Try Platform First** (no `stripe_account` header)
   ```typescript
   try {
     const payment = await stripe.paymentIntents.retrieve(paymentId);
     // Success = Platform-owned
     return { accountType: 'platform', accountId: platformAccountId };
   } catch (error) {
     // Continue to connected accounts
   }
   ```

2. **Try Each Connected Account**
   ```typescript
   const connectedAccounts = await stripe.accounts.list({ limit: 100 });
   
   for (const account of connectedAccounts.data) {
     try {
       const payment = await stripe.paymentIntents.retrieve(paymentId, {
         stripeAccount: account.id
       });
       // Success = Connected account owns it
       return { 
         accountType: 'connected', 
         accountId: account.id,
         accountName: account.business_profile?.name || account.email 
       };
     } catch (error) {
       // Try next account
     }
   }
   
   return { accountType: 'unresolved' };
   ```

**Why This Approach:**
- A PaymentIntent can only be retrieved from the account that owns it
- `InvalidRequestError` from Stripe = wrong account context
- Must iterate through all connected accounts to find the owner

#### 9B.2 StripeEnrichmentService.ts Implementation

**File: `src/services/StripeEnrichmentService.ts`**

Key Methods:

```typescript
interface StripeEnrichmentService {
  // Core detection
  findOwningAccount(paymentId: string): Promise<AccountOwnership>;
  
  // Connected accounts management
  listConnectedAccounts(): Promise<ConnectedAccount[]>;
  cacheConnectedAccounts(): Promise<void>;
  
  // Payment enrichment
  enrichPaymentIntent(paymentId: string): Promise<EnrichedPayment>;
  batchEnrichPayments(paymentIds: string[]): Promise<EnrichedPayment[]>;
  
  // Payout/deposit tracing
  findPayoutForBalanceTransaction(
    balanceTransactionId: string, 
    accountId: string
  ): Promise<PayoutInfo | null>;
  
  getBankDetails(
    accountId: string, 
    externalAccountId: string
  ): Promise<BankInfo>;
  
  // Cache management
  getCachedAccountMapping(paymentId: string): AccountOwnership | null;
  setCachedAccountMapping(paymentId: string, ownership: AccountOwnership): void;
  exportCache(): PaymentAccountMapping[];
  importCache(mappings: PaymentAccountMapping[]): void;
}
```

**UI Integration Points:**

1. **Progress Tracking** (for UI updates):
   ```typescript
   interface EnrichmentProgress {
     total: number;
     processed: number;
     successful: number;
     failed: number;
     unresolved: number;
     currentPaymentId: string;
     estimatedTimeRemaining: number; // seconds
   }
   
   // Emit events for UI to subscribe
   onProgress(callback: (progress: EnrichmentProgress) => void): void;
   ```

2. **Rate Limiting & Batching**:
   - UI shows: "Enriching payments... 42/150 (28%)"
   - Implement exponential backoff for rate limit errors
   - Batch requests: process 10 payments at a time, pause 1 second between batches
   - UI displays: "Rate limited. Retrying in 3 seconds..."

3. **Error Handling Categories**:
   ```typescript
   enum EnrichmentErrorType {
     INVALID_API_KEY = 'invalid_api_key',
     RATE_LIMIT = 'rate_limit',
     PAYMENT_NOT_FOUND = 'payment_not_found',
     NETWORK_ERROR = 'network_error',
     PERMISSION_ERROR = 'permission_error',
     UNKNOWN = 'unknown'
   }
   ```

#### 9B.3 Stripe API Calls Inventory

**UI Components Should Handle:**

| API Call | Purpose | UI State to Update | Error Handling |
|----------|---------|-------------------|----------------|
| `stripe.paymentIntents.retrieve(id)` | Get payment details | Show "Fetching payment..." | "Payment not found" → mark as unresolved |
| `stripe.paymentIntents.retrieve(id, {stripeAccount})` | Check connected account | Show "Checking connected accounts..." | Expected errors, continue iteration |
| `stripe.accounts.list({limit: 100})` | Get connected accounts | Show "Loading connected accounts..." | Cache result, retry on failure |
| `stripe.accounts.retrieve(id)` | Get account name | Show account name in UI | Use fallback: account ID |
| `stripe.customers.retrieve(id)` | Get customer details (optional) | Show in transaction drawer | Non-blocking, show "N/A" |
| `stripe.balanceTransactions.retrieve(id)` | Get deposit timing (`available_on`) | Show "Checking deposit date..." | Mark as "not traceable" |
| `stripe.payouts.list({limit: N})` | Find matching payout | Show "Matching payouts..." | Use heuristic: date proximity |
| `stripe.accounts.retrieveExternalAccount(acctId, bankId)` | Get bank details | Show masked bank info | Show "Bank info unavailable" |

**Expand Strategy** (reduce API calls):
```typescript
// Instead of separate calls, use expand:
const payment = await stripe.paymentIntents.retrieve(paymentId, {
  expand: ['latest_charge.balance_transaction']
});

// Now access without additional call:
const availableOn = payment.latest_charge.balance_transaction.available_on;
```

#### 9B.4 UI Components for Stripe Enrichment

**EnrichmentProgressModal.tsx**

```typescript
interface EnrichmentProgressModalProps {
  isOpen: boolean;
  progress: EnrichmentProgress;
  onCancel: () => void;
}

// Display:
// - Progress bar (0-100%)
// - "Enriching 42 of 150 payments..."
// - "Successfully enriched: 38"
// - "Unresolved: 4"
// - Current payment ID being processed
// - Estimated time remaining
// - Cancel button (allows stopping mid-process)
```

**StripeConnectionStatus.tsx**

```typescript
// Settings page component
interface ConnectionStatus {
  isConnected: boolean;
  platformAccountId: string;
  platformAccountName: string;
  connectedAccountsCount: number;
  lastTestedAt: Date;
  error?: string;
}

// Display:
// - Green checkmark if connected
// - Platform account details
// - "X connected accounts found"
// - "Test Connection" button
// - Last tested timestamp
```

**PaymentAccountBadge.tsx**

```typescript
// Reusable badge for tables/drawers
interface PaymentAccountBadgeProps {
  routeType: 'platform' | 'connected' | 'unresolved';
  accountName?: string;
  accountId?: string;
}

// Display:
// - Platform: blue badge "Platform"
// - Connected: green badge "Connected • AccountName"
// - Unresolved: yellow badge "Unresolved"
// - Tooltip shows full account ID
```

#### 9B.5 Caching Strategy for UI Performance

**Payment Account Mapping Cache** (inspired by `payment_account_mapping.csv`):

```typescript
interface PaymentAccountMapping {
  paymentId: string;
  accountType: 'platform' | 'connected' | 'unresolved';
  accountId: string | null;
  accountName: string | null;
  cachedAt: Date;
}

// Store in IndexedDB (browser) or session storage
// UI checks cache first before making API calls
// Export/import cache as JSON for reuse across sessions
```

**Cache UI Controls:**

- **Settings Page**:
  - "Export Stripe Cache" button → download JSON
  - "Import Stripe Cache" button → upload JSON (skip already-enriched payments)
  - "Clear Stripe Cache" button → force re-enrichment
  - "Cache size: 342 payments"

**Why Cache Matters for UI:**
- Prevents re-fetching same PaymentIntent ownership on page refresh
- Dramatically speeds up subsequent dashboard loads
- Reduces Stripe API usage (cost + rate limits)

#### 9B.6 Deposit & Payout Tracing (Advanced)

**Algorithm** (from `STRIPE_API_CALLS_AND_ACCOUNT_DETECTION.md`):

1. **Get Balance Transaction** (via expand on PaymentIntent):
   ```typescript
   const payment = await stripe.paymentIntents.retrieve(paymentId, {
     expand: ['latest_charge.balance_transaction']
   });
   const balanceTxn = payment.latest_charge.balance_transaction;
   const availableOn = balanceTxn.available_on; // Unix timestamp
   ```

2. **Find Matching Payout** (heuristic: date proximity):
   ```typescript
   const payouts = await stripe.payouts.list({
     arrival_date: { gte: availableOn, lte: availableOn + 86400 * 7 }, // +7 days window
     limit: 10
   });
   
   // UI: "Matching payout by arrival date..."
   const matchingPayout = payouts.data.find(p => 
     Math.abs(p.arrival_date - availableOn) < 86400 * 2 // within 2 days
   );
   ```

3. **Get Bank Details** (for masked display):
   ```typescript
   if (matchingPayout) {
     const bank = await stripe.accounts.retrieveExternalAccount(
       accountId,
       matchingPayout.destination
     );
     
     return {
       bankName: bank.bank_name || 'Unknown Bank',
       last4: bank.last4,
       arrivalDate: matchingPayout.arrival_date,
       status: matchingPayout.status // 'paid' | 'pending' | 'failed'
     };
   }
   ```

**UI Display** (Transaction Drawer):
```
Deposit Information
├─ Status: ● Paid (green) | ⧗ Pending (yellow) | ✕ Failed (red)
├─ Bank: Chase Bank •••• 1234
├─ Arrival Date: Jan 15, 2026
├─ Payout ID: po_abc123 (copy button)
└─ Available On: Jan 10, 2026 (from balance transaction)
```

**Fallback for "Not Traceable"**:
- If no payout match found: show "Available On: [date]" only
- If balance transaction missing: show "Deposit info not available"

#### 9B.7 Connected Account Context Switching

**Challenge**: Some payments require connected account context to retrieve full details.

**UI Pattern**:

```typescript
// When connected account detected, switch context for subsequent calls:
const payment = await stripe.paymentIntents.retrieve(paymentId, {
  stripeAccount: connectedAccountId,
  expand: ['latest_charge.balance_transaction']
});

const payout = await stripe.payouts.list({
  stripeAccount: connectedAccountId,
  limit: 10
});
```

**UI Indicator**:
- Show "Connected Account Context" badge in transaction drawer
- Warn if connected account access is restricted: "Limited access. Some details unavailable."

#### 9B.8 Zustand Store Updates for Enrichment

**useStripeStore.ts** (Phase 2 additions):

```typescript
interface StripeStore {
  // Auth
  apiKey: string | null;
  isEnabled: boolean;
  connectionStatus: ConnectionStatus | null;
  
  // Enrichment state
  isEnriching: boolean;
  enrichmentProgress: EnrichmentProgress | null;
  
  // Cache
  accountMappingCache: Map<string, PaymentAccountMapping>;
  connectedAccountsCache: ConnectedAccount[];
  
  // Enriched data
  enrichedPayments: Map<string, EnrichedPayment>;
  
  // Actions
  setApiKey: (key: string) => void;
  testConnection: () => Promise<ConnectionStatus>;
  enrichTransactions: (paymentIds: string[]) => Promise<void>;
  cancelEnrichment: () => void;
  exportCache: () => void;
  importCache: (data: PaymentAccountMapping[]) => void;
  clearCache: () => void;
}
```

**UI Subscription Pattern**:
```typescript
// Component listens to enrichment progress
const { enrichmentProgress } = useStripeStore();

useEffect(() => {
  if (enrichmentProgress) {
    // Update progress modal
  }
}, [enrichmentProgress]);
```

#### 9B.9 Error States & User Feedback

**UI Error Messages**:

| Error Type | UI Message | User Action |
|------------|------------|-------------|
| Invalid API Key | "Invalid Stripe API key. Please check your credentials." | Re-enter key in Settings |
| Rate Limit | "Stripe rate limit reached. Retrying in 30s..." | Auto-retry, show countdown |
| Payment Not Found | "Payment pi_abc123 not found in any account." | Mark as "Unresolved", continue |
| Permission Error | "Insufficient permissions to access connected account acct_xyz." | Show warning, mark as "Limited Access" |
| Network Error | "Network error. Check your connection." | Retry button |

**Retry Strategy** (UI displays):
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- UI shows: "Retry attempt 3 of 5..."
- After 5 failures: mark as failed, allow manual retry

#### 9B.10 Performance Optimizations for UI

**Batch Processing UI Pattern**:
```typescript
// Process 10 payments at a time
const BATCH_SIZE = 10;
const BATCH_DELAY = 1000; // 1 second between batches

for (let i = 0; i < paymentIds.length; i += BATCH_SIZE) {
  const batch = paymentIds.slice(i, i + BATCH_SIZE);
  
  // UI update: "Processing batch 3 of 15..."
  await Promise.all(batch.map(enrichSinglePayment));
  
  // Pause between batches (UI shows countdown)
  if (i + BATCH_SIZE < paymentIds.length) {
    await sleep(BATCH_DELAY);
  }
}
```

**Incremental UI Updates**:
- Don't wait for all enrichments to complete
- Update table/cards as each payment is enriched
- Use optimistic UI: show "Enriching..." badge while in progress

**Background Processing Option**:
- Add "Enrich in Background" toggle
- Use Web Workers for non-blocking enrichment
- UI shows notification when complete: "42 payments enriched!"

#### 9B.11 Testing Stripe Integration (UI Perspective)

**Manual Testing Scenarios**:

1. **Happy Path**:
   - Enter valid API key → test connection → success
   - Click "Enrich Payments" → progress modal appears
   - Watch progress bar update in real-time
   - Verify enriched data appears in tables

2. **Error Scenarios**:
   - Invalid API key → see error message
   - Disconnect network mid-enrichment → see retry logic
   - Use payment from different environment → see "Unresolved" badge

3. **Cache Testing**:
   - Enrich 100 payments
   - Refresh page → verify cache used (instant load)
   - Export cache → verify JSON download
   - Import cache → verify skips already-enriched

4. **Performance Testing**:
   - Enrich 500 payments → verify batch processing
   - Monitor for rate limit handling
   - Verify UI remains responsive during enrichment

**UI Test Checklist**:
- [ ] Progress modal shows accurate percentage
- [ ] Cancel button stops enrichment mid-process
- [ ] Error messages are clear and actionable
- [ ] Retry logic works and shows countdown
- [ ] Cache export/import works correctly
- [ ] Enriched data persists across page refresh
- [ ] Tables update incrementally (not all at once)
- [ ] Transaction drawer shows all Stripe fields
- [ ] Bank info displays correctly (masked)
- [ ] Connected account badge appears correctly

---

### **Phase 10: Diagnostics & Data Health**

#### 10.1 Diagnostics Page
- [ ] **DataHealthSummary.tsx**:
  - [ ] Missing PaymentID rows
  - [ ] TotalTickets = 0 but TotalAmount > 0
  - [ ] Redeemed > Sold anomalies
  - [ ] Invalid/missing PurchaseDate or RedemptionDateTime
  - [ ] Duplicate ticketId
  - [ ] TicketTypes parsing issues (e.g., unparseable strings)
  - [ ] Buyers with inconsistent identifiers (same email, different names)
- [ ] **AnomaliesTable.tsx**: Exportable list of problematic rows with reasons

---

### **Phase 11: Insights Engine**

#### 11.1 Insights Panel
- [ ] **InsightsPanel.tsx** (right-side or top module):
  - [ ] Auto-generate 5–10 insight bullets based on filtered data:
    - Top ticket type by revenue
    - Highest refund rate ticket type
    - Top referral code by tickets/revenue
    - Online vs boxOffice contribution
    - Highest dispute rate source/referral
    - Peak purchase hour/day
    - Avg time from purchase to redemption
  - [ ] Each insight clickable → apply filters
  - [ ] Show numbers (not vague statements)

---

### **Phase 12: Utilities & Helpers**

#### 12.1 Date Helpers
- [ ] **dateHelpers.ts**:
  - [ ] `parseDate(dateString)`: detect format, convert to Date
  - [ ] `utcToEst(date)`: convert UTC to EST using `date-fns-tz`
  - [ ] `formatDate(date, format)`: display formatting
  - [ ] `getHourOfDay(date)`, `getDayOfWeek(date)`

#### 12.2 Export Helpers
- [ ] **exportHelpers.ts**:
  - [ ] `exportToCSV(data, filename)`: convert array of objects to CSV + download

#### 12.3 QR Generator
- [ ] **qrGenerator.ts**:
  - [ ] Use `qrcode.react` to generate QR code for ticketId or PaymentID
  - [ ] Return downloadable image

#### 12.4 Utils
- [ ] **utils.ts**:
  - [ ] `cn(...)`: Tailwind class name merger (from shadcn)
  - [ ] `formatCurrency(amount)`: $X,XXX.XX
  - [ ] `formatNumber(num)`: 1,234
  - [ ] `formatPercent(rate)`: 12.3%
  - [ ] `getInitials(name)`: "John Doe" → "JD"

---

### **Phase 13: UX Enhancements**

#### 13.1 Empty States
- [ ] Meaningful empty states for each widget/page when no data matches filters
- [ ] Explanations + CTAs (e.g., "No refunds found. Adjust filters or date range.")

#### 13.2 Loading States
- [ ] Skeleton loaders for tables, charts, cards
- [ ] Progress indicator for file upload parsing
- [ ] Progress indicator for Stripe enrichment (future)

#### 13.3 Responsive Design
- [ ] Desktop-first layout
- [ ] Collapsible sidebar for tablet/mobile
- [ ] Tables scroll horizontally on small screens
- [ ] Charts resize appropriately
- [ ] Test on iPad and iPhone sizes

#### 13.4 Dark Theme Polish
- [ ] Less neon, better contrast
- [ ] Consistent card padding, spacing, typography scale
- [ ] Readable text colors
- [ ] Hover/focus states for interactive elements

#### 13.5 Drilldowns
- [ ] Clicking any chart segment applies filters to tables
- [ ] Clicking KPI card opens relevant page or filters
- [ ] Breadcrumbs or filter chips to show active filters
- [ ] "Clear all filters" button

---

### **Phase 14: Testing & Validation**

#### 14.1 Data Parsing Tests
- [ ] Test XLSX parsing with sample file (Nabin-K-Bhattarai-Virginia-2026-01-04T19-04-55-226Z.xlsx)
- [ ] Test CSV parsing
- [ ] Test with missing columns (graceful degradation)
- [ ] Test with invalid dates
- [ ] Test with 8,000 rows (performance)

#### 14.2 Metrics Calculation Tests
- [ ] Verify derived metrics accuracy (tickets sold, gross, net, refunds, redemption rate)
- [ ] Test time-series aggregation (hour/day/week)
- [ ] Test grouping by TicketTypes, PurchaseFrom, ReferralCode

#### 14.3 Filter Tests
- [ ] Test each filter independently
- [ ] Test filter combinations
- [ ] Test global search across Name, Email, Phone, ticketId, PaymentID
- [ ] Test date range with PurchaseDate vs RedemptionDateTime modes

#### 14.4 Tour Mode Tests
- [ ] Test with single event
- [ ] Test with multiple events (tour mode)
- [ ] Test Tour Overview page aggregations

#### 14.5 UI/UX Tests
- [ ] Test sidebar collapse/expand
- [ ] Test responsive layout on tablet/mobile
- [ ] Test dark theme readability
- [ ] Test table virtualization with large datasets
- [ ] Test export to CSV

---

### **Phase 15: Polish & Documentation**

#### 15.1 Code Quality
- [ ] TypeScript: ensure no `any` types
- [ ] ESLint + Prettier setup
- [ ] Code comments for complex logic

#### 15.2 Performance
- [ ] Memoize expensive calculations (useMemo, useCallback)
- [ ] Virtualize tables with 1k+ rows
- [ ] Debounce search inputs
- [ ] Lazy load routes (React.lazy + Suspense)

#### 15.3 README
- [ ] Project overview
- [ ] Tech stack
- [ ] Setup instructions:
  - npm install
  - npm run dev
- [ ] Environment variables (.env.local)
- [ ] Features list
- [ ] Known limitations (e.g., Stripe frontend-only for MVP)

#### 15.4 Deployment Prep (for future AWS Amplify)
- [ ] Ensure build works: `npm run build`
- [ ] Add `.env.production` template
- [ ] Document deployment steps (for later)

---

## Open Questions & Decisions

### 1. Tour Mode Implementation
**Question**: Separate "Tour Overview" page or dashboard toggle?  
**Decision**: Separate page. Show nav item only when multiple EventName values detected.

### 2. Export Format
**Question**: CSV only, or also XLSX export?  
**Decision**: CSV for simplicity in MVP. Can add XLSX later.

### 3. Data Health Summary
**Question**: Block upload if validation errors, or warn and proceed?  
**Decision**: Warn but allow proceed. Provide Diagnostics page for ongoing audit.

### 4. Capacity Settings
**Question**: How to handle missing capacity data?  
**Decision**: Skip capacity for MVP. Show sold counts only. Remove "SOLD OUT" labels. Add Config page for capacity in v3.

### 5. Price per Ticket Type
**Question**: Infer from TotalAmount / TotalTickets or require config?  
**Decision**: Infer average revenue per ticket per TicketType. No config needed for MVP.

### 6. Customer Deduplication
**Question**: Dedupe by Email, Phone, or Name?  
**Decision**: Email (primary), then Phone (fallback), then Name (last resort). Treat each row as a separate purchase; group by identifier on Customers page.

### 7. Date Format
**Question**: What format is PurchaseDate?  
**Decision**: Likely `11/18/2025` or `2025-11-18T09:30:00Z` (UTC). Parse with `date-fns`, convert to EST for display.

### 8. Web Analytics (Page Views / Conversion Rate)
**Question**: Include in MVP?  
**Decision**: Show "Coming Soon" placeholders. Not in current dataset.

### 9. Sidebar Nav Items
**Question**: Which nav items are functional vs placeholder?  
**Decision**:
- **Functional (with data)**: Dashboard, Live Ops, Customers, Transactions, Referrals, Redemption, Sources, Refunds, Disputes, Deposits & Payouts, Tour Overview, Diagnostics, Settings
- **Placeholders (disabled sub-nav)**: Business, Event, Unverified Events, Archives, Box Office, Lucky, Blogs, Physical Ticket

### 10. Stripe Integration (MVP)
**Question**: Include Stripe backend calls in MVP?  
**Decision**: No. Frontend UI only (forms, placeholders, empty states). Backend integration in Phase 2 after first review.

---

## Success Criteria (MVP Done)

After completing all tasks, the following must work:

1. **Upload**: I can upload an XLSX/CSV file and see a Data Health summary.
2. **Dashboard**: I see all widgets from screenshots (Highlights, Tickets Sold by Category, Redeemed, Sources, Referrals, Recent Activities) with real data.
3. **Live Ops**: I see scan velocity, redemption counters, alerts, recent redemptions.
4. **Customers**: I can search/filter customers, view deduplicated list, click to see purchase history.
5. **Transactions**: I can filter, sort, export transactions. Click row to see detail drawer.
6. **Referrals**: I see referral donuts, codes list, can copy codes, filter by code.
7. **Refunds & Disputes**: I see KPIs, breakdowns, tables for refunded/disputed transactions.
8. **Charts**: I can toggle Week/Month/Year/All Time, change granularity, see sales/redemption charts update.
9. **Tour Mode**: If I upload multiple events, I see Tour Overview page with comparison table + charts.
10. **Stripe UI**: I see Settings > Stripe form, Payout Routing card (empty state), Deposits page (empty state).
11. **Diagnostics**: I see data health issues, anomalies table.
12. **Insights**: I see auto-generated insights panel with numbers, can click to filter.
13. **Filters**: All global filters work and update all widgets/tables in real-time.
14. **Responsive**: Dashboard works on desktop, tablet, and iPhone.
## Next Steps After MVP

- **Phase 2: Stripe Backend Integration** ⚠️ POST-MVP ONLY
  - Implement StripeEnrichmentService with real API calls (see Phase 9B documentation)
  - Add caching, rate limiting, progress tracking
  - Display routing, deposits, payouts with real data
  - Follow algorithm documented in Phase 9B section
  - Use existing Python scripts as reference (STRIPE_API_CALLS_AND_ACCOUNT_DETECTION.md)

- **Phase 3: API Adapter**mentService with real API calls
  - Add caching, rate limiting, progress tracking
  - Display routing, deposits, payouts with real data

- **Phase 3: API Adapter**
  - Replace UploadAdapter with ApiAdapter for server-side data
  - Add authentication
  - Real-time updates (websockets/polling)

- **Phase 4: Advanced Features**
  - Capacity settings (Config page)
  - Role-based access (Owner, Door Staff, Finance)
  - Email/notification integrations (Send All User Ticket Email)
  - Web analytics integration (Page Views, Conversion Rate)

- **Phase 5: Deployment**
  - Deploy to AWS Amplify
  - Set up CI/CD
  - Production environment variables
  - Monitoring & error tracking (Sentry)

---

## File Checklist

Use this checklist to track file creation:

### Config Files
- [ ] `.env.local`
- [ ] `.gitignore`
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `vite.config.ts`
- [ ] `tailwind.config.js`
- [ ] `postcss.config.js`

### Core App
- [ ] `index.html`
- [ ] `src/main.tsx`
- [ ] `src/App.tsx`
- [ ] `src/index.css`
- [ ] `src/vite-env.d.ts`

### Types (4 files)
- [ ] `src/types/transaction.ts`
- [ ] `src/types/metrics.ts`
- [ ] `src/types/filters.ts`
- [ ] `src/types/stripe.ts`

### Stores (4 files)
- [ ] `src/stores/useDataStore.ts`
- [ ] `src/stores/useFilterStore.ts`
- [ ] `src/stores/useStripeStore.ts`
- [ ] `src/stores/useUIStore.ts`

### Services (5 files)
- [ ] `src/services/dataAdapter.ts`
- [ ] `src/services/UploadAdapter.ts`
- [ ] `src/services/ApiAdapter.ts`
- [ ] `src/services/StripeEnrichmentService.ts`
- [ ] `src/services/MetricsCalculator.ts`

### Lib (4 files)
- [ ] `src/lib/utils.ts`
- [ ] `src/lib/dateHelpers.ts`
- [ ] `src/lib/exportHelpers.ts`
- [ ] `src/lib/qrGenerator.ts`

### Hooks (5 files)
- [ ] `src/hooks/useFilteredTransactions.ts`
- [ ] `src/hooks/useDerivedMetrics.ts`
- [ ] `src/hooks/useTimeSeriesData.ts`
- [ ] `src/hooks/useCustomerDeduplication.ts`
- [ ] `src/hooks/useStripeEnrichment.ts`

### Layout Components (4 files)
- [ ] `src/components/layout/Sidebar.tsx`
- [ ] `src/components/layout/Header.tsx`
- [ ] `src/components/layout/GlobalFilters.tsx`
- [ ] `src/components/layout/Shell.tsx`

### Dashboard Components (8 files)
- [ ] `src/components/dashboard/HighlightsCard.tsx`
- [ ] `src/components/dashboard/FinancialWaterfall.tsx`
- [ ] `src/components/dashboard/TicketsSoldByCategory.tsx`
- [ ] `src/components/dashboard/TicketRedeemedByCategory.tsx`
- [ ] `src/components/dashboard/TicketIssueSource.tsx`
- [ ] `src/components/dashboard/ReferralDonuts.tsx`
- [ ] `src/components/dashboard/ReferralCodesList.tsx`
- [ ] `src/components/dashboard/RecentActivities.tsx`

### Live Ops Components (5 files)
- [ ] `src/components/live-ops/ScanVelocity.tsx`
- [ ] `src/components/live-ops/RedemptionCounter.tsx`
- [ ] `src/components/live-ops/UnredeemedByType.tsx`
- [ ] `src/components/live-ops/Alerts.tsx`
- [ ] `src/components/live-ops/RecentlyRedeemed.tsx`

### Customer Components (2 files)
- [ ] `src/components/customers/CustomersTable.tsx`
- [ ] `src/components/customers/CustomerDetailDrawer.tsx`

### Transaction Components (2 files)
- [ ] `src/components/transactions/TransactionsTable.tsx`
- [ ] `src/components/transactions/TransactionDetailDrawer.tsx`

### Chart Components (4 files)
- [ ] `src/components/charts/SalesCountChart.tsx`
- [ ] `src/components/charts/CategoryRedemptionChart.tsx`
- [ ] `src/components/charts/CategorySalesChart.tsx`
- [ ] `src/components/charts/TimeRangeToggle.tsx`

### Tour Components (3 files)
- [ ] `src/components/tour/TourComparisonTable.tsx`
- [ ] `src/components/tour/TourCharts.tsx`
- [ ] `src/components/tour/BestWorstCallouts.tsx`

### Stripe Components (4 files)
- [ ] `src/components/stripe/StripeSettingsForm.tsx`
- [ ] `src/components/stripe/PayoutRoutingCard.tsx`
- [ ] `src/components/stripe/DepositsCard.tsx`
- [ ] `src/components/stripe/StripeRoutingPage.tsx`

### Diagnostics Components (2 files)
- [ ] `src/components/diagnostics/DataHealthSummary.tsx`
- [ ] `src/components/diagnostics/AnomaliesTable.tsx`

### Insights Components (1 file)
- [ ] `src/components/insights/InsightsPanel.tsx`

### Pages (14 files)
- [ ] `src/pages/DashboardPage.tsx`
- [ ] `src/pages/LiveOpsPage.tsx`
- [ ] `src/pages/CustomersPage.tsx`
- [ ] `src/pages/TransactionsPage.tsx`
- [ ] `src/pages/ReferralsPage.tsx`
- [ ] `src/pages/RedemptionPage.tsx`
- [ ] `src/pages/SourcesPage.tsx`
- [ ] `src/pages/RefundsPage.tsx`
- [ ] `src/pages/DisputesPage.tsx`
- [ ] `src/pages/DepositsPayoutsPage.tsx`
- [ ] `src/pages/TourOverviewPage.tsx`
- [ ] `src/pages/DiagnosticsPage.tsx`
- [ ] `src/pages/OverviewChartsPage.tsx`
- [ ] `src/pages/SettingsPage.tsx`

### shadcn/ui Components (12+ files)
- [ ] `src/components/ui/button.tsx`
- [ ] `src/components/ui/card.tsx`
- [ ] `src/components/ui/input.tsx`
- [ ] `src/components/ui/select.tsx`
- [ ] `src/components/ui/dialog.tsx`
- [ ] `src/components/ui/drawer.tsx`
- [ ] `src/components/ui/table.tsx`
- [ ] `src/components/ui/badge.tsx`
- [ ] `src/components/ui/tooltip.tsx`
- [ ] `src/components/ui/dropdown-menu.tsx`
- [ ] (+ additional shadcn components as needed)

---

**Total Estimated Files**: ~100+ files

**Estimated Implementation Time**: 3–4 weeks for MVP (single developer, full-time)

---

## References

- **Prompt.md**: Primary requirements document
- **LiveOpsPrompt.md**: Live Ops + Stripe payout deposit trace feature spec
- **stripeExtendtionPrompt.md**: Stripe routing audit feature spec
- **Sample Data**: `Nabin-K-Bhattarai-Virginia-2026-01-04T19-04-55-226Z.xlsx`
- **Screenshots**: 6 reference screenshots in `screenshots/` folder

---

## Notes

- **Data Privacy**: All processing is client-side (XLSX parsing, filtering, calculations). No data sent to servers in MVP.
- **Stripe Keys**: Store in `.env.local` (gitignored). For MVP, keys stored in session only (not persisted to disk beyond env file).
- **Performance**: Target 8k rows max for MVP. Virtualize tables to handle larger datasets in future.
- **Accessibility**: Use shadcn/ui (built on Radix) for accessible components out-of-box.
- **Ticket Type/Name Flexibility**: Dynamically derive ticket types from data (no hardcoded names). Normalize strings (trim, lowercase) for consistency.
- **Date Handling**: Assume input dates in UTC (or mixed formats). Always convert to EST for display using `date-fns-tz`.
- **Tour Mode**: Detect multi-event by checking unique EventName values. If > 1, show Tour Overview nav item.
- **Stripe (MVP)**: Frontend UI only (forms, empty states, placeholders). No backend API calls until Phase 2.

---

## Appendix: Component Inventory (From Screenshots)

### Global Shell
- Left sidebar nav (collapsible)
- Top header per page (event title + timestamp + action buttons)
- Main content area with cards (2–3 column grid)

### Global Controls
- Global search
- Date range filter (purchase vs redemption mode)
- Event selector (for tour mode / multi-event)

### Primary Global Actions
- Send All User Ticket Email (button)
- QR Code Generate (button)
- Download All Transactions (button on Recent Activities)

### Page: Event Dashboard (Austin/Virginia)
1. Event Header Block
2. Highlights Card
3. Tickets Sold by Category
4. Ticket Redeemed by Category
5. Ticket Issue Source
6. Referrals (donuts + codes list)
7. Recent Activities Table

### Page: Customers
8. Customer Search + Date Filter
9. Customers Table

### Page: Referrals + Recent Activities
10. Checking by Referral (Tickets Scanned)
11. Tickets Sold by Referral
12. Referral Codes List
13. Recent Activities Table

### Page: Overview All Time (Charts)
14. Time Range Tabs
15. Sales Count Chart
16. Category Redemption Chart
17. Category Sales Chart

### Page: Redemption + Issue Source + Web KPIs
18. Ticket Redeemed by Category
19. Page Views KPI + Conversion Rate KPI (placeholder)
20. Ticket Issue Source

### Page: Full Dashboard Shell (Virginia)
21. Sidebar Nav (Dashboard, Customers, Business, Event, Unverified Events, Archives, Transactions, Box Office, Lucky, Disputes, Blogs, Physical Ticket)

---

**End of Plan**
