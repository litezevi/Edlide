import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const locales = ['ru', 'en']
const defaultLocale = 'ru'

export default getRequestConfig(async ({ requestLocale }) => {
  // Try requestLocale first (set by setRequestLocale in layout)
  let locale = await requestLocale

  if (!locale || !locales.includes(locale)) {
    // Fall back to NEXT_LOCALE cookie (set by middleware on previous request)
    const cookieStore = await cookies()
    const fromCookie = cookieStore.get('NEXT_LOCALE')?.value
    locale = (fromCookie && locales.includes(fromCookie)) ? fromCookie : defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
