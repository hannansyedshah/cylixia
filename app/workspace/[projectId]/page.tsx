'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { ChatBox } from '@/components/ChatBox'
import { CodeEditor } from '@/components/CodeEditor'
import { CodeEditorCollaborative } from '@/components/CodeEditorCollaborative'
import { CollaborationPanel } from '@/components/CollaborationPanel'
import { ProjectChat } from '@/components/ProjectChat'
import { InviteCollaboratorModal } from '@/components/InviteCollaboratorModal'
import { PlotViewer } from '@/components/PlotViewer'
import { TerminalView } from '@/components/TerminalView'
import { UploadPanel } from '@/components/UploadPanel'
import { VersionHistory } from '@/components/VersionHistory'
import { DataPreview } from '@/components/DataPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSessionStore } from '@/store/useSessionStore'
import { Send, Play, Code2, BarChart3, ArrowLeft, Maximize2, Minimize2, Loader2, Users, MessageSquare, X, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  code?: string
  plot_url?: string
  created_at: string
  user_id?: string
  profiles?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export default function WorkspacePage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const projectId = params.projectId as string
  
  const { user, setUser } = useSessionStore()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [loadingProject, setLoadingProject] = useState(true)
  type DatasetItem = { id: string, fileName: string, sizeBytes: number, persisted: boolean, includeChat: boolean, includeRun: boolean, csvText?: string }
  const [datasets, setDatasets] = useState<DatasetItem[]>([])
  
  // Shared datasets state
  interface SharedDataset {
    id: string
    project_id: string
    user_id: string
    file_name: string
    csv_text: string
    size_bytes: number
    include_chat: boolean
    include_run: boolean
    created_at: string
    profiles?: {
      id: string
      display_name: string | null
      avatar_url: string | null
    } | null
  }
  const [sharedDatasets, setSharedDatasets] = useState<SharedDataset[]>([])
  const [privacyMode, setPrivacyMode] = useState<boolean>(true) // Default to randomized data for privacy
  // Track user preferences for shared datasets (local state, not persisted)
  const [sharedDatasetPreferences, setSharedDatasetPreferences] = useState<Record<string, { includeChat: boolean; includeRun: boolean }>>({})
  const [airiaMode, setAiriaMode] = useState<'legacy' | 'quick' | 'ask'>('quick')
  const [stdoutText, setStdoutText] = useState<string>('')
  const [stderrText, setStderrText] = useState<string>('')
  const [showTerminalNextToPlot, setShowTerminalNextToPlot] = useState<boolean>(false)
  const [editorFocusMode, setEditorFocusMode] = useState<boolean>(false)
  const [enableEditLock, setEnableEditLock] = useState<boolean>(false)
  const hasLoadedRef = useRef(false)
  const [showDatasetsPanel, setShowDatasetsPanel] = useState<boolean>(false)
  const [galleryPlots, setGalleryPlots] = useState<string[]>([])
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)
  const datasetsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef(true)
  const [editorKey, setEditorKey] = useState<number>(0)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [estimatedSeconds, setEstimatedSeconds] = useState<number>(40) // Will be updated based on mode
  const [userRole, setUserRole] = useState<'owner' | 'edit' | 'view' | null>(null)
  const [showCollaborationSidebar, setShowCollaborationSidebar] = useState<boolean>(false)
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false)
  const [codeSelection, setCodeSelection] = useState<{ code: string; startLine: number; endLine: number } | null>(null)
  const mountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const chatAbortControllerRef = useRef<AbortController | null>(null)
  const runAbortControllerRef = useRef<AbortController | null>(null)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Dedicated function to determine and update user role
  const updateUserRole = useCallback(async (projectUserId: string) => {
    if (!user?.id || !projectId) {
      console.warn('⚠️ Cannot determine role: missing user or projectId')
      return
    }

    try {
      // Always check owner first - this is the most reliable check
      const isOwner = projectUserId === user.id
      if (isOwner) {
        console.log('✅ User is project owner')
        setUserRole('owner')
        return
      }

      // If not owner, check collaborator status
      const collabResponse = await fetch(`/api/projects/${projectId}/collaborators`)
      if (collabResponse.ok) {
        const collabData = await collabResponse.json()
        const currentUserCollab = collabData.collaborators?.find((c: any) => c.user_id === user.id)
        if (currentUserCollab && currentUserCollab.status === 'accepted') {
          console.log(`✅ User is collaborator with role: ${currentUserCollab.role}`)
          setUserRole(currentUserCollab.role as 'owner' | 'edit' | 'view')
        } else {
          console.log('⚠️ User is not a collaborator, defaulting to view')
          setUserRole('view')
        }
      } else {
        console.warn('⚠️ Failed to fetch collaborators, defaulting to view')
        setUserRole('view')
      }
    } catch (error) {
      console.error('❌ Error determining user role:', error)
      setUserRole('view') // Default to view on error
    }
  }, [user?.id, projectId])

  const loadProject = useCallback(async () => {
    if (!projectId || hasLoadedRef.current) return
    
    try {
      console.log('🚀 Loading project:', projectId)
      setLoadingProject(true)
      hasLoadedRef.current = true
      
      // Load project data
      const controller = new AbortController()
      abortControllerRef.current = controller
      const timeoutId = setTimeout(() => {
        console.log('⏰ Request timeout, aborting...')
        controller.abort()
      }, 10000) // 10 second timeout
      timeoutIdRef.current = timeoutId
      
      const response = await fetch(`/api/projects/${projectId}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      timeoutIdRef.current = null
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('❌ Project not found')
          if (mountedRef.current) {
            router.push('/dashboard')
          }
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (mountedRef.current && data.project) {
        console.log('✅ Project loaded successfully:', data.project.name)
        // Ensure messages array exists
        const projectWithMessages = {
          ...data.project,
          messages: data.project.messages || []
        }
        setProject(projectWithMessages)
        
        // Load messages from API
        loadMessages()
        
        // Determine and update user role
        await updateUserRole(data.project.user_id)
        
        // Load shared datasets
        await loadSharedDatasets()
        
        // Load saved dataset metadata from project.dataset field
        isInitialLoadRef.current = true // Mark as initial load to prevent saving
        if (data.project.dataset) {
          try {
            const savedDatasets = JSON.parse(data.project.dataset)
            if (Array.isArray(savedDatasets) && savedDatasets.length > 0) {
              // Create placeholder items for previously uploaded files
              const placeholderItems: DatasetItem[] = savedDatasets.map((meta: any, index: number) => ({
                id: `saved_${meta.fileName}_${index}`,
                fileName: meta.fileName,
                sizeBytes: meta.sizeBytes || 0,
                persisted: true, // Mark as persisted (needs re-upload)
                includeChat: meta.includeChat !== false, // Default to true
                includeRun: meta.includeRun !== false, // Default to true
                // No csvText - needs to be re-uploaded
              }))
              setDatasets(placeholderItems)
              console.log(`📁 Loaded ${placeholderItems.length} saved dataset metadata entries`)
              // Auto-open datasets panel if there are files that need re-uploading
              if (placeholderItems.length > 0) {
                setShowDatasetsPanel(true)
              }
            }
          } catch (error) {
            console.warn('Failed to parse saved dataset metadata:', error)
          }
        }
        // Reset flag after a short delay
        setTimeout(() => {
          isInitialLoadRef.current = false
        }, 1000)
      } else if (!mountedRef.current) {
        return // Don't navigate if component unmounted
      } else {
        console.warn('❌ No project data received')
        if (mountedRef.current) {
          router.push('/dashboard')
        }
      }
    } catch (error: any) {
      if (!mountedRef.current) return
      if (error.name === 'AbortError') {
        console.error('💥 Request was aborted')
        // Note: Alert shown via pathname change handler or beforeunload
        return // Don't navigate or set state on abort
      }
      console.error('💥 Failed to load project:', error)
      if (mountedRef.current) {
        router.push('/dashboard')
      }
    } finally {
      if (mountedRef.current) {
        setLoadingProject(false)
      }
      abortControllerRef.current = null
    }
  }, [projectId, router])

  // Load messages from API
  const loadMessages = useCallback(async () => {
    if (!projectId || !mountedRef.current) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`)
      if (!response.ok) {
        console.error('Failed to load messages')
        return
      }
      
      const data = await response.json()
      if (mountedRef.current && data.messages) {
        setProject((prev: any) => ({
          ...prev,
          messages: data.messages || []
        }))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [projectId])

  // Load shared datasets
  const loadSharedDatasets = useCallback(async () => {
    if (!projectId) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/shared-datasets`)
      if (response.ok) {
        const data = await response.json()
        const loadedDatasets = data.sharedDatasets || []
        setSharedDatasets(loadedDatasets)
        
        // Initialize preferences with stored values (user can override)
        setSharedDatasetPreferences(prev => {
          const newPrefs = { ...prev }
          loadedDatasets.forEach((ds: SharedDataset) => {
            if (!newPrefs[ds.id]) {
              // Initialize with stored values if not already set
              newPrefs[ds.id] = {
                includeChat: ds.include_chat,
                includeRun: ds.include_run
              }
            }
          })
          return newPrefs
        })
      } else {
        console.error('Failed to load shared datasets:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading shared datasets:', error)
    }
  }, [projectId])

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!projectId || !mountedRef.current) return

    const channel = supabase
      .channel(`project-messages-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          // Fetch the new message with profile
          const { data: newMessageData } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (newMessageData && mountedRef.current) {
            // Get profile for user messages
            let profile = null
            if (newMessageData.user_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', newMessageData.user_id)
                .single()
              
              if (profileData) {
                profile = profileData
              }
            }

            const newMessage: Message = {
              ...newMessageData,
              profiles: profile
            }

            // Prevent duplicate messages
            setProject((prev: any) => {
              if (!prev) return prev
              const exists = prev.messages?.some((m: Message) => m.id === newMessage.id)
              if (exists) return prev
              return {
                ...prev,
                messages: [...(prev.messages || []), newMessage]
              }
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [projectId])

  // Handle authentication state changes
  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!mounted) return
      
      if (!session && !user) {
        console.log('❌ No auth, redirecting to login')
        if (mounted) {
          router.push('/login')
        }
        return
      }
      
      if (session && !user) {
        console.log('✅ Setting user from session')
        setUser(session.user)
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
  }, [user, setUser, router])

  // Reset loading state when projectId changes
  useEffect(() => {
    hasLoadedRef.current = false
    setLoadingProject(true)
    setProject(null)
  }, [projectId])

  // Track elapsed time when loading AI response
  useEffect(() => {
    if (!mountedRef.current) return
    
    // Determine estimated time based on mode
    const baseEstimate = airiaMode === 'quick' ? 40 : airiaMode === 'ask' ? 60 : 130
    
    let interval: NodeJS.Timeout | null = null
    let estimateInterval: NodeJS.Timeout | null = null
    if (loading && loadingStartTime && mountedRef.current) {
      // Update elapsed time every second
      interval = setInterval(() => {
        if (!mountedRef.current) {
          if (interval) clearInterval(interval)
          if (estimateInterval) clearInterval(estimateInterval)
          return
        }
        const elapsed = Math.floor((Date.now() - loadingStartTime) / 1000)
        if (mountedRef.current) {
          setElapsedSeconds(elapsed)
        }
      }, 1000)
      
      // Update estimated time every 5 seconds (more stable)
      estimateInterval = setInterval(() => {
        if (!mountedRef.current) {
          if (interval) clearInterval(interval)
          if (estimateInterval) clearInterval(estimateInterval)
          return
        }
        const elapsed = Math.floor((Date.now() - loadingStartTime) / 1000)
        if (mountedRef.current) {
          setEstimatedSeconds(elapsed + baseEstimate)
        }
      }, 5000)
      
      // Set initial estimate
      if (mountedRef.current) {
        setEstimatedSeconds(baseEstimate)
      }
    } else {
      if (mountedRef.current) {
        setElapsedSeconds(0)
        setEstimatedSeconds(baseEstimate)
      }
    }
    return () => {
      if (interval) clearInterval(interval)
      if (estimateInterval) clearInterval(estimateInterval)
    }
  }, [loading, loadingStartTime, airiaMode])

  // Load project when projectId changes (only once per projectId)
  useEffect(() => {
    if (projectId && !hasLoadedRef.current) {
      loadProject()
    }
  }, [projectId, loadProject])

  // Subscribe to real-time collaborator role changes to update userRole
  useEffect(() => {
    if (!projectId || !user?.id || !project) return

    const channel = supabase
      .channel(`project-user-role-${projectId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_collaborators',
          filter: `project_id=eq.${projectId} AND user_id=eq.${user.id}`
        },
        async (payload) => {
          // When the current user's role is updated, update role immediately
          console.log('🔄 User role updated in real-time:', payload.new)
          const newRole = (payload.new as any).role
          if (newRole && ['owner', 'edit', 'view'].includes(newRole)) {
            setUserRole(newRole as 'owner' | 'edit' | 'view')
            // Force editor re-render by updating editor key
            setEditorKey(prev => prev + 1)
          } else {
            // If role update is unclear, re-check role
            await updateUserRole(project.user_id)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_collaborators',
          filter: `project_id=eq.${projectId} AND user_id=eq.${user.id}`
        },
        async () => {
          // When user is added as collaborator, update role
          console.log('🔄 User added as collaborator, updating role...')
          await updateUserRole(project.user_id)
          setEditorKey(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'project_collaborators',
          filter: `project_id=eq.${projectId} AND user_id=eq.${user.id}`
        },
        async () => {
          // When user is removed as collaborator, check if they're still owner
          console.log('🔄 User removed as collaborator, checking role...')
          await updateUserRole(project.user_id)
          setEditorKey(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [projectId, user?.id, project, updateUserRole])

  // Force component updates when role changes
  useEffect(() => {
    // When role changes, force editor to re-render with correct permissions
    if (userRole !== null) {
      setEditorKey(prev => prev + 1)
    }
  }, [userRole])

  // Real-time subscription for shared_datasets changes
  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`shared_datasets:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_datasets',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          console.log('Shared dataset changed:', payload.eventType)
          // Reload shared datasets when changes occur
          await loadSharedDatasets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, loadSharedDatasets])

  // Handle visibility changes to reset stuck states
  // Use ref to access current loading value to avoid recreating listener
  const loadingRef = useRef(loading)
  
  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only handle visibility changes - don't do anything on hidden
      if (document.visibilityState === 'hidden') {
        // Clear any pending visibility timeouts when tab becomes hidden
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current)
          visibilityTimeoutRef.current = null
        }
        return
      }

      if (document.visibilityState === 'visible' && mountedRef.current) {
        // Reset stuck loading state if detected
        // If loading state is true but no active operation, something might be stuck
        // This ensures buttons aren't permanently disabled
        // Use ref to get current value without dependency issues
        if (loadingRef.current) {
          // Clear any existing timeout first
          if (visibilityTimeoutRef.current) {
            clearTimeout(visibilityTimeoutRef.current)
          }
          // Check if loading seems stuck (give it a moment)
          visibilityTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && loadingRef.current) {
              // Still loading after delay - might be stuck, but don't reset automatically
              // Only reset if we can confirm there's no active operation
              console.log('Loading state still active after visibility change')
            }
            visibilityTimeoutRef.current = null
          }, 3000)
        }
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        // Clean up any pending timeout
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current)
          visibilityTimeoutRef.current = null
        }
      }
    }
  }, []) // Empty deps - use refs to access current state

  // Warn users before leaving page during operations
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loading || loadingProject) {
        e.preventDefault()
        e.returnValue = 'You have operations in progress. Are you sure you want to leave? This will cancel your current operation.'
        return e.returnValue
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, [loading, loadingProject])

  // Track previous pathname to detect navigation
  const previousPathnameRef = useRef<string | null>(null)
  
  // Warn users before client-side navigation during operations
  useEffect(() => {
    // Skip initial mount - store current pathname for next render
    if (previousPathnameRef.current === null) {
      previousPathnameRef.current = pathname
      return
    }
    
    // Only check if we're actually on a different page (not initial mount)
    const currentPathname = pathname
    const expectedPathname = `/workspace/${projectId}`
    
    // Only show warning if:
    // 1. We were on the workspace page before
    // 2. We're now on a different page
    // 3. We have active operations
    // 4. Component is still mounted (about to unmount)
    const wasOnWorkspace = previousPathnameRef.current === expectedPathname
    const isLeavingWorkspace = currentPathname !== expectedPathname
    const hasActiveOperations = loading || loadingProject
    
    if (wasOnWorkspace && 
        isLeavingWorkspace && 
        hasActiveOperations && 
        mountedRef.current) {
      // User is navigating away - abort operations and show warning
      try {
        alert('⚠️ Warning: You have operations in progress. They have been cancelled because you navigated away from the page. Please stay on the page while operations are running.')
      } catch (e) {
        // Alert might fail if already unmounted, ignore
      }
      
      // Abort all active operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (chatAbortControllerRef.current) {
        chatAbortControllerRef.current.abort()
      }
      if (runAbortControllerRef.current) {
        runAbortControllerRef.current.abort()
      }
    }
    
    // Update previous pathname for next render
    previousPathnameRef.current = currentPathname
  }, [pathname, projectId, loading, loadingProject])

  // Track loading state in ref for cleanup
  const loadingStateRef = useRef(loading)
  
  useEffect(() => {
    loadingStateRef.current = loading
  }, [loading])

  // Comprehensive cleanup on unmount only
  useEffect(() => {
    return () => {
      // Set mounted to false first to prevent any new operations
      mountedRef.current = false
      
      // Use ref to get current loading state without causing effect to re-run
      const hasActiveOperations = loadingStateRef.current || 
        abortControllerRef.current || 
        chatAbortControllerRef.current || 
        runAbortControllerRef.current
      
      // Abort all active fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      if (chatAbortControllerRef.current) {
        chatAbortControllerRef.current.abort()
        chatAbortControllerRef.current = null
      }
      if (runAbortControllerRef.current) {
        runAbortControllerRef.current.abort()
        runAbortControllerRef.current = null
      }
      
      // Clear any pending timeouts
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      
      // Clear visibility timeout
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current)
        visibilityTimeoutRef.current = null
      }
      
      // Clear dataset save timeout
      if (datasetsSaveTimeoutRef.current) {
        clearTimeout(datasetsSaveTimeoutRef.current)
        datasetsSaveTimeoutRef.current = null
      }
    }
  }, []) // Empty deps - only run on unmount

  const handleSendMessage = async () => {
    if (!prompt.trim() || !project) return

    // Prevent view-only users from using AI chat (they can use collaboration chat)
    if (userRole === 'view') {
      alert('View-only access: You cannot use the AI chat. Please use the collaboration chat instead.')
      return
    }

    if (!mountedRef.current) return
    
    const controller = new AbortController()
    chatAbortControllerRef.current = controller
    
    setLoading(true)
    setLoadingStartTime(Date.now())
    
    try {
      // Add user message to database
      const userMessageResponse = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: prompt }),
        signal: controller.signal,
      })
      
      const userMessageData = await userMessageResponse.json()
      
      // Add user message to local state immediately so it appears in the UI
      if (mountedRef.current && userMessageData.message) {
        const userMessage: Message = {
          id: userMessageData.message.id || Math.random().toString(36).substring(7),
          role: 'user' as const,
          content: prompt,
          created_at: userMessageData.message.created_at || new Date().toISOString(),
          user_id: user?.id,
          profiles: userMessageData.message.profiles || null
        }
        
        setProject((prev: any) => ({
          ...prev,
          messages: [...(prev.messages || []), userMessage]
        }))
      }

      if (!mountedRef.current) return

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          existingCode: project.code,
          userId: user?.id || user?.email || 'anonymous',
          privacyMode,
          mode: airiaMode,
          csvFilesForChat: [
            ...datasets
              .filter(d => d.includeChat && d.csvText) // only ephemeral have csvText locally
              .map(d => ({ fileName: d.fileName, csvData: d.csvText! })),
            ...sharedDatasets
              .filter(d => {
                const prefs = sharedDatasetPreferences[d.id]
                // Use user preference if set, otherwise use stored value
                return prefs ? prefs.includeChat : d.include_chat
              })
              .map(d => ({ fileName: d.file_name, csvData: d.csv_text }))
          ]
        }),
        signal: controller.signal,
      })

      const data = await response.json()
      
      if (!mountedRef.current) return

      // For ask mode, don't update code or show it in terminal
      const isAskMode = airiaMode === 'ask'

      if (data.code && !isAskMode) {
        // Update code in database (skip for ask mode)
        // This will trigger real-time updates for all collaborators
        const updateResponse = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.code }),
          signal: controller.signal,
        })
        
        if (!mountedRef.current) return

        // Get the updated project to ensure we have the latest timestamp
        if (updateResponse.ok) {
          const updatedProject = await updateResponse.json()
          if (updatedProject.project && mountedRef.current) {
            // Update local state with the full project data including updated_at
            setProject((prev: any) => ({
              ...prev,
              code: data.code,
              updated_at: updatedProject.project.updated_at
            }))
          }
        } else {
          // Fallback: update local state even if API call fails
          if (mountedRef.current) {
            setProject((prev: any) => ({
              ...prev,
              code: data.code
            }))
          }
        }

        // Auto-save version when new code is generated
        try {
          await fetch(`/api/projects/${projectId}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: data.code,
              plot_url: project.plot_url,
              description: `Auto-saved: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`
            }),
            signal: controller.signal,
          })
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('Failed to auto-save version:', error)
          }
        }
      }

      if (!mountedRef.current) return

      // Add assistant message
      // For ask mode, don't include code - just show text response
      // Ensure we have content even if message is empty
      let messageContent = data.message
      if (isAskMode && (!messageContent || messageContent.trim() === '')) {
        // For ask mode, if no message but there's a response, use the code as message (it's actually text response)
        messageContent = data.code || 'Here\'s the answer to your question:'
      }
      if (!messageContent || messageContent.trim() === '') {
        messageContent = isAskMode ? 'Here\'s the answer to your question:' : 'Here\'s the R code for your request:'
      }
      
      const newMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: messageContent,
        code: isAskMode ? undefined : data.code, // Don't include code for ask mode
        created_at: new Date().toISOString()
      }
      
      await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: newMessage.content,
          code: isAskMode ? undefined : data.code, // Don't save code for ask mode
        }),
        signal: controller.signal,
      })
      
      // Update messages locally
      if (mountedRef.current) {
        setProject((prev: any) => ({
          ...prev,
          messages: [...prev.messages, newMessage]
        }))
      }
    } catch (error: any) {
      if (!mountedRef.current) return
      if (error.name === 'AbortError') {
        console.log('Chat request was aborted')
        // Note: Alert shown via pathname change handler or beforeunload
        return
      }
      console.error('Chat error:', error)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setLoadingStartTime(null)
        setElapsedSeconds(0)
        setPrompt('')
      }
      chatAbortControllerRef.current = null
    }
  }

  const handleRunCode = async () => {
    if (!project) {
      console.error('No project loaded')
      return
    }
    
    if (!mountedRef.current) return
    
    console.log('🚀 Running R code...')
    console.log('Code:', project.code.substring(0, 100))
    console.log('Selected for run:', datasets.filter(d => d.includeRun).length)
    
    setLoading(true)

    try {
      console.log('Sending request to /api/execute proxy...')
      
      // Prepare CSV data array for execution (originals)
      const runFiles = datasets.filter(d => d.includeRun && d.csvText)
      const sharedRunFiles = sharedDatasets.filter(d => {
        const prefs = sharedDatasetPreferences[d.id]
        // Use user preference if set, otherwise use stored value
        return prefs ? prefs.includeRun : d.include_run
      })
      const allRunFiles = [
        ...runFiles.map(d => ({ filename: d.fileName, data_base64: btoa(d.csvText!) })),
        ...sharedRunFiles.map(d => ({ filename: d.file_name, data_base64: btoa(d.csv_text) }))
      ]
      const csv_files = allRunFiles
      // Backward compatibility: also send the first CSV as single fields expected by backend
      const primary = runFiles[0] || sharedRunFiles[0]
      const csv_base64 = primary 
        ? ('csvText' in primary && primary.csvText 
            ? btoa(primary.csvText) 
            : 'csv_text' in primary 
              ? btoa((primary as unknown as SharedDataset).csv_text) 
              : undefined)
        : undefined
      const file_name = primary 
        ? ('fileName' in primary ? primary.fileName : (primary as unknown as SharedDataset).file_name)
        : undefined
      
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          code: project.code, 
          csv_files,
          csv_base64,
          file_name,
        }),
      })

      console.log('Response status:', response.status)
      
      const data = await response.json()
      console.log('Full response data:', JSON.stringify(data, null, 2))
      console.log('Response keys:', Object.keys(data))
      console.log('Success status:', data.success)
      console.log('Plot data present:', !!(data.plot_base64 || data.plot || data.image || data.plot_data || data.result))
      
      // Capture terminal output if available
      try {
        if (mountedRef.current) {
          if (typeof data?.stdout === 'string') setStdoutText(data.stdout)
          if (typeof data?.stderr === 'string') setStderrText(data.stderr)
        }
      } catch {}

      if (!mountedRef.current) return

      if (!response.ok) {
        console.error('Execute error:', data)
        const errorMessage = data.error || 'Failed to execute code'
        
        // Show detailed error information
        let fullErrorMessage = `Error: ${errorMessage}`
        
        // Special handling for service not deployed
        if (response.status === 503) {
          fullErrorMessage += `\n\n🔧 The R execution service is not responding properly. Please check the Hugging Face service status.`
        }
        
        alert(fullErrorMessage)
        return
      }
      
      // Handle response payloads: multiple or single plot(s)
      let urls: string[] = []
      if (Array.isArray(data.plot_base64)) {
        urls = data.plot_base64
          .map((p: any) => (p && (p.data || p)))
          .filter(Boolean)
          .map((b64: string) => `data:image/png;base64,${b64}`)
      } else {
        const plotData =
          data.plot_base64 ||
          data.image_base64 ||
          data.plot ||
          data.image ||
          data.plot_data ||
          data.result
        if (plotData) {
          urls = [`data:image/png;base64,${plotData}`]
        }
      }

      if (urls.length > 0) {
        if (mountedRef.current) {
          setGalleryPlots(urls)
        }

        if (!mountedRef.current) return

        // Persist the first image URL for version/history continuity
        const firstUrl = urls[0]
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plot_url: firstUrl }),
        })

        if (!mountedRef.current) return

        if (mountedRef.current) {
          setProject((prev: any) => ({
            ...prev,
            plot_url: firstUrl
          }))
        }

        try {
          // Save all plots in a single version save
          // Store multiple plot URLs as a JSON array in the plot_url field
          const plotUrlsJson = urls.length > 1 ? JSON.stringify(urls) : urls[0]
          await fetch(`/api/projects/${projectId}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: project.code,
              plot_url: plotUrlsJson,
              description: urls.length > 1
                ? `${urls.length} plots generated: ${new Date().toLocaleString()}`
                : `Plot generated: ${new Date().toLocaleString()}`
            }),
          })
        } catch (error: any) {
          console.error('Failed to auto-save version with plot(s):', error)
        }

        console.log(`✅ Plot updated successfully (${urls.length} image(s))`)
      } else {
        console.warn('No plot data found in response')
        console.log('Available fields:', Object.keys(data))
        if (data.message) {
          console.log('Response message:', data.message)
        }
      }
    } catch (error: any) {
      if (!mountedRef.current) return
      console.error('Execution error:', error)
      if (mountedRef.current) {
        setStderrText(prev => `${prev}\n${error.message}`)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleCodeChange = useCallback(async (newCode: string) => {
    if (project && mountedRef.current) {
      const now = new Date().toISOString()
      setProject({ ...project, code: newCode, updated_at: now })
      // Debounce the API call - don't await to prevent blocking
      fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode }),
      }).catch(error => {
        if (mountedRef.current) {
          console.error('Failed to save code:', error)
        }
      })
    }
  }, [project, projectId])

  // Real-time code updates are handled by CodeEditorCollaborative via useRealtimeProject hook
  // No need for duplicate subscription here

  // Share a dataset with collaborators
  const handleShareDataset = useCallback(async (dataset: DatasetItem) => {
    if (!projectId || !dataset.csvText) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/shared-datasets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: dataset.fileName,
          csv_text: dataset.csvText,
          size_bytes: dataset.sizeBytes,
          include_chat: dataset.includeChat,
          include_run: dataset.includeRun
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to share dataset')
      }
      
      const data = await response.json()
      // Add the new shared dataset to the list
      setSharedDatasets(prev => [...prev, data.sharedDataset])
    } catch (error: any) {
      console.error('Failed to share dataset:', error)
      throw error
    }
  }, [projectId])
  
  // Remove a shared dataset
  const handleRemoveSharedDataset = useCallback(async (datasetId: string) => {
    if (!projectId) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/shared-datasets/${datasetId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove shared dataset')
      }
      
      // Remove from local state
      setSharedDatasets(prev => prev.filter(d => d.id !== datasetId))
    } catch (error: any) {
      console.error('Failed to remove shared dataset:', error)
      throw error
    }
  }, [projectId])

  // Save dataset metadata when datasets change (debounced to avoid excessive saves)
  useEffect(() => {
    if (!project || !mountedRef.current || isInitialLoadRef.current) return
    
    // Clear existing timeout
    if (datasetsSaveTimeoutRef.current) {
      clearTimeout(datasetsSaveTimeoutRef.current)
    }
    
    // Debounce the save
    datasetsSaveTimeoutRef.current = setTimeout(() => {
      // Extract metadata (without csvText) for each dataset
      const datasetMetadata = datasets.map(d => ({
        fileName: d.fileName,
        sizeBytes: d.sizeBytes,
        includeChat: d.includeChat,
        includeRun: d.includeRun,
        persisted: d.persisted || !!d.csvText, // Mark as persisted if it has csvText
      }))
      
      // Save to database (don't await to prevent blocking)
      fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dataset: datasetMetadata.length > 0 ? JSON.stringify(datasetMetadata) : null 
        }),
      }).catch(error => {
        if (mountedRef.current) {
          console.error('Failed to save dataset metadata:', error)
        }
      })
    }, 500) // 500ms debounce
    
    return () => {
      if (datasetsSaveTimeoutRef.current) {
        clearTimeout(datasetsSaveTimeoutRef.current)
      }
    }
  }, [datasets, project, projectId])

  const handleVersionRestore = (code: string, plotUrl?: string) => {
    if (project && mountedRef.current) {
      // Parse plotUrl - could be a single URL string or JSON array of URLs
      let parsedPlotUrls: string[] = []
      let plotUrlToSave = plotUrl || project.plot_url
      
      if (plotUrl) {
        try {
          // Try to parse as JSON array (for multiple plots)
          const parsed = JSON.parse(plotUrl)
          if (Array.isArray(parsed)) {
            parsedPlotUrls = parsed
            // Save the first URL to project.plot_url for compatibility
            plotUrlToSave = parsed[0]
          } else {
            // Single plot URL
            parsedPlotUrls = [plotUrl]
            plotUrlToSave = plotUrl
          }
        } catch {
          // Not JSON, treat as single plot URL
          parsedPlotUrls = [plotUrl]
          plotUrlToSave = plotUrl
        }
      }
      
      // Update project code and plot URL (use first URL for compatibility)
      setProject({ 
        ...project, 
        code: code,
        plot_url: plotUrlToSave
      })
      
      // Force CodeEditor to re-render with new code
      setEditorKey(prev => prev + 1)
      
      // Update gallery plots with all restored plots
      setGalleryPlots(parsedPlotUrls)
      
      // Clear terminal output when restoring
      setStdoutText('')
      setStderrText('')
      
      // Update the database - don't await to prevent blocking
      fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code,
          plot_url: plotUrlToSave
        }),
      }).catch(error => {
        if (mountedRef.current) {
          console.error('Failed to restore version:', error)
        }
      })
    }
  }

  const handleSaveVersion = async (code: string, plotUrl?: string, description?: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          plot_url: plotUrl,
          description: description || `Version ${new Date().toLocaleString()}`
        })
      })

      const data = await response.json()
      if (data.version) {
        console.log('Version saved successfully:', data.version.version_number)
      }
    } catch (error) {
      console.error('Failed to save version:', error)
    }
  }

  // Show loading screen while project is loading
  if (loadingProject) {
    return (
      <Layout>
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rstudio mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // If no project after loading, redirect to dashboard
  if (!project) {
    return (
      <Layout>
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Project not found</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-80px)] flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-purple-950/30">
        {/* Project Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b px-4 py-2 flex items-center justify-between">
          {/* Left: Project Title and Leave Button */}
          <div className="flex items-center space-x-3 flex-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold text-darktext dark:text-white">
                  {project.name}
                </h1>
                {datasets.length > 0 && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    privacyMode 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {privacyMode ? '🔒 Chat uses randomized data' : '⚠️ Chat uses originals'}
                  </div>
                )}
              </div>
              {project.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Middle: Collaborators Button */}
          <div className="flex items-center justify-center flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCollaborationSidebar(!showCollaborationSidebar)}
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Collaborate</span>
            </Button>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Datasets dropdown trigger - hide for view-only users */}
            {userRole !== 'view' && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowDatasetsPanel(v => !v)} 
                className={`h-8 px-3 ${datasets.some(d => {
                  if (!d.persisted || d.csvText) return false
                  // Don't show if file is shared (available as shared dataset)
                  const isShared = sharedDatasets.some(sd => sd.file_name === d.fileName)
                  return !isShared
                }) ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
              >
                Datasets ({datasets.length})
                {datasets.some(d => {
                  if (!d.persisted || d.csvText) return false
                  const isShared = sharedDatasets.some(sd => sd.file_name === d.fileName)
                  return !isShared
                }) && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500 text-yellow-900">
                    {datasets.filter(d => {
                      if (!d.persisted || d.csvText) return false
                      const isShared = sharedDatasets.some(sd => sd.file_name === d.fileName)
                      return !isShared
                    }).length} need re-upload
                  </span>
                )}
              </Button>
            )}
            {/* Compact AI mode pills - hide for view-only users */}
            {userRole !== 'view' && (
              <div className="flex gap-1 text-xs">
                <button
                  className={`px-2 py-1 rounded border ${airiaMode === 'legacy' ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 font-medium' : 'bg-transparent border-transparent opacity-70'}`}
                  onClick={() => setAiriaMode('legacy')}
                >
                  Legacy
                </button>
                <button
                  className={`px-2 py-1 rounded border ${airiaMode === 'quick' ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 font-medium' : 'bg-transparent border-transparent opacity-70'}`}
                  onClick={() => setAiriaMode('quick')}
                >
                  Quick
                </button>
                <button
                  className={`px-2 py-1 rounded border ${airiaMode === 'ask' ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 font-medium' : 'bg-transparent border-transparent opacity-70'}`}
                  onClick={() => setAiriaMode('ask')}
                >
                  Ask Data
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Datasets dropdown panel - hide for view-only users */}
        {showDatasetsPanel && userRole !== 'view' && (
          <div className="px-4 pt-2">
            {datasets.some(d => {
              if (!d.persisted || d.csvText) return false
              // Don't show if file is shared (available as shared dataset)
              const isShared = sharedDatasets.some(sd => sd.file_name === d.fileName)
              return !isShared
            }) && (
              <div className="mb-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600">
                <div className="flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                      Files Need to be Re-uploaded
                    </p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                      This project previously had {datasets.filter(d => {
                        if (!d.persisted || d.csvText) return false
                        const isShared = sharedDatasets.some(sd => sd.file_name === d.fileName)
                        return !isShared
                      }).length} file{datasets.filter(d => {
                        if (!d.persisted || d.csvText) return false
                        const isShared = sharedDatasets.some(sd => sd.file_name === d.fileName)
                        return !isShared
                      }).length > 1 ? 's' : ''} uploaded. 
                      Please re-upload {datasets.filter(d => {
                        if (!d.persisted || d.csvText) return false
                        const isShared = sharedDatasets.some(sd => sd.file_name === d.fileName)
                        return !isShared
                      }).length > 1 ? 'them' : 'it'} below to use {datasets.filter(d => {
                        if (!d.persisted || d.csvText) return false
                        const isShared = sharedDatasets.some(sd => sd.file_name === d.fileName)
                        return !isShared
                      }).length > 1 ? 'them' : 'it'} again:
                    </p>
                    <ul className="mt-2 text-xs text-yellow-800 dark:text-yellow-200 list-disc list-inside">
                      {datasets.filter(d => {
                        if (!d.persisted || d.csvText) return false
                        const isShared = sharedDatasets.some(sd => sd.file_name === d.fileName)
                        return !isShared
                      }).map(d => (
                        <li key={d.id}>{d.fileName}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-md">
              <UploadPanel 
                privacyMode={privacyMode}
                datasets={datasets}
                sharedDatasets={sharedDatasets}
                onDatasetsChange={(list) => setDatasets(list)}
                projectId={projectId}
                userRole={userRole ?? undefined}
                currentUserId={user?.id}
                onShareDataset={handleShareDataset}
                onRemoveSharedDataset={handleRemoveSharedDataset}
                onSharedDatasetPreferenceChange={(datasetId, type, value) => {
                  setSharedDatasetPreferences(prev => {
                    const current = prev[datasetId] || { includeChat: true, includeRun: true }
                    return {
                      ...prev,
                      [datasetId]: {
                        ...current,
                        [type === 'chat' ? 'includeChat' : 'includeRun']: value
                      }
                    }
                  })
                }}
                sharedDatasetPreferences={sharedDatasetPreferences}
              />
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Chat & Code */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl min-w-0">
          {!editorFocusMode && (
            <>
              {/* Chat Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Loading Indicator */}
                {loading && loadingStartTime && (
                  <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 px-4 py-3 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 text-rstudio animate-spin" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          AI is thinking...
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {elapsedSeconds > 0 ? `${elapsedSeconds}s elapsed` : 'Getting started...'}
                          {elapsedSeconds > 0 && (
                            <span className="ml-2">• Estimated: ~{Math.min(240, estimatedSeconds)}s total</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-rstudio animate-pulse"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {airiaMode === 'legacy' ? 'Legacy Mode' : airiaMode === 'ask' ? 'Ask Data Mode' : 'Quick Mode'}
                      </span>
                    </div>
                  </div>
                )}
                {/* Run Loading Indicator */}
                {loading && !loadingStartTime && (
                  <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 px-4 py-3 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 text-rstudio animate-spin" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Compiling in Hugging Face...
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Executing your R code...
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-rstudio animate-pulse"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Running Code</span>
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                  {project.messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center animate-fade-in-up">
                        <div className="mb-4 text-6xl animate-float">💬</div>
                        <p className="text-lg">Start a conversation by typing a question below</p>
                        <p className="text-sm mt-2 opacity-70">Try: &quot;Create a scatter plot of my data&quot;</p>
                      </div>
                    </div>
                  ) : (
                    project.messages.map((message: Message, index: number) => {
                      const isCurrentUser = message.user_id === user?.id
                      const senderName = message.profiles?.display_name || (message.user_id ? 'User' : null)
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          } animate-fade-in-up`}
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div
                            className={`max-w-[70%] rounded-xl px-4 py-3 shadow ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-rstudio to-blue-600 text-white'
                                : 'bg-white dark:bg-gray-700 text-darktext dark:text-white border border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            {/* Show sender name for user messages from other collaborators */}
                            {message.role === 'user' && senderName && !isCurrentUser && (
                              <div className="text-xs font-medium mb-1 opacity-90">
                                {senderName}
                              </div>
                            )}
                            <div className="text-sm leading-relaxed break-words">
                            {message.content.split('\n').map((line: string, lineIndex: number) => {
                              const trimmedLine = line.trim()
                              
                              // Check if line is a bullet point (-, *, •)
                              const bulletMatch = line.match(/^[\s]*[-•*]\s*(.+)$/)
                              if (bulletMatch) {
                                return (
                                  <div key={lineIndex} className="flex items-start gap-3 mb-2 ml-1">
                                    <span className="text-current mt-0.5 flex-shrink-0">•</span>
                                    <span className="flex-1 leading-relaxed">{bulletMatch[1]}</span>
                                  </div>
                                )
                              }
                              // Check if line is a numbered list item (1. or 1))
                              const numberedMatch = line.match(/^[\s]*(\d+)[.)]\s*(.+)$/)
                              if (numberedMatch) {
                                return (
                                  <div key={lineIndex} className="flex items-start mb-2.5 pl-0">
                                    <span className="font-medium flex-shrink-0 text-gray-600 dark:text-gray-400 mr-2.5 min-w-[28px]">
                                      {numberedMatch[1]}.
                                    </span>
                                    <span className="flex-1 leading-relaxed">{numberedMatch[2]}</span>
                                  </div>
                                )
                              }
                              // Check if line is indented (sub-item)
                              const indentMatch = line.match(/^[\s]{2,}(.+)$/)
                              if (indentMatch && lineIndex > 0) {
                                return (
                                  <div key={lineIndex} className="ml-6 mb-1 text-gray-600 dark:text-gray-300">
                                    • {indentMatch[1]}
                                  </div>
                                )
                              }
                              // Regular line
                              if (trimmedLine) {
                                return (
                                  <div key={lineIndex} className={lineIndex > 0 ? 'mt-2' : ''}>
                                    {trimmedLine}
                                  </div>
                                )
                              }
                              // Empty line
                              return <div key={lineIndex} className="h-2"></div>
                            })}
                          </div>
                          {message.code && (
                            <pre className="mt-2 p-3 bg-black/10 dark:bg-black/30 rounded-lg text-xs overflow-x-auto border border-white/20">
                              <code>{message.code}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                      )
                    })
                  )}
                </div>
                {/* Privacy Toggle - Compact - Disable for view-only users */}
                {datasets.length > 0 && (
                  <div className="px-4 py-2 bg-blue-50/30 dark:bg-blue-950/10 border-t border-blue-200/30 dark:border-blue-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${privacyMode ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {privacyMode ? '🔒 Privacy ON' : '⚠️ Privacy OFF'}
                        </span>
                      </div>
                      <label className={`flex items-center space-x-1 ${userRole === 'view' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={privacyMode}
                          onChange={(e) => setPrivacyMode(e.target.checked)}
                          disabled={userRole === 'view'}
                          className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-1 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Randomize
                        </span>
                      </label>
                    </div>
                  </div>
                )}
                {/* AI Mode now in header; removed here to save space */}
                {/* Prompt Input - Disabled for view-only users (they can use collaboration chat) */}
                {userRole !== 'view' ? (
                  <div className="p-4 border-t bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Ask me anything about your data... (e.g., 'make a regression plot')"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={loading}
                        className="border-2 border-rstudio/20 focus:border-rstudio shadow-sm text-darktext dark:text-white bg-white dark:bg-gray-800"
                      />
                      <Button onClick={handleSendMessage} disabled={loading} className="shadow-lg">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>View-only access: AI chat is disabled. Use the collaboration chat instead.</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Code Editor Section */}
          <div className={`${editorFocusMode ? 'flex-1' : 'h-1/3'} border-t border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 shadow-inner min-h-0`}>
            <div className="p-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-semibold text-darktext dark:text-white flex items-center">
                  <Code2 className="h-4 w-4 mr-2 text-rstudio" />
                  R Code Editor
                </span>
                <VersionHistory
                  projectId={projectId}
                  currentCode={project.code}
                  currentPlotUrl={project.plot_url}
                  onVersionRestore={userRole === 'view' ? undefined : handleVersionRestore}
                  onSaveVersion={userRole === 'view' ? undefined : handleSaveVersion}
                />
              </div>
              <div className="flex items-center gap-2">
                {userRole !== 'view' && (
                  <Button onClick={() => setEditorFocusMode(!editorFocusMode)} size="sm" variant="outline" className="shadow-none">
                    {editorFocusMode ? (
                      <>
                        <Minimize2 className="h-4 w-4 mr-2" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Expand
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={handleRunCode} size="sm" disabled={loading} className="shadow-md">
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 relative">
              {userRole === 'view' ? (
                <CodeEditor key={`editor-${editorKey}-view`} value={project.code} onChange={() => {}} readOnly={true} />
              ) : (
                <CodeEditorCollaborative 
                  key={`editor-${editorKey}-${userRole}`} 
                  value={project.code} 
                  onChange={handleCodeChange}
                  projectId={projectId}
                  readOnly={false}
                  enableEditLock={enableEditLock}
                  onEditLockChange={setEnableEditLock}
                  onCodeSelection={codeSelection}
                />
              )}
            </div>
          </div>
        </div>

          {/* Right Pane - Plot / Terminal - Scrollable */}
          <div className={`${showCollaborationSidebar ? 'w-[calc(50%-320px)]' : 'w-1/2'} bg-white dark:bg-gray-900 shadow-xl flex flex-col overflow-y-auto min-w-0`}>
            {/* Plot Display Section - Scrollable content */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-2 bg-gradient-to-r from-gray-100 to-blue-50 dark:from-gray-800 dark:to-blue-950 border-b flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-semibold text-darktext dark:text-white flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-rstudio" />
                  View
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    className={`px-2 py-1 rounded border ${!showTerminalNextToPlot ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'bg-transparent border-transparent opacity-60'}`}
                    onClick={() => setShowTerminalNextToPlot(false)}
                  >
                    Plot only
                  </button>
                  <button
                    className={`px-2 py-1 rounded border ${showTerminalNextToPlot ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'bg-transparent border-transparent opacity-60'}`}
                    onClick={() => setShowTerminalNextToPlot(true)}
                  >
                    Plot + Terminal
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-[400px] overflow-auto">
                {showTerminalNextToPlot ? (
                  <div className="h-full w-full flex gap-2 p-2">
                    <div className="w-1/2 min-w-0">
                      <TerminalView stdout={stdoutText} stderr={stderrText} projectId={projectId} />
                    </div>
                    <div className="w-1/2 min-w-0">
                      <PlotViewer 
                        plotUrl={project.plot_url || null}
                        plotUrls={galleryPlots}
                        projectName={project.name} 
                        hasCsvData={datasets.length > 0}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full">
                    <PlotViewer 
                      plotUrl={project.plot_url || null}
                      plotUrls={galleryPlots}
                      projectName={project.name} 
                      hasCsvData={datasets.length > 0}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Collaboration Sidebar */}
        {showCollaborationSidebar && (
          <div className="fixed right-0 top-[80px] h-[calc(100vh-80px)] w-80 bg-white dark:bg-gray-800 border-l shadow-2xl z-40 flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Collaboration</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCollaborationSidebar(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <CollaborationPanel 
                projectId={projectId}
                projectOwnerId={project?.user_id}
              />
              <div className="h-[400px]">
                <ProjectChat 
                  projectId={projectId}
                  userRole={userRole}
                  onCodeSelectionClick={(selection) => {
                    setCodeSelection(selection)
                    // Don't auto-clear - let user click off to clear
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Invite Collaborator Modal */}
        {showInviteModal && (
          <InviteCollaboratorModal
            projectId={projectId}
            onClose={() => setShowInviteModal(false)}
            onSuccess={() => {
              // Refresh collaboration panel if sidebar is open
              if (showCollaborationSidebar) {
                // The CollaborationPanel will refresh on its own
                setShowInviteModal(false)
              }
            }}
          />
        )}
        </div>
      </div>
    </Layout>
  )
}

