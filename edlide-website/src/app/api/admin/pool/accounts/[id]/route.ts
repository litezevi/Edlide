import { NextRequest, NextResponse } from 'next/server'
import { ChutesAccountPoolManager } from '@/lib/chutes-pool-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await ChutesAccountPoolManager.getAccountById(id)

    if (!result.success || !result.account) {
      return NextResponse.json(
        { error: result.error || 'Account not found' },
        { status: 404 }
      )
    }

    const acc = result.account
    return NextResponse.json({
      account: {
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
      }
    })
  } catch (error) {
    console.error('[Admin Pool Account] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await ChutesAccountPoolManager.removeAccount(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to remove account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Pool Account] DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid isActive field' },
        { status: 400 }
      )
    }

    const result = await ChutesAccountPoolManager.setAccountActive(id, isActive)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Pool Account] PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}