'use client'

import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="border-t bg-secondary/50">
      <div className="container flex flex-col md:flex-row h-auto md:h-16 items-center justify-between px-4 py-3 md:py-0 gap-2 md:gap-0">
        <div className="text-xs md:text-sm text-muted-foreground">
          {t('rights')}
        </div>
        <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
          <a href="/privacy-policy" className="hover:text-foreground transition-colors whitespace-nowrap">{t('privacy')}</a>
          <span className="text-muted-foreground/30">•</span>
          <a href="/terms-of-use" className="hover:text-foreground transition-colors whitespace-nowrap">{t('terms')}</a>
          <span className="text-muted-foreground/30">•</span>
          <a href="/licenses" className="hover:text-foreground transition-colors whitespace-nowrap">{t('licenses')}</a>
          <span className="text-muted-foreground/30">•</span>
          <a href="/contact" className="hover:text-foreground transition-colors whitespace-nowrap">{t('contact')}</a>
        </div>
        <div className="text-xs md:text-sm text-muted-foreground">
          {t('built')}
        </div>
      </div>
    </footer>
  )
}
