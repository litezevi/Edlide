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

const TIER_DISPLAY_NAMES: Record<string, string> = {
  'base': 'Starter',
  'plus': 'Pro',
  'pro': 'Ultra',
}

const TIER_PRICES: Record<string, number> = {
  'base': 6.99,
  'plus': 19.99,
  'pro': 34.99,
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
      // Upgrade: call Dodo preview for proration amount
      const preview = await dodoClient.subscriptions.previewChangePlan(
        subscription.subscription_id,
        {
          product_id: newProductId,
          quantity: 1,
          proration_billing_mode: 'difference_immediately',
        }
      )

      return NextResponse.json({
        preview,
        currentTier: subscription.plan_tier,
        currentTierName: TIER_DISPLAY_NAMES[subscription.plan_tier] || subscription.plan_tier,
        newTier,
        newTierName: TIER_DISPLAY_NAMES[newTier] || newTier,
        isUpgrade: true,
        subscriptionId: subscription.subscription_id,
      })
    } else {
      // Downgrade: no charge today, effective at next billing date
      return NextResponse.json({
        preview: null,
        currentTier: subscription.plan_tier,
        currentTierName: TIER_DISPLAY_NAMES[subscription.plan_tier] || subscription.plan_tier,
        newTier,
        newTierName: TIER_DISPLAY_NAMES[newTier] || newTier,
        isUpgrade: false,
        isDowngrade: true,
        noChargeToday: true,
        downgradeAt: subscription.next_billing_date,
        newPlanPrice: TIER_PRICES[newTier],
        currentPlanPrice: TIER_PRICES[subscription.plan_tier],
        subscriptionId: subscription.subscription_id,
      })
    }
  } catch (error) {
    console.error('Preview change plan error:', error)
    return NextResponse.json(
      { error: 'Failed to preview plan change' },
      { status: 500 }
    )
  }
}
