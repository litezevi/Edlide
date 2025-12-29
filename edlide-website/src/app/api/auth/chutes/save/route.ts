import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TokenEncryption } from '@/lib/token-encryption'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, chutesUserId, username, expiresIn } = await request.json()

    if (!accessToken || !chutesUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: accessToken or chutesUserId' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    console.log('=== CHUTES TOKEN ENCRYPTION ===')
    console.log('Encrypting tokens before saving to database...')

    const { encrypted: encryptedAccess, iv: commonIv } = TokenEncryption.encrypt(accessToken)
    const { encrypted: encryptedRefresh } = TokenEncryption.encrypt(refreshToken || '', Buffer.from(commonIv, 'base64'))

    console.log('Encryption successful:')
    console.log('- Encrypted access token length:', encryptedAccess.length)
    console.log('- Encryption IV length:', commonIv.length)
    console.log('- Encrypted refresh token exists:', encryptedRefresh.length > 0)

    const { data, error } = await supabase
      .from('chutes_tokens')
      .upsert(
        {
          user_id: user.id,
          chutes_user_id: chutesUserId,
          encrypted_access_token: encryptedAccess,
          encrypted_refresh_token: encryptedRefresh,
          encryption_iv: commonIv,
          expires_at: expiresAt?.toISOString() || null,
          username: username || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error saving chutes token:', error)
      return NextResponse.json(
        { error: 'Failed to save chutes token' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Save chutes token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}