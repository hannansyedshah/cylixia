'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Check, X } from 'lucide-react'
import { getPendingInvitations, acceptInvitation } from '@/lib/db/collaborators'
import type { CollaboratorWithProject } from '@/lib/db/collaborators'

interface InvitationsBannerProps {
  onInvitationAccepted: () => void
}

export function InvitationsBanner({ onInvitationAccepted }: InvitationsBannerProps) {
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

  const handleAccept = async (id: string) => {
    const success = await acceptInvitation(id)
    if (success) {
      setInvitations(prev => prev.filter(i => i.id !== id))
      onInvitationAccepted()
    }
  }

  const handleDismiss = (id: string) => {
    setInvitations(prev => prev.filter(i => i.id !== id))
  }

  if (loading || invitations.length === 0) return null

  return (
    <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
      <h3 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
        <Mail className="h-4 w-4" />
        Pending Invitations ({invitations.length})
      </h3>
      <div className="space-y-2">
        {invitations.map(inv => (
          <div
            key={inv.id}
            className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg"
          >
            <div>
              <p className="text-white font-medium">{inv.project_name}</p>
              <p className="text-xs text-zinc-500">You've been invited to collaborate</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(inv.id)}
                className="h-8 bg-emerald-500 hover:bg-emerald-400 text-black"
              >
                <Check className="h-3 w-3 mr-1" /> Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(inv.id)}
                className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
