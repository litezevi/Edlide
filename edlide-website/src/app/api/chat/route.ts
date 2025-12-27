import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TokenEncryption } from '@/lib/token-encryption'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const clientId = process.env.NEXT_PUBLIC_CHUTES_CLIENT_ID!
const clientSecret = process.env.CHUTES_CLIENT_SECRET!

async function refreshChutesToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; refresh_token?: string }> {
  const response = await fetch('https://idp.chutes.ai/idp/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Token refresh failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    
    console.log('=== CHAT API DEBUG ===')
    console.log('Auth header:', authHeader ? 'exists' : 'missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header or invalid format')
      return NextResponse.json(
        { error: 'Supabase access token required' },
        { status: 401 }
      )
    }

    const supabaseToken = authHeader.substring(7)
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(supabaseToken)

    if (userError || !user) {
      console.log('Invalid or expired Supabase token:', userError?.message)
      return NextResponse.json(
        { error: 'Invalid Supabase session' },
        { status: 401 }
      )
    }

    console.log('Supabase user authenticated:', user.id)

    const { data: chutesData, error: chutesError } = await supabase
      .from('chutes_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (chutesError || !chutesData) {
      console.log('No Chutes token found for user:', user.id)
      return NextResponse.json(
        { error: 'Chutes account not linked. Please link your Chutes account first.' },
        { status: 403 }
      )
    }

    console.log('=== CHUTES TOKEN DECRYPTION ===')
    console.log('Decrypting token from database...')
    console.log('- Has encrypted token:', !!chutesData.encrypted_access_token)
    console.log('- Has encryption IV:', !!chutesData.encryption_iv)

    let accessToken = TokenEncryption.decrypt(chutesData.encrypted_access_token, chutesData.encryption_iv || '')
    
    console.log('- Decryption successful, token length:', accessToken.length)

    const isTokenExpired = chutesData.expires_at && new Date(chutesData.expires_at) < new Date()

    if (isTokenExpired && chutesData.encrypted_refresh_token) {
      console.log('Token expired, refreshing...')

      const decryptedRefreshToken = TokenEncryption.decrypt(chutesData.encrypted_refresh_token, chutesData.encryption_iv || '')
      
      if (!decryptedRefreshToken) {
        console.error('Failed to decrypt refresh token')
        return NextResponse.json(
          { error: 'Failed to refresh token. Please re-link your Chutes account.' },
          { status: 401 }
        )
      }

      try {
        const newTokens = await refreshChutesToken(decryptedRefreshToken)

        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

        const { encrypted: newEncryptedAccess } = TokenEncryption.encrypt(newTokens.access_token)
        const { encrypted: newEncryptedRefresh } = TokenEncryption.encrypt(newTokens.refresh_token || decryptedRefreshToken)

        const { error: updateError } = await adminSupabase
          .from('chutes_tokens')
          .update({
            encrypted_access_token: newEncryptedAccess,
            encrypted_refresh_token: newEncryptedRefresh,
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Failed to update token in database:', updateError)
        } else {
          accessToken = newTokens.access_token
          console.log('Token refreshed and re-encrypted successfully')
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError)

        const errorMessage = refreshError instanceof Error ? refreshError.message : String(refreshError)

        if (errorMessage.includes('invalid_grant')) {
          console.log('Refresh token is invalid or expired, deleting from database')

          const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
          const { error: deleteError } = await adminSupabase
            .from('chutes_tokens')
            .delete()
            .eq('user_id', user.id)

          if (deleteError) {
            console.error('Failed to delete expired token:', deleteError)
          } else {
            console.log('Successfully deleted invalid token from database')
          }

          return NextResponse.json(
            { 
              error: 'Your Chutes session has expired. Please re-link your Chutes account to continue.',
              code: 'RELINK_REQUIRED'
            },
            { status: 403 }
          )
        }

        return NextResponse.json(
          { error: 'Failed to refresh Chutes token. Please re-link your Chutes account.' },
          { status: 401 }
        )
      }
    } else if (isTokenExpired) {
      console.log('Token expired and no refresh token available')
      return NextResponse.json(
        { error: 'Chutes token expired. Please re-link your Chutes account.' },
        { status: 401 }
      )
    }

    console.log('Using Chutes token, length:', accessToken.length)

    const userInfoResponse = await fetch('https://idp.chutes.ai/idp/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!userInfoResponse.ok) {
      console.log('Chutes token validation failed:', userInfoResponse.status)
      return NextResponse.json(
        { error: 'Chutes token validation failed. Please re-link your Chutes account.' },
        { status: 403 }
      )
    }

    const userInfo = await userInfoResponse.json()
    console.log('Chutes user verified:', userInfo.username)

    const body = await request.json()
    const { message, model = "Qwen/Qwen3-32B" } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const chatResponse = await fetch('https://llm.chutes.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: message }],
        stream: false,
        max_tokens: 1000,
      }),
    })

    if (!chatResponse.ok) {
      const errorData = await chatResponse.text()
      console.error('Chat API error:', errorData)
      return NextResponse.json(
        { error: `Chat API error: ${chatResponse.status}` },
        { status: chatResponse.status }
      )
    }

    const chatData = await chatResponse.json()
    
    return NextResponse.json({
      response: chatData.choices[0]?.message?.content || 'No response received',
      user: userInfo.username,
      model: model,
      usage: chatData.usage,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}