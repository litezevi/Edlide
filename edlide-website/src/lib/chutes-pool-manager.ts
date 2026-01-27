import { createClient } from '@supabase/supabase-js'
import { TokenEncryption } from './token-encryption'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const clientId = process.env.NEXT_PUBLIC_CHUTES_CLIENT_ID!
const clientSecret = process.env.CHUTES_CLIENT_SECRET!

const POOL_ACCOUNTS_TABLE = 'chutes_pool_accounts'

interface PoolAccount {
  id: string
  account_name: string
  access_key: string
  encrypted_access_token: string
  encrypted_refresh_token: string | null
  encryption_iv: string
  expires_at: string | null
  daily_limit: number
  rpm_limit: number
  used_today: number
  requests_per_minute: number
  last_request_at: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface PoolAccountResult {
  success: boolean
  account?: PoolAccount
  accessToken?: string
  error?: string
}

interface AddAccountParams {
  accountName: string
  accessKey: string
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

export class ChutesAccountPoolManager {
  private static refreshInProgress: Map<string, Promise<PoolAccountResult>> = new Map()

  private static isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return true
    const expiryTime = new Date(expiresAt).getTime()
    return Date.now() >= expiryTime
  }

  private static async refreshAccountToken(accountId: string, encryptedRefreshToken: string, encryptionIv: string): Promise<PoolAccountResult> {
    try {
      console.log(`[ChutesPoolManager] Refreshing token for account: ${accountId}`)

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
        console.error(`[ChutesPoolManager] Token refresh failed: ${errorText}`)
        return { success: false, error: `Refresh failed: ${response.status}` }
      }

      const newTokens = await response.json()

      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
      const { encrypted: newEncryptedAccess, iv: newIv } = TokenEncryption.encrypt(newTokens.access_token)
      const { encrypted: newEncryptedRefresh } = TokenEncryption.encrypt(
        newTokens.refresh_token || decryptedRefreshToken,
        Buffer.from(newIv, 'base64')
      )

      const expiresAt = new Date(Date.now() + (newTokens.expires_in || 3600) * 1000).toISOString()

      const { error: updateError } = await adminSupabase
        .from(POOL_ACCOUNTS_TABLE)
        .update({
          encrypted_access_token: newEncryptedAccess,
          encrypted_refresh_token: newEncryptedRefresh,
          encryption_iv: newIv,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId)

      if (updateError) {
        console.error(`[ChutesPoolManager] Failed to update token in DB: ${updateError}`)
        return { success: false, error: 'Failed to save new token' }
      }

      console.log(`[ChutesPoolManager] Token refreshed successfully for account: ${accountId}`)
      return { success: true, accessToken: newTokens.access_token }
    } catch (error) {
      console.error(`[ChutesPoolManager] Token refresh error: ${error}`)
      return { success: false, error: String(error) }
    }
  }

  static async getAvailableAccount(): Promise<{
    success: boolean
    account?: PoolAccount
    accessToken?: string
    error?: string
  }> {
    try {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

      const { data: accountData, error } = await adminSupabase
        .rpc('get_next_chutes_account')
        .maybeSingle()

      if (error) {
        console.error(`[ChutesPoolManager] Error getting next account: ${error}`)
        return { success: false, error: error.message }
      }

      if (!accountData) {
        console.error('[ChutesPoolManager] No available accounts in pool')
        return { success: false, error: 'No available accounts in pool' }
      }

      const account = accountData as PoolAccount
      console.log(`[ChutesPoolManager] Found available account: ${account.account_name} (${account.id})`)

      const isExpired = this.isTokenExpired(account.expires_at)

      if (!isExpired) {
        const accessToken = TokenEncryption.decrypt(account.encrypted_access_token, account.encryption_iv || '')
        if (accessToken) {
          return { success: true, account, accessToken }
        }
      }

      if (!account.encrypted_refresh_token) {
        return { success: false, error: 'Account has no refresh token' }
      }

      let refreshPromise = this.refreshInProgress.get(account.id)
      if (!refreshPromise) {
        refreshPromise = this.refreshAccountToken(
          account.id,
          account.encrypted_refresh_token,
          account.encryption_iv || ''
        )
        this.refreshInProgress.set(account.id, refreshPromise)
      }

      const result = await refreshPromise
      this.refreshInProgress.delete(account.id)

      if (result.success && result.accessToken) {
        return { success: true, account, accessToken: result.accessToken }
      }

      return { success: false, error: result.error || 'Failed to refresh account token' }
    } catch (error) {
      console.error(`[ChutesPoolManager] Error getting available account: ${error}`)
      return { success: false, error: String(error) }
    }
  }

  static async recordUsage(accountId: string): Promise<boolean> {
    try {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

      const { error } = await adminSupabase
        .rpc('record_chutes_pool_usage', { p_account_id: accountId })

      if (error) {
        console.error(`[ChutesPoolManager] Failed to record usage: ${error}`)
        return false
      }

      return true
    } catch (error) {
      console.error(`[ChutesPoolManager] Error recording usage: ${error}`)
      return false
    }
  }

