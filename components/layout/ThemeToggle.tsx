'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

export function ThemeToggle() {
  // Always start with false to match server render (prevents hydration mismatch)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted to indicate client-side hydration is complete
    setMounted(true)
    
    // Read theme from localStorage after mount
    const storedTheme = localStorage.getItem('theme')
    const shouldBeDark = storedTheme === 'dark'
    setIsDark(shouldBeDark)
    
    // Sync theme class on mount
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Don't render the switch until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <Sun className="h-4 w-4" />
        <Switch checked={false} onCheckedChange={() => {}} disabled />
        <Moon className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4" />
      <Switch checked={isDark} onCheckedChange={toggleTheme} />
      <Moon className="h-4 w-4" />
    </div>
  )
}

