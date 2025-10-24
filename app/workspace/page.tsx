'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/useSessionStore'

export default function WorkspacePage() {
  const router = useRouter()
  const { user } = useSessionStore()

  useEffect(() => {
    // Redirect to dashboard since we now use /workspace/[projectId]
    router.push('/dashboard')
  }, [router])

  return null
}

