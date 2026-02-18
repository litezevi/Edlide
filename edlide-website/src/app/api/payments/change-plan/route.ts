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
      .select('subscription_id, plan_tier, status')
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

    // Mark pending plan change before calling Dodo
    await supabase
      .from('subscriptions')
      .update({
        next_plan_tier: newTier,
        plan_change_date: new Date().toISOString(),
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

    console.log(`[Change Plan] User ${userId}: ${subscription.plan_tier} -> ${newTier}`)

    return NextResponse.json({
      success: true,
      status: 'processing',
      subscriptionId: subscription.subscription_id,
      previousTier: subscription.plan_tier,
      newTier,
    })
  } catch (error) {
    console.error('Change plan error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to change plan'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
