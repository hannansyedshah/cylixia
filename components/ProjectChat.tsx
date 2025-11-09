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
  code_selection?: string | null
  code_selection_start_line?: number | null
  code_selection_end_line?: number | null
  profiles?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface ProjectChatProps {
  projectId: string
  onCodeSelectionClick?: (selection: { code: string; startLine: number; endLine: number }) => void
}

export function ProjectChat({ projectId, onCodeSelectionClick }: ProjectChatProps) {
  const { user } = useSessionStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userProfile, setUserProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    loadUserProfile()
    loadMessages()
    subscribeToMessages()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [projectId, user?.id])

  const loadUserProfile = async () => {
    if (!user?.id) return
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile({
          display_name: data.profile?.display_name || null,
          avatar_url: data.profile?.avatar_url || null
        })
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

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
          // Fetch the new message
          const { data: newMessageData } = await supabase
            .from('project_chat_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (newMessageData) {
            // Get profile for the message sender
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url')
              .eq('id', newMessageData.user_id)
              .single()

            const newMessage: ChatMessage = {
              ...newMessageData,
              profiles: profile || null
            }

            // Prevent duplicate messages
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMessage.id)
              if (exists) return prev
              return [...prev, newMessage]
            })
          }
        }
      )
      .subscribe()

    subscriptionRef.current = channel
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const messageText = newMessage.trim()
    setSending(true)
    
    // Optimistically add the message to local state immediately
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      project_id: projectId,
      user_id: user?.id || '',
      message: messageText,
      created_at: new Date().toISOString(),
      profiles: {
        id: user?.id || '',
        display_name: userProfile?.display_name || user?.email || 'You',
        avatar_url: userProfile?.avatar_url || null
      }
    }
    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')

    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      })

      if (!response.ok) {
        const error = await response.json()
        // Remove the temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
        throw new Error(error.error || 'Failed to send message')
      }

      const data = await response.json()
      // Replace temp message with real message
      if (data.message) {
        setMessages(prev => prev.map(m => 
          m.id === tempMessage.id ? data.message : m
        ))
      }
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
      <CardContent className="flex-1 flex flex-col min-h-0 p-4">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 min-h-0">
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
                  className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  <div className="flex-shrink-0">
                    <UserAvatar
                      userId={message.user_id}
                      displayName={displayName}
                      avatarUrl={avatarUrl}
                      size="sm"
                    />
                  </div>
                  <div className={`flex-1 min-w-0 ${isCurrentUser ? 'flex items-end flex-col' : ''}`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm font-medium">{displayName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div
                      className={`inline-block max-w-[80%] px-4 py-2 rounded-lg break-words ${
                        isCurrentUser
                          ? 'bg-rstudio text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-darktext dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      {message.code_selection && message.code_selection_start_line && message.code_selection_end_line && (
                        <button
                          onClick={() => {
                            if (onCodeSelectionClick) {
                              onCodeSelectionClick({
                                code: message.code_selection,
                                startLine: message.code_selection_start_line!,
                                endLine: message.code_selection_end_line!
                              })
                            }
                          }}
                          className={`mt-2 block w-full text-left p-2 rounded border transition-colors ${
                            isCurrentUser
                              ? 'bg-white/20 border-white/30 hover:bg-white/30 text-white'
                              : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${
                              isCurrentUser
                                ? 'text-white/90'
                                : 'text-blue-700 dark:text-blue-300'
                            }`}>
                              📎 Lines {message.code_selection_start_line}-{message.code_selection_end_line}
                            </span>
                            <span className={`text-xs ${
                              isCurrentUser
                                ? 'text-white/70'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}>Click to view</span>
                          </div>
                          <pre className={`text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto ${
                            isCurrentUser
                              ? 'text-white/90'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {message.code_selection}
                          </pre>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
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

