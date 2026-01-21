import { ISecretStorageService } from '../../../../platform/secrets/common/secrets.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import type { SupabaseTokens, IDEAuthState } from '../common/supabaseAuthTypes.js';
import { SupabaseAuthHelper } from '../common/supabaseAuthHelper.js';

export const ISupabaseAuthService = createDecorator<SupabaseAuthService>('supabaseAuthService');

/**
 * Service for managing Supabase authentication tokens securely in IDE
 * Uses website API for token refresh (secure, no browser popups)
 */
export class SupabaseAuthService {
  private static readonly TOKENS_KEY = 'edlide.supabase.tokens';
  private static readonly AUTH_STATE_KEY = 'edlide.supabase.authState';
  private static readonly WEBSITE_URL = 'https://edlide.com';
  private static readonly REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute for testing
  private static readonly REFRESH_BEFORE_EXPIRE_MS = 30 * 1000; // 30 seconds for testing

  private _onDidChangeAuthState = new Emitter<IDEAuthState>();
  readonly onDidChangeAuthState: Event<IDEAuthState> = this._onDidChangeAuthState.event;

  private _tokens: SupabaseTokens | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private _initialized = false;

  constructor(
    @ISecretStorageService private readonly secretStorage: ISecretStorageService
  ) {
    console.log('[SupabaseAuth] Service constructed, initializing...');
    this._initialize();
  }

  /**
   * Initialize tokens immediately - called from constructor
   */
  private async _initialize(): Promise<void> {
    if (this._initialized) return;

    try {
      await this.getTokens();
      this._initialized = true;
      console.log('[SupabaseAuth] Initialization complete, tokens loaded:', !!this._tokens);
    } catch (error) {
      console.error('[SupabaseAuth] Initialization error:', error);
    }
  }

  /**
   * Get stored tokens from secure storage
   */
  async getTokens(): Promise<SupabaseTokens | null> {
    try {
      if (!this._tokens) {
        const tokensJson = await this.secretStorage.get(
          SupabaseAuthService.TOKENS_KEY
        );
        if (tokensJson) {
          this._tokens = JSON.parse(tokensJson);
          console.log('[SupabaseAuth] Loaded tokens from secure storage');

          // Update sync cache for immediate access
          if (this._tokens) {
            SupabaseAuthHelper.setAccessToken(this._tokens.access_token);
          }
        }
      }
      return this._tokens;
    } catch (error) {
      console.error('[SupabaseAuth] Error loading tokens:', error);
      return null;
    }
  }