  static async addAccount(params: AddAccountParams): Promise<{
    success: boolean
    accountId?: string
    error?: string
  }> {
    try {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

      const { encrypted: encryptedAccess, iv: commonIv } = TokenEncryption.encrypt(params.accessToken)
      const { encrypted: encryptedRefresh } = params.refreshToken
        ? TokenEncryption.encrypt(params.refreshToken, Buffer.from(commonIv, 'base64'))
        : { encrypted: null }

      const expiresAt = params.expiresIn
        ? new Date(Date.now() + params.expiresIn * 1000).toISOString()
        : null

      const { data, error } = await adminSupabase
        .from(POOL_ACCOUNTS_TABLE)
        .insert({
          account_name: params.accountName,
          access_key: params.accessKey,
          encrypted_access_token: encryptedAccess,
          encrypted_refresh_token: encryptedRefresh,
          encryption_iv: commonIv,
          expires_at: expiresAt,
        })
        .select('id')
        .single()

      if (error) {
        console.error(`[ChutesPoolManager] Failed to add account: ${error}`)
        return { success: false, error: error.message }
      }

      console.log(`[ChutesPoolManager] Account added: ${params.accountName} (${data.id})`)
      return { success: true, accountId: data.id }
    } catch (error) {
      console.error(`[ChutesPoolManager] Error adding account: ${error}`)
      return { success: false, error: String(error) }
    }
  }

  static async removeAccount(accountId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

      const { error } = await adminSupabase
        .from(POOL_ACCOUNTS_TABLE)
        .delete()
        .eq('id', accountId)

      if (error) {
        console.error(`[ChutesPoolManager] Failed to remove account: ${error}`)
        return { success: false, error: error.message }
      }

      console.log(`[ChutesPoolManager] Account removed: ${accountId}`)
      return { success: true }
    } catch (error) {
      console.error(`[ChutesPoolManager] Error removing account: ${error}`)
      return { success: false, error: String(error) }
    }
  }

  static async getAllAccounts(): Promise<{
    success: boolean
    accounts?: PoolAccount[]
    error?: string
  }> {
    try {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

      const { data, error } = await adminSupabase
        .from(POOL_ACCOUNTS_TABLE)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(`[ChutesPoolManager] Failed to get accounts: ${error}`)
        return { success: false, error: error.message }
      }

      return { success: true, accounts: data || [] }
    } catch (error) {
      console.error(`[ChutesPoolManager] Error getting accounts: ${error}`)
      return { success: false, error: String(error) }
    }
  }

  static async getAccountById(accountId: string): Promise<{
    success: boolean
    account?: PoolAccount
    error?: string
  }> {
    try {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

      const { data, error } = await adminSupabase
        .from(POOL_ACCOUNTS_TABLE)
        .select('*')
        .eq('id', accountId)
        .single()

      if (error) {
        console.error(`[ChutesPoolManager] Failed to get account: ${error}`)
        return { success: false, error: error.message }
      }

      return { success: true, account: data }
    } catch (error) {
      console.error(`[ChutesPoolManager] Error getting account: ${error}`)
      return { success: false, error: String(error) }
    }
  }

  static async setAccountActive(accountId: string, isActive: boolean): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

      const { error } = await adminSupabase
        .from(POOL_ACCOUNTS_TABLE)
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', accountId)

      if (error) {
        console.error(`[ChutesPoolManager] Failed to update account status: ${error}`)
        return { success: false, error: error.message }
      }

      console.log(`[ChutesPoolManager] Account ${accountId} set active: ${isActive}`)
      return { success: true }
    } catch (error) {
      console.error(`[ChutesPoolManager] Error updating account status: ${error}`)
      return { success: false, error: String(error) }
    }
  }

  static async resetDailyLimits(): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

      const { error } = await adminSupabase
        .rpc('reset_chutes_pool_daily_limits')

      if (error) {
        console.error(`[ChutesPoolManager] Failed to reset daily limits: ${error}`)
        return { success: false, error: error.message }
      }

      console.log(`[ChutesPoolManager] Daily limits reset`)
      return { success: true }
    } catch (error) {
      console.error(`[ChutesPoolManager] Error resetting daily limits: ${error}`)
      return { success: false, error: String(error) }
    }
  }

  static async getPoolStats(): Promise<{
    success: boolean
    stats?: {
      totalAccounts: number
      activeAccounts: number
      totalUsedToday: number
      avgUsagePercent: number
    }
    error?: string
  }> {
    try {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

      const { data, error } = await adminSupabase
        .from(POOL_ACCOUNTS_TABLE)
        .select('used_today, daily_limit, is_active')

      if (error) {
        console.error(`[ChutesPoolManager] Failed to get stats: ${error}`)
        return { success: false, error: error.message }
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          stats: { totalAccounts: 0, activeAccounts: 0, totalUsedToday: 0, avgUsagePercent: 0 }
        }
      }

      const activeAccounts = data.filter(a => a.is_active)
      const totalUsedToday = activeAccounts.reduce((sum, a) => sum + (a.used_today || 0), 0)
      const totalDailyLimit = activeAccounts.reduce((sum, a) => sum + (a.daily_limit || 5000), 0)
      const avgUsagePercent = totalDailyLimit > 0 ? (totalUsedToday / totalDailyLimit) * 100 : 0

      return {
        success: true,
        stats: {
          totalAccounts: data.length,
          activeAccounts: activeAccounts.length,
          totalUsedToday,
          avgUsagePercent: Math.round(avgUsagePercent * 100) / 100,
        }
      }
    } catch (error) {
      console.error(`[ChutesPoolManager] Error getting stats: ${error}`)
      return { success: false, error: String(error) }
    }
  }
}