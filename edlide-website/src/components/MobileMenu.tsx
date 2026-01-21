'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

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
        <div className="absolute top-16 left-0 right-0 bg-secondary border-b shadow-lg">
          <div className="container py-4 space-y-3 text-center">
            <Link
              href="/download"
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-accent"
              onClick={() => setIsOpen(false)}
            >
              Download
            </Link>

            <Link
              href="/docs"
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-accent"
              onClick={() => setIsOpen(false)}
            >
              Docs
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}