'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm font-medium"
      >
        <div className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4" />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          <span>Dark</span>
        </>
      )}
    </button>
  )
}