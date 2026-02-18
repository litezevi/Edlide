import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import DodoPayments from 'dodopayments'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CHUTES_PARTNER_API_URL = 'https://partner-api.chutes.ai'
const CHUTES_PARTNER_API_KEY = process.env.CHUTES_PARTNER_API_KEY!

const PLAN_TIER_MAP: Record<string, string> = {
  'pdt_0NX7tjKSxW7Dn1oGBdMbE': 'base',
  'pdt_0NX7uDmO6LQ1tZPva4I5A': 'plus',
  'pdt_0NX7uQKJc1elOk1df38G7': 'pro',
}

const DODO_PRODUCT_ID_MAP: Record<string, string> = {
  'prod_starter_monthly': 'pdt_0NX7tjKSxW7Dn1oGBdMbE',
  'prod_pro_monthly': 'pdt_0NX7uDmO6LQ1tZPva4I5A',
  'prod_ultra_monthly': 'pdt_0NX7uQKJc1elOk1df38G7',
}

const PLAN_QUOTA_MAP: Record<string, number> = {
  'base': 300,
  'plus': 2000,
  'pro': 5000,
}

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
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

async function handlePaymentSucceeded(data: any) {
  console.log('Payment data:', JSON.stringify(data, null, 2))
  
  const customerEmail = data.customer?.email || data.customer_email || data.customer?.metadata?.email
  const rawProductId = data.product_id || data.metadata?.product_id || data.products?.[0]?.product_id
  const productId = DODO_PRODUCT_ID_MAP[rawProductId] || rawProductId
  const subscriptionId = data.subscription_id || data.id
  const userIdFromMeta = data.customer?.metadata?.user_id || data.metadata?.user_id
  
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

  const isProduction = process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode'

  let chutesData: { userId: string; apiKey: string; fingerprint: string } | null = null

  if (isProduction) {
    const chutesAccount = await createChutesAccount(userId, customerEmail)
    await createAndRedeemCode(chutesAccount.userId, tier)
    chutesData = chutesAccount
  } else {
    const chutesAccount = await createChutesAccount(userId, customerEmail)
    chutesData = chutesAccount
  }

  const expiresAt = data.expires_at || data.next_billing_date
  const nextBillingDate = data.next_billing_date

  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      subscription_id: subscriptionId,
      plan_tier: tier,
      chutes_user_id: chutesData?.userId,
      chutes_api_key: chutesData?.apiKey,
      chutes_fingerprint: chutesData?.fingerprint,
      status: 'active',
      expires_at: expiresAt,
      next_billing_date: nextBillingDate,
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
      
      case 'payment.failed':
      case 'subscription.failed':
        console.log('Payment failed:', eventData)
        break
      
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