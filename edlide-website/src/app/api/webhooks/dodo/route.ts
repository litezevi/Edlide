import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import DodoPayments from 'dodopayments'
import { TokenEncryption } from '@/lib/token-encryption'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CHUTES_PARTNER_API_URL = 'https://partner-api.chutes.ai'
const CHUTES_PARTNER_API_KEY = process.env.CHUTES_PARTNER_API_KEY!

const STARTER_PRODUCT_ID = process.env.EDLIDE_STARTER_PLAN_PRODUCT_ID!
const PRO_PRODUCT_ID = process.env.EDLIDE_PRO_PLAN_PRODUCT_ID!
const ULTRA_PRODUCT_ID = process.env.EDLIDE_ULTRA_PLAN_PRODUCT_ID!

const PLAN_TIER_MAP: Record<string, string> = {
  [STARTER_PRODUCT_ID]: 'base',
  [PRO_PRODUCT_ID]: 'plus',
  [ULTRA_PRODUCT_ID]: 'pro',
}

const DODO_PRODUCT_ID_MAP: Record<string, string> = {
  'prod_starter_monthly': STARTER_PRODUCT_ID,
  'prod_pro_monthly': PRO_PRODUCT_ID,
  'prod_ultra_monthly': ULTRA_PRODUCT_ID,
}

const PLAN_QUOTA_MAP: Record<string, number> = {
  'base': 300,
  'plus': 2000,
  'pro': 5000,
}

const REVERSE_PLAN_TIER_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PLAN_TIER_MAP).map(([k, v]) => [v, k])
)

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode',
})

