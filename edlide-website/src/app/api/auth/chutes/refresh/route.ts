import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TokenEncryption } from '@/lib/token-encryption'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const clientId = process.env.NEXT_PUBLIC_CHUTES_CLIENT_ID!
const clientSecret = process.env.CHUTES_CLIENT_SECRET!

async function refreshChutesToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; refresh_token?: string }> {
  const response = await fetch('https://idp.chutes.ai/idp/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Token refresh failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseToken = authHeader.substring(7)

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(supabaseToken)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { data: chutesData, error: chutesError } = await supabase
      .from('chutes_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (chutesError || !chutesData) {
      return NextResponse.json({ linked: false }, { status: 200 })
    }

    const expiresAt = chutesData.expires_at ? new Date(chutesData.expires_at) : null
    const now = new Date()
    const REFRESH_BEFORE_EXPIRE_MS = 10 * 60 * 1000 // 10 minutes

    const isTokenExpiringSoon = expiresAt && (expiresAt.getTime() - now.getTime()) < REFRESH_BEFORE_EXPIRE_MS

    if (!isTokenExpiringSoon || !chutesData.encrypted_refresh_token) {
      return NextResponse.json({
        linked: true,
        refreshed: false,
        expiresAt: chutesData.expires_at
      })
    }

    console.log('[Chutes Refresh] Proactively refreshing token for user:', user.id)

    const decryptedRefreshToken = TokenEncryption.decrypt(
      chutesData.encrypted_refresh_token,
      chutesData.encryption_iv || ''
    )

    if (!decryptedRefreshToken) {
      return NextResponse.json({ error: 'Failed to decrypt refresh token' }, { status: 500 })
    }

    const newTokens = await refreshChutesToken(decryptedRefreshToken)

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

    const { encrypted: newEncryptedAccess } = TokenEncryption.encrypt(newTokens.access_token)
    const { encrypted: newEncryptedRefresh } = TokenEncryption.encrypt(newTokens.refresh_token || decryptedRefreshToken)

    const { error: updateError } = await adminSupabase
      .from('chutes_tokens')
      .update({
        encrypted_access_token: newEncryptedAccess,
        encrypted_refresh_token: newEncryptedRefresh,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[Chutes Refresh] Failed to update token:', updateError)
      return NextResponse.json({ error: 'Failed to update token' }, { status: 500 })
    }

    console.log('[Chutes Refresh] Token refreshed successfully for user:', user.id)

    return NextResponse.json({
      linked: true,
      refreshed: true,
      expiresAt: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
    })

  } catch (error) {
    console.error('[Chutes Refresh] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}