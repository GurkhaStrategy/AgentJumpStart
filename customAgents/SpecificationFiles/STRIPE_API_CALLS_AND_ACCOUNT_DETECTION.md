# Stripe API Calls + Account Detection (PaymentID → Platform vs Connected)

This document is a handoff-ready outline of:
- Every Stripe API call used in this workspace’s scripts
- The exact algorithm used to determine **which Stripe account “owns” a PaymentIntent** (`pi_...`) using only the PaymentIntent ID
- Why `payment_ids.txt` / CSV “cache” files exist, and how to run without them

## Context / assumptions

- We authenticate with the **platform secret key** via `STRIPE_SECRET_KEY`.
- Payment IDs in these spreadsheets are **Stripe PaymentIntent IDs** (`pi_...`).
- In Stripe Connect, a PaymentIntent can exist in:
  - the **platform** account, or
  - a **connected** account.

Because of that, a PaymentIntent ID alone does not guarantee you can retrieve it from the platform context.

---

## Core algorithm: “find the owning account for a PaymentIntent ID”

Primary implementation: `find_payment_accounts.py`.

### Key idea

A PaymentIntent can be retrieved successfully **only from the Stripe account that owns it**.

So the detection algorithm is:

1) **Try platform first** (no `stripe_account` header)

```python
stripe.PaymentIntent.retrieve(payment_id)
```

- If this succeeds → treat as **platform-owned**.

2) If platform retrieval fails, **try every connected account** by re-running the same retrieval with `stripe_account=<acct_...>`.

```python
stripe.PaymentIntent.retrieve(payment_id, stripe_account=connected_account_id)
```

- The first connected account where retrieval succeeds is the owner.

### How we get the connected-account list

- Call `stripe.Account.list(limit=100)` and iterate over `accounts.data`.
- For each account, we store:
  - `account.id` (like `acct_...`)
  - a readable name from `business_profile.name` or fallback to `email`.

### Why exceptions are expected

When you call `stripe.PaymentIntent.retrieve(payment_id)` against the *wrong* account context, Stripe typically raises `stripe.error.InvalidRequestError` (commonly “No such payment_intent”). That failure is the signal to keep searching.

### Where the “final connected account” is decided

In `find_payment_accounts.py`:
- Platform attempt: `stripe.PaymentIntent.retrieve(payment_id, expand=[...])`
- Connected attempts: `stripe.PaymentIntent.retrieve(payment_id, stripe_account=acct_id, expand=[...])`

The first account context where retrieve succeeds is the **final owning account**.

---

## Stripe API calls used (by purpose)

Below is an inventory of the Stripe calls used across these scripts:
- `find_payment_accounts.py`
- `update_excel_with_bank_info.py`
- `analyze_with_bank_info.py`
- `analyze_stripe_payments.py`
- `deep_dive_analysis.py`

### 0) Authentication

- `stripe.api_key = os.environ['STRIPE_SECRET_KEY']`
  - Not an API call; sets auth for all subsequent requests.

### 1) Retrieve a PaymentIntent (platform or connected)

Used to fetch the payment itself.

- Platform-owned attempt:
  - `stripe.PaymentIntent.retrieve(payment_id, expand=[...])`
- Connected-owned attempt:
  - `stripe.PaymentIntent.retrieve(payment_id, stripe_account=connected_account_id, expand=[...])`

Notes:
- `stripe_account=...` sends the “Stripe-Account” header (Connect) to scope the call to a connected account.
- `expand=['latest_charge.balance_transaction']` expands nested objects so we don’t need separate calls for the balance transaction.

Files:
- `find_payment_accounts.py`
- `update_excel_with_bank_info.py`
- `analyze_with_bank_info.py`
- `analyze_stripe_payments.py` (platform-only retrieve, then reads fields like `transfer_data`)
- `deep_dive_analysis.py`

### 2) List connected accounts

Used to get candidate `acct_...` IDs for the “try each account” loop.

- `stripe.Account.list(limit=100)`

Files:
- `find_payment_accounts.py`
- `analyze_with_bank_info.py`
- `deep_dive_analysis.py`
- `example_account_detection.py`

### 3) Retrieve account details (names, metadata, etc.)

Used to translate `acct_...` into a human name and/or access external accounts.

- `stripe.Account.retrieve(account_id)`
- `stripe.Account.retrieve()` (retrieve “current” account from the API key context)

Files:
- `analyze_stripe_payments.py` (name lookup)
- `deep_dive_analysis.py`
- `update_excel_with_bank_info.py`
- `analyze_with_bank_info.py`

### 4) Retrieve a Customer (to show customer name/email)

- Platform customer:
  - `stripe.Customer.retrieve(customer_id)`
- Connected customer:
  - `stripe.Customer.retrieve(customer_id, stripe_account=connected_account_id)`

