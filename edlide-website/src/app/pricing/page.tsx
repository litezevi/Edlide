'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, HelpCircle } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { useRouter } from 'next/navigation'

interface PricingTier {
  id: string
  name: string
  price: number
  requestsPerDay: number
  description: string
  productId: string
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
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    requestsPerDay: 2000,
    description: 'Best for professional developers',
    productId: 'prod_pro_monthly',
    popular: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: 34.99,
    requestsPerDay: 5000,
    description: 'The ultimate plan for ambitious individual developers.',
    productId: 'prod_ultra_monthly',
  },
]

const PRODUCT_IDS: Record<string, string> = {
  'prod_starter_monthly': 'pdt_0NX7tjKSxW7Dn1oGBdMbE',
  'prod_pro_monthly': 'pdt_0NX7uDmO6LQ1tZPva4I5A',
  'prod_ultra_monthly': 'pdt_0NX7uQKJc1elOk1df38G7',
}

const faqs = [
  {
    question: 'What counts as a request?',
    answer: 'One request is one message to the AI. A simple display-only site uses about 20-30 requests.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'No free trial, but we offer the Starter plan at $6.99 so you can try it out.',
  },
]

export default function PricingPage() {
  const { user } = useSupabaseAuth()
  const router = useRouter()
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSubscribe = async (tier: PricingTier) => {
    if (!user) {
      router.push('/account?mode=signup')
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
          dodoProductId: PRODUCT_IDS[tier.productId],
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
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={`relative ${
              tier.popular
                ? 'border-primary shadow-lg shadow-primary/10'
                : 'border-border'
            }`}
          >
            {tier.popular && (
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
                  <span className="text-sm">{tier.requestsPerDay.toLocaleString()} requests/day</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Access to GLM-4.7, Kimi-K2.5, Minimax-M2.5</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Advanced code completion</span>
                </li>
              </ul>

              <div className="mt-auto">
                <Button
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(tier)}
                  disabled={loadingTier === tier.id}
                >
                  {loadingTier === tier.id
                    ? 'Loading...'
                    : user
                    ? 'Subscribe Now'
                    : 'Sign Up to Subscribe'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
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
