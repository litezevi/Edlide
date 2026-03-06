import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['ru', 'en']
const defaultLocale = 'ru'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect /chat to home
  if (pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Skip for API routes, auth, static
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.includes('/account/reset-password')
  ) {
    return NextResponse.next()
  }

  // Check if pathname already starts with a known locale prefix
  // e.g. /en, /en/docs, /ru, /ru/docs
  const pathnameLocale = locales.find(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
  )

  let rewritePathname: string
  let locale: string

  if (pathnameLocale) {
    // URL already has locale prefix — rewrite as-is so [locale] segment picks it up
    rewritePathname = pathname
    locale = pathnameLocale
  } else {
    // No locale prefix — serve default locale (ru), rewrite to /ru/<rest>
    rewritePathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`
    locale = defaultLocale
  }

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = rewritePathname

  // Pass locale in request headers so next-intl Server Components can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('X-NEXT-INTL-LOCALE', locale)

  let response = NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeaders },
  })
  response.cookies.set('NEXT_LOCALE', locale)

  // Refresh Supabase session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => {
            request.cookies.set(name, value)
          })
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2|woff|ttf|otf|manifest\\.json)$).*)',
  ],
}