Files:
- `find_payment_accounts.py`
- `analyze_with_bank_info.py`

### 5) Read balance transaction availability (deposit timing)

Two patterns exist in the repo:

A) Preferable: expand on the PaymentIntent retrieve and read:
- `payment.latest_charge.balance_transaction.available_on`

B) Deep-dive: fetch explicitly:
- `stripe.BalanceTransaction.retrieve(balance_transaction_id)`

Files:
- Expand-based: `find_payment_accounts.py`, `update_excel_with_bank_info.py`, `analyze_with_bank_info.py`
- Explicit retrieve: `deep_dive_analysis.py`

### 6) Find payout (deposit) records and arrival date

Used to get a payout/transfer identifier and a bank arrival date.

- Platform payouts:
  - `stripe.Payout.list(limit=N)`
- Connected payouts:
  - `stripe.Payout.list(limit=N, stripe_account=connected_account_id)`

The scripts use heuristics (date proximity) to match a payout to the balance transaction’s available date.

Files:
- `update_excel_with_bank_info.py`
- `analyze_with_bank_info.py`

### 7) Retrieve bank account details (destination) for a payout

Used to show “BANK NAME •••• 1234” in the spreadsheet.

- `stripe.Account.retrieve_external_account(account_id, external_account_id)`

Notes:
- `external_account_id` is taken from `payout.destination`.
- Some scripts also fall back to listing the account’s default external account.

Files:
- `update_excel_with_bank_info.py`
- `analyze_with_bank_info.py`

### 8) List external accounts (fallback bank info)

Used when a payout match isn’t found, to still show “bank on file”.

- `account = stripe.Account.retrieve(...)`
- `account.external_accounts.list(limit=1)` (or `limit=10`)

Files:
- `update_excel_with_bank_info.py`
- `analyze_with_bank_info.py`

### 9) Retrieve a Transfer (used by the older “infer destination” approach)

Used to trace `charge.transfer` → destination account.

- `stripe.Transfer.retrieve(transfer_id)`

Files:
- `analyze_stripe_payments.py`
- `deep_dive_analysis.py`

### 10) List application fees (deep-dive / fee tracing)

- `stripe.ApplicationFee.list(charge=charge_id, limit=10)`

Files:
- `deep_dive_analysis.py`

---

## Why do we have `payment_ids.txt`?

`payment_ids.txt` exists mainly to support a workflow where we:
1) Collect a set of PaymentIntent IDs (from any source)
2) Run a single analysis job against that list
3) Persist the results for reuse

Benefits:
- **Decouples input from Excel format**: Excel exports change column names and structure; a plain text list is stable.
- **Easy dedupe / repeatability**: you can re-run the same set without re-extracting.
- **Faster iteration**: you can correct the Stripe logic without re-opening/re-parsing large spreadsheets.

Scripts that read `payment_ids.txt`:
- `find_payment_accounts.py`
- `analyze_stripe_payments.py`
- `analyze_with_bank_info.py`

## Can we query all Payment IDs directly from Excel instead?

Yes — and we already do that in `update_excel_with_bank_info.py`:
- It loads the Excel (`pandas.read_excel`) and scans columns for values starting with `pi_`.

However, `update_excel_with_bank_info.py` still relies on `payment_account_mapping.csv` as a **cache** (see next section).

If you want a single-step flow (Excel in → Stripe queried → Excel out) with no manual `payment_ids.txt`, the right approach is:
- Extract all `pi_...` IDs from the Excel
- For any ID not already in the cache, run the “owning account detection” logic and append to the cache
- Then write the enriched Excel

(We’ve effectively done this manually when we discovered “missing records” in prior runs.)

---

## Why do we have `payment_account_mapping.csv` (the cache)?

`payment_account_mapping.csv` stores the result of the expensive part:
- PaymentIntent ID → owning account (platform vs which connected account)

Reasons:
- **Avoids repeated Stripe calls**: looking up the owning account can require up to 1 + N API calls per payment (platform + many connected accounts).
- **Rate limits / speed**: for large files, caching prevents hitting Stripe rate limits and makes re-runs much faster.
- **Stability**: the owning account for a given PaymentIntent ID doesn’t change, so caching is safe.

What still may change over time:
- Payout/deposit timing and payout IDs (so the Excel updater may still call payouts/bank lookups each run).

---

## Practical “handoff” notes for another AI

- The most reliable ownership detection in this repo is **"try retrieve in each account context"** (platform then each connected account).
- Do not assume `transfer_data.destination` is present or sufficient:
  - It helps in some Stripe Connect integration styles, but in our real data we observed many PaymentIntents that can only be retrieved under a connected account context.
- Use `expand=['latest_charge.balance_transaction']` to minimize calls when you need `available_on` for deposit timing.

