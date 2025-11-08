'use client'

import { UserAvatar } from './UserAvatar'

interface Collaborator {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'edit' | 'view'
  status: string
  created_at: string
  profiles?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface CollaboratorListProps {
  collaborators: Collaborator[]
  currentUserId?: string
  onRoleChange?: (userId: string, role: 'owner' | 'edit' | 'view') => void
  onRemove?: (userId: string) => void
  canManage?: boolean
}

export function CollaboratorList({ 
  collaborators, 
  currentUserId,
  onRoleChange,
  onRemove,
  canManage = false
}: CollaboratorListProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'edit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'view':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (collaborators.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        <p className="text-sm">No collaborators yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {collaborators.map((collaborator) => {
        const profile = collaborator.profiles
        const displayName = profile?.display_name || 'User'
        const isCurrentUser = collaborator.user_id === currentUserId

        return (
          <div
            key={collaborator.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex-shrink-0">
              <UserAvatar
                userId={collaborator.user_id}
                displayName={displayName}
                avatarUrl={profile?.avatar_url}
                size="sm"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium truncate">
                  {displayName}
                  {isCurrentUser && <span className="text-gray-500 dark:text-gray-400"> (You)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getRoleBadgeColor(collaborator.role)}`}>
                  {collaborator.role}
                </span>
                {canManage && !isCurrentUser && (
                  <>
                    {onRoleChange && collaborator.role !== 'owner' && (
                      <select
                        value={collaborator.role}
                        onChange={(e) => onRoleChange(collaborator.user_id, e.target.value as 'owner' | 'edit' | 'view')}
                        className="text-xs px-2 py-1 border rounded-md bg-white dark:bg-gray-800 text-darktext dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Change role"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                        <option value="owner">Owner</option>
                      </select>
                    )}
                    {onRemove && (
                      <button
                        onClick={() => onRemove(collaborator.user_id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Remove collaborator"
                      >
                        Remove
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

