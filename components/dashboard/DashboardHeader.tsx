'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/homepage/Mascot'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'
import { getProfile } from '@/lib/db/profile'
import { LogOut, User } from 'lucide-react'

export function DashboardHeader() {
  const { user, setUser } = useSessionStore()
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null)
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        try {
          const profileData = await getProfile()
          setProfile(profileData)
        } catch (error) {
          console.error('Failed to load profile:', error)
        }
      }
    }
    loadProfile()
  }, [user?.id])

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
    await supabase.auth.signOut()
    setUser(null)
    localStorage.clear()
    window.location.href = '/'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="relative container mx-auto">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl" />
        <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-lg shadow-emerald-900/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center w-fit group">
            <Mascot size={36} className="transition-transform group-hover:scale-110" />
          </Link>
          {user && (
            <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm text-zinc-500">
              <span className="truncate max-w-[180px] sm:max-w-[240px]">
                {profile?.display_name || user.email}
              </span>
              <span className="opacity-50">•</span>
              <span className="whitespace-nowrap">{formattedNow}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </Link>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
        </div>
      </div>
    </header>
  )
}