async function createChutesAccount(userId: string, email: string) {
  const response = await fetch(`${CHUTES_PARTNER_API_URL}/users`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'X-API-Key': CHUTES_PARTNER_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to create Chutes user: ${await response.text()}`)
  }

  const userData = await response.json()
  
  return {
    userId: userData.user_id,
    apiKey: userData.api_key.secret_key,
    fingerprint: userData.fingerprint,
  }
}

async function createAndRedeemCode(chutesUserId: string, tier: string) {
  const quota = PLAN_QUOTA_MAP[tier]
  
  const createCodeResponse = await fetch(`${CHUTES_PARTNER_API_URL}/codes`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'X-API-Key': CHUTES_PARTNER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tier }),
  })

  if (!createCodeResponse.ok) {
    throw new Error(`Failed to create code: ${await createCodeResponse.text()}`)
  }

  const codeData = await createCodeResponse.json()
  
  const redeemResponse = await fetch(`${CHUTES_PARTNER_API_URL}/codes/redeem`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'X-API-Key': CHUTES_PARTNER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: codeData.code,
      user_id: chutesUserId,
    }),
  })

  if (!redeemResponse.ok) {
    throw new Error(`Failed to redeem code: ${await redeemResponse.text()}`)
  }

  return await redeemResponse.json()
}

async function handlePaymentSucceeded(data: Record<string, unknown>) {
  console.log('Payment data:', JSON.stringify(data, null, 2))

  const customer = data.customer as Record<string, unknown> | undefined
  const customerMeta = customer?.metadata as Record<string, unknown> | undefined
  const dataMeta = data.metadata as Record<string, unknown> | undefined

  const customerEmail = (customer?.email || data.customer_email || customerMeta?.email) as string | undefined
  const rawProductId = (data.product_id || dataMeta?.product_id || (data.products as Array<Record<string, unknown>> | undefined)?.[0]?.product_id) as string | undefined
  const productId = rawProductId ? (DODO_PRODUCT_ID_MAP[rawProductId] || rawProductId) : undefined
  const subscriptionId = (data.subscription_id || data.id) as string | undefined
  const userIdFromMeta = (customerMeta?.user_id || dataMeta?.user_id) as string | undefined

  let userId = userIdFromMeta

  if (!userId && customerEmail) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', customerEmail)
      .single()

    if (user) {
      userId = user.id
    }
  }

  if (!userId) {
    console.error('Missing user_id and cannot find by email:', customerEmail)
    return
  }

  if (!productId) {
    console.error('Missing product_id in webhook')
    return
  }

  const tier = PLAN_TIER_MAP[productId]
  if (!tier) {
    console.log('Unknown product_id, trying raw:', rawProductId)
    console.log('Available mappings:', PLAN_TIER_MAP)
  }

  // Check if subscription already exists — could be:
  // 1. Proration payment from upgrade (next_plan_tier set, no downgrade_at)
  // 2. Renewal payment after scheduled downgrade (next_plan_tier + downgrade_at set)
  // 3. Normal renewal (no pending changes)
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('subscription_id, plan_tier, status, next_plan_tier, downgrade_at, chutes_user_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (existingSub && existingSub.subscription_id === subscriptionId) {
    if (existingSub.next_plan_tier && existingSub.downgrade_at) {
      // === SCHEDULED DOWNGRADE: renewal payment succeeded at OLD price ===
      // Now call Dodo changePlan to switch to the lower plan for future billing.
      const newProductId = REVERSE_PLAN_TIER_MAP[existingSub.next_plan_tier]
      if (newProductId) {
        try {
          await dodoClient.subscriptions.changePlan(
            existingSub.subscription_id,
            {
              product_id: newProductId,
              quantity: 1,
              proration_billing_mode: 'difference_immediately',
            }
          )
          console.log(`[Webhook] Dodo changePlan called for downgrade: ${existingSub.plan_tier} -> ${existingSub.next_plan_tier}`)
        } catch (changePlanError) {
          console.error('[Webhook] Failed to call Dodo changePlan for scheduled downgrade:', changePlanError)
          // Still update DB — the plan change intent is recorded
        }
      }

      console.log(`[Webhook] Renewal after scheduled downgrade — applying: ${existingSub.plan_tier} -> ${existingSub.next_plan_tier}`)
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_tier: existingSub.next_plan_tier,
          next_plan_tier: null,
          plan_change_date: null,
          downgrade_at: null,
          next_billing_date: (data.next_billing_date as string) || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('[Webhook] Failed to apply scheduled downgrade:', updateError)
      } else {
        console.log(`[Webhook] Downgrade applied: ${existingSub.next_plan_tier} for user ${userId}`)

        // Redeem new tier code for existing Chutes account
        if (existingSub.chutes_user_id && existingSub.next_plan_tier) {
          try {
            const redeemResult = await createAndRedeemCode(existingSub.chutes_user_id, existingSub.next_plan_tier)
            console.log(`[Webhook] Redeemed ${existingSub.next_plan_tier} code for Chutes user ${existingSub.chutes_user_id}:`, redeemResult)
          } catch (redeemError) {
            console.error('[Webhook] Failed to redeem code after downgrade:', redeemError)
          }
        }
      }
    } else if (existingSub.next_plan_tier) {
      // === UPGRADE: proration payment succeeded → apply new tier ===
      console.log(`[Webhook] Proration payment succeeded — applying upgrade: ${existingSub.plan_tier} -> ${existingSub.next_plan_tier}`)
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_tier: existingSub.next_plan_tier,
          next_plan_tier: null,
          plan_change_date: null,
          downgrade_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('[Webhook] Failed to apply plan change:', updateError)
      } else {
        console.log(`[Webhook] Plan upgraded to ${existingSub.next_plan_tier} for user ${userId}`)

        // Redeem new tier code for existing Chutes account
        if (existingSub.chutes_user_id && existingSub.next_plan_tier) {
          try {
            const redeemResult = await createAndRedeemCode(existingSub.chutes_user_id, existingSub.next_plan_tier)
            console.log(`[Webhook] Redeemed ${existingSub.next_plan_tier} code for Chutes user ${existingSub.chutes_user_id}:`, redeemResult)
          } catch (redeemError) {
            console.error('[Webhook] Failed to redeem code after upgrade:', redeemError)
          }
        }
      }
    } else {
      // Normal renewal — payment.succeeded means payment was successful
      // Update next_billing_date and redeem Chutes code for another 32 days
      const nextBillingDate = data.next_billing_date as string | undefined
      if (nextBillingDate) {
        await supabase
          .from('subscriptions')
          .update({
            next_billing_date: nextBillingDate,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
      }

      // Redeem code to extend Chutes subscription for another 32 days
      if (existingSub.chutes_user_id && existingSub.plan_tier) {
        try {
          const redeemResult = await createAndRedeemCode(existingSub.chutes_user_id, existingSub.plan_tier)
          console.log(`[Webhook] Renewal redeem: ${existingSub.plan_tier} code for Chutes user ${existingSub.chutes_user_id}:`, redeemResult)
        } catch (redeemError) {
          console.error(`[Webhook] Failed to redeem code on renewal for user ${userId}:`, redeemError)
        }
      }

      console.log(`[Webhook] Normal renewal processed for subscription ${subscriptionId}, user ${userId}`)
    }
    return
  }

  let chutesData: { userId: string; apiKey: string; fingerprint: string } | null = null

  const chutesAccount = await createChutesAccount(userId, customerEmail || '')
  await createAndRedeemCode(chutesAccount.userId, tier)
  chutesData = chutesAccount

  const expiresAt = data.expires_at || data.next_billing_date
  const nextBillingDate = data.next_billing_date

  const encryptedApiKey = chutesData?.apiKey
    ? TokenEncryption.encrypt(chutesData.apiKey)
    : { encrypted: '', iv: '' }

  const encryptedFingerprint = chutesData?.fingerprint
    ? TokenEncryption.encrypt(chutesData.fingerprint)
    : { encrypted: '', iv: '' }

  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      subscription_id: subscriptionId,
      plan_tier: tier,
      chutes_user_id: chutesData?.userId,
      chutes_api_key_encrypted: encryptedApiKey.encrypted,
      chutes_api_key_iv: encryptedApiKey.iv,
      chutes_fingerprint_encrypted: encryptedFingerprint.encrypted,
      chutes_fingerprint_iv: encryptedFingerprint.iv,
      status: 'active',
      expires_at: expiresAt as string,
      next_billing_date: nextBillingDate as string,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (upsertError) {
    console.error('Failed to save subscription:', upsertError)
    throw upsertError
  }

  console.log(`Subscription activated for user ${userId} with tier ${tier}`)
}

async function handlePlanChanged(data: Record<string, unknown>) {
  console.log('[Webhook] subscription.plan_changed:', JSON.stringify(data, null, 2))

  const subscriptionId = (data.subscription_id || data.id) as string | undefined
  const newProductId = (data.product_id || data.plan_id) as string | undefined

  if (!subscriptionId) {
    console.error('[Webhook] plan_changed: missing subscription_id')
    return
  }

  // Check if this is a scheduled downgrade — if so, do NOT update plan_tier yet.
  // The plan was changed in Dodo immediately (proration_billing_mode: 'none'),
  // but we keep the current tier in our DB until renewal.
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('downgrade_at, plan_tier')
    .eq('subscription_id', subscriptionId)
    .single()

  if (existingSub?.downgrade_at) {
    console.log(`[Webhook] plan_changed for subscription ${subscriptionId} — scheduled downgrade active, skipping plan_tier update (keeping ${existingSub.plan_tier} until ${existingSub.downgrade_at})`)
    // Only update next_billing_date if present
    const nextBillingDate = data.next_billing_date as string | undefined
    if (nextBillingDate) {
      await supabase
        .from('subscriptions')
        .update({
          next_billing_date: nextBillingDate,
          updated_at: new Date().toISOString(),
        })
        .eq('subscription_id', subscriptionId)
    }
    return
  }

  let newTier: string | undefined
  if (newProductId) {
    newTier = PLAN_TIER_MAP[newProductId]
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    status: 'active',
    next_plan_tier: null,
    plan_change_date: null,
    downgrade_at: null,
  }

  if (newTier) {
    updateData.plan_tier = newTier
  }

  const nextBillingDate = data.next_billing_date as string | undefined
  if (nextBillingDate) {
    updateData.next_billing_date = nextBillingDate
  }

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('subscription_id', subscriptionId)

  if (updateError) {
    console.error('[Webhook] Failed to update subscription on plan_changed:', updateError)
    throw updateError
  }

  console.log(`[Webhook] Plan changed for subscription ${subscriptionId} to tier: ${newTier || 'unknown'}`)
}

async function handleSubscriptionUpdated(data: Record<string, unknown>) {
  console.log('[Webhook] subscription.updated:', JSON.stringify(data, null, 2))

  const subscriptionId = (data.subscription_id || data.id) as string | undefined
  const newProductId = (data.product_id) as string | undefined

  if (!subscriptionId) {
    console.error('[Webhook] subscription.updated: missing subscription_id')
    return
  }

  // Look up existing subscription by subscription_id
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('plan_tier, status, downgrade_at')
    .eq('subscription_id', subscriptionId)
    .single()

  if (!existingSub) {
    console.log(`[Webhook] subscription.updated: no matching subscription for ${subscriptionId}`)
    return
  }

  // If scheduled downgrade is active, do NOT update plan_tier from Dodo's product_id.
  // Dodo already switched the plan, but we keep current tier until renewal.
  if (existingSub.downgrade_at) {
    console.log(`[Webhook] subscription.updated: scheduled downgrade active for ${subscriptionId}, skipping plan_tier update`)
    const nextBillingDate = data.next_billing_date as string | undefined
    if (nextBillingDate) {
      await supabase
        .from('subscriptions')
        .update({
          next_billing_date: nextBillingDate,
          updated_at: new Date().toISOString(),
        })
        .eq('subscription_id', subscriptionId)
    }
    return
  }

  // If product_id is present and maps to a different tier, update it
  // This handles the case where subscription.plan_changed doesn't fire
  // but subscription.updated does after a changePlan call.
  if (newProductId) {
    const newTier = PLAN_TIER_MAP[newProductId]
    if (newTier && newTier !== existingSub.plan_tier) {
      console.log(`[Webhook] subscription.updated: tier change detected ${existingSub.plan_tier} -> ${newTier}`)

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_tier: newTier,
          updated_at: new Date().toISOString(),
          next_plan_tier: null,
          plan_change_date: null,
          downgrade_at: null,
        })
        .eq('subscription_id', subscriptionId)

      if (updateError) {
        console.error('[Webhook] Failed to update tier on subscription.updated:', updateError)
      } else {
        console.log(`[Webhook] Plan updated to ${newTier} via subscription.updated`)
      }
      return
    }
  }

  // Update next_billing_date if present
  const nextBillingDate = data.next_billing_date as string | undefined
  if (nextBillingDate) {
    await supabase
      .from('subscriptions')
      .update({
        next_billing_date: nextBillingDate,
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscriptionId)
  }

  console.log(`[Webhook] subscription.updated processed for ${subscriptionId}`)
}

export async function POST(req: NextRequest) {
  try {
    const webhookId = req.headers.get('webhook-id')
    const webhookSignature = req.headers.get('webhook-signature')
    const webhookTimestamp = req.headers.get('webhook-timestamp')
    const rawBody = await req.text()

    console.log('Webhook headers:', { webhookId, webhookSignature: webhookSignature?.slice(0, 20), webhookTimestamp })

    let event
    if (webhookId && webhookSignature && webhookTimestamp) {
      try {
        const unwrapped = dodoClient.webhooks.unwrap(rawBody, {
          headers: {
            'webhook-id': webhookId,
            'webhook-signature': webhookSignature,
            'webhook-timestamp': webhookTimestamp,
          }
        })
        event = unwrapped
      } catch (verifyError) {
        console.error('Webhook verification failed:', verifyError)
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      console.log('Missing webhook headers, parsing without verification')
      event = JSON.parse(rawBody)
    }

    const eventType = event.type
    const eventData = event.data

    console.log('Received webhook event:', eventType)

    switch (eventType) {
      case 'payment.succeeded':
      case 'subscription.created':
      case 'subscription.activated':
      case 'subscription.active':
        await handlePaymentSucceeded(eventData)
        break
      
      case 'subscription.plan_changed':
        await handlePlanChanged(eventData)
        break

      case 'subscription.updated':
        await handleSubscriptionUpdated(eventData)
        break

      case 'payment.failed':
      case 'subscription.failed':
        console.log('Payment failed:', eventData)
        break

      case 'subscription.on_hold': {
        console.log('[Webhook] Subscription on hold (payment failed):', eventData)
        const onHoldSubId = (eventData.subscription_id || eventData.id) as string | undefined
        if (onHoldSubId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'on_hold',
              updated_at: new Date().toISOString(),
            })
            .eq('subscription_id', onHoldSubId)
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired':
        console.log('Subscription cancelled/expired:', eventData)
        break
      
      default:
        console.log('Unknown event type:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}