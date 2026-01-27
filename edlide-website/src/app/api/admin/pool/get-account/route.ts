import { NextResponse } from 'next/server'
import { ChutesAccountPoolManager } from '@/lib/chutes-pool-manager'

export async function POST() {
  try {
    const result = await ChutesAccountPoolManager.getAvailableAccount()

    if (!result.success || !result.account) {
      return NextResponse.json(
        { error: result.error || 'No available accounts' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      accountId: result.account.id,
      accessToken: result.accessToken,
      accountName: result.account.account_name,
    })
  } catch (error) {
    console.error('[Pool Get Account] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}