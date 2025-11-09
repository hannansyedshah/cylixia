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
  debounceMs = 200 
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

    console.log(`[Realtime] Subscribing to project ${projectId}`)

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
          console.log('[Realtime] Received update:', payload)
          const newData = payload.new as ProjectUpdate
          
          // Ignore updates from current user to prevent loops
          // Only ignore if the timestamp matches exactly (same update we just sent)
          if (newData.updated_at === lastUpdateRef.current) {
            console.log('[Realtime] Ignoring update from current user (same timestamp)')
            return
          }

          // Update lastUpdateRef to the new timestamp
          lastUpdateRef.current = newData.updated_at

          if (newData.code !== undefined && onCodeChangeRef.current) {
            console.log('[Realtime] Calling onCodeChange with new code, length:', newData.code.length)
            onCodeChangeRef.current(newData.code)
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status: ${status}`)
        setIsConnected(status === 'SUBSCRIBED')
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to project changes')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error - check if projects table is enabled for Realtime')
        }
      })

    subscriptionRef.current = channel

    return () => {
      console.log(`[Realtime] Unsubscribing from project ${projectId}`)
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [projectId, user]) // Removed onCodeChange from dependencies

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

        console.log(`[Realtime] Broadcasting code change for project ${projectId}`)
        const { error } = await supabase
          .from('projects')
          .update({ code, updated_at: now })
          .eq('id', projectId)

        if (error) {
          console.error('[Realtime] Failed to broadcast code change:', error)
        } else {
          console.log('[Realtime] Code change broadcasted successfully')
        }
      } catch (error) {
        console.error('[Realtime] Failed to broadcast code change:', error)
      }
    }, debounceMs)
  }, [projectId, user, debounceMs])

  return {
    isConnected,
    activeUsers: Array.from(activeUsers),
    broadcastCodeChange
  }
}

