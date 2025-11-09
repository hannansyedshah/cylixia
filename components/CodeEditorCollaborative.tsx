'use client'

import { Editor } from '@monaco-editor/react'
import { useState, useEffect, useRef } from 'react'
import { useRealtimeProject } from '@/hooks/useRealtimeProject'
import { Wifi, WifiOff, Lock, Unlock, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from '@/store/useSessionStore'
import { UserAvatar } from './UserAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

interface CodeEditorCollaborativeProps {
  value: string
  onChange: (value: string) => void
  projectId: string
  readOnly?: boolean
  enableEditLock?: boolean
  onEditLockChange?: (enabled: boolean) => void
  onCodeSelection?: { code: string; startLine: number; endLine: number } | null
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
  onEditLockChange,
  onCodeSelection
}: CodeEditorCollaborativeProps) {
  const { user } = useSessionStore()
  const [theme, setTheme] = useState<'light' | 'vs-dark'>('light')
  const [localValue, setLocalValue] = useState(value)
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [editLockEnabled, setEditLockEnabled] = useState(enableEditLock)
  const [selectedCode, setSelectedCode] = useState<{ code: string; startLine: number; endLine: number } | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [sendingSelection, setSendingSelection] = useState(false)
  const editorRef = useRef<any>(null)
  const isLocalChangeRef = useRef(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const presenceChannelRef = useRef<any>(null)
  const typingStateRef = useRef<{ [userId: string]: TypingUser }>({})

  const { isConnected, broadcastCodeChange } = useRealtimeProject({
    projectId,
    onCodeChange: (code) => {
      // Update if change came from another user or from AI (not local typing)
      // AI updates will have isLocalChangeRef.current = false
      if (!isLocalChangeRef.current && editorRef.current) {
        setLocalValue(code)
        onChange(code)
        // Update editor value directly
        editorRef.current.setValue(code)
      }
      // Reset the flag after handling the change
      isLocalChangeRef.current = false
    }
  })

  // Subscribe to shared edit lock state and typing indicators via presence
  useEffect(() => {
    if (!projectId || !user) return

    const channel = supabase.channel(`typing-${projectId}`)
    
    // Track presence (who is typing and lock state)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        typingStateRef.current = {}
        let foundTyping = false
        let foundLockEnabled = false
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.userId !== user?.id) {
              // Check if lock is enabled by another user
              if (presence.lockEnabled) {
                foundLockEnabled = true
              }
              // Check if someone is typing
              if (presence.typing) {
                typingStateRef.current[presence.userId] = {
                  userId: presence.userId,
                  displayName: presence.displayName || 'User',
                  avatarUrl: presence.avatarUrl
                }
                foundTyping = true
              }
            }
          })
        })
        
        // If someone else has lock enabled, sync our state
        // But only if we're not the one who just turned it off
        if (foundLockEnabled && !editLockEnabled) {
          // Check if the lock is enabled by another user (not ourselves)
          const otherUserHasLock = Object.values(state).some((presences: any) => {
            return presences.some((p: any) => 
              p.userId !== user?.id && p.lockEnabled
            )
          })
          
          if (otherUserHasLock) {
            setEditLockEnabled(true)
            if (onEditLockChange) {
              onEditLockChange(true)
            }
          }
        } else if (!foundLockEnabled && editLockEnabled) {
          // If no one has lock enabled, turn it off
          setEditLockEnabled(false)
          if (onEditLockChange) {
            onEditLockChange(false)
          }
        }
        
        if (foundTyping) {
          const firstTyping = Object.values(typingStateRef.current)[0]
          setTypingUser(firstTyping as TypingUser)
          setIsLocked(true)
        } else {
          setTypingUser(null)
          // Only unlock if no one else has lock enabled
          if (!foundLockEnabled) {
            setIsLocked(false)
          }
        }
      })

    channel
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.userId !== user?.id) {
            // Check if lock is enabled by another user (not ourselves)
            if (presence.lockEnabled && !editLockEnabled) {
              setEditLockEnabled(true)
              if (onEditLockChange) {
                onEditLockChange(true)
              }
            }
            // Check if typing
            if (presence.typing) {
              typingStateRef.current[presence.userId] = {
                userId: presence.userId,
                displayName: presence.displayName || 'User',
                avatarUrl: presence.avatarUrl
              }
              setTypingUser(typingStateRef.current[presence.userId])
              setIsLocked(true)
            }
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
            // Check if anyone else has lock enabled
            const state = channel.presenceState()
            let hasLockEnabled = false
            Object.values(state).forEach((presences: any) => {
              presences.forEach((p: any) => {
                if (p.userId !== user?.id && p.lockEnabled) {
                  hasLockEnabled = true
                }
              })
            })
            if (!hasLockEnabled) {
              setIsLocked(false)
            }
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
          typing: false,
          lockEnabled: editLockEnabled
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

  // Broadcast typing status and lock state
  const broadcastTyping = async (isTyping: boolean) => {
    if (!presenceChannelRef.current || !user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()

    await presenceChannelRef.current.track({
      userId: user.id,
      displayName: profile?.display_name || user.email || 'User',
      avatarUrl: profile?.avatar_url,
      typing: isTyping,
      lockEnabled: editLockEnabled
    })
  }

  // Broadcast lock state change
  const broadcastLockState = async (enabled: boolean) => {
    if (!presenceChannelRef.current || !user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()

    await presenceChannelRef.current.track({
      userId: user.id,
      displayName: profile?.display_name || user.email || 'User',
      avatarUrl: profile?.avatar_url,
      typing: false,
      lockEnabled: enabled
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

  const toggleEditLock = async () => {
    const newValue = !editLockEnabled
    
    // Update local state immediately
    setEditLockEnabled(newValue)
    setIsLocked(false) // Always unlock when toggling
    setTypingUser(null) // Clear typing user
    
    if (onEditLockChange) {
      onEditLockChange(newValue)
    }
    
    // Broadcast lock state change to all users
    await broadcastLockState(newValue)
    
    if (!newValue) {
      // Clear typing status when disabling
      await broadcastTyping(false)
    }
  }

  // Handle editor mount to get editor instance
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    
    // Listen for selection changes
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection()
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel().getValueInRange(selection)
        const startLine = selection.startLineNumber
        const endLine = selection.endLineNumber
        
        if (selectedText.trim()) {
          setSelectedCode({
            code: selectedText,
            startLine,
            endLine
          })
        } else {
          setSelectedCode(null)
        }
      } else {
        setSelectedCode(null)
      }
    })
  }

  // Handle highlighting code when selection is received
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const decorationIdsRef = useRef<string[]>([])
  const activeHighlightRef = useRef<{ startLine: number; endLine: number } | null>(null)
  const clickDisposablesRef = useRef<any[]>([])

  useEffect(() => {
    if (!onCodeSelection || !editorRef.current) {
      // Clear highlight if selection is cleared
      if (editorRef.current && decorationIdsRef.current.length > 0) {
        editorRef.current.deltaDecorations(decorationIdsRef.current, [])
        decorationIdsRef.current = []
        activeHighlightRef.current = null
      }
      return
    }
    
    const selection = onCodeSelection
    if (selection && typeof selection === 'object' && selection.startLine && selection.endLine) {
      // Clear previous highlight
      if (decorationIdsRef.current.length > 0) {
        editorRef.current.deltaDecorations(decorationIdsRef.current, [])
        decorationIdsRef.current = []
      }
      
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
        highlightTimeoutRef.current = null
      }

      // Store active highlight
      activeHighlightRef.current = {
        startLine: selection.startLine,
        endLine: selection.endLine
      }

      // Scroll to the selection (center it in view)
      editorRef.current.revealLineInCenter(selection.startLine)
      
      // Set selection to show the range
      editorRef.current.setSelection({
        startLineNumber: selection.startLine,
        startColumn: 1,
        endLineNumber: selection.endLine,
        endColumn: 999999
      })
      
      // Highlight the selection with soft blue background
      const decorations = editorRef.current.deltaDecorations([], [
        {
          range: {
            startLineNumber: selection.startLine,
            startColumn: 1,
            endLineNumber: selection.endLine,
            endColumn: 999999
          },
          options: {
            className: 'bg-blue-50 dark:bg-blue-900/20',
            isWholeLine: true,
            stickiness: 1,
            hoverMessage: { value: 'Shared code selection - Click anywhere to clear' }
          }
        }
      ])
      decorationIdsRef.current = decorations
      
      // Clear previous click handlers
      clickDisposablesRef.current.forEach(disposable => disposable.dispose())
      clickDisposablesRef.current = []
      
      // Add click handler to clear highlight when user clicks
      const clearHighlight = () => {
        if (decorationIdsRef.current.length > 0 && activeHighlightRef.current) {
          editorRef.current.deltaDecorations(decorationIdsRef.current, [])
          decorationIdsRef.current = []
          activeHighlightRef.current = null
        }
      }
      
      // Listen for cursor changes (user clicking)
      const disposable1 = editorRef.current.onDidChangeCursorSelection(() => {
        if (activeHighlightRef.current) {
          const currentSelection = editorRef.current.getSelection()
          if (currentSelection) {
            const currentLine = currentSelection.startLineNumber
            const highlightStart = activeHighlightRef.current.startLine
            const highlightEnd = activeHighlightRef.current.endLine
            
            // If user clicked outside the highlighted range, clear it
            if (currentLine < highlightStart || currentLine > highlightEnd) {
              clearHighlight()
            }
          }
        }
      })
      
      // Listen for mouse clicks
      const disposable2 = editorRef.current.onMouseDown(() => {
        if (activeHighlightRef.current) {
          clearHighlight()
        }
      })
      
      clickDisposablesRef.current = [disposable1, disposable2]
    }

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
      clickDisposablesRef.current.forEach(disposable => disposable.dispose())
      clickDisposablesRef.current = []
    }
  }, [onCodeSelection])

  const handleShareSelection = async () => {
    if (!selectedCode || !shareMessage.trim()) return

    setSendingSelection(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: shareMessage.trim(),
          code_selection: selectedCode.code,
          code_selection_start_line: selectedCode.startLine,
          code_selection_end_line: selectedCode.endLine
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send code selection')
      }

      setShowShareDialog(false)
      setShareMessage('')
      setSelectedCode(null)
    } catch (error: any) {
      alert(error.message || 'Failed to share code selection')
    } finally {
      setSendingSelection(false)
    }
  }

  const effectiveReadOnly = readOnly || (isLocked && editLockEnabled)

  return (
    <div className="relative h-full">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded-md shadow-sm flex-wrap">
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
                <Unlock className="w-3 h-3" />
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

        {/* Share Selection Button */}
        {!readOnly && selectedCode && (
          <button
            onClick={() => setShowShareDialog(true)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            title={`Share lines ${selectedCode.startLine}-${selectedCode.endLine}`}
          >
            <Share2 className="w-3 h-3" />
            <span>Share Lines {selectedCode.startLine}-{selectedCode.endLine}</span>
          </button>
        )}
      </div>
      <Editor
        height="100%"
        defaultLanguage="r"
        value={localValue}
        onChange={handleChange}
        onMount={handleEditorDidMount}
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
      
      {/* Share Selection Modal */}
      {showShareDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-darktext dark:text-white">Share Code Selection</h3>
              <button
                onClick={() => setShowShareDialog(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="share-message" className="text-sm font-medium mb-2 block">
                  Message
                </Label>
                <Input
                  id="share-message"
                  placeholder="Hey, look at this..."
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleShareSelection()}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Selected Code (Lines {selectedCode?.startLine}-{selectedCode?.endLine})
                </Label>
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md max-h-40 overflow-auto border border-gray-200 dark:border-gray-700">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {selectedCode?.code}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleShareSelection} 
                disabled={!shareMessage.trim() || sendingSelection}
                className="bg-rstudio hover:bg-rstudio/90 text-white"
              >
                {sendingSelection ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}
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

