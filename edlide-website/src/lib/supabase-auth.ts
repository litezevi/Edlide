/**
 * Supabase Authentication Hook
 * Handles sign in, sign up, sign out, and session management
 * Uses single shared Supabase client from supabase.ts to prevent race conditions
 * Session persistence via cookies (@supabase/ssr) + localStorage fallback
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface SupabaseUser {
  id: string
  email?: string
  email_confirmed_at?: string
  created_at?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initSession = async () => {
      // On reset-password page — skip getSession, let onAuthStateChange handle it
      // to avoid setting user from a recovery session
      if (typeof window !== 'undefined' &&
          window.location.pathname === '/account/reset-password') {
        setIsLoading(false)
        return
      }

      // Try getSession first (reads from storage without network call)
      const { data: { session: currentSession } } = await supabase.auth.getSession()

      if (currentSession) {
        setSession(currentSession)
        setUser(currentSession.user)
        setIsLoading(false)
        return
      }

      // If getSession returned null, the JWT may be expired but refresh_token
      // may still be valid. getUser() triggers a server-side validation and
      // automatic token refresh if possible.
      const { data: { user: recoveredUser } } = await supabase.auth.getUser()
      if (recoveredUser) {
        // getUser succeeded — the SDK refreshed the session internally.
        // Re-read the now-valid session from storage.
        const { data: { session: refreshedSession } } = await supabase.auth.getSession()
        setSession(refreshedSession)
        setUser(refreshedSession?.user ?? recoveredUser)
      }

      setIsLoading(false)
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // PASSWORD_RECOVERY must not establish a user session globally —
      // the reset-password page handles it in isolation
      if (event === 'PASSWORD_RECOVERY') return
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      throw error
    }

    return data
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Supabase signOut exception:', err)
    }

    // Only remove specific keys — do NOT clear entire localStorage.
    // supabase.auth.signOut() already removes the session from its storage.
    // We only need to clean up app-specific keys that are no longer relevant.
    if (typeof window !== 'undefined') {
      const keysToRemove = [
        'chutes_access_token',
        'chutes_refresh_token',
        'chutes_user',
        'chutes_expires_in',
      ]
      keysToRemove.forEach((key) => localStorage.removeItem(key))
      sessionStorage.clear()

      window.location.href = '/'
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/account/reset-password`,
    })

    if (error) {
      throw error
    }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw error
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'github' = 'google') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/account`,
        scopes: 'openid email profile',
      },
    })

    if (error) {
      throw error
    }

    return data
  }

  const signUpWithOAuth = async (provider: 'google' | 'github' = 'google') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/account`,
        scopes: 'openid email profile',
      },
    })

    if (error) {
      throw error
    }

    return data
  }

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithOAuth,
    signUpWithOAuth,
  }
}