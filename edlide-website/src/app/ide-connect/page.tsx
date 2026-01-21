'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SupabaseSignInForm } from '@/components/auth/supabase-signin-button'

const insertTokenPromises = new Map<string, Promise<boolean>>()

async function insertTokens(session: any, stateId: string | null): Promise<boolean> {
  if (!stateId) {
    console.error('[IDE Connect] ERROR: No state ID provided')
    return false
  }

  if (!session?.user?.id) {
    console.error('[IDE Connect] ERROR: No user in session', session)
    return false
  }

  const requestKey = `${stateId}:${session.user.id}`
  if (insertTokenPromises.has(requestKey)) {
    console.log('[IDE Connect] Waiting for existing insert for:', requestKey)
    return insertTokenPromises.get(requestKey)!
  }

  const insertPromise = (async () => {
    console.log('[IDE Connect] Creating API key for user:', session.user?.id)

    try {
      const response = await fetch('/api/ide/create-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('[IDE Connect] Failed to create API key:', data.error)
        return false
      }

      const { api_key, expires_at, user_email } = data

      const { error } = await supabase.from('ide_pending_tokens').insert({
        state_id: stateId,
        access_token: api_key,
        refresh_token: api_key,
        expires_at: expires_at,
        user_id: session.user?.id,
        user_email: user_email
      })

      if (error) {
        console.error('[IDE Connect] ERROR inserting API key to ide_pending_tokens:', JSON.stringify(error, null, 2))
        return false
      }

      console.log('[IDE Connect] API key inserted to ide_pending_tokens for state:', stateId)
      console.log('[IDE Connect] API key:', api_key.substring(0, 30) + '...')

      return true
    } catch (err) {
      console.error('[IDE Connect] Error creating API key:', err)
      return false
    }
  })()

  insertTokenPromises.set(requestKey, insertPromise)

  try {
    const result = await insertPromise
    insertTokenPromises.delete(requestKey)
    return result
  } catch {
    insertTokenPromises.delete(requestKey)
    return false
  }
}

export default function IDEConnectPage() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [stateId, setStateId] = useState<string | null>(null)
  const [inserted, setInserted] = useState(false)
  const connectedRef = useRef(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const state = urlParams.get('state')
    setStateId(state)

    const doConnect = async (s: any) => {
      if (connectedRef.current) {
        console.log('[IDE Connect] Already connected, skipping')
        return
      }

      const success = await insertTokens(s, state)
      if (success && !connectedRef.current) {
        connectedRef.current = true
        setInserted(true)
        setTimeout(() => window.close(), 500)
      }
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[IDE Connect] Initial session:', session ? 'found' : 'none')
      setSession(session)
      setLoading(false)

      if (session && state) {
        await doConnect(session)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[IDE Connect] Auth state changed:', event, session ? 'has session' : 'no session')
        if (event === 'SIGNED_IN' && session && state && !connectedRef.current) {
          console.log('[IDE Connect] Setting session and connecting...')
          setSession(session)
          await doConnect(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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