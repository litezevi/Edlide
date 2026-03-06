'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock, CheckCircle, AlertCircle, User } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { GoogleButton } from './google-button'
import { useLocale, useTranslations } from 'next-intl'

interface SupabaseSignUpFormProps {
  className?: string
}

export function SupabaseSignUpForm({ className }: SupabaseSignUpFormProps) {
  const locale = useLocale()
  const t = useTranslations('signUpForm')
  const lp = (path: string) => locale === 'ru' ? path : `/${locale}${path}`
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const { signUp } = useSupabaseAuth()

  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const hasMinLength = password.length >= 8
  const isPasswordValid = hasUppercase && hasLowercase && hasNumber && hasSpecialChar && hasMinLength

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await signUp(email, password, fullName)
      setSuccess(true)
      setTimeout(() => {
        window.location.href = lp('/account')
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t('fullName')}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('fullNamePlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={isLoading || success}
            />
          </div>
        </div>

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
            />
          </div>
        </div>

        {password.length > 0 && (
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground mb-2">{t('passwordRequirements')}</p>
            <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-500' : 'text-muted-foreground'}`}>
              {hasMinLength ? <CheckCircle className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-border"></span>}
              <span>{t('reqMinLength')}</span>
            </div>
            <div className={`flex items-center gap-2 ${hasUppercase ? 'text-green-500' : 'text-muted-foreground'}`}>
              {hasUppercase ? <CheckCircle className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-border"></span>}
              <span>{t('reqUppercase')}</span>
            </div>
            <div className={`flex items-center gap-2 ${hasLowercase ? 'text-green-500' : 'text-muted-foreground'}`}>
              {hasLowercase ? <CheckCircle className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-border"></span>}
              <span>{t('reqLowercase')}</span>
            </div>
            <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-500' : 'text-muted-foreground'}`}>
              {hasNumber ? <CheckCircle className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-border"></span>}
              <span>{t('reqNumber')}</span>
            </div>
            <div className={`flex items-center gap-2 ${hasSpecialChar ? 'text-green-500' : 'text-muted-foreground'}`}>
              {hasSpecialChar ? <CheckCircle className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-border"></span>}
              <span>{t('reqSpecial')}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t('confirmPassword')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
              disabled={isLoading || success}
            />
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-xs text-destructive">{t('passwordsNoMatch')}</p>
          )}
          {confirmPassword.length > 0 && password === confirmPassword && password.length > 0 && (
            <p className="text-xs text-green-500">{t('passwordsMatch')}</p>
          )}
        </div>

        <div className="flex flex-row-reverse items-center gap-2 justify-end">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-background accent-primary"
            required
          />
          <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
            {t('agreeText')}{' '}
            <a href={lp('/terms-of-use')} target="_blank" className="text-primary hover:underline">
              {t('termsOfUse')}
            </a>{' '}
            {t('and')}{' '}
            <a href={lp('/privacy-policy')} target="_blank" className="text-primary hover:underline">
              {t('privacyPolicy')}
            </a>
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading || success || !email || !password || !isPasswordValid || !acceptedTerms || password !== confirmPassword}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('creatingAccount')}
            </>
          ) : success ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('success')}
            </>
          ) : (
            <span className="text-black">{t('createAccount')}</span>
          )}
        </Button>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {t('hasAccount')}{' '}
            <a href={lp('/account')} className="text-primary hover:underline">
              {t('signIn')}
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

        <GoogleButton mode="signup" />
      </form>
    </div>
  )
}

export function SupabaseSignUpCard() {
  const t = useTranslations('signUpForm')
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('cardTitle')}</CardTitle>
        <CardDescription>{t('cardDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <SupabaseSignUpForm />
      </CardContent>
    </Card>
  )
}