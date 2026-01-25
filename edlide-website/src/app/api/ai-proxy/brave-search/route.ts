import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const braveApiKey = process.env.BRAVE_SEARCH_API_KEY!

const authenticateViaApiKey = async (key: string) => {
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: sessionData, error } = await adminSupabase
    .from('user_sessions')
    .select('user_id, user_email, status')
    .eq('api_key', key)
    .eq('is_ide_device', true)
    .eq('status', 'active')
    .maybeSingle()

  if (error || !sessionData) {
    return null
  }

  const { data: userData } = await adminSupabase.auth.admin.getUserById(sessionData.user_id)
  return userData?.user || null
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const apiKeyHeader = request.headers.get('X-API-Key')

    if (!authHeader && !apiKeyHeader) {
      const res = NextResponse.json({ error: 'Missing authentication' }, { status: 401 })
      res.headers.set('Access-Control-Allow-Origin', '*')
      return res
    }

    let user = null

    if (authHeader?.startsWith('Bearer edlide_')) {
      const apiKey = authHeader.substring(7)
      user = await authenticateViaApiKey(apiKey)
    } else if (apiKeyHeader) {
      user = await authenticateViaApiKey(apiKeyHeader)
    } else if (authHeader?.startsWith('Bearer ')) {
      const userToken = authHeader.substring(7)
      const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { user: jwtUser } } = await supabase.auth.getUser(userToken)
      user = jwtUser
    }

    if (!user) {
      const res = NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
      res.headers.set('Access-Control-Allow-Origin', '*')
      return res
    }

    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      const res = NextResponse.json({ error: 'Missing query' }, { status: 400 })
      res.headers.set('Access-Control-Allow-Origin', '*')
      return res
    }

    console.log('[Brave Search] User:', user.id, 'Query:', query)
    console.log('[Brave Search] API key present:', !!braveApiKey, 'length:', braveApiKey?.length)

    const braveResponse = await fetch('https://api.search.brave.com/res/v1/web/search?q=' + encodeURIComponent(query), {
      headers: {
        'X-Subscription-Token': braveApiKey,
        'Accept': 'application/json',
      }
    })

    console.log('[Brave Search] Brave API response status:', braveResponse.status)

    if (!braveResponse.ok) {
      const error = await braveResponse.text()
      console.error('[Brave Search] API error:', error)
      const res = NextResponse.json({ error: 'Search service error' }, { status: 502 })
      res.headers.set('Access-Control-Allow-Origin', '*')
      return res
    }

    const data = await braveResponse.json()

    const results = (data.web?.results || []).slice(0, 5).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || ''
    }))

    const res = NextResponse.json({ results })
    res.headers.set('Access-Control-Allow-Origin', '*')
    return res

  } catch (error) {
    console.error('[Brave Search] Unexpected error:', error)
    const res = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    res.headers.set('Access-Control-Allow-Origin', '*')
    return res
  }
}