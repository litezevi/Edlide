'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const defaultLocale = 'ru'

export function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return

    startTransition(() => {
      // pathname from next/navigation always includes the locale prefix
      // e.g. on /ru/docs -> pathname = "/ru/docs"
      //      on /en/docs -> pathname = "/en/docs"
      //      on /ru      -> pathname = "/ru"

      // Strip current locale prefix to get the "bare" path
      let bare: string
      if (pathname === `/${locale}`) {
        bare = '/'
      } else if (pathname.startsWith(`/${locale}/`)) {
        bare = pathname.slice(locale.length + 1) // e.g. "/docs"
      } else {
        bare = pathname
      }

      // Build target path
      let target: string
      if (newLocale === defaultLocale) {
        // ru has no prefix in URL — but our middleware rewrites / to /ru internally
        // So navigate to bare path (middleware will rewrite to /ru/...)
        target = bare === '/' ? '/' : bare
      } else {
        // non-default locale gets explicit prefix
        target = `/${newLocale}${bare === '/' ? '' : bare}`
      }

      router.push(target)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-border/50 bg-background/50 p-1">
      <button
        onClick={() => switchLocale('ru')}
        disabled={isPending}
        className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
          locale === 'ru'
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {t('ru')}
      </button>
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
          locale === 'en'
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {t('en')}
      </button>
    </div>
  )
}
