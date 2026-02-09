'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SupabaseSignInForm } from '@/components/auth/supabase-signin-button'

export default function IDEConnectPage() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [stateId, setStateId] = useState<string | null>(null)
  const [inserted, setInserted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const connectingRef = useRef(false)
  const stateRef = useRef<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const state = urlParams.get('state')
    stateRef.current = state
    setStateId(state)

    if (!state) {
      setError('No state parameter provided')
      setLoading(false)
      return
    }

    const doConnect = async (s: any) => {
      if (connectingRef.current) {
        console.log('[IDE Connect] Already connecting, skipping')
        return
      }
      connectingRef.current = true

      const currentStateId = stateRef.current
      console.log('[IDE Connect] Starting connection for state:', currentStateId)

      try {
        console.log('[IDE Connect] Creating API key for user:', s.user?.id)
        
        const response = await fetch('/api/ide/create-api-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${s.access_token}`
          }
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          console.error('[IDE Connect] Failed to create API key:', data.error)
          setError(`Failed to create API key: ${data.error || 'Unknown error'}`)
          setLoading(false)
          connectingRef.current = false
          return
        }

        const { api_key, expires_at, user_email } = data
        console.log('[IDE Connect] API key created:', api_key.substring(0, 30) + '...')

        console.log('[IDE Connect] Inserting to ide_pending_tokens...')
        const { error: insertError } = await supabase.from('ide_pending_tokens').insert({
          state_id: currentStateId,
          access_token: api_key,
          refresh_token: api_key,
          expires_at: expires_at,
          user_id: s.user?.id,
          user_email: user_email
        })

        if (insertError) {
          console.error('[IDE Connect] DB insert error:', insertError)
          setError('Failed to save connection. Please try again.')
          setLoading(false)
          connectingRef.current = false
          return
        }

        console.log('[IDE Connect] Success! Token saved for state:', currentStateId)
        setInserted(true)
        setTimeout(() => window.close(), 500)

      } catch (err) {
        console.error('[IDE Connect] Connection error:', err)
        setError(err instanceof Error ? err.message : 'Connection failed')
        setLoading(false)
        connectingRef.current = false
      }
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[IDE Connect] Initial session:', session ? 'found' : 'none')
      setSession(session)
      setLoading(false)

      if (session && state && !connectingRef.current) {
        console.log('[IDE Connect] Auto-connecting with session')
        doConnect(session)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[IDE Connect] Auth state changed:', event, session ? 'has session' : 'no session')
        if (event === 'SIGNED_IN' && session && stateRef.current && !connectingRef.current && !inserted) {
          console.log('[IDE Connect] User signed in, connecting...')
          setSession(session)
          setLoading(false)
          doConnect(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-500">Connection Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button onClick={() => window.close()} variant="outline" className="w-full mt-4">
              Close Window
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (inserted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md w-full text-center bg-card">
          <h1 className="text-2xl font-bold text-foreground mb-4">Connected Successfully!</h1>
          <p className="text-muted-foreground">You can close this window.</p>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md bg-card">
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 max-w-md w-full bg-card">
        <h1 className="text-2xl font-bold text-foreground mb-2">Ready to Connect</h1>
        <p className="text-muted-foreground mb-6">{session.user?.email}</p>
        <Button
          onClick={async () => {
            try {
              if (connectingRef.current) return
              connectingRef.current = true

              console.log('[IDE Connect] Manual connect with state:', stateRef.current)

              const response = await fetch('/api/ide/create-api-key', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                }
              })

              const data = await response.json()

              if (!response.ok || !data.success) {
                console.error('[IDE Connect] Manual connect failed:', data.error)
                setError(`Failed: ${data.error || 'Unknown error'}`)
                connectingRef.current = false
                return
              }

              const { api_key, expires_at, user_email } = data

              const { error } = await supabase.from('ide_pending_tokens').insert({
                state_id: stateRef.current,
                access_token: api_key,
                refresh_token: api_key,
                expires_at: expires_at,
                user_id: session.user?.id,
                user_email: user_email
              })

              if (error) {
                console.error('[IDE Connect] DB insert error:', error)
                setError('Failed to save connection')
                connectingRef.current = false
                return
              }

              setInserted(true)
              setTimeout(() => window.close(), 500)

            } catch (err) {
              console.error('[IDE Connect] Manual connect error:', err)
              setError('Connection failed')
              connectingRef.current = false
            }
          }}
          className="w-full"
          disabled={connectingRef.current}
        >
          {connectingRef.current ? 'Connecting...' : 'Authorize'}
        </Button>
        <Button onClick={() => window.close()} variant="outline" className="w-full mt-4">
          Close Window
        </Button>
      </Card>
    </div>
  )
}