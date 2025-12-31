'use client'

import { useState, useEffect, useCallback } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useChutesAuth } from '@/lib/chutes-auth'
import { ChutesSignInButton } from '@/components/auth/chutes-signin-button'
import { User, LogOut, Settings, Shield } from 'lucide-react'

export function ChutesAuthButton() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { getCurrentUser, isAuthenticated, signOut } = useChutesAuth()

  useEffect(() => {
    const loadUser = () => {
      try {
        if (isAuthenticated()) {
          const userData = getCurrentUser()
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, []) // Remove dependencies to prevent infinite re-renders

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </Button>
    )
  }

  if (!user) {
    return <ChutesSignInButton variant="outline" size="sm" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs overflow-hidden p-0">
              <img
                src="/chutesLogo.png"
                alt="Chutes"
                className="h-full w-full object-cover"
              />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.username}</p>
            <p className="w-[200px] truncate text-xs text-muted-foreground">
              ID: {user.sub}
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
        <DropdownMenuItem asChild>
          <a href="/account" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => window.open('https://chutes.ai', '_blank')}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Manage Chutes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}