'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { UserAvatar } from './UserAvatar'
import { Loader2 } from 'lucide-react'
import { useSessionStore } from '@/store/useSessionStore'

interface User {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface UserSearchProps {
  onSelect: (user: User) => void
  excludeUserIds?: string[]
  className?: string
}

export function UserSearch({ onSelect, excludeUserIds = [], className = '' }: UserSearchProps) {
  const { user: currentUser } = useSessionStore()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length < 2) {
      setUsers([])
      return
    }

    setLoading(true)
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        if (!response.ok) throw new Error('Failed to search users')
        
        const data = await response.json()
        // Filter out excluded users and current user
        const filtered = data.users.filter((u: User) => 
          u.id !== currentUser?.id && !excludeUserIds.includes(u.id)
        )
        setUsers(filtered)
      } catch (error) {
        console.error('Failed to search users:', error)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, excludeUserIds, currentUser])

  const handleSelect = (user: User) => {
    setSelectedUser(user)
    setQuery('')
    setUsers([])
    onSelect(user)
  }

  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        placeholder="Search users by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-11"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      )}
      {selectedUser && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center space-x-2">
          <UserAvatar userId={selectedUser.id} displayName={selectedUser.display_name} avatarUrl={selectedUser.avatar_url} size="sm" />
          <span className="text-sm">{selectedUser.display_name || 'User'}</span>
        </div>
      )}
      {users.length > 0 && !selectedUser && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-left"
            >
              <UserAvatar userId={user.id} displayName={user.display_name} avatarUrl={user.avatar_url} size="sm" />
              <span className="text-sm">{user.display_name || 'User'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

