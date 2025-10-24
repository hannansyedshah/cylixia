'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark'
    setIsDark(isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
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

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4" />
      <Switch checked={isDark} onCheckedChange={toggleTheme} />
      <Moon className="h-4 w-4" />
    </div>
  )
}

