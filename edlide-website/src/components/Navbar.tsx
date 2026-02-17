'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MobileMenu } from './MobileMenu'
import { SupabaseAuthButton } from './layout/supabase-auth-button'
import { ThemeToggle } from './ui/theme-toggle'

export function Navbar() {
  const [isLight, setIsLight] = useState(false)

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
        <Link href="/">
          <img src={edlideLogo} alt="Edlide" width={32} height={32} className="cursor-pointer" />
        </Link>

        <div className="hidden md:flex items-center ml-16 space-x-8">
          <Link
            href="/docs"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            Docs
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>

          <Link
            href="/download"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            Download
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>

          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            Pricing
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>
        </div>

        <div className="flex-1 flex justify-end items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <SupabaseAuthButton />
          </div>

          <MobileMenu />
        </div>
      </div>
    </nav>
  )
}