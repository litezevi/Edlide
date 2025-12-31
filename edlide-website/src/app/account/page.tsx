'use client'

import { useState, Suspense } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SupabaseSignInCard } from '@/components/auth/supabase-signin-button'
import { SupabaseSignUpCard as SupabaseSignUpCardComponent } from '@/components/auth/supabase-signup-button'
import { ChutesSignInButton } from '@/components/auth/chutes-signin-button'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { useChutesIntegration } from '@/lib/chutes-integration'
import { LogOut, User, Shield, Link2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function AccountContent() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const isSignupMode = mode === 'signup'

  const { user, isLoading, signOut } = useSupabaseAuth()
  const { linkedAccount, unlinkChutesAccount } = useChutesIntegration()
  const [isUnlinking, setIsUnlinking] = useState(false)

  const isChutesLinked = !!linkedAccount

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleUnlinkChutes = async () => {
    if (isUnlinking) return
    setIsUnlinking(true)

    const success = await unlinkChutesAccount()
    if (success) {
      localStorage.removeItem('chutes_user')
      window.location.reload()
    }

    setIsUnlinking(false)
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-md py-12">
        <div className="flex justify-center">
          {isSignupMode ? (
            <SupabaseSignUpCardComponent />
          ) : (
            <SupabaseSignInCard />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-primary">Account</h1>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Integrations Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              Integrations
            </CardTitle>
            <CardDescription>
              Manage your connected services and integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isChutesLinked ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <img
                    src="/chutesLogo.png"
                    alt="Chutes"
                    className="h-8 w-8 object-contain rounded"
                  />
                  <div>
                    <p className="font-medium">Chutes.ai</p>
                    <p className="text-xs text-muted-foreground">@{linkedAccount?.username}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnlinkChutes}
                  disabled={isUnlinking}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  {isUnlinking ? 'Unlinking...' : 'Unlink'}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Chutes.ai Integration</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect your Chutes account to access AI models in the IDE.
                    </p>
                    <ChutesSignInButton variant="outline" size="sm" />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-4xl py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <AccountContent />
    </Suspense>
  )
}
