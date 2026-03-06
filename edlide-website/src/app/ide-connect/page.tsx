import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'
import IDEConnectContent from './_IDEConnectContent'

export const dynamic = 'force-dynamic'

export default async function IDEConnectPage() {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'ru'
  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <IDEConnectContent />
    </NextIntlClientProvider>
  )
}
