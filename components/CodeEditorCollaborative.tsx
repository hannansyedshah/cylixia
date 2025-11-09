'use client'

import { Editor } from '@monaco-editor/react'
import { useState, useEffect, useRef } from 'react'
import { useRealtimeProject } from '@/hooks/useRealtimeProject'
import { Wifi, WifiOff, Lock, LockOpen } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from '@/store/useSessionStore'
import { UserAvatar } from './UserAvatar'

interface CodeEditorCollaborativeProps {
  value: string
  onChange: (value: string) => void
  projectId: string
  readOnly?: boolean
  enableEditLock?: boolean
  onEditLockChange?: (enabled: boolean) => void
}

interface TypingUser {
  userId: string
  displayName: string
  avatarUrl?: string | null
}

export function CodeEditorCollaborative({ 
  value, 
  onChange, 
  projectId,
  readOnly = false,
  enableEditLock = false,
  onEditLockChange
}: CodeEditorCollaborativeProps) {
  const { user } = useSessionStore()
  const [theme, setTheme] = useState<'light' | 'vs-dark'>('light')
  const [localValue, setLocalValue] = useState(value)
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [editLockEnabled, setEditLockEnabled] = useState(enableEditLock)
  const isLocalChangeRef = useRef(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const presenceChannelRef = useRef<any>(null)
  const typingStateRef = useRef<{ [userId: string]: TypingUser }>({})

  const { isConnected, broadcastCodeChange } = useRealtimeProject({
    projectId,
    onCodeChange: (code) => {
      // Only update if change came from another user
      if (!isLocalChangeRef.current) {
        setLocalValue(code)
        onChange(code)
      }
      isLocalChangeRef.current = false
    }
  })

  // Subscribe to typing indicators via presence
  useEffect(() => {
    if (!projectId || !user || !editLockEnabled) return

    const channel = supabase.channel(`typing-${projectId}`)
    
    // Track presence (who is typing)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        typingStateRef.current = {}
        let foundTyping = false
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.userId !== user?.id && presence.typing) {
              typingStateRef.current[presence.userId] = {
                userId: presence.userId,
                displayName: presence.displayName || 'User',
                avatarUrl: presence.avatarUrl
              }
              foundTyping = true
            }
          })
        })
        
        if (foundTyping) {
          const firstTyping = Object.values(typingStateRef.current)[0]
          setTypingUser(firstTyping as TypingUser)
          setIsLocked(true)
        } else {
          setTypingUser(null)
          setIsLocked(false)
        }
      })

    channel
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.userId !== user?.id && presence.typing) {
            typingStateRef.current[presence.userId] = {
              userId: presence.userId,
              displayName: presence.displayName || 'User',
              avatarUrl: presence.avatarUrl
            }
            setTypingUser(typingStateRef.current[presence.userId])
            setIsLocked(true)
          }
        })
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          delete typingStateRef.current[presence.userId]
          const remaining = Object.values(typingStateRef.current)
          if (remaining.length > 0) {
            setTypingUser(remaining[0])
            setIsLocked(true)
          } else {
            setTypingUser(null)
            setIsLocked(false)
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
          typing: false
        })
      }
    })

    presenceChannelRef.current = channel

    return () => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe()
      }
    }
  }, [projectId, user, editLockEnabled])

  // Broadcast typing status
  const broadcastTyping = async (isTyping: boolean) => {
    if (!presenceChannelRef.current || !user || !editLockEnabled) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()

    await presenceChannelRef.current.track({
      userId: user.id,
      displayName: profile?.display_name || user.email || 'User',
      avatarUrl: profile?.avatar_url,
      typing: isTyping
    })
  }

  // Clear typing status after inactivity
  useEffect(() => {
    if (!editLockEnabled || !user) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false)
    }, 2000) // Stop typing after 2 seconds of inactivity

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [localValue, editLockEnabled, user])

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'vs-dark' : 'light')

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'vs-dark' : 'light')
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const handleChange = (newValue: string | undefined) => {
    // Check if locked
    if (isLocked && editLockEnabled) {
      return // Don't allow editing when locked
    }

    const code = newValue || ''
    setLocalValue(code)
    isLocalChangeRef.current = true
    onChange(code)
    
    // Broadcast typing status
    if (editLockEnabled && !readOnly) {
      broadcastTyping(true)
    }
    
    // Broadcast change to other collaborators
    if (!readOnly) {
      broadcastCodeChange(code)
    }
  }

  const toggleEditLock = () => {
    const newValue = !editLockEnabled
    setEditLockEnabled(newValue)
    if (onEditLockChange) {
      onEditLockChange(newValue)
    }
    if (!newValue) {
      // Clear typing status when disabling
      broadcastTyping(false)
      setTypingUser(null)
      setIsLocked(false)
    }
  }

  const effectiveReadOnly = readOnly || (isLocked && editLockEnabled)

  return (
    <div className="relative h-full">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded-md shadow-sm">
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Offline</span>
          </>
        )}
        
        {/* Edit Lock Toggle */}
        {!readOnly && (
          <button
            onClick={toggleEditLock}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              editLockEnabled
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={editLockEnabled ? 'Disable edit lock' : 'Enable edit lock'}
          >
            {editLockEnabled ? (
              <>
                <Lock className="w-3 h-3" />
                <span>Lock On</span>
              </>
            ) : (
              <>
                <LockOpen className="w-3 h-3" />
                <span>Lock Off</span>
              </>
            )}
          </button>
        )}

        {/* Typing Indicator */}
        {editLockEnabled && typingUser && (
          <div className="flex items-center gap-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs text-yellow-700 dark:text-yellow-300">
            <Lock className="w-3 h-3" />
            <UserAvatar
              userId={typingUser.userId}
              displayName={typingUser.displayName}
              avatarUrl={typingUser.avatarUrl}
              size="xs"
            />
            <span className="font-medium">{typingUser.displayName} is editing...</span>
          </div>
        )}
      </div>
      <Editor
        height="100%"
        defaultLanguage="r"
        value={localValue}
        onChange={handleChange}
        theme={theme}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: effectiveReadOnly,
        }}
      />
      {effectiveReadOnly && editLockEnabled && typingUser && (
        <div className="absolute inset-0 bg-gray-500/10 dark:bg-gray-900/20 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {typingUser.displayName} is currently editing
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

