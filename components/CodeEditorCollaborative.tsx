'use client'

import { Editor } from '@monaco-editor/react'
import { useState, useEffect, useRef } from 'react'
import { useRealtimeProject } from '@/hooks/useRealtimeProject'
import { Wifi, WifiOff, Lock, Unlock, Share2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from '@/lib/useSessionStore'
import { playCollaborationSound } from '@/lib/soundNotifications'
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
  realtimeCollaborationEnabled?: boolean // Whether real-time collaboration is enabled
  onRealtimeCollaborationToggle?: (enabled: boolean) => void // Callback to toggle real-time collaboration
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
  onCodeSelection,
  realtimeCollaborationEnabled = false,
  onRealtimeCollaborationToggle
}: CodeEditorCollaborativeProps) {
  const { user } = useSessionStore()
  const [theme, setTheme] = useState<'light' | 'vs-dark'>('light')
  const [localValue, setLocalValue] = useState(value)
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [editLockEnabled, setEditLockEnabled] = useState(enableEditLock)
  const isUserTypingRef = useRef(false) // Track if current user is actively typing
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const [hasRemoteUpdates, setHasRemoteUpdates] = useState(false) // Track if there are remote updates available
  const lastKnownRemoteCodeRef = useRef<string | null>(null) // Track last known remote code
  const [selectedCode, setSelectedCode] = useState<{ code: string; startLine: number; endLine: number } | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [sendingSelection, setSendingSelection] = useState(false)
  const editorRef = useRef<any>(null)
  const isLocalChangeRef = useRef(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const presenceChannelRef = useRef<any>(null)
  const typingStateRef = useRef<{ [userId: string]: TypingUser }>({})
  const editLockEnabledRef = useRef(enableEditLock)
  const userToggledLockRef = useRef(false) // Track if user explicitly toggled the lock
  
  // Keep ref in sync with state
  useEffect(() => {
    editLockEnabledRef.current = editLockEnabled
  }, [editLockEnabled])

  // Only subscribe to real-time updates if collaboration is enabled
  const { isConnected, broadcastCodeChange } = useRealtimeProject({
    projectId,
    onCodeChange: realtimeCollaborationEnabled ? (code) => {
      // Automatically apply remote updates when collaboration is enabled
      if (code !== lastKnownRemoteCodeRef.current && code !== localValue) {
        // Don't apply if user is currently typing
        if (!isUserTypingRef.current) {
          lastKnownRemoteCodeRef.current = code
          setLocalValue(code)
          onChange(code) // Update parent component
          setHasRemoteUpdates(false) // Clear the refresh indicator since we applied it
          
          // Update Monaco editor directly
          if (editorRef.current) {
            const currentValue = editorRef.current.getValue()
            if (currentValue !== code) {
              editorRef.current.setValue(code)
            }
          }
          
          console.log('[CodeEditor] Remote edits applied automatically')
        } else {
          // User is typing, just track that there are updates available
          lastKnownRemoteCodeRef.current = code
          setHasRemoteUpdates(true) // Show refresh button with indicator
          console.log('[CodeEditor] Remote edits detected but user is typing - refresh available')
        }
      }
    } : undefined, // Don't subscribe if collaboration is disabled
    debounceMs: 200,
    enabled: realtimeCollaborationEnabled // Pass enabled flag
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
              // Check if someone is typing (always show typing, not just when lock is on)
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
        
        // Update typing user (show even when lock is off)
        if (foundTyping) {
          const firstTyping = Object.values(typingStateRef.current)[0]
          setTypingUser(firstTyping as TypingUser)
        } else {
          setTypingUser(null)
        }
        
        // Sync lock state from other users - if ANYONE has it on, everyone should see it on
        // Check if ANY OTHER user (excluding ourselves) has lock enabled
        let anyoneElseHasLock = false
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.userId !== user?.id && presence.lockEnabled) {
              anyoneElseHasLock = true
            }
          })
        })
        
        // Sync our lock state to match if anyone ELSE has it enabled
        // But don't override if user explicitly toggled it recently
        if (anyoneElseHasLock && !editLockEnabledRef.current && !userToggledLockRef.current) {
          // Someone else has lock enabled, sync our state to ON (only if user didn't just toggle it off)
          setEditLockEnabled(true)
          editLockEnabledRef.current = true
          if (onEditLockChange) {
            onEditLockChange(true)
          }
        } else if (!anyoneElseHasLock && editLockEnabledRef.current && !userToggledLockRef.current) {
          // No one else has lock enabled, sync our state to OFF (only if user didn't just toggle it on)
          setEditLockEnabled(false)
          editLockEnabledRef.current = false
          if (onEditLockChange) {
            onEditLockChange(false)
          }
        }
        
        // Update locked state: if lock is enabled AND someone else is typing, block editing
        if (editLockEnabledRef.current && foundTyping) {
          setIsLocked(true)
        } else {
          setIsLocked(false)
        }
      })

    channel
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.userId !== user?.id) {
            // Check if lock is enabled by another user - sync immediately (unless user just toggled it)
            if (presence.lockEnabled && !editLockEnabledRef.current && !userToggledLockRef.current) {
              setEditLockEnabled(true)
              editLockEnabledRef.current = true
              if (onEditLockChange) {
                onEditLockChange(true)
              }
            }
            // Check if typing (always show, not just when lock is on)
            if (presence.typing) {
              typingStateRef.current[presence.userId] = {
                userId: presence.userId,
                displayName: presence.displayName || 'User',
                avatarUrl: presence.avatarUrl
              }
              setTypingUser(typingStateRef.current[presence.userId])
              // If lock is enabled and someone is typing, block editing
              if (editLockEnabledRef.current) {
                setIsLocked(true)
              }
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
            // If lock is enabled and someone is still typing, keep locked
            if (editLockEnabledRef.current) {
              setIsLocked(true)
            }
          } else {
            setTypingUser(null)
            // Check if anyone else has lock enabled
            const state = channel.presenceState()
            let anyoneHasLock = false
            Object.values(state).forEach((presences: any) => {
              presences.forEach((p: any) => {
                if (p.lockEnabled) {
                  anyoneHasLock = true
                }
              })
            })
            // If no one has lock enabled, sync our state to OFF
            if (!anyoneHasLock && editLockEnabledRef.current) {
              setEditLockEnabled(false)
              editLockEnabledRef.current = false
              if (onEditLockChange) {
                onEditLockChange(false)
              }
            }
            setIsLocked(false)
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
          lockEnabled: editLockEnabledRef.current
        })
      }
    })

    presenceChannelRef.current = channel

    return () => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe()
      }
    }
  }, [projectId, user])
  
  // Update presence when lock state changes - this broadcasts to all users
  useEffect(() => {
    if (presenceChannelRef.current && user) {
      // Only update if user didn't just toggle (to avoid double broadcast)
      // The toggleEditLock function already broadcasts, so we skip here if user just toggled
      if (userToggledLockRef.current) {
        // User just toggled, skip this update (toggleEditLock already broadcasted)
        return
      }
      
      const updatePresence = async () => {
        try {
          // Get current profile for display name
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', user.id)
            .single()

          if (presenceChannelRef.current) {
            const trackPromise = presenceChannelRef.current.track({
              userId: user.id,
              displayName: profile?.display_name || user.email || 'User',
              avatarUrl: profile?.avatar_url,
              typing: false,
              lockEnabled: editLockEnabled
            })
            // Handle PromiseLike by wrapping in Promise.resolve
            Promise.resolve(trackPromise).catch((err: any) => {
              console.error('Failed to update presence:', err)
            })
          }
        } catch (err: any) {
          console.error('Failed to load profile:', err)
          // Fallback without profile
          if (presenceChannelRef.current) {
            const trackPromise = presenceChannelRef.current.track({
              userId: user.id,
              displayName: user.email || 'User',
              typing: false,
              lockEnabled: editLockEnabled
            })
            // Handle PromiseLike by wrapping in Promise.resolve
            Promise.resolve(trackPromise).catch((err: any) => {
              console.error('Failed to update presence:', err)
            })
          }
        }
      }
      updatePresence()
    }
  }, [editLockEnabled, user])

  // Broadcast typing status and lock state
  const broadcastTyping = async (isTyping: boolean) => {
    if (!presenceChannelRef.current || !user) return

    try {
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
        lockEnabled: editLockEnabledRef.current
      })
    } catch (error) {
      console.error('Failed to broadcast typing:', error)
    }
  }

  // Broadcast lock state change
  const broadcastLockState = async (enabled: boolean) => {
    if (!presenceChannelRef.current || !user) return

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single()

      const trackPromise = presenceChannelRef.current.track({
        userId: user.id,
        displayName: profile?.display_name || user.email || 'User',
        avatarUrl: profile?.avatar_url,
        typing: false,
        lockEnabled: enabled
      })
      
      // Update ref immediately
      editLockEnabledRef.current = enabled
      
      // Wait for the track to complete to ensure it's broadcasted
      await Promise.resolve(trackPromise)
      
      console.log(`🔒 Lock state broadcasted: ${enabled ? 'ON' : 'OFF'}`)
    } catch (error) {
      console.error('Failed to broadcast lock state:', error)
    }
  }

  // Cleanup typing debounce on unmount
  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

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
    // Don't allow editing if read-only
    if (readOnly) {
      return
    }
    
    // Check if locked
    if (isLocked && editLockEnabledRef.current) {
      return // Don't allow editing when locked
    }

    const code = newValue || ''
    
    // Mark that user is actively typing
    isUserTypingRef.current = true
    
    // Update local state immediately (no delay)
    setLocalValue(code)
    isLocalChangeRef.current = true
    onChange(code)
    
    // Clear the "has remote updates" flag when user types (they're making their own changes)
    setHasRemoteUpdates(false)
    
    // Broadcast typing status
    if (!readOnly) {
      broadcastTyping(true)
    }
    
    // Clear existing debounce
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current)
    }
    
    // Debounce the broadcast - only send when user stops typing
    typingDebounceRef.current = setTimeout(() => {
      // User has stopped typing, now broadcast the change
      isUserTypingRef.current = false
      
      if (!readOnly && realtimeCollaborationEnabled) {
        broadcastCodeChange(code)
        lastKnownRemoteCodeRef.current = code // Update our known remote code
      }
      
      // Stop typing indicator after a short delay
      setTimeout(() => {
        broadcastTyping(false)
      }, 300)
    }, 800) // Wait 800ms after user stops typing before broadcasting
  }

  // Manual refresh function to fetch latest code
  const handleRefresh = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('code')
        .eq('id', projectId)
        .single()

      if (error) throw error

      if (data && data.code !== localValue) {
        setLocalValue(data.code)
        onChange(data.code)
        lastKnownRemoteCodeRef.current = data.code
        setHasRemoteUpdates(false)
        
        // Update editor
        if (editorRef.current) {
          editorRef.current.setValue(data.code)
        }
      } else {
        setHasRemoteUpdates(false)
      }
    } catch (error) {
      console.error('[CodeEditor] Failed to refresh:', error)
    }
  }

  const toggleEditLock = async () => {
    const newValue = !editLockEnabled
    
    // Mark that user explicitly toggled the lock - prevent sync from overriding
    userToggledLockRef.current = true
    
    // Update local state immediately
    setEditLockEnabled(newValue)
    editLockEnabledRef.current = newValue
    setIsLocked(false) // Always unlock when toggling
    setTypingUser(null) // Clear typing user
    
    if (onEditLockChange) {
      onEditLockChange(newValue)
    }
    
    // Broadcast lock state change to all users FIRST
    // This ensures other users see the change immediately
    await broadcastLockState(newValue)
    
    if (!newValue) {
      // Clear typing status when disabling
      await broadcastTyping(false)
    }
    
    // Reset the flag after a longer delay to prevent sync from overriding
    // This gives time for the broadcast to propagate
    setTimeout(() => {
      userToggledLockRef.current = false
    }, 2000)
  }

  // Calculate effective read-only state
  // Only block if locked (not based on remote typing - allow free typing)
  const effectiveReadOnly = readOnly || (isLocked && editLockEnabled)

  // Update editor readOnly when prop changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        readOnly: effectiveReadOnly
      })
    }
  }, [effectiveReadOnly])

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
      
      // Highlight the selection with animated gradient background
      const decorations = editorRef.current.deltaDecorations([], [
        {
          range: {
            startLineNumber: selection.startLine,
            startColumn: 1,
            endLineNumber: selection.endLine,
            endColumn: 999999
          },
          options: {
            className: 'code-selection-highlight',
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

  return (
    <div className="relative h-full">
      {/* Notification banner for remote edits */}
      {hasRemoteUpdates && (
        <div className="absolute top-2 left-2 right-2 z-20 bg-green-500/95 dark:bg-green-600/95 backdrop-blur-sm text-white px-3 py-1.5 text-xs font-medium flex items-center justify-between rounded-md shadow-md animate-slide-down border border-green-400/30">
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>New edits available</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors"
          >
            Refresh
          </button>
        </div>
      )}
      
      <div className={`absolute ${hasRemoteUpdates ? 'top-10' : 'top-2'} right-2 z-10 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded-md shadow-sm flex-wrap transition-all`}>
        {/* Real-time Collaboration Toggle */}
        {!readOnly && onRealtimeCollaborationToggle && (
          <button
            onClick={() => {
              const newState = !realtimeCollaborationEnabled
              onRealtimeCollaborationToggle(newState)
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              realtimeCollaborationEnabled
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={realtimeCollaborationEnabled ? 'Disable real-time collaboration' : 'Enable real-time collaboration'}
          >
            {realtimeCollaborationEnabled ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Linked</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Not Linked</span>
              </>
            )}
          </button>
        )}

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

        {/* Refresh Button - Show when there are remote updates */}
        {hasRemoteUpdates && (
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            title="Refresh to see latest changes"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        )}

        {/* Typing Indicator - Show always, not just when lock is enabled */}
        {typingUser && (
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300">
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
                  className="w-full bg-white dark:bg-gray-900 text-darktext dark:text-white border-2 border-gray-300 dark:border-gray-600"
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

