'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function IDEConnectPage() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [tokensSent, setTokensSent] = useState(false)
  const [stateId, setStateId] = useState<string | null>(null)

  useEffect(() => {
    // Получаем state_id из URL параметров
    const urlParams = new URLSearchParams(window.location.search)
    const state = urlParams.get('state')
    setStateId(state)
    
    checkSessionAndInitialize()
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        if (event === 'SIGNED_IN' && session) {
          setSession(session)
        }
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setTokensSent(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkSessionAndInitialize = async () => {
    try {
      setLoading(true)
      setError(null)

      // Получаем текущую сессию
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        setError('Session error: ' + sessionError.message)
        setLoading(false)
        return
      }

      if (session) {
        console.log('Session found:', session.user?.email)
        setSession(session)
      } else {
        console.log('No session found')
        setSession(null)
      }
      setLoading(false)
    } catch (err) {
      console.error('Check session error:', err)
      setError(err instanceof Error ? err.message : 'Failed to check session')
      setLoading(false)
    }
  }

  const handleAuthorize = async () => {
    if (session && !tokensSent) {
      try {
        setTokensSent(true)

        if (!stateId) {
          throw new Error('No state ID provided. Please open this page from Edlide IDE.')
        }

        console.log('[IDE Connect] Session data:', {
          has_access_token: !!session.access_token,
          has_refresh_token: !!session.refresh_token,
          expires_at: session.expires_at,
          user_id: session.user?.id,
          user_email: session.user?.email
        });

        // Convert expires_at timestamp to ISO datetime string if it's a number
        const expiresAtDateTime = typeof session.expires_at === 'number'
          ? new Date(session.expires_at * 1000).toISOString()
          : session.expires_at;

        console.log('[IDE Connect] expires_at converted:', expiresAtDateTime);

        // Сохраняем токены в ide_pending_tokens таблицу
        const { error: insertError, data } = await supabase
          .from('ide_pending_tokens')
          .insert({
            state_id: stateId,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: expiresAtDateTime,
            user_id: session.user?.id,
            user_email: session.user?.email
          })

        if (insertError) {
          console.error('Error saving tokens:', insertError)
          throw new Error('Failed to save tokens: ' + insertError.message)
        }

        console.log('Tokens saved successfully for state:', stateId)
      } catch (err) {
        console.error('Error authorizing IDE:', err)
        setError('Failed to authorize: ' + (err instanceof Error ? err.message : 'Unknown error'))
        setTokensSent(false)
      }
    }
  }

  const handleSignIn = async () => {
    try {
      setError(null)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/ide-connect`,
        },
      })

      if (error) {
        console.error('Sign in error:', error)
        setError('Sign in failed: ' + error.message)
      }
    } catch (err) {
      console.error('Sign in exception:', err)
      setError('Sign in failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  

  // Если пользователь не авторизован
  if (!loading && !session && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <Card className="p-12 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-white mb-6">
            Please sign in to connect your Edlide account with the IDE
          </p>
          <Button
            onClick={handleSignIn}
            className="w-full"
          >
            Sign In with GitHub
          </Button>
        </Card>
      </div>
    )
  }

  // Состояние загрузки
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">Connecting to IDE...</p>
        </div>
      </div>
    )
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <Card className="p-12 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6">Connection Failed</h1>
          <p className="text-white mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  // Авторизован и готов к передаче токенов
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <Card className="p-12 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-4">
            Ready to Connect to IDE
          </h1>
          <p className="text-white mb-2">
            User: {session.user?.email}
          </p>
          <p className="text-white mb-6">
            Tokens ready for IDE integration
          </p>
          <Button
            onClick={handleAuthorize}
            className="w-full mb-4"
            disabled={tokensSent}
          >
            {tokensSent ? 'Tokens Sent!' : 'Authorize'}
          </Button>
          
          {stateId && (
            <div className="text-xs text-gray-400 mb-4 p-2 bg-gray-800 rounded">
              State ID: {stateId.substring(0, 8)}...
            </div>
          )}
          
          {tokensSent ? (
            <div className="text-sm text-green-400 mb-6">
              ✓ Tokens sent to IDE. You can close this window.
            </div>
          ) : stateId ? (
            <div className="text-sm text-gray-400 mb-6">
              Waiting for IDE to pick up tokens...
            </div>
          ) : (
            <div className="text-sm text-gray-400 mb-6">
              Open this page from Edlide IDE with state parameter
            </div>
          )}
          
          <Button
            onClick={() => window.close()}
            variant="outline"
            className="w-full"
          >
            Close Window
          </Button>
        </Card>
      </div>
    )
  }

  // По умолчанию - показываем состояние загрузки
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
      <div className="text-center">
        <LoadingSpinner />
        <p className="text-white mt-4">Connecting to IDE...</p>
      </div>
    </div>
  )
}