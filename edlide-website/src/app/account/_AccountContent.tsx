'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SupabaseSignInCard } from '@/components/auth/supabase-signin-button'
import { SupabaseSignUpCard as SupabaseSignUpCardComponent } from '@/components/auth/supabase-signup-button'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import { LogOut, X, Loader2, AlertTriangle, CalendarClock } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

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
    dodoProductId: 'prod_starter_monthly',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    requestsPerDay: 2000,
    tier: 'plus',
    dodoProductId: 'prod_pro_monthly',
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: 34.99,
    requestsPerDay: 5000,
    tier: 'pro',
    dodoProductId: 'prod_ultra_monthly',
  },
]

const TIER_DISPLAY_NAMES: Record<string, string> = {
  'base': 'Starter',
  'plus': 'Pro',
  'pro': 'Ultra',
}

const TIER_ORDER = ['base', 'plus', 'pro']

const TIER_PRICES: Record<string, number> = {
  'base': 6.99,
  'plus': 19.99,
  'pro': 34.99,
}

interface PreviewSummary {
  currency: string
  total_amount: number
  customer_credits: number
  settlement_amount: number
  settlement_currency: string
  settlement_tax?: number | null
  tax?: number | null
}

interface PreviewImmediateCharge {
  summary: PreviewSummary
  line_items: unknown[]
}

