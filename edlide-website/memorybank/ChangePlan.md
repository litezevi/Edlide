# Change Plan System

## Overview

Allows users with an active subscription (Pro/Ultra) to upgrade or downgrade their plan. **Upgrade** uses Dodo Payments `changePlan` API immediately. **Downgrade** is scheduled — the user keeps their current plan until the end of the billing period, then the downgrade is applied upon successful renewal payment. No refunds on downgrade.

## Key Behavior

- **Upgrade**: Dodo immediately charges the price difference from the saved card (e.g. Pro $14.99 → Ultra $29.99 = $15.00 charged). Plan changes instantly.
- **Downgrade (SCHEDULED)**: No charge, no refund. Plan stays the same until `next_billing_date`. At renewal, Dodo bills at the OLD price, then webhook triggers `changePlan` to the lower tier for future billing. User sees "Switching to X on Y date" badge.
- **Cancel Downgrade**: User can cancel a scheduled downgrade at any time — just clears DB fields, no Dodo API call needed.
- **No checkout redirect**: `changePlan` works via saved card, no new payment page
- **Failure handling (upgrade)**: `on_payment_failure: 'prevent_change'` — plan stays unchanged if card fails
- **Webhook delay (upgrade)**: After `changePlan`, Dodo takes ~30sec-2min to process payment and send `payment.succeeded` webhook

## Scheduled Downgrade Flow (Added Feb 19, 2026)

**Status**: Tested and working (Feb 19, 2026). Simulated renewal webhook confirmed: `plan_tier` updated from `pro` -> `base`, scheduled fields cleared, `next_billing_date` updated.

### How It Works

```
User on Ultra ($29.99), paid until Feb 18
  -> Clicks downgrade to Pro
  -> Preview shows: "No charge today. Plan changes on Feb 18, 2026."
  -> Confirms downgrade
  -> Dodo is NOT called. Only DB updated:
     next_plan_tier=plus, downgrade_at=Feb 18
  -> User continues on Ultra with full Ultra quota until Feb 18
  
Feb 18: Dodo renews at $29.99 (current plan) -> payment.succeeded webhook
  -> Webhook sees next_plan_tier + downgrade_at
  -> Calls dodoClient.subscriptions.changePlan(sub, pro_product_id, difference_immediately)
  -> Dodo creates credit ($29.99 - $14.99 = $15.00) applied to future renewals
  -> DB updated: plan_tier=plus, next_plan_tier=null, downgrade_at=null
  -> Next renewal: $14.99 minus credit
```

### Why Not Call Dodo Immediately?

Dodo does NOT support `proration_billing_mode: 'none'`. Tested on Feb 19, 2026 — Dodo returns `422: unknown variant 'none', expected one of 'prorated_immediately', 'full_immediately', 'difference_immediately'`. All supported modes either charge or credit immediately. Since we want "no charge, no refund, keep current plan until period ends", we defer the Dodo call to the renewal webhook.

### Testing (Feb 19, 2026)

Tested full downgrade cycle via simulated webhook:

1. Set scheduled downgrade in DB: `plan_tier=pro, next_plan_tier=plus, downgrade_at=2026-03-18`
2. Sent fake `payment.succeeded` webhook via curl to `http://localhost:3000/api/webhooks/dodo`
3. Result: `plan_tier` changed from `pro` to `plus`, `next_plan_tier=null`, `downgrade_at=null`, `next_billing_date` updated to next month
4. Cancel downgrade also tested — clears DB fields, no Dodo call needed

**Test curl command** (for future testing):
```bash
curl -X POST http://localhost:3000/api/webhooks/dodo \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment.succeeded",
    "data": {
      "subscription_id": "<SUB_ID>",
      "product_id": "<CURRENT_PRODUCT_ID>",
      "next_billing_date": "<NEXT_MONTH_ISO>",
      "customer": {
        "metadata": {
          "user_id": "<USER_ID>"
        }
      }
    }
  }'
```

### Important Fix: webhook dodoClient environment

The `dodoClient` in `webhooks/dodo/route.ts` was missing the `environment` parameter. Added `environment: process.env.DODO_PAYMENTS_ENVIRONMENT` so that the `changePlan` call during renewal uses the correct Dodo environment (test_mode/live_mode).

### Supabase Column Added

- `downgrade_at` (TIMESTAMPTZ) — date when scheduled downgrade takes effect (= `next_billing_date` at time of scheduling). `NULL` if no downgrade scheduled.

### Files Changed (Downgrade Logic)

#### Modified: `src/app/api/payments/change-plan/route.ts` (~154 lines)
- Added `TIER_ORDER` for upgrade/downgrade detection
- Added `next_billing_date` to subscription select query
- **Upgrade path** (unchanged): writes `next_plan_tier`, calls Dodo `changePlan` with `difference_immediately`
- **Downgrade path** (NEW): does NOT call Dodo. Only writes `next_plan_tier`, `downgrade_at`, `plan_change_date` to DB. Returns `{ status: 'scheduled', type: 'downgrade', downgradeAt }`

