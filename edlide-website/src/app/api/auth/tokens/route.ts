import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for tokens by state_id
const tokenStore = new Map<string, {
  tokens: any
  user: any
  chutes: any
  timestamp: number
}>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { state, tokens, user, chutes, timestamp } = body

    if (!state) {
      return NextResponse.json(
        { error: 'State parameter is required' },
        { status: 400 }
      )
    }

    // Store tokens in memory
    tokenStore.set(state, {
      tokens,
      user,
      chutes,
      timestamp: timestamp || Date.now()
    })

    console.log('Tokens stored for state:', state)

    return NextResponse.json({
      success: true,
      message: 'Tokens stored successfully'
    })
  } catch (error) {
    console.error('Error storing tokens:', error)
    return NextResponse.json(
      { error: 'Failed to store tokens' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    if (!state) {
      return NextResponse.json(
        { error: 'State parameter is required' },
        { status: 400 }
      )
    }

    const tokenData = tokenStore.get(state)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'No tokens found for this state' },
        { status: 404 }
      )
    }

    console.log('Tokens retrieved for state:', state)

    // Remove tokens after retrieval (one-time use)
    tokenStore.delete(state)

    return NextResponse.json(tokenData)
  } catch (error) {
    console.error('Error retrieving tokens:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve tokens' },
      { status: 500 }
    )
  }
}