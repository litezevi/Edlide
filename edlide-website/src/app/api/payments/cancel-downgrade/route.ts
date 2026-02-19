import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('subscription_id, plan_tier, next_plan_tier, downgrade_at, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    if (!subscription.downgrade_at || !subscription.next_plan_tier) {
      return NextResponse.json(
        { error: 'No scheduled downgrade to cancel' },
        { status: 400 }
      )
    }

    // Simply clear the scheduled downgrade fields.
    // No Dodo API call needed because we never called changePlan for downgrade.
    await supabase
      .from('subscriptions')
      .update({
        next_plan_tier: null,
        plan_change_date: null,
        downgrade_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    console.log(`[Cancel Downgrade] User ${userId}: cancelled downgrade from ${subscription.plan_tier} to ${subscription.next_plan_tier}`)

    return NextResponse.json({
      success: true,
      currentTier: subscription.plan_tier,
    })
  } catch (error) {
    console.error('Cancel downgrade error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel downgrade'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
