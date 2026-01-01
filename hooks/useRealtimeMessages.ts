import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Message } from '@/types/database'

interface UseRealtimeMessagesOptions {
  projectId: string | null
  onNewMessage: (message: Message) => void
}

export function useRealtimeMessages({ projectId, onNewMessage }: UseRealtimeMessagesOptions) {
  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`messages-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` },
        (payload) => {
          onNewMessage(payload.new as Message)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [projectId, onNewMessage])
}
