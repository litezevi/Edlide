'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { GoogleButton } from './google-button'
import { ForgotPasswordForm } from './forgot-password-form'
import { useLocale, useTranslations } from 'next-intl'

interface SupabaseSignInFormProps {
  className?: string
}

export function SupabaseSignInForm({ className }: SupabaseSignInFormProps) {
  const locale = useLocale()
  const t = useTranslations('signInForm')
  const lp = (path: string) => locale === 'ru' ? path : `/${locale}${path}`
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { signIn } = useSupabaseAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await signIn(email, password)
      setSuccess(true)
      setTimeout(() => {
        window.location.href = lp('/account')
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <ForgotPasswordForm
        className={className}
        onBack={() => setShowForgotPassword(false)}
      />
    )
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t('email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
              disabled={isLoading || success}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t('password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
              disabled={isLoading || success}
              minLength={6}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-xs text-primary hover:underline"
            disabled={isLoading || success}
          >
            {t('forgotPassword')}
          </button>
        </div>

        <Button
          type="submit"
          disabled={isLoading || success || !email || !password}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('signingIn')}
            </>
          ) : success ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('success')}
            </>
          ) : (
            <span className="text-black">{t('signIn')}</span>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          {t('agreeText')}{' '}
          <a href={lp('/terms-of-use')} target="_blank" className="text-primary hover:underline">
            {t('termsOfUse')}
          </a>{' '}
          {t('and')}{' '}
          <a href={lp('/privacy-policy')} target="_blank" className="text-primary hover:underline">
            {t('privacyPolicy')}
          </a>
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {t('noAccount')}{' '}
            <a href={lp('/account') + '?mode=signup'} className="text-primary hover:underline">
              {t('signUp')}
            </a>
          </p>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t('orContinueWith')}</span>
          </div>
        </div>

        <GoogleButton mode="signin" />
      </form>
    </div>
  )
}

export function SupabaseSignInCard() {
  const t = useTranslations('signInForm')
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">{t('cardTitle')}</CardTitle>
        <CardDescription>{t('cardDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <SupabaseSignInForm />
      </CardContent>
    </Card>
  )
}