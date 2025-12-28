/**
 * Service interface for Supabase authentication management
 */
import { createDecorator } from '../../../../../platform/instantiation/common/instantiation.js';
import type { SupabaseTokens, IDEAuthState } from '../../common/supabaseAuthTypes.js';

export const ISupabaseAuthService = createDecorator<ISupabaseAuthService>('supabaseAuthService');

export interface ISupabaseAuthService {
  getTokens(): Promise<SupabaseTokens | null>;
  saveTokens(tokens: SupabaseTokens): Promise<void>;
  removeTokens(): Promise<void>;
  isTokenValid(): Promise<boolean>;
  getAuthState(): Promise<IDEAuthState>;
  refreshTokens(supabaseUrl: string): Promise<SupabaseTokens | null>;
  getAccessTokenSync(): string | null;
}

export interface IDEService {
  getTokens(): Promise<{ access_token: string; refresh_token: string; expires_at: string; user_id: string; user_email: string } | null>;
  saveTokens(tokens: { access_token: string; refresh_token: string; expires_at: string; user_id: string; user_email: string }): Promise<void>;
  removeTokens(): Promise<void>;
  isTokenValid(): Promise<boolean>;
  getAuthState(): Promise<{ connected: boolean; user_email?: string; user_id?: string }>;
}