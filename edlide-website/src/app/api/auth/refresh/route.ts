import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = Buffer.from(parts[1], 'base64url').toString('utf8')
    const decoded = JSON.parse(payload)
    return decoded.sub || decoded.user_id || null
  } catch (e) {
    return null
  }
}

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const userId = request.nextUrl.searchParams.get('user_id')

    if (!authHeader && !userId) {
      console.log('[Auth Refresh] Missing Authorization header or user_id')
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

    let user_id: string

    if (userId) {
      user_id = userId
      console.log('[Auth Refresh] Using user_id from query param:', user_id)
    } else {
      const accessToken = authHeader!.substring(7)
      console.log('[Auth Refresh] Token received, extracting user_id...')

      const extractedUserId = extractUserIdFromToken(accessToken)

      if (extractedUserId) {
        user_id = extractedUserId
        console.log('[Auth Refresh] Extracted user_id from token:', user_id)
      } else {
        console.log('[Auth Refresh] Failed to extract user_id from token')
        return addCorsHeaders(NextResponse.json({ error: 'Invalid token format' }, { status: 401 }))
      }
    }

    console.log('[Auth Refresh] Processing refresh for user:', user_id)

    const { data: sessionData, error: sessionError } = await adminSupabase
      .from('user_sessions')
      .select('refresh_token, expires_at')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !sessionData) {
      console.log('[Auth Refresh] No active session found for user:', user_id)
      return addCorsHeaders(NextResponse.json({ error: 'No active session' }, { status: 404 }))
    }

    const expiresAt = new Date(sessionData.expires_at)
    const now = new Date()
    const isExpired = expiresAt <= now

    console.log('[Auth Refresh] Session expires at:', expiresAt.toISOString(), 'isExpired:', isExpired)

    console.log('[Auth Refresh] Refreshing tokens for user:', user_id)

    const refreshResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        refresh_token: sessionData.refresh_token
      })
    })

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text()
      console.log('[Auth Refresh] Supabase refresh failed:', refreshResponse.status, errorText)

      if (refreshResponse.status === 400 && errorText.includes('invalid_grant')) {
        await adminSupabase
          .from('user_sessions')
          .update({ status: 'revoked', updated_at: new Date().toISOString() })
          .eq('user_id', user_id)
          .eq('status', 'active')

        return addCorsHeaders(NextResponse.json({ error: 'Session expired, please reconnect', code: 'SESSION_REVOKED' }, { status: 401 }))
      }

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
      .eq('user_id', user_id)
      .eq('status', 'active')

    if (updateError) {
      console.error('[Auth Refresh] Failed to update session:', updateError)
    }

    console.log('[Auth Refresh] Tokens refreshed successfully for user:', user_id)

    return addCorsHeaders(NextResponse.json({
      success: true,
      tokens: {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: newExpiresAt,
        user_id: user_id
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