'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useChutesAuth, ChutesUser } from '@/lib/chutes-auth'
import { createClient } from '@supabase/supabase-js'

function ChutesCallbackPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<ChutesUser | null>(null)
  const [processed, setProcessed] = useState(false)

  const { handleCallback, getCurrentUser } = useChutesAuth()

  const saveChutesTokenToDatabase = async (chutesUser: ChutesUser, accessToken: string, refreshToken?: string, expiresIn?: number) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.log('No Supabase session, skipping database save')
        return
      }

      const response = await fetch('/api/auth/chutes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          accessToken,
          refreshToken,
          chutesUserId: chutesUser.sub,
          username: chutesUser.username,
          expiresIn,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to save chutes token:', errorData)
        return
      }

      console.log('Chutes token saved to database successfully')
    } catch (error) {
      console.error('Error saving chutes token to database:', error)
    }
  }

  useEffect(() => {
    // Prevent multiple processing
    if (processed) {
      return
    }

    const processCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (errorParam) {
          setError(errorDescription || errorParam)
          setStatus('error')
          setProcessed(true)
          return
        }

        if (!code) {
          setError('No authorization code received')
          setStatus('error')
          setProcessed(true)
          return
        }

        // Mark as processed to prevent multiple attempts
        setProcessed(true)

        // Handle the OAuth callback
        const authenticatedUser = await handleCallback(code, state || undefined)

        // Store user information in localStorage (for backward compatibility)
        localStorage.setItem('chutes_user', JSON.stringify(authenticatedUser))

        // Save token to Supabase database
        const accessToken = localStorage.getItem('chutes_access_token')
        const refreshToken = localStorage.getItem('chutes_refresh_token')
        const expiresIn = parseInt(localStorage.getItem('chutes_expires_in') || '3600', 10)
        await saveChutesTokenToDatabase(authenticatedUser, accessToken!, refreshToken || undefined, expiresIn)

        setUser(authenticatedUser)
        setStatus('success')

        // Redirect to account page after a short delay
        setTimeout(() => {
          router.push('/account')
        }, 2000)

      } catch (err) {
        console.error('Chutes callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')
      }
    }

    processCallback()
  }, [searchParams, handleCallback, router, processed])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Authenticating...</CardTitle>
            <CardDescription>
              Completing your sign in with Chutes
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">
              Please wait while we verify your identity...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Authentication Failed</CardTitle>
            <CardDescription>
              We couldn't complete your sign in with Chutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/account'} 
                variant="outline" 
                className="w-full"
              >
                Back to Account
              </Button>
              <Button 
                onClick={() => window.location.href = '/'} 
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">Welcome!</CardTitle>
          <CardDescription>
            You've successfully signed in with Chutes
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {user && (
            <div className="flex items-center justify-center space-x-3 p-3 rounded-lg bg-muted">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">ID: {user.sub}</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/account')} 
              className="w-full"
            >
              Continue to Account
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Redirecting automatically...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ChutesCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ChutesCallbackPageContent />
    </Suspense>
  )
}