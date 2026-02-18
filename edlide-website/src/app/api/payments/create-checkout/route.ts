import { NextRequest, NextResponse } from 'next/server'

const DODO_API_URL = process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' 
  ? 'https://dodopayments.com' 
  : 'https://test.dodopayments.com'

const PRODUCT_IDS: Record<string, string> = {
  'prod_starter_monthly': 'pdt_0NX7tjKSxW7Dn1oGBdMbE',
  'prod_pro_monthly': 'pdt_0NX7uDmO6LQ1tZPva4I5A',
  'prod_ultra_monthly': 'pdt_0NX7uQKJc1elOk1df38G7',
}

export async function POST(req: NextRequest) {
  try {
    const { productId, dodoProductId, userId, userEmail } = await req.json()

    if (!dodoProductId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const response = await fetch(`${DODO_API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: dodoProductId, quantity: 1 }],
        customer: {
          email: userEmail,
          metadata: {
            user_id: userId,
          },
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?subscription=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
        metadata: {
          user_id: userId,
          product_id: productId,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Dodo Payments error:', error)
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    const session = await response.json()

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