/**
 * Chutes OAuth2 Authentication Library
 * Implements Sign in with Chutes functionality
 */

export interface ChutesUser {
  sub: string          // User ID
  username: string     // Username
  email?: string       // User email (if available)
  name?: string        // Full name (if available)
  created_at?: string  // Account creation date
  account_status?: string // Account status
  billing_status?: string // Billing status from billing:read scope
  // Extended permissions available via chutes:invoke
  permissions?: string[]   // Available permissions
}

export interface ChutesAuthToken {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

export class ChutesAuth {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private baseUrl: string = 'https://idp.chutes.ai'
  private apiUrl: string = 'https://idp.chutes.ai'

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.redirectUri = redirectUri
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthorizationUrl(state?: string, scope?: string): string {
    // Default scopes for Edlide chat integration with extended permissions
    const defaultScopes = 'openid profile chutes:invoke account:read billing:read'
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scope || defaultScopes,
    })

    if (state) {
      params.append('state', state)
    }

    return `${this.baseUrl}/idp/authorize?${params.toString()}`
  }

/**
 * Exchange authorization code for access token
 */
  async exchangeCodeForToken(code: string): Promise<ChutesAuthToken> {
    const tokenData = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    }
    
    console.log('Token exchange data:', JSON.stringify(tokenData, null, 2))
    console.log('Token URL:', `${this.baseUrl}/idp/token`)
    console.log('Client ID:', this.clientId)
    console.log('Client Secret exists:', !!this.clientSecret)
    console.log('Code length:', code ? code.length : 'no code')
    console.log('Redirect URI:', this.redirectUri)
    
    const response = await fetch(`${this.baseUrl}/idp/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenData),
    })

    console.log('Token response status:', response.status)
    console.log('Token response headers:', response.headers)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token exchange error response:', errorText)
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

/**
 * Get user info from access token
 */
  async getUserInfo(accessToken: string): Promise<ChutesUser> {
    console.log('Getting user info with token:', accessToken ? 'exists' : 'missing')
    console.log('Userinfo URL:', `${this.baseUrl}/idp/userinfo`)
    
    const response = await fetch(`${this.baseUrl}/idp/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    console.log('Userinfo response status:', response.status)
    console.log('Userinfo response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Userinfo error response:', errorText)
      throw new Error(`Failed to get user info: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const userData = await response.json()
    console.log('User data received:', JSON.stringify(userData, null, 2))
    return userData
  }

/**
 * Refresh access token
 */
  async refreshToken(refreshToken: string): Promise<ChutesAuthToken> {
    const response = await fetch(`${this.baseUrl}/idp/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Revoke token
   */
  async revokeToken(token: string): Promise<void> {
    await fetch(`${this.baseUrl}/idp/token/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
      }),
    })
  }

  /**
   * Check if user is authenticated via Chutes SSO
   */
  async checkSSOStatus(): Promise<boolean> {
    try {
      // Check for existing Chutes session cookie
      const response = await fetch(`${this.baseUrl}/idp/userinfo`, {
        credentials: 'include',
      })

      return response.ok
    } catch {
      return false
    }
  }
}

/**
 * React Hook for Chutes Authentication
 */
export function useChutesAuth() {
  const clientId = process.env.NEXT_PUBLIC_CHUTES_CLIENT_ID!
  const clientSecret = process.env.CHUTES_CLIENT_SECRET!
  const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/chutes/callback` : ''

  const auth = new ChutesAuth(clientId, clientSecret, redirectUri)

  const signIn = () => {
    if (typeof window === 'undefined') return
    
    const state = generateRandomString(32)
    localStorage.setItem('chutes_oauth_state', state)
    
    const url = auth.getAuthorizationUrl(state)
    window.location.href = url
  }

  const handleCallback = async (code: string, state?: string): Promise<ChutesUser> => {
    const savedState = localStorage.getItem('chutes_oauth_state')
    
    if (state && savedState && state !== savedState) {
      throw new Error('Invalid state parameter')
    }

    localStorage.removeItem('chutes_oauth_state')

    // Exchange code for tokens via server API
    const tokenResponse = await fetch('/api/auth/chutes/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirectUri: window.location.origin + '/auth/chutes/callback',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${error}`)
    }

    const tokenData = await tokenResponse.json()
    const user = await auth.getUserInfo(tokenData.access_token)

    // Store tokens securely
    localStorage.setItem('chutes_access_token', tokenData.access_token)
    localStorage.setItem('chutes_user', JSON.stringify(user))
    if (tokenData.refresh_token) {
      localStorage.setItem('chutes_refresh_token', tokenData.refresh_token)
    }

    return user
  }

  const signOut = async () => {
    if (typeof window === 'undefined') return
    
    const accessToken = localStorage.getItem('chutes_access_token')
    if (accessToken) {
      await auth.revokeToken(accessToken)
    }

    localStorage.removeItem('chutes_access_token')
    localStorage.removeItem('chutes_refresh_token')
    localStorage.removeItem('chutes_user')
  }

  const getCurrentUser = (): ChutesUser | null => {
    if (typeof window === 'undefined') return null
    
    const userStr = localStorage.getItem('chutes_user')
    return userStr ? JSON.parse(userStr) : null
  }

  const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false
    
    return !!getCurrentUser() && !!localStorage.getItem('chutes_access_token')
  }

  return {
    signIn,
    signOut,
    handleCallback,
    getCurrentUser,
    isAuthenticated,
    checkSSOStatus: () => auth.checkSSOStatus(),
  }
}

/**
 * Utility Functions
 */
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let text = ''
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  
  return text
}

/**
 * Server-side token validation utility
 */
export async function validateChutesToken(accessToken: string): Promise<ChutesUser | null> {
  try {
    console.log('Validating token with length:', accessToken ? accessToken.length : 'no token')
    const response = await fetch('https://idp.chutes.ai/idp/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    console.log('Token validation response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token validation error:', errorText)
      return null
    }

    const userData = await response.json()
    console.log('Token validation successful for user:', userData.username)
    return userData
  } catch (error) {
    console.error('Token validation exception:', error)
    return null
  }
}

/**
 * API route handler for token validation
 */
export interface ChutesSession {
  user: ChutesUser
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

export async function createChutesSession(tokenResponse: ChutesAuthToken): Promise<ChutesSession> {
  const user = await validateChutesToken(tokenResponse.access_token)
  
  if (!user) {
    throw new Error('Invalid access token')
  }

  return {
    user,
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
  }
}