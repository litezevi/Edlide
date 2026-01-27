import { NextResponse } from 'next/server'
import { ChutesAccountPoolManager } from '@/lib/chutes-pool-manager'

export async function GET() {
  try {
    const result = await ChutesAccountPoolManager.getPoolStats()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get stats' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stats: result.stats })
  } catch (error) {
    console.error('[Admin Pool Stats] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}