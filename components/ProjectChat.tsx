'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserAvatar } from './UserAvatar'
import { Send, Loader2, Trash2, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from '@/lib/useSessionStore'
import { playChatSound } from '@/utils/soundNotifications'
import { ViewerWorkspace } from './ViewerWorkspace'
import type { ChatMessage } from '@/types'

interface ProjectChatProps {
  projectId: string
  userRole?: 'owner' | 'edit' | 'view' | null
  onCodeSelectionClick?: (selection: { code: string; startLine: number; endLine: number }) => void
  onImportCode?: (code: string) => void
  onRealtimeCollaborationToggle?: (enabled: boolean) => void
  onWorkspaceViewStatusChange?: (isBeingViewed: boolean) => void // Callback when workspace view status changes
}

export function ProjectChat({ projectId, userRole, onCodeSelectionClick, onImportCode, onRealtimeCollaborationToggle, onWorkspaceViewStatusChange }: ProjectChatProps) {
  const { user } = useSessionStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null) // Track if we're viewing someone's workspace
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteIndex, setAutocompleteIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const commands = [
    { command: '/sendterminal', description: 'Share your workspace view (editor + terminal + plot)' },
    { command: '/seeeditor', description: 'Alias for /sendterminal' },
    { command: '/sharecode', description: 'Enable real-time code collaboration' },
    { command: '/stopsharecode', description: 'Disable real-time code collaboration' },
  ]

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

  // Check if someone is viewing this workspace via /sendterminal
  useEffect(() => {
    if (!user?.id || !onWorkspaceViewStatusChange) return
    
    // Check if there's a /sendterminal message with this user's ID
    // The message should be from another user (not the current user) pointing to the current user's workspace
    const isBeingViewed = messages.some(message => {
      if (message.message.startsWith('/sendterminal ')) {
        const userId = message.message.split(' ')[1]
        // Check if this message is from another user (not the current user)
        // and points to the current user's workspace
        const isFromAnotherUser = message.user_id !== user.id
        const isPointingToMyWorkspace = userId === user.id
        return isFromAnotherUser && isPointingToMyWorkspace
      }
      return false
    })
    
    console.log('[ProjectChat] Checking if workspace is being viewed:', isBeingViewed, {
      messagesCount: messages.length,
      userId: user.id,
      matchingMessages: messages.filter(m => m.message.startsWith('/sendterminal ')).map(m => ({
        message: m.message,
        from: m.user_id,
        to: m.message.split(' ')[1]
      }))
    })
    onWorkspaceViewStatusChange(isBeingViewed)
  }, [messages, user?.id, onWorkspaceViewStatusChange])

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
              
              // Play notification sound if message is from another user
              if (newMessage.user_id !== user?.id) {
                playChatSound()
              }
              
              return [...prev, newMessage]
            })
          }
        }
      )
      .subscribe()

    subscriptionRef.current = channel
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return
    
    try {
      // Check if this is a /sendterminal message and if someone is viewing that workspace
      const messageToDelete = messages.find(m => m.id === messageId)
      if (messageToDelete && messageToDelete.message.startsWith('/sendterminal ')) {
        const userId = messageToDelete.message.split(' ')[1]
        // If someone is viewing this workspace, close it
        if (viewingUserId === userId) {
          setViewingUserId(null)
        }
      }

      const response = await fetch(`/api/projects/${projectId}/chat/${messageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete message')
      }

      // Remove from local state
      setMessages(prev => prev.filter(m => m.id !== messageId))
    } catch (error: any) {
      alert(error.message || 'Failed to delete message')
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    
    // Allow all users (including view-only) to send messages

    const messageText = newMessage.trim()
    
    // Check for special commands
    // /sendterminal - share workspace view (terminal + editor + plot)
    // /seeeditor - same as /sendterminal (alias)
    // /sharecode - enable real-time code collaboration
    // /stopsharecode - disable real-time code collaboration
    const isViewCommand = messageText.toLowerCase().startsWith('/sendterminal') || 
                         messageText.toLowerCase().startsWith('/seeeditor') ||
                         messageText.toLowerCase().startsWith('see editor')
    const isShareCodeCommand = messageText.toLowerCase().startsWith('/sharecode')
    const isStopShareCodeCommand = messageText.toLowerCase().startsWith('/stopsharecode')
    
    setSending(true)
    
    // Handle collaboration toggle commands immediately (don't send as message)
    if (isShareCodeCommand || isStopShareCodeCommand) {
      const enabled = isShareCodeCommand
      if (onRealtimeCollaborationToggle) {
        onRealtimeCollaborationToggle(enabled)
        // Show confirmation
        alert(enabled ? 'Real-time code collaboration enabled! You will see updates when others edit code.' : 'Real-time code collaboration disabled.')
      }
      setSending(false)
      return
    }
    
    // Optimistically add the message to local state immediately
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      project_id: projectId,
      user_id: user?.id || '',
      message: isViewCommand ? `/sendterminal ${user?.id || 'unknown'}` : messageText,
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
        body: JSON.stringify({ message: isViewCommand ? `/sendterminal ${user?.id || 'unknown'}` : messageText })
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
        <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.user_id === user?.id
              const displayName = message.profiles?.display_name || 'User'
              const avatarUrl = message.profiles?.avatar_url

              // Truncate long names
              const truncatedName = displayName.length > 15 
                ? `${displayName.substring(0, 15)}...` 
                : displayName

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
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
                      <span className="text-xs font-medium truncate max-w-[120px] dark:text-gray-200" title={displayName}>
                        {truncatedName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isCurrentUser && (
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="ml-2 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex-shrink-0 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                          title="Delete message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div
                      className={`inline-block max-w-[85%] px-3 py-2 rounded-lg break-words ${
                        isCurrentUser
                          ? 'bg-rstudio text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-darktext dark:text-white'
                      }`}
                    >
                      {/* Check if message is a view command */}
                      {message.message.startsWith('/sendterminal ') ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs whitespace-pre-wrap leading-relaxed dark:text-gray-200 flex-1">
                              {message.profiles?.display_name || 'User'} shared their workspace
                            </p>
                            {isCurrentUser && (
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex-shrink-0 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                title="Stop sharing workspace"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <Button
                            onClick={() => {
                              const userId = message.message.split(' ')[1]
                              if (userId && userId !== 'unknown') {
                                setViewingUserId(userId)
                              }
                            }}
                            size="sm"
                            className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm"
                            variant="default"
                          >
                            👁️ View Workspace
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs whitespace-pre-wrap leading-relaxed dark:text-gray-200">{message.message}</p>
                      )}
                      {message.code_selection && message.code_selection_start_line && message.code_selection_end_line && (
                        <div className={`mt-2 block w-full text-left p-2 rounded border transition-colors relative ${
                          isCurrentUser
                            ? 'bg-white/20 border-white/30 hover:bg-white/30 text-white'
                            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${
                              isCurrentUser
                                ? 'text-white/90'
                                : 'text-blue-700 dark:text-blue-300'
                            }`}>
                              📎 Lines {message.code_selection_start_line}-{message.code_selection_end_line}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (message.code_selection) {
                                    navigator.clipboard.writeText(message.code_selection)
                                    setCopiedCodeId(message.id)
                                    setTimeout(() => setCopiedCodeId(null), 2000)
                                  }
                                }}
                                className={`p-1 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors ${
                                  isCurrentUser
                                    ? 'text-white/70 hover:text-white'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}
                                title="Copy code"
                              >
                                {copiedCodeId === message.id ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              <span className={`text-xs ${
                                isCurrentUser
                                  ? 'text-white/70'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}>Click to view</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (onCodeSelectionClick && message.code_selection && message.code_selection_start_line && message.code_selection_end_line) {
                                onCodeSelectionClick({
                                  code: message.code_selection,
                                  startLine: message.code_selection_start_line,
                                  endLine: message.code_selection_end_line
                                })
                              }
                            }}
                            className="w-full text-left"
                          >
                            <pre className={`text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto ${
                              isCurrentUser
                                ? 'text-white/90'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {message.code_selection}
                            </pre>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 relative">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Type a message... (use / for commands)"
              value={newMessage}
              onChange={(e) => {
                const value = e.target.value
                setNewMessage(value)
                // Show autocomplete when typing /
                if (value.startsWith('/') && !value.includes(' ')) {
                  setShowAutocomplete(true)
                  setAutocompleteIndex(0)
                } else {
                  setShowAutocomplete(false)
                }
              }}
              onKeyDown={(e) => {
                if (showAutocomplete && commands.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setAutocompleteIndex((prev) => (prev + 1) % commands.length)
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setAutocompleteIndex((prev) => (prev - 1 + commands.length) % commands.length)
                  } else if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const selected = commands[autocompleteIndex]
                    if (selected) {
                      setNewMessage(selected.command + ' ')
                      setShowAutocomplete(false)
                      inputRef.current?.focus()
                    }
                  } else if (e.key === 'Escape') {
                    setShowAutocomplete(false)
                  }
                }
              }}
              disabled={sending}
              className="flex-1 bg-white dark:bg-black dark:text-white dark:border-gray-700 dark:placeholder:text-gray-400"
            />
            {showAutocomplete && commands.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-auto">
                {commands.map((cmd, idx) => (
                  <button
                    key={cmd.command}
                    type="button"
                    onClick={() => {
                      setNewMessage(cmd.command + ' ')
                      setShowAutocomplete(false)
                      inputRef.current?.focus()
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      idx === autocompleteIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } ${idx === 0 ? 'rounded-t-lg' : ''} ${idx === commands.length - 1 ? 'rounded-b-lg' : ''}`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{cmd.command}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{cmd.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </CardContent>
      
      {/* Viewer Workspace Modal */}
      {viewingUserId && (
        <ViewerWorkspace
          userId={viewingUserId}
          projectId={projectId}
          onClose={() => setViewingUserId(null)}
          onImportCode={onImportCode}
        />
      )}
    </Card>
  )
}

