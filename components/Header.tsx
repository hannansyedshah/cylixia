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
  }, [])

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
        <Link href="/" className="flex items-center space-x-2 group">
          <span className="text-2xl font-bold text-darktext dark:text-white transition-all duration-300">
            c<span className="text-rstudio group-hover:animate-pulse inline-block">R</span>eate
          </span>
        </Link>

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

