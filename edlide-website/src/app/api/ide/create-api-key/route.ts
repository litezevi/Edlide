import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  return response
}

function generateApiKey(): string {
  return `edlide_${randomBytes(32).toString('hex')}`
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const userId = request.nextUrl.searchParams.get('user_id')

    if (!authHeader && !userId) {
      console.log('[Create API Key] Missing Authorization header or user_id')
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

    let user_id: string
    let user_email: string | null = null

    if (userId) {
      user_id = userId
      console.log('[Create API Key] Using user_id from query param:', user_id)
    } else {
      const accessToken = authHeader!.substring(7)

      const { data: { user }, error: userError } = await adminSupabase.auth.getUser(accessToken)

      if (userError || !user) {
        console.log('[Create API Key] Invalid access token:', userError?.message)
        return addCorsHeaders(NextResponse.json({ error: 'Invalid token' }, { status: 401 }))
      }

      user_id = user.id
      user_email = user.email || null
      console.log('[Create API Key] User verified:', user_id)
    }

    console.log('[Create API Key] Creating API key for user:', user_id)

    const apiKey = generateApiKey()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error: selectError } = await adminSupabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', user_id)
      .eq('is_ide_device', true)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[Create API Key] Failed to check existing session:', selectError)
      return addCorsHeaders(NextResponse.json({ error: 'Database error' }, { status: 500 }))
    }

    const sessionData = {
      user_id: user_id,
      user_email: user_email,
      api_key: apiKey,
      api_key_expires_at: expiresAt,
      status: 'active' as const,
      is_ide_device: true,
      updated_at: new Date().toISOString()
    }

    let keyError
    if (selectError && selectError.code === 'PGRST116') {
      console.log('[Create API Key] No existing session, inserting new...')
      const { error } = await adminSupabase.from('user_sessions').insert(sessionData)
      keyError = error
    } else {
      console.log('[Create API Key] Updating existing session...')
      const { error } = await adminSupabase
        .from('user_sessions')
        .update(sessionData)
        .eq('user_id', user_id)
        .eq('is_ide_device', true)
      keyError = error
    }

    if (keyError) {
      console.error('[Create API Key] Failed to save API key:', keyError)
      return addCorsHeaders(NextResponse.json({ error: 'Failed to create API key' }, { status: 500 }))
    }

    console.log('[Create API Key] API key created successfully')

    return addCorsHeaders(NextResponse.json({
      success: true,
      api_key: apiKey,
      expires_at: expiresAt,
      user_id: user_id,
      user_email: user_email
    }))

  } catch (error) {
    console.error('[Create API Key] Error:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ))
  }
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}