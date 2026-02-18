'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SupabaseSignInCard } from '@/components/auth/supabase-signin-button'
import { SupabaseSignUpCard as SupabaseSignUpCardComponent } from '@/components/auth/supabase-signup-button'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import { LogOut, X, Loader2, AlertTriangle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface PlanOption {
  id: string
  name: string
  price: number
  requestsPerDay: number
  tier: string
  dodoProductId: string
}

const PLANS: PlanOption[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 6.99,
    requestsPerDay: 300,
    tier: 'base',
    dodoProductId: 'pdt_0NX7tjKSxW7Dn1oGBdMbE',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    requestsPerDay: 2000,
    tier: 'plus',
    dodoProductId: 'pdt_0NX7uDmO6LQ1tZPva4I5A',
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: 34.99,
    requestsPerDay: 5000,
    tier: 'pro',
    dodoProductId: 'pdt_0NX7uQKJc1elOk1df38G7',
  },
]

const TIER_DISPLAY_NAMES: Record<string, string> = {
  'base': 'Starter',
  'plus': 'Pro',
  'pro': 'Ultra',
}

const TIER_ORDER = ['base', 'plus', 'pro']

interface PreviewData {
  preview: Record<string, unknown>
  currentTierName: string
  newTierName: string
  isUpgrade: boolean
}

function ChangePlanModal({
  isOpen,
  onClose,
  userId,
  currentTier,
  onPlanChanged,
}: {
  isOpen: boolean
  onClose: () => void
  userId: string
  currentTier: string
  onPlanChanged: () => void
}) {
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [changingPlan, setChangingPlan] = useState(false)
  const [changeError, setChangeError] = useState<string | null>(null)
  const [changeSuccess, setChangeSuccess] = useState(false)

  const resetState = useCallback(() => {
    setSelectedPlan(null)
    setPreviewData(null)
    setPreviewLoading(false)
    setPreviewError(null)
    setChangingPlan(false)
    setChangeError(null)
    setChangeSuccess(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      resetState()
    }
  }, [isOpen, resetState])

  const handleSelectPlan = async (plan: PlanOption) => {
    if (plan.tier === currentTier) return

    setSelectedPlan(plan)
    setPreviewData(null)
    setPreviewError(null)
    setChangeError(null)
    setPreviewLoading(true)

    try {
      const response = await fetch('/api/payments/preview-change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newProductId: plan.dodoProductId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPreviewError(data.error || 'Failed to preview plan change')
        return
      }

      setPreviewData(data)
    } catch {
      setPreviewError('Failed to load preview. Please try again.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleConfirmChange = async () => {
    if (!selectedPlan) return

    setChangingPlan(true)
    setChangeError(null)

    try {
      const response = await fetch('/api/payments/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newProductId: selectedPlan.dodoProductId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setChangeError(data.error || 'Failed to change plan')
        return
      }

      setChangeSuccess(true)
      setTimeout(() => {
        onPlanChanged()
        onClose()
      }, 2000)
    } catch {
      setChangeError('Failed to change plan. Please try again.')
    } finally {
      setChangingPlan(false)
    }
  }

  if (!isOpen) return null

  const currentPlanIndex = TIER_ORDER.indexOf(currentTier)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Change Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {changeSuccess ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">Plan Change Initiated</h3>
              <p className="text-muted-foreground text-sm">
                Your plan is being updated. This may take a moment.
              </p>
            </div>
          ) : !selectedPlan ? (
            /* Step 1: Select a plan */
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Current plan: <span className="font-medium text-foreground">{TIER_DISPLAY_NAMES[currentTier] || currentTier}</span>
              </p>
              <div className="grid gap-3">
                {PLANS.map((plan) => {
                  const planIndex = TIER_ORDER.indexOf(plan.tier)
                  const isCurrent = plan.tier === currentTier
                  const isUpgrade = planIndex > currentPlanIndex
                  const isDowngrade = planIndex < currentPlanIndex

                  return (
                    <button
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrent}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all text-left ${
                        isCurrent
                          ? 'border-primary/50 bg-primary/5 cursor-default'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plan.name}</span>
                          {isCurrent && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {plan.requestsPerDay.toLocaleString()} requests/day
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">${plan.price}</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Step 2: Preview and confirm */
            <div className="space-y-6">
              <button
                onClick={() => {
                  setSelectedPlan(null)
                  setPreviewData(null)
                  setPreviewError(null)
                  setChangeError(null)
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back to plans
              </button>

              {previewLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading preview...</span>
                </div>
              )}

              {previewError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-500">{previewError}</p>
                  </div>
                </div>
              )}

              {previewData && (
                <div className="space-y-4">
                  {/* Plan change summary */}
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current plan</span>
                      <span className="font-medium">{previewData.currentTierName}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">&darr;</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">New plan</span>
                      <span className="font-medium">{previewData.newTierName}</span>
                    </div>
                  </div>

                  {/* Proration info */}
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      {previewData.isUpgrade
                        ? 'You will be charged the price difference immediately.'
                        : 'The remaining value will be credited to future renewals.'}
                    </p>

                  </div>

                  {changeError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <p className="text-sm text-red-500">{changeError}</p>
                      </div>
                    </div>
                  )}

                  {/* Confirm button */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onClose}
                      disabled={changingPlan}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleConfirmChange}
                      disabled={changingPlan}
                    >
                      {changingPlan ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : previewData.isUpgrade ? (
                        'Confirm Upgrade'
                      ) : (
                        'Confirm Downgrade'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AccountContent() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const isSignupMode = mode === 'signup'

  const { user, isLoading: authLoading, signOut } = useSupabaseAuth()
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null)
  const [subscriptionExpires, setSubscriptionExpires] = useState<string | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [showChangePlan, setShowChangePlan] = useState(false)

  const tierDisplayNames: Record<string, string> = {
    'base': 'Starter Plan',
    'plus': 'Pro Plan',
    'pro': 'Ultra Plan'
  }

  const tierPrices: Record<string, string> = {
    'base': '$6.99/mo',
    'plus': '$19.99/mo',
    'pro': '$34.99/mo',
  }

  const loadSubscription = useCallback(async () => {
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
      const nextBillDate = data.next_billing_date
      if (nextBillDate) {
        setSubscriptionExpires(new Date(nextBillDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }))
      }
    } else {
      setSubscriptionTier(null)
      setSubscriptionExpires(null)
    }
    setSubscriptionLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      loadSubscription()
    }
  }, [user, loadSubscription])

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

  const handlePlanChanged = () => {
    setSubscriptionLoading(true)
    // Delay reload to give webhook time to process
    setTimeout(() => {
      loadSubscription()
    }, 3000)
  }

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
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Manage your subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : subscriptionTier ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium text-lg">
                      {tierDisplayNames[subscriptionTier] || subscriptionTier}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tierPrices[subscriptionTier] || ''} &middot; Active subscription
                    </p>
                  </div>
                  <div className="text-right">
                    {subscriptionExpires && (
                      <p className="text-sm text-muted-foreground">
                        Next billing: {subscriptionExpires}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowChangePlan(true)}
                    className="w-fit"
                  >
                    Change Plan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You don&apos;t have an active subscription
                </p>
                <Button onClick={handleManageSubscription}>
                  View Plans
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Plan Modal */}
      {user && subscriptionTier && (
        <ChangePlanModal
          isOpen={showChangePlan}
          onClose={() => setShowChangePlan(false)}
          userId={user.id}
          currentTier={subscriptionTier}
          onPlanChanged={handlePlanChanged}
        />
      )}
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
