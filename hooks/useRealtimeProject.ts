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
  debounceMs = 2000 // Increased to 2 seconds to significantly reduce egress
}: UseRealtimeProjectOptions) {
  const { user } = useSessionStore()
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set())
  const subscriptionRef = useRef<any>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<string | null>(null)

  // Store onCodeChange in a ref to avoid recreating subscription
  const onCodeChangeRef = useRef(onCodeChange)
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange
  }, [onCodeChange])

  useEffect(() => {
    if (!projectId || !user) return

    // Subscribe to project changes
    const channel = supabase
      .channel(`project-${projectId}`) // Stable channel name per project
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
          // Only ignore if the timestamp matches exactly (same update we just sent)
          if (newData.updated_at === lastUpdateRef.current) {
            return
          }

          // Update lastUpdateRef to the new timestamp
          lastUpdateRef.current = newData.updated_at

          if (newData.code !== undefined && onCodeChangeRef.current) {
            onCodeChangeRef.current(newData.code)
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
  }, [projectId, user]) // Removed onCodeChange from dependencies

  const lastBroadcastedCodeRef = useRef<string | null>(null)

  const broadcastCodeChange = useCallback(async (code: string) => {
    if (!projectId || !user) return

    // Skip if code hasn't actually changed
    if (code === lastBroadcastedCodeRef.current) {
      return
    }

    // Debounce updates to reduce egress
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      // Double-check code hasn't changed during debounce
      if (code === lastBroadcastedCodeRef.current) {
        return
      }

      try {
        const now = new Date().toISOString()
        lastUpdateRef.current = now
        lastBroadcastedCodeRef.current = code

        const { error } = await supabase
          .from('projects')
          .update({ code, updated_at: now })
          .eq('id', projectId)

        if (error) {
          console.error('[Realtime] Failed to broadcast code change:', error)
          // Reset on error so we can retry
          lastBroadcastedCodeRef.current = null
        }
      } catch (error) {
        console.error('[Realtime] Failed to broadcast code change:', error)
        lastBroadcastedCodeRef.current = null
      }
    }, debounceMs)
  }, [projectId, user, debounceMs])

  return {
    isConnected,
    activeUsers: Array.from(activeUsers),
    broadcastCodeChange
  }
}

