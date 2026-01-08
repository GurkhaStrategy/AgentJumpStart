# GitHub Issues: Azure Functions for OpenTickets Backend

This document tracks the tasks for building the serverless backend.

---

## Issue #1: Implement `SyncTransactions` Timer Trigger
**Labels**: `backend`, `data-ingestion`, `azure-functions`
**Epic**: Backend Infrastructure
**Sprint**: Sprint 1
**AssignedTo**: Ashik

### Description
Create a timer-triggered Azure Function that synchronizes transaction data from the OpenTickets source database or API into our local Cosmos DB. This ensures the dashboard stays up to date without manual uploads.

### Tasks
- [ ] Configure timer trigger (e.g., every hour: `0 0 * * * *`).
- [ ] Implement OpenTickets API authentication.
- [ ] Fetch new/updated transactions since the last run.
- [ ] Map data to the internal `TicketTransaction` schema.
- [ ] Upsert records into Cosmos DB.
- [ ] Push `PaymentID` to `stripe-enrichment-queue` for new transactions.

### Acceptance Criteria
- Data is successfully pulled and stored in Cosmos DB.
- Duplicate records are handled (upsert).
- Messages are safely queued for Stripe enrichment.

---

## Issue #2: Implement `EnrichStripePayments` Queue Trigger
**Labels**: `backend`, `stripe`, `azure-functions`
**Epic**: Stripe Integration
**Sprint**: Sprint 1
**AssignedTo**: Ashik

### Description
Create a queue-triggered function that listens for new payment IDs and enriches them with routing, payout, and bank information using the Stripe API.

### Tasks
- [ ] Connect to `stripe-enrichment-queue`.
- [ ] Implement multi-account ownership detection (Platform vs Connected).
- [ ] Fetch payout status and arrival date (`available_on`).
- [ ] Retrieve bank account details (Bank Name, Last 4).
- [ ] Update Cosmos DB record with enrichment fields.

### Acceptance Criteria
- Successfully handles `pi_...` IDs from both platform and connected accounts.
- Dashboard specific fields (`stripeRouteType`, `depositBankName`, etc.) are populated correctly.

---

## Issue #3: Implement `GetAnalyticsData` API
**Labels**: `backend`, `api`, `azure-functions`

### Description
Create an HTTP-triggered function to provide aggregated metrics for the dashboard widgets.

### Tasks
- [ ] Define `GET /api/analytics` endpoint.
- [ ] Support filtering by `eventId`, `dateRange`, `ticketTypes`, and `source`.
- [ ] Aggregate metrics (Revenue, Net, Sold, Redeemed) server-side.
- [ ] Return JSON matching `DerivedMetrics` interface.

### Acceptance Criteria
- Response time under 200ms for standard queries.
- Correctly calculates metrics based on filtered subset.

---

## Issue #4: Implement `GetTransactions` & `GetCustomers` APIs
**Labels**: `backend`, `api`, `azure-functions`

### Description
Create endpoints for paginated data retrieval for the Transactions and Customers tables.

### Tasks
- [ ] Define `GET /api/transactions`.
- [ ] Define `GET /api/customers` (including deduplication logic).
- [ ] Implement pagination (offset or continuation tokens).
- [ ] Support global search (Name, Email, PaymentID).

### Acceptance Criteria
- Seamless integration with TanStack Table on the frontend.
- Efficient retrieval from Cosmos DB.

---

## Issue #5: Implement `StripeWebhookHandler`
**Labels**: `backend`, `stripe`, `webhooks`

### Description
Create a webhook endpoint to handle real-time updates from Stripe regarding refunds, disputes, and payouts.

### Tasks
- [ ] Define `POST /api/webhooks/stripe`.
- [ ] Implement signature verification.
- [ ] Handle `charge.refunded` and `charge.dispute.created`.
- [ ] Update status fields in Cosmos DB immediately.

### Acceptance Criteria
- Dashboard reflects refunds/disputes in real-time without refreshing.
- Securely validates payloads.
