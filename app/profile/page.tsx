'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { ProfilePage } from '@/components/ProfilePage'
import { useSessionStore } from '@/lib/useSessionStore'
import { supabase } from '@/lib/supabaseClient'

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
    <Layout>
      <ProfilePage />
    </Layout>
  )
}

