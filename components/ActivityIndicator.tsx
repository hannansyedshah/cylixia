'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from '@/store/useSessionStore'
import { Users } from 'lucide-react'
import { UserAvatar } from './UserAvatar'

interface ActiveUser {
  userId: string
  displayName: string
  avatarUrl?: string | null
  activity: 'typing' | 'editing' | 'active'
  lastSeen: number
}

export function ActivityIndicator({ projectId }: { projectId: string }) {
  const { user } = useSessionStore()
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const presenceChannelRef = useRef<any>(null)
  const activityTimeoutRef = useRef<{ [userId: string]: NodeJS.Timeout }>({})

  useEffect(() => {
    if (!projectId || !user) return

    const channel = supabase.channel(`typing-${projectId}`)
    
    // Track presence (who is typing and active)
    const updateActiveUsers = () => {
      const state = channel.presenceState()
      const users: ActiveUser[] = []
      
      Object.values(state).forEach((presences: any) => {
        presences.forEach((presence: any) => {
          if (presence.userId !== user?.id) {
            const activity: 'typing' | 'editing' | 'active' = presence.typing 
              ? 'typing' 
              : presence.lockEnabled 
                ? 'editing' 
                : 'active'
            
            users.push({
              userId: presence.userId,
              displayName: presence.displayName || 'User',
              avatarUrl: presence.avatarUrl,
              activity,
              lastSeen: Date.now()
            })

            // Clear existing timeout for this user
            if (activityTimeoutRef.current[presence.userId]) {
              clearTimeout(activityTimeoutRef.current[presence.userId])
            }

            // Set timeout to remove user if they stop being active
            if (!presence.typing && !presence.lockEnabled) {
              activityTimeoutRef.current[presence.userId] = setTimeout(() => {
                setActiveUsers(prev => prev.filter(u => u.userId !== presence.userId))
                delete activityTimeoutRef.current[presence.userId]
              }, 5000) // Remove after 5 seconds of inactivity
            }
          }
        })
      })
      
      setActiveUsers(users)
    }

    channel
      .on('presence', { event: 'sync' }, updateActiveUsers)
      .on('presence', { event: 'update' }, updateActiveUsers)

    channel
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.userId !== user?.id) {
            const activity: 'typing' | 'editing' | 'active' = presence.typing 
              ? 'typing' 
              : presence.lockEnabled 
                ? 'editing' 
                : 'active'
            
            setActiveUsers(prev => {
              const exists = prev.find(u => u.userId === presence.userId)
              if (!exists) {
                return [...prev, {
                  userId: presence.userId,
                  displayName: presence.displayName || 'User',
                  avatarUrl: presence.avatarUrl,
                  activity,
                  lastSeen: Date.now()
                }]
              }
              return prev.map(u => 
                u.userId === presence.userId 
                  ? { ...u, activity, lastSeen: Date.now() }
                  : u
              )
            })
          }
        })
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          setActiveUsers(prev => prev.filter(u => u.userId !== presence.userId))
          if (activityTimeoutRef.current[presence.userId]) {
            clearTimeout(activityTimeoutRef.current[presence.userId])
            delete activityTimeoutRef.current[presence.userId]
          }
        })
      })

    // Subscribe to presence channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Set initial presence
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .single()

        await channel.track({
          userId: user.id,
          displayName: profile?.display_name || user.email || 'User',
          avatarUrl: profile?.avatar_url,
          typing: false,
          lockEnabled: false
        })
      }
    })

    presenceChannelRef.current = channel

    return () => {
      // Clear all timeouts
      Object.values(activityTimeoutRef.current).forEach(timeout => clearTimeout(timeout))
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe()
      }
    }
  }, [projectId, user])

  if (activeUsers.length === 0) {
    return null
  }

  const getActivityText = (activity: 'typing' | 'editing' | 'active') => {
    switch (activity) {
      case 'typing':
        return 'is typing...'
      case 'editing':
        return 'is editing code'
      case 'active':
        return 'is active'
      default:
        return 'is active'
    }
  }

  const getActivityColor = (activity: 'typing' | 'editing' | 'active') => {
    switch (activity) {
      case 'typing':
        return 'bg-green-500'
      case 'editing':
        return 'bg-blue-500'
      case 'active':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-semibold text-sm text-darktext dark:text-white">Active Collaborators</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} active
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {activeUsers.map((activeUser) => (
          <div key={activeUser.userId} className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${getActivityColor(activeUser.activity)} animate-pulse`}></div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <UserAvatar
                userId={activeUser.userId}
                displayName={activeUser.displayName}
                avatarUrl={activeUser.avatarUrl}
                size="sm"
              />
              <span className="text-gray-700 dark:text-gray-300 truncate">
                {activeUser.displayName} {getActivityText(activeUser.activity)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

