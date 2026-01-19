'use client'

import { useEffect, useId } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, UserPlus, Trash2, Mail, Check, Clock, Loader2, Pencil, Eye } from 'lucide-react'
import { useCollaborators } from '@/hooks/workspace/useCollaborators'

interface CollaboratorsModalProps {
  projectId: string
  isOwner: boolean
  onClose: () => void
}

export function CollaboratorsModal({ projectId, isOwner, onClose }: CollaboratorsModalProps) {
  const titleId = useId()

  const {
    collaborators,
    email,
    setEmail,
    role,
    setRole,
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
  } = useCollaborators(projectId)

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmDialog) {
          cancelRemove()
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showConfirmDialog, cancelRemove])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur-xl" />
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-emerald-500" />
              </div>
              <h2 id={titleId} className="text-xl font-semibold text-white">Collaborators</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6 space-y-5">
            {/* Invite Form - Owner only */}
            {isOwner && (
              <form onSubmit={handleInvite} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-1 h-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                    aria-label="Email address"
                  />
                  <Button
                    type="submit"
                    disabled={!canInvite}
                    className="h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-black"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('editor')}
                    disabled={isSubmitting}
                    className={`flex-1 h-9 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      role === 'editor'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('viewer')}
                    disabled={isSubmitting}
                    className={`flex-1 h-9 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      role === 'viewer'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Viewer
                  </button>
                </div>
              </form>
            )}

            {error && (
              <p className="text-sm text-red-400" role="alert">{error}</p>
            )}

            {/* Collaborator List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isInitialLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : collaborators.length === 0 ? (
                <p className="text-center text-zinc-500 py-4">
                  No collaborators yet
                </p>
              ) : (
                collaborators.map(collab => (
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
                      {/* Role badge */}
                      {collab.role === 'editor' ? (
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <Pencil className="h-3 w-3" /> Editor
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Viewer
                        </span>
                      )}
                      {/* Status badge */}
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
                          onClick={() => requestRemove(collab.id)}
                          disabled={isRemoving(collab.id)}
                          className="p-1 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          aria-label={`Remove ${collab.email}`}
                        >
                          {isRemoving(collab.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-xs text-zinc-500">
                {isOwner
                  ? 'Editors can view and edit. Viewers can only view.'
                  : 'You are a collaborator on this project.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={cancelRemove}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-title" className="text-lg font-semibold text-white mb-2">Remove Collaborator</h3>
            <p id="confirm-desc" className="text-sm text-zinc-400 mb-4">
              Are you sure you want to remove this collaborator? They will lose access to this project.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={cancelRemove}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRemove}
                disabled={isConfirmRemoving}
                className="bg-red-500 hover:bg-red-400 text-white"
              >
                {isConfirmRemoving && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
