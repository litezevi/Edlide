import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Supabase access token required' },
        { status: 401 }
      )
    }

    const supabaseToken = authHeader.substring(7)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(supabaseToken)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .select('chutes_api_key, plan_tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subError || !subscription?.chutes_api_key) {
      return NextResponse.json(
        { error: 'No active subscription. Please subscribe to use AI chat.' },
        { status: 403 }
      )
    }

    const chutesApiKey = subscription.chutes_api_key
    const requestBody = await request.json()

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'x-user-id': user.id,
        'x-user-email': user.email!,
        'x-edlide-client': 'electron',
        'x-chutes-api-key': chutesApiKey
      },
      body: JSON.stringify(requestBody)
    })

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}