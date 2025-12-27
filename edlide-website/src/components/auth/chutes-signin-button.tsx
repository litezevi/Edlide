'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useChutesAuth } from '@/lib/chutes-auth'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ChutesSignInButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function ChutesSignInButton({
  className,
  variant = 'default',
  size = 'default',
  onSuccess,
  onError,
}: ChutesSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, checkSSOStatus } = useChutesAuth()

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if user is already authenticated via SSO
      const hasSSOSession = await checkSSOStatus()
      
      if (hasSSOSession) {
        // User has active Chutes session, redirect to account
        window.location.href = '/account'
        return
      }

      // Initiate OAuth flow
      signIn()
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Chutes'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {isLoading ? 'Connecting...' : 'Sign in with Chutes'}
      </Button>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="text-xs text-muted-foreground">
          Secure authentication via Chutes.ai
        </div>
      )}
    </div>
  )
}

/**
 * Full Chutes Sign-in Card Component
 */
export function ChutesSignInCard() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signIn, checkSSOStatus } = useChutesAuth()

  const handleSignIn = async () => {
    setIsLoading(true)

    try {
      const hasSSOSession = await checkSSOStatus()
      
      if (hasSSOSession) {
        window.location.href = '/account'
        return
      }

      signIn()
      setSuccess(true)
    } catch (err) {
      console.error('Chutes sign in error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <CardTitle className="text-2xl">Sign in with Chutes</CardTitle>
        <CardDescription>
          Connect your Chutes account to access AI model management tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSignIn}
          disabled={isLoading || success}
          className="w-full gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {isLoading ? 'Connecting to Chutes...' : success ? 'Redirecting...' : 'Continue with Chutes'}
        </Button>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Connect your existing Chutes account</p>
          <p>• Access AI model deployment tools</p>
          <p>• Secure OAuth2 authentication</p>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            By signing in, you agree to Chutes' Terms of Service and Privacy Policy
          </p>
        </div>
      </CardContent>
    </Card>
  )
}