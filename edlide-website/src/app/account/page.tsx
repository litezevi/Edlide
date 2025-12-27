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
import { LogOut, User, Settings, CreditCard, Activity, Shield, Link2 } from 'lucide-react'
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
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">
                  {user.user_metadata?.full_name || user.email}
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.email_confirmed_at && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Email verified</span>
                  </div>
                )}
                {user.created_at && (
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linked Account - Chutes */}
        {isChutesLinked && linkedAccount && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Linked Accounts
              </CardTitle>
              <CardDescription>
                Connected third-party accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <div>
                    <p className="font-medium">Chutes.ai</p>
                    <p className="text-xs text-muted-foreground">@{linkedAccount.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
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

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Edlide Pro
            </CardTitle>
            <CardDescription>
              Upgrade to unlock advanced features and priority support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Free Plan</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Basic model support</li>
                  <li>• Community support</li>
                  <li>• 5 active projects</li>
                </ul>
              </div>
              <Button>Upgrade to Pro</Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
            <CardDescription>
              Your activity and resource usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">248</div>
                <div className="text-sm text-muted-foreground">Models Tested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">1.2TB</div>
                <div className="text-sm text-muted-foreground">Data Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">89h</div>
                <div className="text-sm text-muted-foreground">Runtime</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your account preferences and security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start gap-2">
                <User className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <Settings className="h-4 w-4" />
                Account Preferences
              </Button>
              {isChutesLinked ? (
                <Button
                  variant="outline"
                  onClick={handleUnlinkChutes}
                  disabled={isUnlinking}
                  className="justify-start gap-2"
                >
                  {isUnlinking ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <LogOut className="h-4 w-4 text-orange-600" />
                  )}
                  <span className={isUnlinking ? '' : 'text-orange-600'}>
                    {isUnlinking ? 'Unlinking...' : 'Unlink Chutes Account'}
                  </span>
                </Button>
              ) : (
                <Button variant="outline" className="justify-start gap-2">
                  <Link2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Link Chutes Account</span>
                </Button>
              )}
            </div>
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
