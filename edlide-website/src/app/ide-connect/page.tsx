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
        
        // Отправляем токены на сервер с state_id
        const response = await fetch('/api/auth/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: stateId,
            tokens: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_in: session.expires_in,
              expires_at: session.expires_at
            },
            user: {
              id: session.user?.id,
              email: session.user?.email
            },
            chutes: {
              linked: false,
              username: null
            },
            timestamp: Date.now()
          })
        })

        if (response.ok) {
          console.log('Tokens sent to server successfully')
          // Можно показать уведомление об успехе
        } else {
          throw new Error('Failed to send tokens to server')
        }
      } catch (err) {
        console.error('Error sending tokens to server:', err)
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