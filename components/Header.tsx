'use client'

import { useEffect, useState } from 'react'
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

  // Check actual Supabase session on mount and auth changes
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setActualUser(session?.user || null)
      
      // Sync with Zustand store
      if (session?.user && !user) {
        setUser(session.user)
      } else if (!session?.user && user) {
        setUser(null)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setActualUser(session?.user || null)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, user])

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
          {actualUser && (
            <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <span className="truncate max-w-[180px] sm:max-w-[240px]" title={actualUser.email}>{actualUser.email}</span>
              <span className="opacity-50">•</span>
              <span className="whitespace-nowrap">{formattedNow}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {pathname.startsWith('/workspace') || pathname === '/dashboard' ? (
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          ) : actualUser ? (
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