#### Modified: `src/app/api/payments/preview-change-plan/route.ts` (~120 lines)
- Added `TIER_PRICES`, `TIER_ORDER` constants
- Added `next_billing_date` to subscription select query
- **Upgrade**: calls `dodoClient.subscriptions.previewChangePlan()` as before
- **Downgrade** (NEW): does NOT call Dodo preview. Returns custom response: `{ noChargeToday: true, downgradeAt: next_billing_date, newPlanPrice, isDowngrade: true }`

#### Modified: `src/app/api/webhooks/dodo/route.ts` (~470 lines)
- **`handlePaymentSucceeded()`**: Added `downgrade_at` to subscription select. Three cases:
  1. `next_plan_tier + downgrade_at` → scheduled downgrade renewal → calls `dodoClient.subscriptions.changePlan()` with `difference_immediately` then updates `plan_tier` in DB
  2. `next_plan_tier` only → upgrade proration payment → applies `next_plan_tier` as before
  3. No pending changes → normal renewal, updates `next_billing_date`
- **`handlePlanChanged()`**: Added check for `downgrade_at` — if scheduled downgrade is active, skips `plan_tier` update (keeps current tier until renewal)
- **`handleSubscriptionUpdated()`**: Same `downgrade_at` guard — skips tier update if scheduled downgrade active

#### Created: `src/app/api/payments/cancel-downgrade/route.ts` (~70 lines)
- POST endpoint, accepts `{ userId }`
- Validates active subscription with `downgrade_at` + `next_plan_tier`
- Clears `next_plan_tier`, `plan_change_date`, `downgrade_at` in DB
- No Dodo API call needed (nothing was changed in Dodo)

#### Modified: `src/app/account/page.tsx` (~605 lines)
- **`ChangePlanModal`**: 
  - Added `scheduledDowngrade` prop — if active, shows "Scheduled" badge on target plan and disables it
  - Preview for downgrade: "No charge today. Your plan will change on {date}. Next bill on {date} at the new rate (${price}/mo)."
  - Success for downgrade: "Plan Change Scheduled" with CalendarClock icon
  - Shows "Upgrade"/"Downgrade" labels next to each plan
- **`AccountContent`**:
  - `loadSubscription` now fetches `next_plan_tier`, `downgrade_at`
  - Added `scheduledDowngrade` state
  - Subscription card shows amber notice: "Switching to {Plan} Plan — Effective {date}" with "Cancel" button
  - `handleCancelDowngrade()` calls `/api/payments/cancel-downgrade`
  - Passes `scheduledDowngrade` to `ChangePlanModal`

#### Supabase Migration
- `add_downgrade_at_to_subscriptions`: `ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS downgrade_at TIMESTAMPTZ DEFAULT NULL`

---
## Previous Implementation (before Feb 19, 2026)


## Plan Tier Mapping

| Display Name | Internal Tier | Dodo Product ID              | Price   | Requests/day |
|-------------|---------------|------------------------------|---------|-------------|
| Pro         | `plus`        | `pdt_0NX7uDmO6LQ1tZPva4I5A` | $14.99  | 2,000       |
| Ultra       | `pro`         | `pdt_0NX7uQKJc1elOk1df38G7` | $29.99  | 5,000       |

Additional product ID aliases (from checkout metadata):
- `prod_pro_monthly` → `pdt_0NX7uDmO6LQ1tZPva4I5A`
- `prod_ultra_monthly` → `pdt_0NX7uQKJc1elOk1df38G7`

## Flow

### User Flow
1. User on `/account` clicks "Change Plan" button
2. `ChangePlanModal` opens — Step 1: select target plan (shows current plan badge, upgrade/downgrade arrows)
3. Selecting a plan calls `/api/payments/preview-change-plan` — Step 2: shows preview with proration info
4. User clicks "Confirm Upgrade"/"Confirm Downgrade" → calls `/api/payments/change-plan`
5. Modal shows "Plan Change Initiated" success, auto-closes after 2 seconds
6. After ~30sec-2min, Dodo processes payment and sends webhook → `plan_tier` updated in DB
7. On next page load, user sees the new plan

### Technical Flow
1. `change-plan/route.ts` writes `next_plan_tier` to `subscriptions` table
2. `change-plan/route.ts` calls `dodoClient.subscriptions.changePlan()` with `difference_immediately`
3. Dodo charges saved card → sends `payment.succeeded` webhook
4. `handlePaymentSucceeded` checks: subscription already active + `next_plan_tier` exists?
   - **YES** → applies `next_plan_tier` as new `plan_tier`, clears `next_plan_tier` and `plan_change_date`
   - **NO** → processes as normal new subscription creation
