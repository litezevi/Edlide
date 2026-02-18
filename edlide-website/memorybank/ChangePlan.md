# Change Plan System

## Overview

Allows users with an active subscription (Starter/Pro/Ultra) to upgrade or downgrade their plan using Dodo Payments `changePlan` API with `difference_immediately` proration mode. No new checkout page is opened — Dodo automatically charges the saved card.

## Key Behavior

- **Upgrade**: Dodo immediately charges the price difference from the saved card (e.g. Starter $6.99 → Pro $19.99 = $13.00 charged)
- **Downgrade**: The remaining unused value is credited to future renewal payments
- **No checkout redirect**: `changePlan` works via saved card, no new payment page
- **Failure handling**: `on_payment_failure: 'prevent_change'` — plan stays unchanged if card fails, subscription goes `on_hold`
- **Webhook delay**: After `changePlan`, Dodo takes ~30sec-2min to process payment and send `payment.succeeded` webhook

## Plan Tier Mapping

| Display Name | Internal Tier | Dodo Product ID              | Price   | Requests/day |
|-------------|---------------|------------------------------|---------|-------------|
| Starter     | `base`        | `pdt_0NX7tjKSxW7Dn1oGBdMbE` | $6.99   | 300         |
| Pro         | `plus`        | `pdt_0NX7uDmO6LQ1tZPva4I5A` | $19.99  | 2,000       |
| Ultra       | `pro`         | `pdt_0NX7uQKJc1elOk1df38G7` | $34.99  | 5,000       |

Additional product ID aliases (from checkout metadata):
- `prod_starter_monthly` → `pdt_0NX7tjKSxW7Dn1oGBdMbE`
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
