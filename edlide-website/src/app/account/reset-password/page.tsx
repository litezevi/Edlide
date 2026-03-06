'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLocale, useTranslations } from 'next-intl'

/**
 * Password Reset Page
 *
 * The user arrives here AFTER /auth/confirm has already verified the recovery
 * token and set session cookies. This page simply:
 * 1. Checks for a valid session (set by /auth/confirm via cookies)
 * 2. Shows the new password form
 * 3. Calls updateUser({ password }) to change the password
 */
function ResetPasswordContent() {
  const router = useRouter()
  const t = useTranslations('resetPassword')
  const locale = useLocale()
  const lp = (path: string) => locale === 'ru' ? path : `/${locale}${path}`

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      // The /auth/confirm route handler already verified the recovery token
      // and set session cookies. We just need to pick up that session.

      // Listen for auth events — PASSWORD_RECOVERY fires when session is loaded
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (!mounted) return
        if (event === 'PASSWORD_RECOVERY') {
          setIsValidSession(true)
          setIsLoading(false)
        }
      })

      // Also check if there's already a valid session (from cookies set by /auth/confirm)
      const { data: { user } } = await supabase.auth.getUser()
      if (mounted && user) {
        setIsValidSession(true)
        setIsLoading(false)
      }

      // Fallback: if no session found within 4s, show invalid link
      const timeout = setTimeout(() => {
        if (mounted) {
          setIsLoading(false)
        }
      }, 4000)

      return () => {
        mounted = false
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
    }

    const cleanup = checkSession()

    return () => {
      mounted = false
      cleanup.then((fn) => fn?.())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const passwordRequirements = [
    { label: t('reqMinLength'), valid: password.length >= 8 },
    { label: t('reqUppercase'), valid: /[A-Z]/.test(password) },
    { label: t('reqLowercase'), valid: /[a-z]/.test(password) },
    { label: t('reqNumber'), valid: /\d/.test(password) },
    { label: t('reqSpecial'), valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  const allRequirementsMet = passwordRequirements.every(r => r.valid)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!allRequirementsMet) {
      setError(t('errRequirements'))
      return
    }

    if (!passwordsMatch) {
      setError(t('errNoMatch'))
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      // Sign out so the recovery session doesn't persist globally
      await supabase.auth.signOut()

      setSuccess(true)
      setTimeout(() => {
        router.push(lp('/account'))
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">{t('verifying')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">{t('successTitle')}</CardTitle>
          <CardDescription>{t('successDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t('successRedirect')}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!isValidSession) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">{t('invalidTitle')}</CardTitle>
          <CardDescription>{t('invalidDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push(lp('/account'))} className="w-full">
            {t('goToSignIn')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('setNewTitle')}</CardTitle>
        <CardDescription>{t('setNewDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t('newPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t('confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                className={`w-full pl-10 pr-4 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-green-500'
                      : 'border-red-500'
                    : 'border-border'
                }`}
                required
                disabled={isLoading}
              />
            </div>
            {confirmPassword.length > 0 && (
              <p className={`text-xs ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                {passwordsMatch ? t('passwordsMatch') : t('passwordsNoMatch')}
              </p>
            )}
          </div>

          <div className="space-y-2 p-3 rounded-md bg-muted">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('requirements')}</p>
            {passwordRequirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className={`h-3 w-3 ${req.valid ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className={`text-xs ${req.valid ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !allRequirementsMet || !passwordsMatch}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('updating')}
              </>
            ) : (
              <span className="text-black">{t('updatePassword')}</span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="container max-w-md py-12">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
