import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  return response
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      console.log('[Get Access Token] Missing API key')
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[Get Access Token] Looking up API key:', apiKey.substring(0, 20) + '...')

    const { data: sessionData, error: sessionError } = await adminSupabase
      .from('user_sessions')
      .select('user_id, user_email, access_token, refresh_token, expires_at, api_key_expires_at, status')
      .eq('api_key', apiKey)
      .eq('is_ide_device', true)
      .eq('status', 'active')
      .single()

    if (sessionError || !sessionData) {
      console.log('[Get Access Token] Invalid or expired API key')
      return addCorsHeaders(NextResponse.json({ error: 'Invalid API key' }, { status: 401 }))
    }

    if (sessionData.api_key_expires_at) {
      const expiresAt = new Date(sessionData.api_key_expires_at)
      if (expiresAt < new Date()) {
        console.log('[Get Access Token] API key expired')
        return addCorsHeaders(NextResponse.json({ error: 'API key expired' }, { status: 401 }))
      }
    }

    const userId = sessionData.user_id
    const userEmail = sessionData.user_email
    const storedAccessToken = sessionData.access_token
    const storedRefreshToken = sessionData.refresh_token
    const storedExpiresAt = sessionData.expires_at

    console.log('[Get Access Token] API key valid for user:', userId)

    const expiresAt = storedExpiresAt ? new Date(storedExpiresAt) : null
    const now = new Date()

    if (expiresAt && expiresAt > now) {
      console.log('[Get Access Token] Returning stored tokens (not expired)')

      return addCorsHeaders(NextResponse.json({
        success: true,
        tokens: {
          access_token: storedAccessToken,
          refresh_token: storedRefreshToken,
          expires_at: storedExpiresAt,
          user_id: userId,
          user_email: userEmail
        }
      }))
    }

    if (!storedRefreshToken) {
      console.log('[Get Access Token] No refresh token stored, need re-authentication')
      return addCorsHeaders(NextResponse.json({
        error: 'Session expired',
        code: 'RECONNECT_REQUIRED',
        message: 'Please reconnect your IDE'
      }, { status: 401 }))
    }

    console.log('[Get Access Token] Tokens expired, refreshing...')

    const refreshResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: storedRefreshToken })
    })

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text()
      console.error('[Get Access Token] Token refresh failed:', refreshResponse.status, errorText)

      if (refreshResponse.status === 400 && errorText.includes('invalid_grant')) {
        await adminSupabase.from('user_sessions').update({
          status: 'revoked'
        }).eq('api_key', apiKey)

        return addCorsHeaders(NextResponse.json({
          error: 'Session revoked',
          code: 'SESSION_REVOKED',
          message: 'Please reconnect your IDE'
        }, { status: 401 }))
      }

      return addCorsHeaders(NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 }))
    }

    const newTokens = await refreshResponse.json()
    const newExpiresAt = new Date(Date.now() + (newTokens.expires_in || 3600) * 1000).toISOString()

    console.log('[Get Access Token] Tokens refreshed successfully')

    await adminSupabase.from('user_sessions').update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString()
    }).eq('api_key', apiKey)

    return addCorsHeaders(NextResponse.json({
      success: true,
      tokens: {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: newExpiresAt,
        user_id: userId,
        user_email: userEmail
      }
    }))

  } catch (error) {
    console.error('[Get Access Token] Error:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ))
  }
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}