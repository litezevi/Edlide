import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode',
})

const PRODUCT_IDS: Record<string, string> = {
  'prod_starter_monthly': process.env.EDLIDE_STARTER_PLAN_PRODUCT_ID!,
  'prod_pro_monthly': process.env.EDLIDE_PRO_PLAN_PRODUCT_ID!,
  'prod_ultra_monthly': process.env.EDLIDE_ULTRA_PLAN_PRODUCT_ID!,
}

export async function POST(req: NextRequest) {
  try {
    const { productId, userId, userEmail } = await req.json()

    if (!productId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const resolvedProductId = PRODUCT_IDS[productId]
    if (!resolvedProductId) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    const session = await dodoClient.checkoutSessions.create({
      product_cart: [{ product_id: resolvedProductId, quantity: 1 }],
      customer: {
        email: userEmail,
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?subscription=success`,
      metadata: {
        user_id: userId,
        product_id: productId,
      },
    })

    return NextResponse.json({
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