5. If `subscription.plan_changed` webhook also arrives → `handlePlanChanged` updates `plan_tier` (redundant but safe)
6. If `subscription.updated` webhook arrives with new `product_id` → `handleSubscriptionUpdated` detects tier change (fallback)

## Critical Bug Fix

### Problem
When `changePlan` is called, Dodo sends a `payment.succeeded` webhook for the proration charge. The webhook payload contains `metadata.product_id = "prod_starter_monthly"` — this is the **original** product ID from the initial checkout, NOT the new plan. The old `handlePaymentSucceeded` would upsert this into `subscriptions`, overwriting `plan_tier` back to the old tier.

Additionally, Dodo does NOT reliably send `subscription.plan_changed` webhook in test_mode (and possibly live_mode).

### Solution
1. Before calling `changePlan`, write `next_plan_tier` to DB as a "pending change" marker
2. In `handlePaymentSucceeded`, check if subscription is already active with same `subscription_id`:
   - If `next_plan_tier` exists → this is a proration payment → apply `next_plan_tier` as new `plan_tier`
   - If no `next_plan_tier` → skip (renewal payment or duplicate)
3. Added `handleSubscriptionUpdated` as additional fallback for `subscription.updated` webhook
4. `handlePlanChanged` remains for `subscription.plan_changed` webhook (if Dodo ever sends it)

## Files

### Created
- **`src/app/api/payments/preview-change-plan/route.ts`** (105 lines)
  - POST endpoint, accepts `{ userId, newProductId }`
  - Fetches active subscription from Supabase
  - Calls `dodoClient.subscriptions.previewChangePlan()` with `difference_immediately`
  - Returns preview data, tier names, `isUpgrade` boolean

- **`src/app/api/payments/change-plan/route.ts`** (108 lines)
  - POST endpoint, accepts `{ userId, newProductId }`
  - Validates: active subscription exists, valid product ID, not same plan
  - Writes `next_plan_tier` and `plan_change_date` to DB before calling Dodo
  - Calls `dodoClient.subscriptions.changePlan()` with `difference_immediately` and `on_payment_failure: 'prevent_change'`
  - Returns `{ success: true, status: 'processing', previousTier, newTier }`

### Modified
- **`src/app/api/webhooks/dodo/route.ts`** (431 lines)
  - `handlePaymentSucceeded()`: Added logic to detect proration payments (subscription already active + same subscription_id). If `next_plan_tier` exists, applies it as new `plan_tier`. Otherwise skips to prevent overwriting tier with stale metadata.
  - `handlePlanChanged()`: Handles `subscription.plan_changed` webhook — updates `plan_tier` by `subscription_id`, clears `next_plan_tier`
  - `handleSubscriptionUpdated()` (NEW): Handles `subscription.updated` webhook — detects tier change from `product_id` field, updates if different from current tier
  - `subscription.on_hold` handler: Sets subscription status to `on_hold` when payment fails
  - Switch cases added: `subscription.plan_changed`, `subscription.updated`, `subscription.on_hold`

- **`src/app/account/page.tsx`** (592 lines)
  - Added `ChangePlanModal` component (lines 65-365): 2-step modal with plan selection → preview → confirmation
  - Added `showChangePlan` state and "Change Plan" button in subscription card
  - `handlePlanChanged` callback: reloads subscription after 3 second delay (gives webhook time to process)
  - Uses `PLANS` array with `dodoProductId` for each plan
  - Success state auto-closes modal after 2 seconds

- **`src/app/pricing/page.tsx`** (270 lines)
  - Loads user's current subscription tier on mount
  - Shows "Current Plan" badge and disabled button for active plan
  - Shows "Upgrade"/"Downgrade" labels on other plans based on tier order
  - If user has subscription, all plan buttons redirect to `/account` for management
  - Added FAQ: "Can I change my plan later?" with explanation of proration

## Supabase Columns Used

Table `subscriptions` (existing columns used for change plan):
- `plan_tier` — current active tier (`base`, `plus`, `pro`)
- `next_plan_tier` — pending tier during plan change (set before calling Dodo, cleared after webhook confirms)
- `plan_change_date` — timestamp when plan change was initiated
- `status` — `active`, `on_hold`, etc.
- `subscription_id` — Dodo subscription ID (used to match webhooks)

## Dodo Payments SDK Notes

- `changePlan()` returns `void` (no response body) — cannot check result status from SDK
- `previewChangePlan()` returns preview data with proration amounts
- `difference_immediately` proration: upgrade charges difference now, downgrade credits to future
- `on_payment_failure: 'prevent_change'` prevents plan change if charge fails
- In test_mode, payments from saved cards succeed instantly
- Webhook `subscription.plan_changed` is NOT reliably sent — must use `payment.succeeded` with `next_plan_tier` fallback

## Chutes Partner API

NOT integrated for plan changes yet. When a plan changes, the Chutes tier/quota is NOT updated. This is deferred for future implementation. Only `plan_tier` in Supabase is updated.
