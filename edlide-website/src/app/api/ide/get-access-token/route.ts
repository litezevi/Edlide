import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// API key validity period: 30 days
const API_KEY_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  return response
}

/**
 * Validates IDE API key and extends its expiry by 30 days.
 * 
 * Security model:
 * - API key (edlide_xxx) is the sole auth mechanism for IDE
 * - Stored in user_sessions with is_ide_device=true
 * - Independent of browser/Supabase sessions
 * - Each successful call extends api_key_expires_at by 30 days
 * - User must be active in auth.users (verified via admin API)
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      console.log('[Get Access Token] Missing API key')
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Only accept edlide_ prefixed keys
    if (!apiKey.startsWith('edlide_')) {
      console.log('[Get Access Token] Invalid API key format')
      return addCorsHeaders(NextResponse.json({ error: 'Invalid API key format' }, { status: 401 }))
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[Get Access Token] Looking up API key:', apiKey.substring(0, 20) + '...')

    // 1. Look up the API key in user_sessions
    const { data: sessionData, error: sessionError } = await adminSupabase
      .from('user_sessions')
      .select('user_id, user_email, api_key_expires_at, status')
      .eq('api_key', apiKey)
      .eq('is_ide_device', true)
      .eq('status', 'active')
      .single()

    if (sessionError || !sessionData) {
      console.log('[Get Access Token] Invalid or revoked API key')
      return addCorsHeaders(NextResponse.json({ error: 'Invalid API key' }, { status: 401 }))
    }

    // 2. Check if API key has expired
    if (sessionData.api_key_expires_at) {
      const expiresAt = new Date(sessionData.api_key_expires_at)
      if (expiresAt < new Date()) {
        console.log('[Get Access Token] API key expired on:', expiresAt.toISOString())
        return addCorsHeaders(NextResponse.json({
          error: 'API key expired',
          code: 'RECONNECT_REQUIRED',
          message: 'Please reconnect your IDE'
        }, { status: 401 }))
      }
    }

    // 3. Verify user still exists in auth.users (security check)
    const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(sessionData.user_id)
    if (userError || !userData?.user) {
      console.log('[Get Access Token] User no longer exists:', sessionData.user_id)
      // Revoke the session since user was deleted
      await adminSupabase.from('user_sessions').update({
        status: 'revoked',
        updated_at: new Date().toISOString()
      }).eq('api_key', apiKey)
      return addCorsHeaders(NextResponse.json({ error: 'User not found' }, { status: 401 }))
    }

    // 4. Extend api_key_expires_at by 30 more days from now (rolling window)
    const newExpiresAt = new Date(Date.now() + API_KEY_LIFETIME_MS).toISOString()

    await adminSupabase.from('user_sessions').update({
      api_key_expires_at: newExpiresAt,
      updated_at: new Date().toISOString()
    }).eq('api_key', apiKey)

    console.log('[Get Access Token] API key validated and extended for user:', sessionData.user_id)

    // 5. Return the SAME api_key as access_token (IDE must keep using edlide_xxx)
    return addCorsHeaders(NextResponse.json({
      success: true,
      tokens: {
        access_token: apiKey,
        refresh_token: apiKey,
        expires_at: newExpiresAt,
        user_id: sessionData.user_id,
        user_email: sessionData.user_email
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
