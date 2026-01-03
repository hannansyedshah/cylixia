'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileLayout } from '@/components/profile/ProfileLayout'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'

export default function ProfilePageRoute() {
  const router = useRouter()
  const { user } = useSessionStore()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  if (!user) {
    return null
  }

  return (
    <ProfileLayout>
      <ProfilePage />
    </ProfileLayout>
  )
}
