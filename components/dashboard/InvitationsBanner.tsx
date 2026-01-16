'use client'

import { Button } from '@/components/ui/button'
import { Mail, Check, X, Loader2 } from 'lucide-react'
import { useInvitations } from '@/hooks/dashboard/useInvitations'

interface InvitationsBannerProps {
  onInvitationAccepted: () => void
}

export function InvitationsBanner({ onInvitationAccepted }: InvitationsBannerProps) {
  const {
    invitations,
    loading,
    error,
    processingId,
    handleAccept,
    handleDismiss
  } = useInvitations(onInvitationAccepted)

  if (loading || invitations.length === 0) return null

  return (
    <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
      <h3 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
        <Mail className="h-4 w-4" />
        Pending Invitations ({invitations.length})
      </h3>
      {error && (
        <p className="text-sm text-red-400 mb-3" role="alert">{error}</p>
      )}
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
                disabled={processingId === inv.id}
                className="h-8 bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-50"
              >
                {processingId === inv.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" /> Accept
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(inv.id)}
                disabled={processingId === inv.id}
                className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
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
