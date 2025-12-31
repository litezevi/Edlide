'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SupabaseSignInForm } from '@/components/auth/supabase-signin-button'

export default function IDEConnectPage() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [stateId, setStateId] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const state = urlParams.get('state')
    setStateId(state)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setSession(session)
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
            const expiresAtDateTime = typeof session.expires_at === 'number'
              ? new Date(session.expires_at * 1000).toISOString()
              : session.expires_at

            await supabase.from('ide_pending_tokens').insert({
              state_id: stateId,
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: expiresAtDateTime,
              user_id: session.user?.id,
              user_email: session.user?.email
            })
            window.close()
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