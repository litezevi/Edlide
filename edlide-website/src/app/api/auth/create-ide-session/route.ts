import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
      console.log('[Create IDE Session] Missing Authorization header or user_id')
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

    let user_id: string
    let user_email: string | null = null

    if (userId) {
      user_id = userId
      console.log('[Create IDE Session] Using user_id from query param:', user_id)
    } else {
      const accessToken = authHeader!.substring(7)

      const { data: { user }, error: userError } = await adminSupabase.auth.getUser(accessToken)

      if (userError || !user) {
        console.log('[Create IDE Session] Invalid access token:', userError?.message)
        return addCorsHeaders(NextResponse.json({ error: 'Invalid token' }, { status: 401 }))
      }

      user_id = user.id
      user_email = user.email || null
      console.log('[Create IDE Session] User verified:', user_id)
    }

    console.log('[Create IDE Session] Creating IDE session for user:', user_id)

    // Create refresh token via Admin API (generates independent token)
    const refreshResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}/refresh_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text()
      console.error('[Create IDE Session] Admin API failed:', refreshResponse.status, errorText)
      return addCorsHeaders(NextResponse.json({ error: 'Failed to create IDE tokens' }, { status: 500 }))
    }

    const newTokens = await refreshResponse.json()
    const expiresIn = newTokens.expires_in || 3600
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    console.log('[Create IDE Session] IDE tokens generated via Admin API')

    // Save to user_sessions with is_ide_device flag
    const { error: sessionError } = await adminSupabase
      .from('user_sessions')
      .upsert({
        user_id: user_id,
        user_email: user_email,
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: expiresAt,
        status: 'active',
        is_ide_device: true
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (sessionError) {
      console.error('[Create IDE Session] Failed to save session:', sessionError)
    } else {
      console.log('[Create IDE Session] IDE session saved to user_sessions')
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      tokens: {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: expiresAt,
        user_id: user_id,
        user_email: user_email
      }
    }))

  } catch (error) {
    console.error('[Create IDE Session] Error:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ))
  }
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}