interface PreviewData {
  preview: {
    immediate_charge: PreviewImmediateCharge
  } | null
  currentTierName: string
  newTierName: string
  isUpgrade: boolean
  isDowngrade?: boolean
  noChargeToday?: boolean
  downgradeAt?: string
  newPlanPrice?: number
  currentPlanPrice?: number
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function ChangePlanModal({
  isOpen,
  onClose,
  userId,
  currentTier,
  onPlanChanged,
  scheduledDowngrade,
}: {
  isOpen: boolean
  onClose: () => void
  userId: string
  currentTier: string
  onPlanChanged: () => void
  scheduledDowngrade?: { nextTier: string; downgradeAt: string } | null
}) {
  const t = useTranslations('account')
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [changingPlan, setChangingPlan] = useState(false)
  const [changeError, setChangeError] = useState<string | null>(null)
  const [changeSuccess, setChangeSuccess] = useState(false)
  const [changeType, setChangeType] = useState<'upgrade' | 'downgrade' | null>(null)
  const [downgradeEffectiveDate, setDowngradeEffectiveDate] = useState<string | null>(null)

  const resetState = useCallback(() => {
    setSelectedPlan(null)
    setPreviewData(null)
    setPreviewLoading(false)
    setPreviewError(null)
    setChangingPlan(false)
    setChangeError(null)
    setChangeSuccess(false)
    setChangeType(null)
    setDowngradeEffectiveDate(null)
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

      setChangeType(data.type || (previewData?.isUpgrade ? 'upgrade' : 'downgrade'))
      if (data.downgradeAt) {
        setDowngradeEffectiveDate(data.downgradeAt)
      }
      setChangeSuccess(true)
      setTimeout(() => {
        onPlanChanged()
        onClose()
      }, 2500)
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
          <h2 className="text-xl font-semibold">{t('changePlanTitle')}</h2>
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
              {changeType === 'downgrade' ? (
                <>
                  <CalendarClock className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-2">{t('planChangeScheduled')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('planChangeScheduledDesc')}{' '}
                    {TIER_DISPLAY_NAMES[selectedPlan?.tier || ''] || selectedPlan?.name}{' '}
                    {t('planChangeScheduledDate')}{' '}
                    {downgradeEffectiveDate ? formatDate(downgradeEffectiveDate) : ''}.
                  </p>
                  <p className="text-muted-foreground text-xs mt-2">
                    {t('planChangeScheduledNote')}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">{t('planChangeInitiated')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('planChangeInitiatedDesc')}
                  </p>
                </>
              )}
            </div>
          ) : !selectedPlan ? (
            /* Step 1: Select a plan */
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                {t('currentPlan')}{' '}
                <span className="font-medium text-foreground">{TIER_DISPLAY_NAMES[currentTier] || currentTier}</span>
                {scheduledDowngrade && (
                  <span className="ml-2 text-xs text-amber-500">
                    ({t('switchingTo')} {TIER_DISPLAY_NAMES[scheduledDowngrade.nextTier]} {t('on')} {formatDate(scheduledDowngrade.downgradeAt)})
                  </span>
                )}
              </p>
              <div className="grid gap-3">
                {PLANS.map((plan) => {
                  const planIndex = TIER_ORDER.indexOf(plan.tier)
                  const isCurrent = plan.tier === currentTier
                  const isScheduledTarget = scheduledDowngrade?.nextTier === plan.tier

                  return (
                    <button
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrent || isScheduledTarget}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all text-left ${
                        isCurrent
                          ? 'border-primary/50 bg-primary/5 cursor-default'
                          : isScheduledTarget
                            ? 'border-amber-500/50 bg-amber-500/5 cursor-default'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plan.name}</span>
                          {isCurrent && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {t('current')}
                            </span>
                          )}
                          {isScheduledTarget && (
                            <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                              {t('scheduled')}
                            </span>
                          )}
                          {!isCurrent && !isScheduledTarget && planIndex > currentPlanIndex && (
                            <span className="text-xs text-muted-foreground">{t('upgrade')}</span>
                          )}
                          {!isCurrent && !isScheduledTarget && planIndex < currentPlanIndex && (
                            <span className="text-xs text-muted-foreground">{t('downgrade')}</span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {plan.requestsPerDay.toLocaleString()} {t('requestsPerDay')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">${plan.price}</span>
                        <span className="text-sm text-muted-foreground">{t('mo')}</span>
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
                {t('backToPlans')}
              </button>

              {previewLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">{t('loadingPreview')}</span>
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
                  <h3 className="text-base font-medium">
                    {t('confirmPlanChange')}
                  </h3>

                  {/* Plan change summary */}
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('currentPlanLabel')}</span>
                      <span className="font-medium">
                        {previewData.currentTierName} (${TIER_PRICES[TIER_ORDER.find(tk => TIER_DISPLAY_NAMES[tk] === previewData.currentTierName) || ''] || '?'}{t('mo')})
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">&darr;</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('newPlanLabel')}</span>
                      <span className="font-medium">
                        {previewData.newTierName} (${previewData.newPlanPrice || TIER_PRICES[TIER_ORDER.find(tk => TIER_DISPLAY_NAMES[tk] === previewData.newTierName) || ''] || '?'}{t('mo')})
                      </span>
                    </div>
                  </div>

                  {/* Proration / schedule info */}
                  <div className="p-4 border border-border rounded-lg space-y-2">
                    {previewData.isUpgrade ? (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {t('chargedNow')}
                        </p>
                        {previewData.preview?.immediate_charge?.summary && (
                          <span className="text-sm font-semibold ml-4 whitespace-nowrap">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: previewData.preview.immediate_charge.summary.currency || 'USD',
                            }).format(previewData.preview.immediate_charge.summary.total_amount / 100)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">{t('noChargeToday')}</span>
                        </div>
                        {previewData.downgradeAt && (
                          <p className="text-sm text-muted-foreground">
                            {t('planChangesOn')}{' '}
                            <span className="font-medium text-foreground">{formatDate(previewData.downgradeAt)}</span>.
                            {' '}{t('nextBillAt')} {formatDate(previewData.downgradeAt)}
                            {previewData.newPlanPrice && (
                              <> (<span className="font-medium">${previewData.newPlanPrice}{t('mo')}</span>)</>
                            )}.
                          </p>
                        )}
                        {!previewData.downgradeAt && (
                          <p className="text-sm text-muted-foreground">
                            {t('planChangesAtEnd')}
                          </p>
                        )}
                      </div>
                    )}
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
                      {t('cancel')}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleConfirmChange}
                      disabled={changingPlan}
                    >
                      {changingPlan ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t('processing')}
                        </>
                      ) : previewData.isUpgrade ? (
                        t('confirmUpgrade')
                      ) : (
                        t('confirmDowngrade')
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
  const t = useTranslations('account')
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const isSignupMode = mode === 'signup'

  const { user, isLoading: authLoading, signOut } = useSupabaseAuth()
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null)
  const [subscriptionExpires, setSubscriptionExpires] = useState<string | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [showChangePlan, setShowChangePlan] = useState(false)
  const [scheduledDowngrade, setScheduledDowngrade] = useState<{
    nextTier: string
    downgradeAt: string
  } | null>(null)
  const [cancellingDowngrade, setCancellingDowngrade] = useState(false)
  const [requestsUsed, setRequestsUsed] = useState<number>(0)
  const [requestsLoading, setRequestsLoading] = useState(true)

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

  const loadRequestUsage = useCallback(async () => {
    if (!user) {
      setRequestsLoading(false)
      return
    }

    const todayUTC = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('request_usage')
      .select('request_count')
      .eq('user_id', user.id)
      .eq('request_date', todayUTC)
      .maybeSingle()

    setRequestsUsed(data?.request_count || 0)
    setRequestsLoading(false)
  }, [user])

  const loadSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionLoading(false)
      return
    }

    const { data } = await supabase
      .from('subscriptions')
      .select('plan_tier, status, expires_at, next_billing_date, next_plan_tier, downgrade_at')
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

      if (data.next_plan_tier && data.downgrade_at) {
        setScheduledDowngrade({
          nextTier: data.next_plan_tier,
          downgradeAt: data.downgrade_at,
        })
      } else {
        setScheduledDowngrade(null)
      }
    } else {
      setSubscriptionTier(null)
      setSubscriptionExpires(null)
      setScheduledDowngrade(null)
    }
    setSubscriptionLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      loadSubscription()
      loadRequestUsage()
    }
  }, [user, loadSubscription, loadRequestUsage])

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
    setTimeout(() => {
      loadSubscription()
    }, 3000)
  }

