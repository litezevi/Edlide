import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import DodoPayments from 'dodopayments'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode',
})

const PLAN_TIER_MAP: Record<string, string> = {
  'pdt_0NX7tjKSxW7Dn1oGBdMbE': 'base',
  'pdt_0NX7uDmO6LQ1tZPva4I5A': 'plus',
  'pdt_0NX7uQKJc1elOk1df38G7': 'pro',
}

const TIER_ORDER = ['base', 'plus', 'pro']

export async function POST(req: NextRequest) {
  try {
    const { userId, newProductId } = await req.json()

    if (!userId || !newProductId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, newProductId' },
        { status: 400 }
      )
    }

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('subscription_id, plan_tier, status, next_billing_date')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    if (!subscription.subscription_id) {
      return NextResponse.json(
        { error: 'Subscription ID not found in database' },
        { status: 400 }
      )
    }

    const newTier = PLAN_TIER_MAP[newProductId]
    if (!newTier) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    if (newTier === subscription.plan_tier) {
      return NextResponse.json(
        { error: 'Already on this plan' },
        { status: 400 }
      )
    }

    const currentIndex = TIER_ORDER.indexOf(subscription.plan_tier)
    const newIndex = TIER_ORDER.indexOf(newTier)
    const isUpgrade = newIndex > currentIndex

    if (isUpgrade) {
      // === UPGRADE: immediate change with difference_immediately ===
      await supabase
        .from('subscriptions')
        .update({
          next_plan_tier: newTier,
          plan_change_date: new Date().toISOString(),
          downgrade_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      await dodoClient.subscriptions.changePlan(
        subscription.subscription_id,
        {
          product_id: newProductId,
          quantity: 1,
          proration_billing_mode: 'difference_immediately',
          on_payment_failure: 'prevent_change',
        }
      )

      console.log(`[Change Plan] UPGRADE: User ${userId}: ${subscription.plan_tier} -> ${newTier}`)

      return NextResponse.json({
        success: true,
        status: 'processing',
        type: 'upgrade',
        subscriptionId: subscription.subscription_id,
        previousTier: subscription.plan_tier,
        newTier,
      })
    } else {
      // === DOWNGRADE: scheduled — do NOT call Dodo now ===
      // We only record the intent in DB. When the current period ends and
      // Dodo sends a renewal payment.succeeded webhook, we call changePlan
      // at that point so the NEXT billing is at the lower price.
      const downgradeAt = subscription.next_billing_date

      if (!downgradeAt) {
        return NextResponse.json(
          { error: 'Cannot schedule downgrade: no next billing date found' },
          { status: 400 }
        )
      }

      // Mark scheduled downgrade in DB — do NOT change plan_tier, do NOT call Dodo
      await supabase
        .from('subscriptions')
        .update({
          next_plan_tier: newTier,
          plan_change_date: new Date().toISOString(),
          downgrade_at: downgradeAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      console.log(`[Change Plan] DOWNGRADE scheduled: User ${userId}: ${subscription.plan_tier} -> ${newTier} effective ${downgradeAt}`)

      return NextResponse.json({
        success: true,
        status: 'scheduled',
        type: 'downgrade',
        subscriptionId: subscription.subscription_id,
        previousTier: subscription.plan_tier,
        newTier,
        downgradeAt,
      })
    }
  } catch (error) {
    console.error('Change plan error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to change plan'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
