'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface LinkedChutesAccount {
  chutes_user_id: string
  username: string
  created_at: string
}

export function useChutesIntegration() {
  const [linkedAccount, setLinkedAccount] = useState<LinkedChutesAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getSupabaseSession = async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  const fetchLinkedAccount = async () => {
    try {
      const session = await getSupabaseSession()
      if (!session) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/chutes/unlink', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch linked account')
      }

      const data = await response.json()
      setLinkedAccount(data.data)
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching linked account:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch linked account')
      setIsLoading(false)
    }
  }

  const unlinkChutesAccount = async () => {
    try {
      const session = await getSupabaseSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/auth/chutes/unlink', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to unlink account')
      }

      localStorage.removeItem('chutes_access_token')
      localStorage.removeItem('chutes_refresh_token')
      localStorage.removeItem('chutes_user')

      setLinkedAccount(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink account')
      return false
    }
  }

  useEffect(() => {
    fetchLinkedAccount()

    // Background token refresh - runs every 15 minutes
    const refreshInterval = setInterval(async () => {
      try {
        const session = await getSupabaseSession()
        if (!session) {
          return
        }

        const response = await fetch('/api/auth/chutes/refresh', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.refreshed) {
            console.log('[Chutes Integration] Token proactively refreshed')
          }
        }
      } catch (err) {
        // Silently fail - refresh will happen on next chat request
        console.debug('[Chutes Integration] Background refresh failed:', err)
      }
    }, 15 * 60 * 1000) // 15 minutes

    return () => {
      clearInterval(refreshInterval)
    }
  }, [])

  return {
    linkedAccount,
    isLoading,
    error,
    unlinkChutesAccount,
    refetch: fetchLinkedAccount,
  }
}