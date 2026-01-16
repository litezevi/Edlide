import { NextRequest, NextResponse } from 'next/server'
import { validateChutesToken, createChutesSession } from '@/lib/chutes-auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/chutes/callback?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/chutes/callback?error=no_code&error_description=No authorization code received', request.url)
    )
  }

  try {
    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code)

    // Create session
    const session = await createChutesSession(tokenResponse)

    // Create response with session cookie
    const response = NextResponse.redirect(new URL('/account', request.url))

    // Set session cookie
    response.cookies.set('chutes_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Chutes callback error:', error)
    return NextResponse.redirect(
      new URL(`/auth/chutes/callback?error=callback_failed&error_description=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`, request.url)
    )
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string) {
  const clientId = process.env.NEXT_PUBLIC_CHUTES_CLIENT_ID
  const clientSecret = process.env.CHUTES_CLIENT_SECRET
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/chutes/callback`

  const response = await fetch('https://api.chutes.ai/idp/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Token exchange failed: ${response.statusText} - ${errorData}`)
  }

  return response.json()
}
