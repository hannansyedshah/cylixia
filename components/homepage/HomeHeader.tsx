'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Mascot } from './Mascot'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'
import { getProfile } from '@/lib/db/profile'

export function HomeHeader() {
  const pathname = usePathname()
  const { user, setUser } = useSessionStore()
  const [actualUser, setActualUser] = useState<any>(null)
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null)
  const [now, setNow] = useState<Date>(new Date())
  const [scrolled, setScrolled] = useState(false)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load profile when user changes
  useEffect(() => {
    const loadProfileData = async () => {
      if (actualUser?.id) {
        try {
          const profileData = await getProfile()
          setProfile(profileData)
        } catch (error) {
          console.error('Failed to load profile:', error)
        }
      } else {
        setProfile(null)
      }
    }
    loadProfileData()
  }, [actualUser?.id])

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
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="relative container mx-auto">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl" />
        <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-lg shadow-emerald-900/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center group">
            <Mascot size={32} className="transition-transform group-hover:scale-110" />
          </Link>
          {/* Reserve space to prevent layout shift */}
          <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm min-h-[20px] text-zinc-500">
            {actualUser ? (
              <>
                <span className="truncate max-w-[180px] sm:max-w-[240px]" title={actualUser.email}>
                  {profile?.display_name || actualUser.email}
                </span>
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
          {/* Reserve space for buttons to prevent layout shift - always reserve max width */}
          <div className="flex items-center space-x-2 min-w-[180px]">
            {pathname.startsWith('/workspace') || pathname === '/dashboard' ? (
              <>
                <Link href="/profile" className="flex-shrink-0">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    Profile
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                  Logout
                </Button>
              </>
            ) : actualUser ? (
              <>
                <Link href="/profile" className="flex-shrink-0">
                  <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black">Profile</Button>
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black">Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="flex-shrink-0">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">Login</Button>
                </Link>
                <Link href="/signup" className="flex-shrink-0">
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </header>
  )
}
