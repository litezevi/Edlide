import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ChutesTokenManager } from '@/lib/chutes-token-manager'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

    const tokensInfo = await ChutesTokenManager.getTokensInfo(user.id)

    if (!tokensInfo) {
      return NextResponse.json({ linked: false }, { status: 200 })
    }

    const { expiresAt, isExpired, isExpiringSoon } = tokensInfo
    const REFRESH_THRESHOLD_MS = 5 * 60 * 1000

    console.log(`[Chutes Refresh] Token status for user ${user.id}: expired=${isExpired}, expiringSoon=${isExpiringSoon}`)

    if (!isExpired && !isExpiringSoon) {
      return NextResponse.json({
        linked: true,
        refreshed: false,
        expiresAt,
        message: 'Token is valid, no refresh needed'
      })
    }

    console.log(`[Chutes Refresh] Token expiring soon or expired, refreshing for user: ${user.id}`)

    const refreshSuccess = await ChutesTokenManager.refreshIfNeeded(user.id)

    if (!refreshSuccess) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 })
    }

    const newTokensInfo = await ChutesTokenManager.getTokensInfo(user.id)

    return NextResponse.json({
      linked: true,
      refreshed: true,
      expiresAt: newTokensInfo?.expiresAt || null,
      message: 'Token refreshed successfully'
    })

  } catch (error) {
    console.error('[Chutes Refresh] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}