/**
 * Supabase Client Configuration (Browser)
 *
 * This is the SINGLE shared Supabase client for all browser-side usage.
 * Do NOT create additional clients — use this export everywhere to avoid
 * race conditions during token refresh.
 *
 * Session is persisted in localStorage (key: edlide-supabase-session).
 * Middleware additionally manages cookies for server-side session refresh
 * via @supabase/ssr (see src/lib/supabase/middleware.ts).
 *
 * autoRefreshToken: SDK refreshes JWT while tab is open.
 * Middleware refresh: JWT refreshed on every request even after long inactivity.
 * Combined: session stays alive indefinitely as long as refresh_token is valid.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'edlide-supabase-session',
    flowType: 'pkce',
  }
})