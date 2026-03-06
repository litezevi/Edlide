'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, HelpCircle } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface PricingTier {
  id: string
  name: string
  price: number
  requestsPerDay: number
  description: string
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
    description: 'Perfect for learning and personal projects',
    productId: 'prod_starter_monthly',
    tier: 'base',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    requestsPerDay: 2000,
    description: 'Best for professional developers',
    productId: 'prod_pro_monthly',
    tier: 'plus',
    popular: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: 34.99,
    requestsPerDay: 5000,
    description: 'The ultimate plan for ambitious individual developers.',
    productId: 'prod_ultra_monthly',
    tier: 'pro',
  },
]



const TIER_ORDER = ['base', 'plus', 'pro']

const faqs = [
  {
    question: 'What counts as a request?',
    answer: 'One request is one message to the AI. A simple display-only site uses about 20-30 requests.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'No free trial, but we offer the Starter plan at $6.99 so you can try it out.',
  },
  {
    question: 'Can I change my plan later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time from your Account page. Upgrades are charged immediately (price difference), and downgrades credit the remaining value to future renewals.',
  },
]

export default function PricingPage() {
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

    // If user has subscription, redirect to account to manage plan
    if (currentTier) {
      router.push('/account')
      return
    }

    setLoadingTier(tier.id)

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    if (!user) return 'Sign Up to Subscribe'
    if (!currentTier) return 'Subscribe Now'
    if (tier.tier === currentTier) return 'Current Plan'

    const currentIndex = TIER_ORDER.indexOf(currentTier)
    const tierIndex = TIER_ORDER.indexOf(tier.tier)
    return tierIndex > currentIndex ? 'Upgrade' : 'Downgrade'
  }

  const isCurrentPlan = (tier: PricingTier): boolean => {
    return currentTier === tier.tier
  }

  return (
    <div className="container max-w-4xl py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Simple transparent pricing
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}
              {!currentTier && tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex flex-col flex-grow">
                <div className="text-center">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">$15 worth of tokens</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{tier.requestsPerDay.toLocaleString()} requests/day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                     <span className="text-sm">Access to <span className="whitespace-nowrap">GLM&#8209;4.7</span>, <span className="whitespace-nowrap">GLM&#8209;5</span>, <span className="whitespace-nowrap">Kimi&#8209;K2.5</span>, <span className="whitespace-nowrap">Minimax&#8209;M2.5</span>, <span className="whitespace-nowrap">Qwen&#8209;3.5</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Full context window</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Native quantization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">IDE & CLI access</span>
                  </li>
                </ul>

                <div className="mt-auto">
                  <Button
                    className="w-full"
                    variant={isCurrent ? 'secondary' : (tier.popular && !currentTier) ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(tier)}
                    disabled={loadingTier === tier.id || isCurrent}
                  >
                    {loadingTier === tier.id
                      ? 'Loading...'
                      : buttonLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
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
