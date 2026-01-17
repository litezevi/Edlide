'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SupabaseSignInForm } from '@/components/auth/supabase-signin-button'

async function insertTokens(session: any, stateId: string | null) {
  if (!stateId) {
    console.error('[IDE Connect] ERROR: No state ID provided')
    return false
  }

  if (!session?.access_token) {
    console.error('[IDE Connect] ERROR: No access_token in session', session)
    return false
  }

  const expiresAtDateTime = typeof session.expires_at === 'number'
    ? new Date(session.expires_at * 1000).toISOString()
    : session.expires_at

  console.log('[IDE Connect] Inserting tokens for state:', stateId, {
    user_id: session.user?.id,
    user_email: session.user?.email,
    expires_at: expiresAtDateTime
  })

  const { error } = await supabase.from('ide_pending_tokens').insert({
    state_id: stateId,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: expiresAtDateTime,
    user_id: session.user?.id,
    user_email: session.user?.email
  })

  if (error) {
    console.error('[IDE Connect] ERROR inserting tokens to ide_pending_tokens:', JSON.stringify(error, null, 2))
    console.error('[IDE Connect] Full error details:', error)
    return false
  }

  console.log('[IDE Connect] Tokens inserted to ide_pending_tokens for state:', stateId)

  const expiresAt = new Date(Date.now() + (session.expires_in || 3600) * 1000).toISOString()
  const { error: sessionError } = await supabase.from('user_sessions').insert({
    user_id: session.user?.id,
    user_email: session.user?.email,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: expiresAt,
    status: 'active'
  })

  if (sessionError) {
    console.error('[IDE Connect] ERROR inserting session:', JSON.stringify(sessionError, null, 2))
  } else {
    console.log('[IDE Connect] Session saved to user_sessions for user:', session.user?.id)
  }

  return true
}

export default function IDEConnectPage() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [stateId, setStateId] = useState<string | null>(null)
  const [inserted, setInserted] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const state = urlParams.get('state')
    setStateId(state)

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[IDE Connect] Initial session:', session ? 'found' : 'none')
      setSession(session)
      setLoading(false)

      if (session && state) {
        const success = await insertTokens(session, state)
        if (success) {
          setInserted(true)
          setTimeout(() => window.close(), 500)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[IDE Connect] Auth state changed:', event, session ? 'has session' : 'no session')
        if (event === 'SIGNED_IN' && session && stateId && !inserted) {
          setSession(session)
          const success = await insertTokens(session, stateId)
          if (success) {
            setInserted(true)
            setTimeout(() => window.close(), 500)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [stateId, inserted])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <LoadingSpinner />
      </div>
    )
  }

  if (inserted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Connected Successfully!</h1>
          <p className="text-gray-400">You can close this window.</p>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to connect your Edlide account with the IDE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupabaseSignInForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
      <Card className="p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-2">Ready to Connect</h1>
        <p className="text-gray-400 mb-6">{session.user?.email}</p>
        <Button
          onClick={async () => {
            const success = await insertTokens(session, stateId)
            if (success) {
              setInserted(true)
              setTimeout(() => window.close(), 500)
            }
          }}
          className="w-full"
        >
          Authorize
        </Button>
        <Button onClick={() => window.close()} variant="outline" className="w-full mt-4">
          Close Window
        </Button>
      </Card>
    </div>
  )
}