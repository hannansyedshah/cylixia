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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.clear()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/30">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center w-fit group">
            <Mascot size={36} className="transition-transform group-hover:scale-110" />
          </Link>
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500">
              <span className="truncate max-w-[200px]">
                {profile?.display_name || user.email}
              </span>
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
    </header>
  )
}
