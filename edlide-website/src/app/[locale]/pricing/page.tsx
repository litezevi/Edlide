'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, HelpCircle } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface PricingTier {
  id: string
  name: string
  price: number
  requestsPerDay: number
  descKey: string
  productId: string
  tier: string
  popular?: boolean
}

const tiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 6.99,
    requestsPerDay: 300,
    descKey: 'starterDesc',
    productId: 'prod_starter_monthly',
    tier: 'base',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    requestsPerDay: 2000,
    descKey: 'proDesc',
    productId: 'prod_pro_monthly',
    tier: 'plus',
    popular: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: 34.99,
    requestsPerDay: 5000,
    descKey: 'ultraDesc',
    productId: 'prod_ultra_monthly',
    tier: 'pro',
  },
]

const TIER_ORDER = ['base', 'plus', 'pro']

export default function PricingPage() {
  const t = useTranslations('pricing')
  const { user } = useSupabaseAuth()
  const router = useRouter()
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [currentTier, setCurrentTier] = useState<string | null>(null)

  useEffect(() => {
    async function loadSubscription() {
      if (!user) return

      const { data } = await supabase
        .from('subscriptions')
        .select('plan_tier, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (data?.plan_tier) {
        setCurrentTier(data.plan_tier)
      }
    }

    if (user) {
      loadSubscription()
    }
  }, [user])

  const handleSubscribe = async (tier: PricingTier) => {
    if (!user) {
      router.push('/account?mode=signup')
      return
    }

    if (currentTier) {
      router.push('/account')
      return
    }

    setLoadingTier(tier.id)

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: tier.productId,
          userId: user.id,
          userEmail: user.email,
        }),
      })

      const data = await response.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        console.error('Failed to create checkout:', data.error)
        alert('Failed to create checkout. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoadingTier(null)
    }
  }

  const getButtonLabel = (tier: PricingTier): string => {
    if (!user) return t('signUpToSubscribe')
    if (!currentTier) return t('subscribeNow')
    if (tier.tier === currentTier) return t('currentPlan')

    const currentIndex = TIER_ORDER.indexOf(currentTier)
    const tierIndex = TIER_ORDER.indexOf(tier.tier)
    return tierIndex > currentIndex ? t('upgrade') : t('downgrade')
  }

  const isCurrentPlan = (tier: PricingTier): boolean => {
    return currentTier === tier.tier
  }

  const faqs = [
    { question: t('faq1q'), answer: t('faq1a') },
    { question: t('faq2q'), answer: t('faq2a') },
    { question: t('faq3q'), answer: t('faq3a') },
  ]

  return (
    <div className="container max-w-4xl py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t('title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {tiers.map((tier) => {
          const isCurrent = isCurrentPlan(tier)
          const buttonLabel = getButtonLabel(tier)

          return (
            <Card
              key={tier.id}
              className={`relative ${
                isCurrent
                  ? 'border-primary shadow-lg shadow-primary/10'
                  : tier.popular && !currentTier
                  ? 'border-primary shadow-lg shadow-primary/10'
                  : 'border-border'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-max">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    {t('currentPlan')}
                  </span>
                </div>
              )}
              {!currentTier && tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-max">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    {t('mostPopular')}
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{t(tier.descKey as 'starterDesc' | 'proDesc' | 'ultraDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex flex-col flex-grow">
                <div className="text-center">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">{t('perMonth')}</span>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {tier.id === 'starter' ? t('tokensStarter') : tier.id === 'pro' ? t('tokensPro') : t('tokensUltra')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{tier.requestsPerDay.toLocaleString()} {t('requestsPerDay')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {tier.id === 'starter' ? t('modelsStarter') : t('modelsPro')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('fullContext')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('quantization')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('ideCliAccess')}</span>
                  </li>
                </ul>

                <div className="mt-auto">
                  <Button
                    className="w-full text-xs sm:text-sm h-auto py-2 px-3 whitespace-normal leading-tight"
                    variant={isCurrent ? 'secondary' : (tier.popular && !currentTier) ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(tier)}
                    disabled={loadingTier === tier.id || isCurrent}
                  >
                    {loadingTier === tier.id ? t('loading') : buttonLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">{t('faqTitle')}</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-medium">{faq.question}</span>
                <HelpCircle className={`h-5 w-5 text-muted-foreground transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
