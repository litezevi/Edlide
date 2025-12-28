'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { SupabaseSignInForm } from '@/components/auth/supabase-signin-button'
import { useChutesIntegration } from '@/lib/chutes-integration'
import { User, LogOut, Settings, Link2 } from 'lucide-react'

export function SupabaseAuthButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const { user, isLoading, signOut } = useSupabaseAuth()
  const { linkedAccount, unlinkChutesAccount, refetch } = useChutesIntegration()

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleUnlinkChutes = async () => {
    if (isUnlinking) return
    setIsUnlinking(true)

    const success = await unlinkChutesAccount()
    if (success) {
      refetch()
    }

    setIsUnlinking(false)
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </Button>
    )
  }

  if (!user) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-4" align="end">
          <div className="space-y-2">
            <h4 className="font-medium">Sign In</h4>
            <p className="text-xs text-muted-foreground">
              Enter your email and password to access your account
            </p>
          </div>
          <div className="pt-2">
            <SupabaseSignInForm />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
              {user.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.email}</p>
            <p className="w-[200px] truncate text-xs text-muted-foreground">
              ID: {user.id}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/account" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            Account
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {linkedAccount ? (
          <DropdownMenuItem
            onClick={handleUnlinkChutes}
            disabled={isUnlinking}
            className="flex items-center gap-2 cursor-pointer"
          >
            {isUnlinking ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <LogOut className="h-4 w-4 text-orange-600" />
            )}
            <span className="text-orange-600">
              {isUnlinking ? 'Unlinking...' : 'Unlink Chutes'}
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <a href="/account" className="flex items-center gap-2 cursor-pointer text-green-600">
              <Link2 className="h-4 w-4" />
              <span>Link Chutes Account</span>
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}