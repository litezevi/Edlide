import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Server-side Route Handler for email verification flows (recovery, signup, etc.)
 *
 * This handles the Supabase email verification in a way that works reliably with PKCE:
 * - Accepts `token_hash` + `type` params from customized email templates
 * - Also accepts `code` param from default Supabase email templates (PKCE redirect)
 * - Uses server-side verifyOtp which does NOT require a PKCE code verifier,
 *   so it works even when the user opens the email link in a different browser.
 *
 * For password recovery: redirects to /account/reset-password after verification.
 * For other types (signup confirm, etc.): redirects to /account.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'

  const redirectTo = request.nextUrl.clone()
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('code')
  redirectTo.searchParams.delete('next')

  // Create a server-side Supabase client that reads/writes cookies
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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  let verified = false

  // Approach 1: token_hash + type (recommended for email flows)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      verified = true
    } else {
      console.error('[AUTH CONFIRM] verifyOtp failed:', error.message)
    }
  }

  // Approach 2: PKCE code exchange (fallback for default email templates)
  if (!verified && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      verified = true
    } else {
      console.error('[AUTH CONFIRM] exchangeCodeForSession failed:', error.message)
    }
  }

  if (verified) {
    // For recovery type, redirect to the password reset form
    if (type === 'recovery' || next === '/account/reset-password') {
      redirectTo.pathname = '/account/reset-password'
    } else {
      redirectTo.pathname = next
    }

    // Build redirect response and copy session cookies from supabaseResponse
    const redirect = NextResponse.redirect(redirectTo)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie.name, cookie.value)
    })
    return redirect
  }

  // Verification failed — redirect to error/sign-in
  redirectTo.pathname = '/account'
  redirectTo.searchParams.set('error', 'invalid_recovery_link')
  return NextResponse.redirect(redirectTo)
}
