'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CollaboratorList } from './CollaboratorList'
import { InviteCollaboratorModal } from './InviteCollaboratorModal'
import { UserProfileModal } from './UserProfileModal'
import { UserPlus, Loader2 } from 'lucide-react'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'
import type { Collaborator } from '@/types'

interface CollaborationPanelProps {
  projectId: string
  projectOwnerId?: string
  onViewWorkspace?: (userId: string) => void // Callback to view a collaborator's workspace
}

export function CollaborationPanel({ projectId, projectOwnerId, onViewWorkspace }: CollaborationPanelProps) {
  const { user } = useSessionStore()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    loadCollaborators()

    // Subscribe to real-time collaborator changes
    const channel = supabase
      .channel(`project-collaborators-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'project_collaborators',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          // Reload collaborators when changes occur
          loadCollaborators()
        }
      )
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [projectId])

  const loadCollaborators = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/collaborators`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load collaborators')
      }
      
      const data = await response.json()
      console.log('Collaborators data:', data)
      setCollaborators(data.collaborators || [])
      
      // Check if current user can manage collaborators
      const currentUserCollab = data.collaborators?.find((c: Collaborator) => c.user_id === user?.id)
      setCanManage(
        projectOwnerId === user?.id || 
        currentUserCollab?.role === 'owner'
      )
    } catch (error: any) {
      console.error('Failed to load collaborators:', error)
      // Set empty array on error to prevent UI issues
      setCollaborators([])
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, role: 'owner' | 'edit' | 'view') => {
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      await loadCollaborators()
    } catch (error: any) {
      alert(error.message || 'Failed to update role')
    }
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove collaborator')
      }

      await loadCollaborators()
    } catch (error: any) {
      alert(error.message || 'Failed to remove collaborator')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collaborators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-rstudio" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Collaborators</CardTitle>
              <CardDescription>
                {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            {canManage && (
              <Button
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="h-8"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Invite
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CollaboratorList
            collaborators={collaborators}
            currentUserId={user?.id}
            onRoleChange={canManage ? handleRoleChange : undefined}
            onRemove={canManage ? handleRemove : undefined}
            canManage={canManage}
            onProfileClick={(userId) => {
              setSelectedUserId(userId)
              setShowProfileModal(true)
            }}
            onViewWorkspace={projectOwnerId === user?.id ? onViewWorkspace : undefined}
            isOwner={projectOwnerId === user?.id}
          />
        </CardContent>
      </Card>

      {showProfileModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false)
            setSelectedUserId(null)
          }}
        />
      )}

      {showInviteModal && (
        <InviteCollaboratorModal
          projectId={projectId}
          onClose={() => setShowInviteModal(false)}
          onSuccess={loadCollaborators}
        />
      )}
    </>
  )
}

