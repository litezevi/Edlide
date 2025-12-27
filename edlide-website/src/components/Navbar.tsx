'use client'

import Link from 'next/link'
import { MobileMenu } from './MobileMenu'
import { SupabaseAuthButton } from './layout/supabase-auth-button'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 backdrop-blur-md bg-background/80">
      <div className="container flex h-16 items-center">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
            Edlide
          </Link>
        </div>
        
        {/* Center - Navigation */}
        <div className="flex-1 flex justify-center">
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              href="/docs" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              Docs
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              href="/chat" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              Chat
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              href="/download" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              Download
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>
        </div>

        {/* Right side - Account */}
        <div className="flex items-center">
          <div className="hidden md:block">
            <SupabaseAuthButton />
          </div>
          
          <MobileMenu />
        </div>
      </div>
    </nav>
  )
}