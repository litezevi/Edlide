import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect /chat to home
  if (pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Refresh Supabase session on every request.
  // This calls supabase.auth.getUser() which validates the JWT and,
  // if expired, uses the refresh_token cookie to get a new JWT.
  // The fresh tokens are written back as Set-Cookie headers.
  // This is what keeps sessions alive even after days of inactivity.
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Run on all routes EXCEPT static files, images, favicon, and _next internals.
    // This ensures session refresh happens on every page navigation.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest\\.json)$).*)',
  ],
}
