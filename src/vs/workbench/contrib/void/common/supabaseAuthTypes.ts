/**
 * Supabase authentication tokens for IDE integration
 */

export interface SupabaseTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user_id: string;
  user_email: string;
}

export interface IDEPendingTokensResponse {
  ready: boolean;
  tokens?: SupabaseTokens;
  success?: boolean;
}

export interface IDEAuthState {
  connected: boolean;
  user_email?: string;
  user_id?: string;
}

export interface IDEAuthService {
  getTokens(): Promise<SupabaseTokens | null>;
  saveTokens(tokens: SupabaseTokens): Promise<void>;
  removeTokens(): Promise<void>;
  isTokenValid(): Promise<boolean>;
  getAuthState(): IDEAuthState;
}