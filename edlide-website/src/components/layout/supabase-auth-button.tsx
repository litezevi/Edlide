'use client'

import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { SupabaseSignInForm } from '@/components/auth/supabase-signin-button'
import { User, LogOut } from 'lucide-react'
import { useLocale } from 'next-intl'

export function SupabaseAuthButton() {
  const { user, isLoading, signOut } = useSupabaseAuth()
  const locale = useLocale()
  const localePath = (path: string) => locale === 'ru' ? path : `/${locale}${path}`
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </Button>
    )
  }

  if (!user) {
    return (
      <div ref={containerRef} className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          Sign In
        </Button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md z-[200]">
            <div className="space-y-1 mb-3">
              <h4 className="font-medium">Sign In</h4>
              <p className="text-xs text-muted-foreground">
                Enter your email and password to access your account
              </p>
            </div>
            <SupabaseSignInForm />
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        className="relative h-8 w-8 rounded-full"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
            {user.email?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-md border border-border bg-popover text-popover-foreground shadow-md z-[200] overflow-hidden">
          <div className="p-3">
            <p className="font-medium text-sm break-all">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">ID: {user.id}</p>
          </div>
          <div className="h-px bg-border" />
          <a
            href={localePath('/account')}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User className="h-4 w-4" />
            Account
          </a>
          <div className="h-px bg-border" />
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
