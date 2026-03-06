import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'
import ResetPasswordPageClient from './_ResetPasswordContent'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')
  const locale = localeCookie?.value ?? 'ru'

  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ResetPasswordPageClient />
    </NextIntlClientProvider>
  )
}
