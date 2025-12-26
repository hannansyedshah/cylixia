'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from '@/lib/useSessionStore'

interface ProjectUpdate {
  id: string
  code?: string
  updated_at: string
  user_id?: string // Project owner (not necessarily who edited)
}

interface UseRealtimeProjectOptions {
  projectId: string
  onCodeChange?: (code: string) => void
  debounceMs?: number
  enabled?: boolean // Whether real-time collaboration is enabled
}

export function useRealtimeProject({ 
  projectId, 
  onCodeChange,
  debounceMs = 200, // Fast updates for instant feel
  enabled = true // Default to enabled for backward compatibility
}: UseRealtimeProjectOptions) {
  const { user } = useSessionStore()
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set())
  const subscriptionRef = useRef<any>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<string | null>(null)
  const lastLocalCodeRef = useRef<string | null>(null) // Track our last local code state
  const isApplyingRemoteChangeRef = useRef(false) // Flag to prevent loops when applying remote changes

  // Store onCodeChange in a ref to avoid recreating subscription
  const onCodeChangeRef = useRef(onCodeChange)
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange
  }, [onCodeChange])

  // Initialize lastLocalCodeRef with current code when project loads
  useEffect(() => {
    if (!projectId || !user) return
    
    // Fetch current project code to initialize our state
    supabase
      .from('projects')
      .select('code, updated_at')
      .eq('id', projectId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          lastLocalCodeRef.current = data.code || null
          lastUpdateRef.current = data.updated_at || null
        }
      })
  }, [projectId, user])

  useEffect(() => {
    if (!projectId || !user || !enabled) return // Don't subscribe if disabled

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
          
          // Ignore if we're currently applying a remote change (prevent loops)
          if (isApplyingRemoteChangeRef.current) {
            return
          }
          
          // Ignore updates from current user to prevent loops
          // Only ignore if the timestamp matches exactly (same update we just sent)
          if (newData.updated_at === lastUpdateRef.current) {
            return
          }

          // Only apply if the code is actually different and newer than our last local state
          if (newData.code !== undefined && onCodeChangeRef.current) {
            const incomingCode = newData.code
            const currentLocalCode = lastLocalCodeRef.current
            
            // Only apply if code is significantly different (not just minor changes)
            // This prevents stuttering from rapid updates
            if (incomingCode !== currentLocalCode) {
              // Mark that we're applying a remote change
              isApplyingRemoteChangeRef.current = true
              
              // Update lastUpdateRef to the new timestamp
              lastUpdateRef.current = newData.updated_at
              
              // Update our last local code ref to match the incoming code
              lastLocalCodeRef.current = incomingCode
              
              // Call the callback (this will update the editor)
              onCodeChangeRef.current(incomingCode)
              
              // Reset the flag quickly to allow new updates
              setTimeout(() => {
                isApplyingRemoteChangeRef.current = false
              }, 50) // Faster reset for smoother updates
            } else {
              // Update timestamp even if we don't apply the code (to track latest update)
              lastUpdateRef.current = newData.updated_at
            }
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
  }, [projectId, user, enabled]) // Added enabled to dependencies

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
        lastLocalCodeRef.current = code // Update our last local code state

        const { error } = await supabase
          .from('projects')
          .update({ code, updated_at: now })
          .eq('id', projectId)

        if (error) {
          console.error('[Realtime] Failed to broadcast code change:', error)
          // Reset on error so we can retry
          lastBroadcastedCodeRef.current = null
          lastLocalCodeRef.current = null
        }
      } catch (error) {
        console.error('[Realtime] Failed to broadcast code change:', error)
        lastBroadcastedCodeRef.current = null
        lastLocalCodeRef.current = null
      }
    }, debounceMs)
  }, [projectId, user, debounceMs])

  return {
    isConnected,
    activeUsers: Array.from(activeUsers),
    broadcastCodeChange
  }
}

