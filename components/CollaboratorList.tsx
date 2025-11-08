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

  return (
    <div className="space-y-2">
      {collaborators.map((collaborator) => {
        const profile = collaborator.profiles
        const displayName = profile?.display_name || 'User'
        const isCurrentUser = collaborator.user_id === currentUserId

        return (
          <div
            key={collaborator.id}
            className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <UserAvatar
                userId={collaborator.user_id}
                displayName={displayName}
                avatarUrl={profile?.avatar_url}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium truncate">
                    {displayName}
                    {isCurrentUser && ' (You)'}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleBadgeColor(collaborator.role)}`}>
                    {collaborator.role}
                  </span>
                </div>
              </div>
            </div>
            {canManage && !isCurrentUser && (
              <div className="flex items-center space-x-1">
                {onRoleChange && collaborator.role !== 'owner' && (
                  <select
                    value={collaborator.role}
                    onChange={(e) => onRoleChange(collaborator.user_id, e.target.value as 'owner' | 'edit' | 'view')}
                    className="text-xs px-2 py-1 border rounded-md bg-white dark:bg-gray-800 text-darktext dark:text-white"
                  >
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                    <option value="owner">Owner</option>
                  </select>
                )}
                {onRemove && (
                  <button
                    onClick={() => onRemove(collaborator.user_id)}
                    className="text-xs text-destructive hover:underline px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove collaborator"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

