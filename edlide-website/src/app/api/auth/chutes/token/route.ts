import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json()

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing code or redirectUri' },
        { status: 400 }
      )
    }

    const clientId = process.env.NEXT_PUBLIC_CHUTES_CLIENT_ID!
    const clientSecret = process.env.CHUTES_CLIENT_SECRET!

    console.log('Server token exchange:', { 
      clientId, 
      clientSecret: !!clientSecret, 
      code: code.substring(0, 10) + '...',
      redirectUri 
    })

    const tokenData = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }

    const response = await fetch('https://idp.chutes.ai/idp/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenData),
    })

    const responseText = await response.text()
    console.log('Token response status:', response.status)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Token exchange failed', details: responseText },
        { status: response.status }
      )
    }

    const tokenDataParsed = JSON.parse(responseText)
    return NextResponse.json(tokenDataParsed)

  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}