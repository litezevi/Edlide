'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { useTranslations } from 'next-intl'

interface ForgotPasswordFormProps {
  className?: string
  onBack?: () => void
}

export function ForgotPasswordForm({ className, onBack }: ForgotPasswordFormProps) {
  const t = useTranslations('forgotPassword')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const { resetPassword } = useSupabaseAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    if (!email) {
      setError(t('emailRequired'))
      setIsLoading(false)
      return
    }

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset link'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">{t('checkEmailTitle')}</CardTitle>
          <CardDescription>
            {t('checkEmailDesc')} <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('checkEmailNote')}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSuccess(false)
              setEmail('')
            }}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('sendAnother')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('title')}</CardTitle>
        <CardDescription>{t('desc')}</CardDescription>
      </CardHeader>
      <CardContent>
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
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('sending')}
              </>
            ) : (
              <span className="text-black">{t('sendLink')}</span>
            )}
          </Button>

          {onBack && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={isLoading}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToSignIn')}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

export function ForgotPasswordCard() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  )
}