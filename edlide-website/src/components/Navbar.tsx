'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MobileMenu } from './MobileMenu'
import { SupabaseAuthButton } from './layout/supabase-auth-button'
import { ThemeToggle } from './ui/theme-toggle'
import { LanguageSwitcher } from './ui/language-switcher'
import { useTranslations, useLocale } from 'next-intl'

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const [isLight, setIsLight] = useState(false)

  const localePath = (path: string) => `/${locale}${path}`

  useEffect(() => {
    const checkTheme = () => {
      setIsLight(document.documentElement.classList.contains('light'))
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const edlideLogo = isLight ? '/EdlideLogoLight.png' : '/EdlideLogoDark.png'

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 backdrop-blur-md bg-background/80">
      <div className="container flex h-16 items-center">
        <Link href={localePath('/')}>
          <img src={edlideLogo} alt="Edlide" width={32} height={32} className="cursor-pointer" />
        </Link>

        <div className="hidden md:flex items-center ml-16 space-x-8">
          <Link
            href={localePath('/docs')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            {t('docs')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>

          <Link
            href={localePath('/download')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            {t('download')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>

          <Link
            href={localePath('/pricing')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            {t('pricing')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>

          <Link
            href={localePath('/team')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            {t('team')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>
        </div>

        <div className="flex-1 flex justify-end items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <SupabaseAuthButton />
          </div>

          <MobileMenu />
        </div>
      </div>
    </nav>
  )
}
