'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  inviteCollaborator,
  getCollaborators,
  removeCollaborator
} from '@/lib/db/collaborators'
import { isValidEmail } from '@/lib/utils/validation'
import type { Collaborator } from '@/types/database'

export function useCollaborators(projectId: string) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [email, setEmail] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const emailRef = useRef(email)
  emailRef.current = email

  useEffect(() => {
    const load = async () => {
      const data = await getCollaborators(projectId)
      setCollaborators(data)
      setIsInitialLoading(false)
    }
    load()
  }, [projectId])

  const handleInvite = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const currentEmail = emailRef.current.trim()
    if (!currentEmail) return

    if (!isValidEmail(currentEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const collab = await inviteCollaborator(projectId, currentEmail)

      if (collab) {
        setCollaborators(prev => [...prev, collab])
        setEmail('')
      } else {
        setError('Failed to invite. Email may already be invited.')
      }
    } catch {
      setError('An error occurred while inviting.')
    } finally {
      setIsSubmitting(false)
    }
  }, [projectId])

  const requestRemove = useCallback((collaboratorId: string) => {
    setConfirmRemoveId(collaboratorId)
  }, [])

  const cancelRemove = useCallback(() => {
    setConfirmRemoveId(null)
  }, [])

  const confirmRemove = useCallback(async () => {
    if (!confirmRemoveId) return

    setRemovingId(confirmRemoveId)
    setError(null)

    try {
      const success = await removeCollaborator(confirmRemoveId)
      if (success) {
        setCollaborators(prev => prev.filter(c => c.id !== confirmRemoveId))
        setConfirmRemoveId(null)
      } else {
        setError('Failed to remove collaborator.')
      }
    } catch {
      setError('An error occurred while removing.')
    } finally {
      setRemovingId(null)
    }
  }, [confirmRemoveId])

  const isRemoving = useCallback((id: string) => removingId === id, [removingId])

  // Computed values
  const canInvite = !isSubmitting && email.trim().length > 0
  const showConfirmDialog = confirmRemoveId !== null
  const isConfirmRemoving = removingId === confirmRemoveId

  return {
    collaborators,
    email,
    setEmail,
    isInitialLoading,
    isSubmitting,
    canInvite,
    showConfirmDialog,
    isConfirmRemoving,
    error,
    handleInvite,
    requestRemove,
    cancelRemove,
    confirmRemove,
    isRemoving
  }
}
