import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ChutesAccountPoolManager } from '@/lib/chutes-pool-manager'
import { TokenEncryption } from '@/lib/token-encryption'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function isAdminRequest(request: NextRequest): boolean {
  return true
}

export async function GET(request: NextRequest) {
  try {
    const result = await ChutesAccountPoolManager.getAllAccounts()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get accounts' },
        { status: 500 }
      )
    }

    const accounts = result.accounts?.map(acc => ({
      id: acc.id,
      accountName: acc.account_name,
      accessKey: acc.access_key,
      expiresAt: acc.expires_at,
      dailyLimit: acc.daily_limit,
      rpmLimit: acc.rpm_limit,
      usedToday: acc.used_today,
      requestsPerMinute: acc.requests_per_minute,
      lastRequestAt: acc.last_request_at,
      isActive: acc.is_active,
      createdAt: acc.created_at,
    }))

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('[Admin Pool] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { accountName, accessKey, accessToken, refreshToken, expiresIn } = body

    if (!accountName || !accessKey || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: accountName, accessKey, accessToken' },
        { status: 400 }
      )
    }

    const result = await ChutesAccountPoolManager.addAccount({
      accountName,
      accessKey,
      accessToken,
      refreshToken,
      expiresIn,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to add account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      accountId: result.accountId,
    })
  } catch (error) {
    console.error('[Admin Pool] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}