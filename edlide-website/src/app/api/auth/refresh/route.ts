import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as jose from 'jose'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let jwksCache: jose.JWTVerifyGetKey | null = null

async function getJwks() {
  if (jwksCache) return jwksCache

  const jwks = jose.createRemoteJWKSet(
    new URL(`${supabaseUrl}/auth/v1/jwks`)
  )
  jwksCache = jwks
  return jwks
}

async function verifyAndExtractUserId(token: string): Promise<string | null> {
  try {
    const jwks = await getJwks()

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: supabaseAnonKey
    })

    return (payload.sub as string) || (payload.user_id as string) || null
  } catch (error) {
    console.error('[Auth Refresh] JWT verification failed:', error)
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
      console.log('[Auth Refresh] Token received, verifying JWT...')

      const extractedUserId = await verifyAndExtractUserId(accessToken)

      if (extractedUserId) {
        user_id = extractedUserId
        console.log('[Auth Refresh] JWT verified, user_id:', user_id)
      } else {
        console.log('[Auth Refresh] JWT verification failed')
        return addCorsHeaders(NextResponse.json({ error: 'Invalid token', code: 'INVALID_TOKEN' }, { status: 401 }))
      }
    }

    console.log('[Auth Refresh] Processing refresh for user:', user_id)

    const { data: sessionData, error: sessionError } = await adminSupabase
      .from('user_sessions')
      .select('status, user_email')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !sessionData) {
      console.log('[Auth Refresh] No active session found for user:', user_id)
      return addCorsHeaders(NextResponse.json({ error: 'No active session', code: 'SESSION_NOT_FOUND' }, { status: 404 }))
    }

    console.log('[Auth Refresh] Active session found, refreshing via Admin API...')

    const refreshResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}/refresh_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text()
      console.log('[Auth Refresh] Admin API refresh failed:', refreshResponse.status, errorText)

      if (refreshResponse.status === 400 || refreshResponse.status === 404) {
        console.log('[Auth Refresh] User not found or invalid, revoking session...')
        await adminSupabase
          .from('user_sessions')
          .update({ status: 'revoked', updated_at: new Date().toISOString() })
          .eq('user_id', user_id)
          .eq('status', 'active')

        return addCorsHeaders(NextResponse.json({ error: 'User not found or session expired', code: 'USER_NOT_FOUND' }, { status: 401 }))
      }

      return addCorsHeaders(NextResponse.json({ error: 'Failed to refresh token' }, { status: 400 }))
    }

    const newTokens = await refreshResponse.json()

    const expiresIn = newTokens.expires_in || 3600
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    console.log('[Auth Refresh] Tokens refreshed successfully via Admin API for user:', user_id)

    return addCorsHeaders(NextResponse.json({
      success: true,
      tokens: {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: newExpiresAt,
        user_id: user_id,
        user_email: sessionData?.user_email || null
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