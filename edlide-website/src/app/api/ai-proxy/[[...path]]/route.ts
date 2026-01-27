import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ChutesAccountPoolManager } from '@/lib/chutes-pool-manager'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const apiKeyHeader = request.headers.get('X-API-Key')

    if (!authHeader && !apiKeyHeader) {
      return NextResponse.json(
        { error: 'Missing authentication' },
        { status: 401 }
      )
    }

    let user: any = null

    const authenticateViaApiKey = async (key: string) => {
      console.log('[AI Proxy] Authenticating via API key:', key.substring(0, 20) + '...')
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

      const { data: sessionData, error } = await adminSupabase
        .from('user_sessions')
        .select('user_id, user_email, status')
        .eq('api_key', key)
        .eq('is_ide_device', true)
        .eq('status', 'active')
        .maybeSingle()

      if (error || !sessionData) {
        console.error('[AI Proxy] Invalid API key:', error?.message)
        return null
      }

      const { data: userData } = await adminSupabase.auth.admin.getUserById(sessionData.user_id)
      if (!userData?.user) {
        console.error('[AI Proxy] User not found for API key')
        return null
      }

      console.log('[AI Proxy] User authenticated via API key:', {
        user_id: userData.user.id,
        email: userData.user.email
      })
      return userData.user
    }

    if (authHeader?.startsWith('Bearer edlide_')) {
      const apiKey = authHeader.substring(7)
      user = await authenticateViaApiKey(apiKey)
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired token. Please connect to your Edlide account.' },
          { status: 401 }
        )
      }
    } else if (apiKeyHeader) {
      user = await authenticateViaApiKey(apiKeyHeader)
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired token. Please connect to your Edlide account.' },
          { status: 401 }
        )
      }
    } else if (authHeader?.startsWith('Bearer ')) {
      const userToken = authHeader.substring(7)
      const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { user: jwtUser }, error: userError } = await supabase.auth.getUser(userToken)

      if (userError || !jwtUser) {
        console.error('[AI Proxy] Invalid JWT token:', userError?.message)
        return NextResponse.json(
          { error: 'Invalid or expired token. Please connect to your Edlide account.' },
          { status: 401 }
        )
      }

      user = jwtUser
      console.log('[AI Proxy] User authenticated via JWT:', {
        user_id: user.id,
        email: user.email
      })
    } else {
      return NextResponse.json(
        { error: 'Missing or invalid authentication' },
        { status: 401 }
      )
    }

    console.log('[AI Proxy] Getting available account from pool...')
    const poolResult = await ChutesAccountPoolManager.getAvailableAccount()

    if (!poolResult.success || !poolResult.account || !poolResult.accessToken) {
      console.error('[AI Proxy] No available accounts in pool:', poolResult.error)
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const { accessToken: freshAccessToken, account: poolAccount } = {
      accessToken: poolResult.accessToken!,
      account: poolResult.account! as { id: string; account_name: string }
    }
    console.log(`[AI Proxy] Using pool account: ${poolAccount.account_name} (${poolAccount.id})`)

    const requestBody = await request.json()

    console.log('[AI Proxy] AI request from user:', {
      user_id: user.id,
      model: requestBody.model,
      provider: 'edlide-pool',
      poolAccount: poolAccount.account_name
    })

    const supabaseFunctionUrl = `${supabaseUrl}/functions/v1/ai-proxy`

    const response = await fetch(supabaseFunctionUrl, {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'x-user-id': String(user.id),
        'x-user-email': String(user.email),
        'x-request-source': 'ide',
        'x-edlide-client': 'electron',
        'x-chutes-access-token': freshAccessToken,
        'x-pool-account-id': poolAccount.id,
      }),
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Proxy] Supabase function error:', {
        status: response.status,
        error: errorText,
        user_id: user.id,
        poolAccount: poolAccount.account_name
      })

      return NextResponse.json(
        { error: 'AI service error. Please try again later.' },
        { status: response.status }
      )
    }

    await ChutesAccountPoolManager.recordUsage(poolAccount.id)
    console.log(`[AI Proxy] Recorded usage for account: ${poolAccount.account_name}`)

    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', 'application/json')
    responseHeaders.set('x-edlide-proxy', 'v1-pool')

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('[AI Proxy] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}