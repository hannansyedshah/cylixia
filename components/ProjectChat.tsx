'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserAvatar } from './UserAvatar'
import { Send, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from '@/store/useSessionStore'

interface ChatMessage {
  id: string
  project_id: string
  user_id: string
  message: string
  created_at: string
  profiles?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface ProjectChatProps {
  projectId: string
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const { user } = useSessionStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    loadMessages()
    subscribeToMessages()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/chat`)
      if (!response.ok) throw new Error('Failed to load messages')
      
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`project-chat-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_chat_messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          // Fetch the new message with profile data
          const { data: newMessage } = await supabase
            .from('project_chat_messages')
            .select(`
              *,
              profiles:user_id (
                id,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            setMessages(prev => [...prev, newMessage as ChatMessage])
          }
        }
      )
      .subscribe()

    subscriptionRef.current = channel
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      setNewMessage('')
    } catch (error: any) {
      alert(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-rstudio" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
        <CardDescription>Collaborate with your team</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.user_id === user?.id
              const displayName = message.profiles?.display_name || 'User'
              const avatarUrl = message.profiles?.avatar_url

              return (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <UserAvatar
                    userId={message.user_id}
                    displayName={displayName}
                    avatarUrl={avatarUrl}
                    size="sm"
                  />
                  <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">{displayName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div
                      className={`inline-block px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? 'bg-rstudio text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-darktext dark:text-white'
                      }`}
                    >
                      {message.message}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

