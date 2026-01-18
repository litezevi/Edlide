import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ChutesTokenManager } from '@/lib/chutes-token-manager'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

    const tokenResult = await ChutesTokenManager.getValidAccessToken(user.id)

    if (!tokenResult) {
      console.log('No valid Chutes token found for user:', user.id)
      return NextResponse.json(
        { error: 'Chutes account not linked. Please link your Chutes account first.' },
        { status: 403 }
      )
    }

    const { accessToken, refreshed } = tokenResult
    console.log(`Using Chutes token, length: ${accessToken.length}, refreshed: ${refreshed}`)

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