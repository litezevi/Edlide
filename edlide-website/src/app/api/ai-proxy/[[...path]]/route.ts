import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // 1. Получаем пользовательский JWT токен из Authorization header
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }

    const userToken = authHeader.substring(7)
    
    // 2. Валидируем JWT токен через Supabase
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: userError } = await supabase.auth.getUser(userToken)

    if (userError || !user) {
      console.error('[AI Proxy] Invalid user token:', userError?.message)
      return NextResponse.json(
        { error: 'Invalid or expired token. Please connect to your Edlide account.' },
        { status: 401 }
      )
    }

    console.log('[AI Proxy] User authenticated:', {
      user_id: user.id,
      email: user.email
    })

    // 3. Получаем тело запроса от IDE (OpenAI-compatible формат)
    const requestBody = await request.json()
    
    // 4. Логирование запроса (опционально)
    console.log('[AI Proxy] AI request from user:', {
      user_id: user.id,
      model: requestBody.model,
      provider: 'edlide'
    })

    // 5. Проксируем в Supabase Edge Function с СПЕЦИАЛЬНЫМИ HEADERS
    const supabaseFunctionUrl = `${supabaseUrl}/functions/v1/ai-proxy`
    
    const response = await fetch(supabaseFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'x-user-id': user.id,
        'x-user-email': user.email!,
        'x-request-source': 'ide',
        'x-edlide-client': 'electron'
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