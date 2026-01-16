import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth Refresh] Missing or invalid Authorization header')
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const accessToken = authHeader.substring(7)
    console.log('[Auth Refresh] Token received, validating...')

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      console.log('[Auth Refresh] Invalid token:', userError?.message)
      return addCorsHeaders(NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }))
    }

    console.log('[Auth Refresh] User validated:', user.id)

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: sessionData, error: sessionError } = await adminSupabase
      .from('user_sessions')
      .select('refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !sessionData) {
      console.log('[Auth Refresh] No active session found for user:', user.id)
      return addCorsHeaders(NextResponse.json({ error: 'No active session' }, { status: 404 }))
    }

    const expiresAt = new Date(sessionData.expires_at)
    const now = new Date()
    const isExpired = expiresAt <= now

    if (isExpired) {
      console.log('[Auth Refresh] Session expired for user:', user.id)
      return addCorsHeaders(NextResponse.json({ error: 'Session expired', code: 'SESSION_EXPIRED' }, { status: 401 }))
    }

    console.log('[Auth Refresh] Refreshing tokens for user:', user.id)

    const refreshResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        refresh_token: sessionData.refresh_token
      })
    })

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text()
      console.log('[Auth Refresh] Supabase refresh failed:', refreshResponse.status, errorText)
      return addCorsHeaders(NextResponse.json({ error: 'Failed to refresh token' }, { status: 400 }))
    }

    const newTokens = await refreshResponse.json()

    const expiresIn = newTokens.expires_in || 3600
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    const { error: updateError } = await adminSupabase
      .from('user_sessions')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (updateError) {
      console.error('[Auth Refresh] Failed to update session:', updateError)
    }

    console.log('[Auth Refresh] Tokens refreshed successfully for user:', user.id)

    return addCorsHeaders(NextResponse.json({
      success: true,
      tokens: {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: newExpiresAt,
        user_id: user.id,
        user_email: user.email
      }
    }))

  } catch (error) {
    console.error('[Auth Refresh] Error:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ))
  }
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}