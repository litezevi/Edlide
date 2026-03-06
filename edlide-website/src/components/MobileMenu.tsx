'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ui/theme-toggle'
import { LanguageSwitcher } from './ui/language-switcher'
import { Menu, X } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export function MobileMenu() {
  const t = useTranslations('mobileMenu')
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  const localePath = (path: string) =>
    locale === 'ru' ? path : `/${locale}${path}`

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 text-muted-foreground hover:text-primary"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b border-border/50 backdrop-blur-md shadow-lg">
          <div className="container py-4 space-y-3">
            <div className="flex justify-center gap-3 mb-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            <Link
              href={localePath('/download')}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-accent text-center"
              onClick={() => setIsOpen(false)}
            >
              {t('download')}
            </Link>

            <Link
              href={localePath('/docs')}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-accent text-center"
              onClick={() => setIsOpen(false)}
            >
              {t('docs')}
            </Link>

            <Link
              href={localePath('/pricing')}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-accent text-center"
              onClick={() => setIsOpen(false)}
            >
              {t('pricing')}
            </Link>

            <div className="pt-4 border-t border-border/50">
              <Link
                href={localePath('/account')}
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-accent text-center"
                onClick={() => setIsOpen(false)}
              >
                {t('account')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
