'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPendingInvitations, acceptInvitation, declineInvitation } from '@/lib/db/collaborators'
import type { CollaboratorWithProject } from '@/lib/db/collaborators'

export function useInvitations(onInvitationAccepted?: () => void) {
  const [invitations, setInvitations] = useState<CollaboratorWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPendingInvitations()
        setInvitations(data)
      } catch {
        setError('Failed to load invitations.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleAccept = useCallback(async (id: string) => {
    setProcessingId(id)
    setError(null)

    try {
      const success = await acceptInvitation(id)
      if (success) {
        setInvitations(prev => prev.filter(i => i.id !== id))
        onInvitationAccepted?.()
      } else {
        setError('Failed to accept invitation.')
      }
    } catch {
      setError('An error occurred while accepting.')
    } finally {
      setProcessingId(null)
    }
  }, [onInvitationAccepted])

  const handleDismiss = useCallback(async (id: string) => {
    setProcessingId(id)
    setError(null)

    try {
      const success = await declineInvitation(id)
      if (success) {
        setInvitations(prev => prev.filter(i => i.id !== id))
      } else {
        setError('Failed to dismiss invitation.')
      }
    } catch {
      setError('An error occurred while dismissing.')
    } finally {
      setProcessingId(null)
    }
  }, [])

  return {
    invitations,
    loading,
    error,
    processingId,
    handleAccept,
    handleDismiss
  }
}