  const handleCancelDowngrade = async () => {
    if (!user) return
    setCancellingDowngrade(true)

    try {
      const response = await fetch('/api/payments/cancel-downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      if (response.ok) {
        setScheduledDowngrade(null)
        setTimeout(() => {
          loadSubscription()
        }, 1000)
      } else {
        const data = await response.json()
        console.error('Failed to cancel downgrade:', data.error)
      }
    } catch (error) {
      console.error('Cancel downgrade error:', error)
    } finally {
      setCancellingDowngrade(false)
    }
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
        <h1 className="text-4xl font-bold text-primary">{t('title')}</h1>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          {t('signOut')}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profileTitle')}</CardTitle>
            <CardDescription>{t('profileDesc')}</CardDescription>
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
                  {t('memberSince')} {new Date(user.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('subscriptionTitle')}</CardTitle>
            <CardDescription>{t('subscriptionDesc')}</CardDescription>
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
                      {tierPrices[subscriptionTier] || ''} &middot; {t('activeSubscription')}
                    </p>
                  </div>
                  <div className="text-right">
                    {subscriptionExpires && (
                      <p className="text-sm text-muted-foreground">
                        {t('nextBilling')} {subscriptionExpires}
                      </p>
                    )}
                  </div>
                </div>

                {/* Scheduled Downgrade Notice */}
                {scheduledDowngrade && (
                  <div className="flex items-center justify-between p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center gap-3">
                      <CalendarClock className="h-5 w-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">
                          {t('switchingTo')} {TIER_DISPLAY_NAMES[scheduledDowngrade.nextTier] || scheduledDowngrade.nextTier} Plan
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(scheduledDowngrade.downgradeAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelDowngrade}
                      disabled={cancellingDowngrade}
                      className="shrink-0"
                    >
                      {cancellingDowngrade ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        t('cancelDowngrade')
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowChangePlan(true)}
                    className="w-fit"
                  >
                    {t('changePlan')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {t('noSubscription')}
                </p>
                <Button onClick={handleManageSubscription}>
                  {t('viewPlans')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requests Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('requestsTitle')}</CardTitle>
            <CardDescription>{t('requestsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : subscriptionTier ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-medium text-lg">
                    {t('includedIn')} {tierDisplayNames[subscriptionTier] || subscriptionTier}
                  </p>
                </div>

                {/* Usage progress bar */}
                {(() => {
                  const plan = PLANS.find(p => p.tier === subscriptionTier)
                  const limit = plan?.requestsPerDay || 300
                  const used = requestsLoading ? 0 : requestsUsed
                  const percentage = Math.min((used / limit) * 100, 100)

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {requestsLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin inline-block mr-1" />
                          ) : (
                            <>{used.toLocaleString()} / {limit.toLocaleString()} {t('usedToday')}</>
                          )}
                        </span>
                        <span className="text-muted-foreground">
                          {t('resetsAt')}
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-600 transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {t('subscribeForRequests')}
                </p>
                <Button onClick={handleManageSubscription}>
                  {t('viewPlans')}
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
          scheduledDowngrade={scheduledDowngrade}
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
