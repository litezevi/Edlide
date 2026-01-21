import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  return response
}

function generateApiKey(): string {
  return `edlide_${randomBytes(32).toString('hex')}`
}

const pendingRequests = new Map<string, Promise<any>>()

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const userId = request.nextUrl.searchParams.get('user_id')

    if (!authHeader && !userId) {
      console.log('[Create API Key] Missing Authorization header or user_id')
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

    let user_id: string
    let user_email: string | null = null

    if (userId) {
      user_id = userId
      console.log('[Create API Key] Using user_id from query param:', user_id)
    } else {
      const accessToken = authHeader!.substring(7)

      const { data: { user }, error: userError } = await adminSupabase.auth.getUser(accessToken)

      if (userError || !user) {
        console.log('[Create API Key] Invalid access token:', userError?.message)
        return addCorsHeaders(NextResponse.json({ error: 'Invalid token' }, { status: 401 }))
      }

      user_id = user.id
      user_email = user.email || null
      console.log('[Create API Key] User verified:', user_id)
    }

    if (pendingRequests.has(user_id)) {
      console.log('[Create API Key] Waiting for existing request for user:', user_id)
      const result = await pendingRequests.get(user_id)!
      return addCorsHeaders(NextResponse.json(result))
    }

    const createKeyPromise = (async () => {
      console.log('[Create API Key] Creating API key for user:', user_id)

      const apiKey = generateApiKey()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      console.log('[Create API Key] Generated API key:', apiKey.substring(0, 30) + '...')

      console.log('[Create API Key] Upserting to user_sessions...')
      const { error: upsertError } = await adminSupabase
        .from('user_sessions')
        .upsert({
          user_id: user_id,
          user_email: user_email,
          api_key: apiKey,
          api_key_expires_at: expiresAt,
          status: 'active',
          is_ide_device: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('[Create API Key] Failed to save API key:', upsertError)
        throw new Error('Failed to create API key')
      }

      console.log('[Create API Key] API key saved successfully')

      return {
        success: true,
        api_key: apiKey,
        expires_at: expiresAt,
        user_id: user_id,
        user_email: user_email
      }
    })()

    pendingRequests.set(user_id, createKeyPromise)

    try {
      const result = await createKeyPromise
      pendingRequests.delete(user_id)
      return addCorsHeaders(NextResponse.json(result))
    } catch (error: any) {
      pendingRequests.delete(user_id)
      console.error('[Create API Key] Error:', error)
      return addCorsHeaders(NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      ))
    }

  } catch (error: any) {
    console.error('[Create API Key] Error:', error)
    return addCorsHeaders(NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    ))
  }
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}