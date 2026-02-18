import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // 1. Получаем токен из Authorization header
    const authHeader = request.headers.get('Authorization')
    const apiKeyHeader = request.headers.get('X-API-Key')

    if (!authHeader && !apiKeyHeader) {
      return NextResponse.json(
        { error: 'Missing authentication' },
        { status: 401 }
      )
    }

    let user: any = null

    // Helper function to authenticate via API key
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

      if (error) {
        console.error('[AI Proxy] Invalid API key:', error.message, 'code:', error.code)
        return null
      }

      if (!sessionData) {
        console.error('[AI Proxy] API key not found in database')
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

    // 2. Проверяем API key или JWT токен
    console.log('[AI Proxy] Auth check:', {
      authHeader: authHeader?.substring(0, 30) + '...',
      apiKeyHeader: apiKeyHeader?.substring(0, 30) + '...'
    })

    if (authHeader?.startsWith('Bearer edlide_')) {
      // Authorization: Bearer edlide_xxx... -> API key
      const apiKey = authHeader.substring(7)
      user = await authenticateViaApiKey(apiKey)
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired token. Please connect to your Edlide account.' },
          { status: 401 }
        )
      }
    } else if (apiKeyHeader) {
      // X-API-Key: edlide_xxx... -> API key
      user = await authenticateViaApiKey(apiKeyHeader)
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired token. Please connect to your Edlide account.' },
          { status: 401 }
        )
      }
    } else if (authHeader?.startsWith('Bearer ')) {
      // Authorization: Bearer jwt_xxx... -> JWT токен
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

    // 3. Получаем Chutes API ключ из подписки пользователя
    console.log('[AI Proxy] Getting Chutes API key from subscription...')
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .select('chutes_api_key, plan_tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subError || !subscription?.chutes_api_key) {
      console.error('[AI Proxy] No active subscription or Chutes API key for user:', user.id)
      return NextResponse.json(
        { error: 'No active subscription. Please subscribe to use AI features.' },
        { status: 403 }
      )
    }

    const chutesApiKey = subscription.chutes_api_key
    const planTier = subscription.plan_tier
    console.log(`[AI Proxy] Using Chutes API key for plan: ${planTier}`)

    // 4. Получаем тело запроса от IDE (OpenAI-compatible формат)
    const requestBody = await request.json()

    // 5. Логирование запроса
    console.log('[AI Proxy] AI request from user:', {
      user_id: user.id,
      model: requestBody.model,
      provider: 'edlide',
      plan: planTier
    })

    // 6. Проксируем в Supabase Edge Function с Chutes API ключом
    const supabaseFunctionUrl = `${supabaseUrl}/functions/v1/ai-proxy`

    const response = await fetch(supabaseFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'x-user-id': user.id,
        'x-user-email': user.email!,
        'x-request-source': 'ide',
        'x-edlide-client': 'electron',
        'x-chutes-api-key': chutesApiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Proxy] Supabase function error:', {
        status: response.status,
        error: errorText,
        user_id: user.id
      })
      
      return NextResponse.json(
        { error: 'AI service error. Please try again later.' },
        { status: response.status }
      )
    }

    // 6. Возвращаем потоковый ответ от Supabase
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', 'application/json')
    responseHeaders.set('x-edlide-proxy', 'v1')

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