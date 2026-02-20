/**
 * Supabase Middleware Helper
 * Creates a server-side Supabase client that reads/writes cookies on each request.
 * This ensures the Supabase session (JWT + refresh_token) is automatically
 * refreshed on every navigation, keeping users logged in for as long as the
 * refresh_token is valid (effectively indefinitely with rolling expiry).
 *
 * Why: The browser-side autoRefreshToken only works while a tab is open.
 * Middleware runs on every request (even the first after days of inactivity),
 * so it can refresh the JWT before the page renders.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Start with a plain NextResponse so we can attach Set-Cookie headers.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          // 1. Set cookies on the request object so downstream server components
          //    can read the fresh session within the same request cycle.
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => {
            request.cookies.set(name, value)
          })

          // 2. Re-create response with updated request cookies.
          supabaseResponse = NextResponse.next({ request })

          // 3. Set cookies on the response so the browser persists them.
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Do NOT call supabase.auth.getSession() here.
  // getSession() reads from storage without verifying the JWT.
  // getUser() sends the token to Supabase Auth server which validates it,
  // and if the JWT is expired but refresh_token is still valid, the SDK
  // automatically refreshes the session and calls setAll() with new cookies.
  // This is the key mechanism that keeps sessions alive across long gaps.
  await supabase.auth.getUser()

  return supabaseResponse
}
