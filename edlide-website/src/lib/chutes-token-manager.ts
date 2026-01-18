import { createClient } from '@supabase/supabase-js'
import { TokenEncryption } from './token-encryption'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const clientId = process.env.NEXT_PUBLIC_CHUTES_CLIENT_ID!
const clientSecret = process.env.CHUTES_CLIENT_SECRET!

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 минут до истечения

interface ChutesTokens {
  encrypted_access_token: string
  encrypted_refresh_token: string | null
  encryption_iv: string
  expires_at: string | null
}

interface RefreshResult {
  success: boolean
  accessToken?: string
  error?: string
}

export class ChutesTokenManager {
  private static refreshInProgress: Map<string, Promise<RefreshResult>> = new Map()

  private static isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return true
    const expiryTime = new Date(expiresAt).getTime()
    return Date.now() >= expiryTime
  }

  private static isTokenExpiringSoon(expiresAt: string | null, thresholdMs: number = REFRESH_THRESHOLD_MS): boolean {
    if (!expiresAt) return true
    const expiryTime = new Date(expiresAt).getTime()
    return (expiryTime - Date.now()) < thresholdMs
  }

  private static async refreshToken(userId: string, encryptedRefreshToken: string, encryptionIv: string): Promise<RefreshResult> {
    try {
      console.log(`[ChutesTokenManager] Refreshing token for user: ${userId}`)

      const decryptedRefreshToken = TokenEncryption.decrypt(encryptedRefreshToken, encryptionIv)
      if (!decryptedRefreshToken) {
        return { success: false, error: 'Failed to decrypt refresh token' }
      }

      const response = await fetch('https://idp.chutes.ai/idp/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: decryptedRefreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[ChutesTokenManager] Refresh failed: ${errorText}`)
        return { success: false, error: `Refresh failed: ${response.status}` }
      }

      const newTokens = await response.json()

      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
      const { encrypted: newEncryptedAccess, iv: newIv } = TokenEncryption.encrypt(newTokens.access_token)
      const { encrypted: newEncryptedRefresh } = TokenEncryption.encrypt(
        newTokens.refresh_token || decryptedRefreshToken,
        Buffer.from(newIv, 'base64')
      )

      const { error: updateError } = await adminSupabase
        .from('chutes_tokens')
        .update({
          encrypted_access_token: newEncryptedAccess,
          encrypted_refresh_token: newEncryptedRefresh,
          encryption_iv: newIv,
          expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error(`[ChutesTokenManager] Failed to update token in DB: ${updateError}`)
        return { success: false, error: 'Failed to save new token' }
      }

      console.log(`[ChutesTokenManager] Token refreshed successfully for user: ${userId}`)
      return { success: true, accessToken: newTokens.access_token }
    } catch (error) {
      console.error(`[ChutesTokenManager] Token refresh error: ${error}`)
      return { success: false, error: String(error) }
    }
  }

  static async getValidAccessToken(userId: string): Promise<{ accessToken: string; refreshed: boolean } | null> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: tokens, error } = await supabase
        .from('chutes_tokens')
        .select('encrypted_access_token, encrypted_refresh_token, encryption_iv, expires_at')
        .eq('user_id', userId)
        .single()

      if (error || !tokens) {
        console.error(`[ChutesTokenManager] No tokens found for user: ${userId}`)
        return null
      }

      const isExpired = this.isTokenExpired(tokens.expires_at)
      const isExpiringSoon = this.isTokenExpiringSoon(tokens.expires_at)

      if (!isExpired && !isExpiringSoon) {
        const accessToken = TokenEncryption.decrypt(tokens.encrypted_access_token, tokens.encryption_iv || '')
        if (accessToken) {
          return { accessToken, refreshed: false }
        }
      }

      if (!tokens.encrypted_refresh_token) {
        console.error(`[ChutesTokenManager] No refresh token available for user: ${userId}`)
        return null
      }

      let refreshPromise = this.refreshInProgress.get(userId)
      if (!refreshPromise) {
        refreshPromise = this.refreshToken(userId, tokens.encrypted_refresh_token, tokens.encryption_iv || '')
        this.refreshInProgress.set(userId, refreshPromise)
      }

      const result = await refreshPromise
      this.refreshInProgress.delete(userId)

      if (result.success && result.accessToken) {
        return { accessToken: result.accessToken, refreshed: true }
      }

      return null
    } catch (error) {
      console.error(`[ChutesTokenManager] Error getting access token: ${error}`)
      return null
    }
  }

  static async refreshIfNeeded(userId: string): Promise<boolean> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: tokens, error } = await supabase
        .from('chutes_tokens')
        .select('encrypted_refresh_token, encryption_iv, expires_at')
        .eq('user_id', userId)
        .single()

      if (error || !tokens) {
        return false
      }

      const isExpired = this.isTokenExpired(tokens.expires_at)
      const isExpiringSoon = this.isTokenExpiringSoon(tokens.expires_at)

      if (!isExpired && !isExpiringSoon) {
        return false
      }

      if (!tokens.encrypted_refresh_token) {
        console.warn(`[ChutesTokenManager] Token expired but no refresh token available for user: ${userId}`)
        return false
      }

      console.log(`[ChutesTokenManager] Token expired=${isExpired}, expiringSoon=${isExpiringSoon}, refreshing...`)
      const result = await this.refreshToken(userId, tokens.encrypted_refresh_token, tokens.encryption_iv || '')
      return result.success
    } catch (error) {
      console.error(`[ChutesTokenManager] Error checking/refresh token: ${error}`)
      return false
    }
  }

  static async getTokensInfo(userId: string): Promise<{
    linked: boolean
    expiresAt: string | null
    isExpired: boolean
    isExpiringSoon: boolean
  } | null> {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: tokens, error } = await supabase
        .from('chutes_tokens')
        .select('expires_at')
        .eq('user_id', userId)
        .single()

      if (error || !tokens) {
        return null
      }

      return {
        linked: true,
        expiresAt: tokens.expires_at,
        isExpired: this.isTokenExpired(tokens.expires_at),
        isExpiringSoon: this.isTokenExpiringSoon(tokens.expires_at),
      }
    } catch (error) {
      console.error(`[ChutesTokenManager] Error getting tokens info: ${error}`)
      return null
    }
  }
}