  /**
   * Save tokens to secure storage
   */
  async saveTokens(tokens: SupabaseTokens): Promise<void> {
    try {
      this._tokens = tokens;
      await this.secretStorage.set(
        SupabaseAuthService.TOKENS_KEY,
        JSON.stringify(tokens)
      );

      // Update auth state
      const authState: IDEAuthState = {
        connected: true,
        user_email: tokens.user_email,
        user_id: tokens.user_id
      };
      await this.secretStorage.set(
        SupabaseAuthService.AUTH_STATE_KEY,
        JSON.stringify(authState)
      );

      // Update cache for sync access
      SupabaseAuthHelper.setAccessToken(tokens.access_token);

      // Start auto-refresh timer
      this.startAutoRefresh();

      this._onDidChangeAuthState.fire(authState);
      console.log('[SupabaseAuth] Tokens saved securely:', {
        user_email: tokens.user_email,
        user_id: tokens.user_id
      });
    } catch (error) {
      console.error('[SupabaseAuth] Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Remove tokens from storage (disconnect)
   */
  async removeTokens(): Promise<void> {
    try {
      this._tokens = null;
      await this.secretStorage.delete(SupabaseAuthService.TOKENS_KEY);
      await this.secretStorage.delete(SupabaseAuthService.AUTH_STATE_KEY);

      // Clear the sync cache as well
      SupabaseAuthHelper.setAccessToken(null);

      // Stop auto-refresh timer
      this.stopAutoRefresh();

      const authState: IDEAuthState = { connected: false };
      this._onDidChangeAuthState.fire(authState);
      console.log('[SupabaseAuth] Tokens removed');
    } catch (error) {
      console.error('[SupabaseAuth] Error removing tokens:', error);
      throw error;
    }
  }

  /**
   * Check if tokens are valid (not expired)
   */
  async isTokenValid(): Promise<boolean> {
    const tokens = await this.getTokens();
    if (!tokens) {
      return false;
    }

    try {
      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();
      const isValid = expiresAt > now;

      if (!isValid) {
        console.log('[SupabaseAuth] Tokens expired on:', expiresAt);
      }

      return isValid;
    } catch (error) {
      console.error('[SupabaseAuth] Error validating tokens:', error);
      return false;
    }
  }

  /**
   * Get current auth state
   */
  async getAuthState(): Promise<IDEAuthState> {
    const tokens = await this.getTokens();
    const isValid = await this.isTokenValid();

    if (tokens && isValid) {
      return {
        connected: true,
        user_email: tokens.user_email,
        user_id: tokens.user_id
      };
    }

    return { connected: false };
  }

  /**
   * Get fresh access token using API key
   * API key is independent of browser session
   */
  async refreshTokens(supabaseUrl: string): Promise<SupabaseTokens | null> {
    try {
      const tokens = await this.getTokens();
      if (!tokens) {
        console.log('[SupabaseAuth] No tokens to refresh');
        return null;
      }

      console.log('[SupabaseAuth] Getting fresh access token via API key...');

      const response = await fetch(`https://edlide.com/api/ide/get-access-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': tokens.access_token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[SupabaseAuth] Get token failed:', errorData.error);
        return null;
      }

      const data = await response.json();

      if (!data.success || !data.tokens) {
        console.error('[SupabaseAuth] Invalid response:', data);
        return null;
      }

      const newTokens: SupabaseTokens = {
        access_token: data.tokens.access_token,
        refresh_token: data.tokens.refresh_token,
        expires_at: data.tokens.expires_at,
        user_id: data.tokens.user_id,
        user_email: data.tokens.user_email
      };

      await this.saveTokens(newTokens);
      console.log('[SupabaseAuth] Access token refreshed successfully');
      return newTokens;
    } catch (error) {
      console.error('[SupabaseAuth] Error refreshing tokens:', error);
      return null;
    }
  }

  /**
   * Synchronously get access token from cached memory (for immediate use)
   * Returns null if not cached
   */
  getAccessTokenSync(): string | null {
    return this._tokens?.access_token || null;
  }

  /**
   * Check if auth is ready (initialization complete)
   */
  isReady(): boolean {
    return this._initialized && this._tokens !== null;
  }

  /**
   * Wait for initialization to complete (for critical paths)
   */
  async whenReady(): Promise<void> {
    if (this._initialized) return;
    await this._initialize();
  }

  /**
   * Get access token, refresh if expired
   */
  async getOrRefreshToken(): Promise<string | null> {
    const tokens = await this.getTokens();

    if (!tokens) {
      return null;
    }

    const isValid = await this.isTokenValid();
    if (!isValid) {
      console.log('[SupabaseAuth] Token invalid, refreshing...');
      const newTokens = await this.refreshTokens(SupabaseAuthService.WEBSITE_URL);
      return newTokens?.access_token || null;
    }

    return tokens.access_token;
  }

  /**
    * Start automatic token refresh timer
    * Called on IDE startup to ensure continuous session
    */
  startAutoRefresh(): void {
    this.stopAutoRefresh();

    console.log('[SupabaseAuth] Starting auto-refresh timer (1 min for testing)');

    this.refreshTimer = setInterval(async () => {
      try {
        const tokens = await this.getTokens();
        if (!tokens) {
          console.log('[SupabaseAuth] Timer: No tokens to refresh');
          return;
        }

        const isValid = await this.isTokenValid();
        const expiresAt = new Date(tokens.expires_at).getTime();
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        console.log('[SupabaseAuth] Timer check:', {
          isValid,
          expiresIn: Math.floor(timeUntilExpiry / 1000) + 's',
          willRefresh: !isValid || timeUntilExpiry < SupabaseAuthService.REFRESH_BEFORE_EXPIRE_MS
        });

        if (!isValid) {
          console.log('[SupabaseAuth] Token expired, auto-refreshing...');
          await this.refreshTokens(SupabaseAuthService.WEBSITE_URL);
          console.log('[SupabaseAuth] Token refreshed successfully');
        } else if (timeUntilExpiry < SupabaseAuthService.REFRESH_BEFORE_EXPIRE_MS) {
          console.log('[SupabaseAuth] Token expiring soon, proactive refresh...');
          await this.refreshTokens(SupabaseAuthService.WEBSITE_URL);
        }
      } catch (error) {
        console.error('[SupabaseAuth] Auto-refresh failed:', error);
      }
    }, SupabaseAuthService.REFRESH_INTERVAL_MS);
  }

  /**
   * Stop automatic token refresh timer
   */
  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('[SupabaseAuth] Auto-refresh timer stopped');
    }
  }
}

// Register singleton
registerSingleton(ISupabaseAuthService, SupabaseAuthService, InstantiationType.Eager);
