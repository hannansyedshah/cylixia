'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPendingInvitations, acceptInvitation } from '@/lib/db/collaborators'
import type { CollaboratorWithProject } from '@/lib/db/collaborators'

export function useInvitations(onInvitationAccepted?: () => void) {
  const [invitations, setInvitations] = useState<CollaboratorWithProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await getPendingInvitations()
      setInvitations(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleAccept = useCallback(async (id: string) => {
    const success = await acceptInvitation(id)
    if (success) {
      setInvitations(prev => prev.filter(i => i.id !== id))
      onInvitationAccepted?.()
    }
  }, [onInvitationAccepted])

  const handleDismiss = useCallback((id: string) => {
    setInvitations(prev => prev.filter(i => i.id !== id))
  }, [])

  return {
    invitations,
    loading,
    handleAccept,
    handleDismiss
  }
}
