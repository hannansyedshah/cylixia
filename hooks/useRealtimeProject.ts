'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from '@/store/useSessionStore'

interface ProjectUpdate {
  id: string
  code?: string
  updated_at: string
}

interface UseRealtimeProjectOptions {
  projectId: string
  onCodeChange?: (code: string) => void
  debounceMs?: number
}

export function useRealtimeProject({ 
  projectId, 
  onCodeChange,
  debounceMs = 500 
}: UseRealtimeProjectOptions) {
  const { user } = useSessionStore()
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set())
  const subscriptionRef = useRef<any>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<string | null>(null)

  useEffect(() => {
    if (!projectId || !user) return

    // Subscribe to project changes
    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          const newData = payload.new as ProjectUpdate
          
          // Ignore updates from current user to prevent loops
          if (newData.updated_at === lastUpdateRef.current) {
            return
          }

          if (newData.code !== undefined && onCodeChange) {
            onCodeChange(newData.code)
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [projectId, user, onCodeChange])

  const broadcastCodeChange = useCallback(async (code: string) => {
    if (!projectId || !user) return

    // Debounce updates
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const now = new Date().toISOString()
        lastUpdateRef.current = now

        const { error } = await supabase
          .from('projects')
          .update({ code, updated_at: now })
          .eq('id', projectId)

        if (error) {
          console.error('Failed to broadcast code change:', error)
        }
      } catch (error) {
        console.error('Failed to broadcast code change:', error)
      }
    }, debounceMs)
  }, [projectId, user, debounceMs])

  return {
    isConnected,
    activeUsers: Array.from(activeUsers),
    broadcastCodeChange
  }
}

