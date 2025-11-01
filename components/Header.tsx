'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/store/useSessionStore'
import { ThemeToggle } from './ThemeToggle'
import { supabase } from '@/lib/supabaseClient'

export function Header() {
  const pathname = usePathname()
  const { user, setUser } = useSessionStore()
  const [actualUser, setActualUser] = useState<any>(null)
  const [now, setNow] = useState<Date>(new Date())
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  // Check actual Supabase session on mount and set up auth listener once
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setActualUser(session?.user || null)
      // Initial sync with Zustand store
      setUser(session?.user || null)
    }

    checkSession()

    // Listen for auth changes - only set up once on mount
    // The subscription callback will handle all future updates
    if (!subscriptionRef.current) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setActualUser(session?.user || null)
        setUser(session?.user || null)
      })
      subscriptionRef.current = subscription
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const formattedNow = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(now)

  const handleLogout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut()
    // Clear local state
    setUser(null)
    // Clear all localStorage
    localStorage.clear()
    // Redirect to home
    window.location.href = '/'
  }

  return (
    <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-bold text-darktext dark:text-white transition-all duration-300">
              c<span className="text-rstudio group-hover:animate-pulse inline-block">R</span>eate
            </span>
          </Link>
          {/* Reserve space to prevent layout shift */}
          <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm min-h-[20px]">
            {actualUser ? (
              <>
                <span className="truncate max-w-[180px] sm:max-w-[240px]" title={actualUser.email}>{actualUser.email}</span>
                <span className="opacity-50">•</span>
                <span className="whitespace-nowrap">{formattedNow}</span>
              </>
            ) : (
              <span className="opacity-0 pointer-events-none select-none" aria-hidden="true">
                placeholder@email.com • Jan 1, 2024, 12:00 AM
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 min-w-[220px] justify-end">
          <ThemeToggle />
          
          {/* Reserve space for buttons to prevent layout shift - always reserve max width */}
          <div className="flex items-center space-x-2 min-w-[180px]">
            {pathname.startsWith('/workspace') || pathname === '/dashboard' ? (
              <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
                Logout
              </Button>
            ) : actualUser ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="flex-shrink-0">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link href="/signup" className="flex-shrink-0">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

