'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  inviteCollaborator,
  getCollaborators,
  removeCollaborator
} from '@/lib/db/collaborators'
import type { Collaborator } from '@/types/database'

export function useCollaborators(projectId: string) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const data = await getCollaborators(projectId)
      setCollaborators(data)
    }
    load()
  }, [projectId])

  const handleInvite = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    const collab = await inviteCollaborator(projectId, email.trim())

    if (collab) {
      setCollaborators(prev => [...prev, collab])
      setEmail('')
    } else {
      setError('Failed to invite. Email may already be invited.')
    }
    setLoading(false)
  }, [projectId, email])

  const handleRemove = useCallback(async (collaboratorId: string) => {
    const success = await removeCollaborator(collaboratorId)
    if (success) {
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId))
    }
  }, [])

  return {
    collaborators,
    email,
    setEmail,
    loading,
    error,
    handleInvite,
    handleRemove
  }
}
