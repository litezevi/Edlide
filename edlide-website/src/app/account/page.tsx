'use client'

import { useState, Suspense, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SupabaseSignInCard } from '@/components/auth/supabase-signin-button'
import { SupabaseSignUpCard as SupabaseSignUpCardComponent } from '@/components/auth/supabase-signup-button'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import { LogOut, User } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function AccountContent() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const isSignupMode = mode === 'signup'

  const { user, isLoading: authLoading, signOut } = useSupabaseAuth()
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null)
  const [subscriptionExpires, setSubscriptionExpires] = useState<string | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  useEffect(() => {
    async function loadSubscription() {
      if (!user) {
        setSubscriptionLoading(false)
        return
      }

      const { data } = await supabase
        .from('subscriptions')
        .select('plan_tier, status, expires_at, next_billing_date')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (data?.plan_tier) {
        setSubscriptionTier(data.plan_tier)
        const expDate = data.expires_at || data.next_billing_date
        if (expDate) {
          setSubscriptionExpires(new Date(expDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }))
        }
      }
      setSubscriptionLoading(false)
    }

    if (user) {
      loadSubscription()
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleManageSubscription = () => {
    window.location.href = '/pricing'
  }

  const isLoading = authLoading || subscriptionLoading

  if (authLoading) {
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
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-lg">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(user.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionTier ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="font-medium capitalize text-lg">{subscriptionTier} Plan</p>
                  <p className="text-sm text-muted-foreground">Active subscription</p>
                </div>
                {subscriptionExpires && (
                  <p className="text-sm text-muted-foreground">
                    Expires: {subscriptionExpires}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You don't have an active subscription
                </p>
                <Button onClick={handleManageSubscription}>
                  View Plans
                </Button>
              </div>
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