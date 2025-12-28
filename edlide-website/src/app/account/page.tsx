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
      <div className="container max-w-4xl py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">Account</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            {isSignupMode ? (
              <SupabaseSignUpCardComponent />
            ) : (
              <SupabaseSignInCard />
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Why create an Edlide account?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">AI Model Management</h4>
                      <p className="text-sm text-muted-foreground">
                        Deploy and manage open source AI models directly from Edlide
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Secure Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Your data stays secure with enterprise-grade authentication
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Developer Tools</h4>
                      <p className="text-sm text-muted-foreground">
                        Access powerful AI development tools and resources
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security & Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Encrypted password storage via Supabase</li>
                  <li>• Secure session management</li>
                  <li>• Two-factor authentication ready</li>
                  <li>• You control your data and permissions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
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
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-purple-500" />
              Integrations
            </CardTitle>
            <CardDescription>
              Connect third-party services to enhance your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isChutesLinked ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
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
                      Connect your Chutes account to access AI model deployment services and advanced AI tools
                    </p>
                    <ChutesSignInButton variant="outline" size="sm" />
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Access to Chutes AI model deployment platform</li>
                    <li>• Direct integration with Qwen models</li>
                    <li>• Secure OAuth2 authentication</li>
                    <li>• Enhanced AI capabilities</li>
                  </ul>
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
