'use client'

import { useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('edlide-theme') as Theme
    if (stored) {
      setThemeState(stored)
    } else {
      // Default to light theme if no preference stored
      setThemeState('light')
    }
    setMounted(true)
  }, [])

  // Apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(newTheme)
  }, [])

  // Update theme when state changes
  useEffect(() => {
    if (!mounted) return
    applyTheme(theme)
  }, [theme, mounted, applyTheme])

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setThemeState(newTheme)
    localStorage.setItem('edlide-theme', newTheme)
    applyTheme(newTheme)
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('edlide-theme', newTheme)
    applyTheme(newTheme)
  }

  return { theme, setTheme, toggleTheme, mounted }
}