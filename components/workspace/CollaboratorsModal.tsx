'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, UserPlus, Trash2, Mail, Check, Clock } from 'lucide-react'
import { useCollaborators } from '@/hooks/workspace/useCollaborators'

interface CollaboratorsModalProps {
  projectId: string
  isOwner: boolean
  onClose: () => void
}

export function CollaboratorsModal({ projectId, isOwner, onClose }: CollaboratorsModalProps) {
  const {
    collaborators,
    email,
    setEmail,
    loading,
    error,
    handleInvite,
    handleRemove
  } = useCollaborators(projectId)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur-xl" />
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Collaborators</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6 space-y-5">
            {/* Invite Form - Owner only */}
            {isOwner && (
              <form onSubmit={handleInvite} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                />
                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-black"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </form>
            )}

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            {/* Collaborator List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {collaborators.map(collab => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="text-sm text-white">{collab.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {collab.status === 'pending' ? (
                      <span className="text-xs text-yellow-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Joined
                      </span>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(collab.id)}
                        className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {collaborators.length === 0 && (
                <p className="text-center text-zinc-500 py-4">
                  No collaborators yet
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-xs text-zinc-500">
                {isOwner
                  ? 'Collaborators can view and edit this project.'
                  : 'You are a collaborator on this project.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
