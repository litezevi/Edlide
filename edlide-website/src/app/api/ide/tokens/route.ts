import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/ide/tokens?state={state_id}
// Returns pending tokens if ready, 404 if not ready yet
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const stateId = searchParams.get('state')

    if (!stateId) {
      const response = NextResponse.json({ error: 'Missing state parameter' }, { status: 400 })
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    console.log('[API GET] Checking tokens for state:', stateId)

    // Clean up expired tokens first
    await supabase
      .from('ide_pending_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())

    // Try to get pending tokens for this state_id
    const { data: pendingToken, error } = await supabase
      .from('ide_pending_tokens')
      .select('*')
      .eq('state_id', stateId)
      .single()

    if (error || !pendingToken) {
      console.log('[API GET] No tokens found for state:', stateId)
      // No tokens ready yet
      const response = NextResponse.json({ ready: false }, { status: 404 })
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    console.log('[API GET] Tokens found for state:', stateId, {
      user_email: pendingToken.user_email
    })

    // Extract sensitive data (don't return internal fields)
    const tokens = {
      access_token: pendingToken.access_token,
      refresh_token: pendingToken.refresh_token,
      expires_at: pendingToken.expires_at,
      user_id: pendingToken.user_id,
      user_email: pendingToken.user_email
    }

    // Delete the pending token after successful retrieval (one-time use)
    await supabase
      .from('ide_pending_tokens')
      .delete()
      .eq('state_id', stateId)

    console.log('[API GET] Tokens deleted and returned for state:', stateId)

    const response = NextResponse.json({
      ready: true,
      tokens,
      success: true
    })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response

  } catch (err) {
    console.error('[API GET] Error checking for IDE tokens:', err)
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}