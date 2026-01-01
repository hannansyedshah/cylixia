'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSessionStore } from '@/lib/stores/sessionStore'
import type { ProjectUpdate } from '@/types'

interface UseRealtimeProjectOptions {
  projectId: string
  onCodeChange?: (code: string) => void
  debounceMs?: number
  enabled?: boolean
}

export function useRealtimeProject({
  projectId,
  onCodeChange,
  debounceMs = 200,
  enabled = true
}: UseRealtimeProjectOptions) {
  const { user } = useSessionStore()
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set())
  const subscriptionRef = useRef<any>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<string | null>(null)
  const lastLocalCodeRef = useRef<string | null>(null)
  const isApplyingRemoteChangeRef = useRef(false)

  const onCodeChangeRef = useRef(onCodeChange)
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange
  }, [onCodeChange])

  useEffect(() => {
    if (!projectId || !user) return

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
    if (!projectId || !user || !enabled) return

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

          if (isApplyingRemoteChangeRef.current) {
            return
          }

          if (newData.updated_at === lastUpdateRef.current) {
            return
          }

          if (newData.code !== undefined && onCodeChangeRef.current) {
            const incomingCode = newData.code
            const currentLocalCode = lastLocalCodeRef.current

            if (incomingCode !== currentLocalCode) {
              isApplyingRemoteChangeRef.current = true
              lastUpdateRef.current = newData.updated_at
              lastLocalCodeRef.current = incomingCode
              onCodeChangeRef.current(incomingCode)

              setTimeout(() => {
                isApplyingRemoteChangeRef.current = false
              }, 50)
            } else {
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
  }, [projectId, user, enabled])

  const lastBroadcastedCodeRef = useRef<string | null>(null)

  const broadcastCodeChange = useCallback(async (code: string) => {
    if (!projectId || !user) return

    if (code === lastBroadcastedCodeRef.current) {
      return
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (code === lastBroadcastedCodeRef.current) {
        return
      }

      try {
        const now = new Date().toISOString()
        lastUpdateRef.current = now
        lastBroadcastedCodeRef.current = code
        lastLocalCodeRef.current = code

        const { error } = await supabase
          .from('projects')
          .update({ code, updated_at: now })
          .eq('id', projectId)

        if (error) {
          console.error('[Realtime] Failed to broadcast code change:', error)
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

