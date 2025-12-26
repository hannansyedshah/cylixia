'use client'

import { useState, useEffect, useRef } from 'react'
import { Editor } from '@monaco-editor/react'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from '@/lib/useSessionStore'
import { TerminalView } from './TerminalView'
import { PlotViewer } from './PlotViewer'
import { Button } from '@/components/ui/button'
import { X, Download, Copy } from 'lucide-react'
import { UserAvatar } from './UserAvatar'

interface ViewerWorkspaceProps {
  userId: string
  projectId?: string // Optional: if not provided, will find the user's project
  projectName?: string // Optional: if provided, will try to find a project with this name first
  onClose: () => void
  onImportCode?: (code: string) => void
}

export function ViewerWorkspace({ userId, projectId, projectName, onClose, onImportCode }: ViewerWorkspaceProps) {
  const { user } = useSessionStore()
  const [viewedCode, setViewedCode] = useState<string>('')
  const [viewedPlotUrl, setViewedPlotUrl] = useState<string | null>(null)
  const [viewedPlotUrls, setViewedPlotUrls] = useState<string[]>([])
  const [viewedStdout, setViewedStdout] = useState<string>('')
  const [viewedStderr, setViewedStderr] = useState<string>('')
  const [viewedUserProfile, setViewedUserProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null)
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null) // Store the actual project ID being viewed
  const [theme, setTheme] = useState<'light' | 'vs-dark'>('light')
  const [viewMode, setViewMode] = useState<'plot' | 'graph'>('plot') // Default to 'plot'
  const subscriptionRef = useRef<any>(null)
  const editorRef = useRef<any>(null)

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .single()
      
      if (data) {
        setViewedUserProfile(data)
      }
    }
    loadProfile()
  }, [userId])

  // Reset state when userId changes
  useEffect(() => {
    console.log('[ViewerWorkspace] User changed, resetting state. New userId:', userId)
    // Reset all state when switching users
    setViewedCode('')
    setViewedPlotUrl(null)
    setViewedPlotUrls([])
    setViewedStdout('')
    setViewedStderr('')
    setTargetProjectId(null)
    
    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
  }, [userId])

  // Load initial project state - find the project that belongs to the userId being viewed
  useEffect(() => {
    if (!userId) return
    
    const loadProject = async () => {
      console.log('[ViewerWorkspace] Loading project for userId:', userId, 'projectId:', projectId, 'projectName:', projectName)
      
      // ALWAYS find the project that belongs to the viewed user
      // Don't trust the projectId prop - it might be from the current user's project
      let targetProjectId: string | undefined = undefined
      
      // First, try to find a project with the same name as the current project (if provided)
      if (projectName) {
        // Priority 1: Check if user OWNS a project with this name
        const { data: ownedProject } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', userId)
          .eq('name', projectName)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (ownedProject) {
          targetProjectId = ownedProject.id
          console.log('[ViewerWorkspace] Found owned project by name:', targetProjectId)
        } else {
          // Priority 2: Check if user is a COLLABORATOR on a project with this name
          // First get all project IDs where user is a collaborator
          const { data: collaboratorRecords } = await supabase
            .from('project_collaborators')
            .select('project_id')
            .eq('user_id', userId)
            .eq('status', 'accepted')
          
          if (collaboratorRecords && collaboratorRecords.length > 0) {
            const collaboratedProjectIds = collaboratorRecords.map((c: any) => c.project_id)
            
            // Now check if any of those projects have the matching name
            const { data: matchingCollaboratedProject } = await supabase
              .from('projects')
              .select('id')
              .in('id', collaboratedProjectIds)
              .eq('name', projectName)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            
            if (matchingCollaboratedProject) {
              // Only use collaborated project if user doesn't own one with the same name
              // (We already checked for owned projects above, so this is safe)
              targetProjectId = matchingCollaboratedProject.id
              console.log('[ViewerWorkspace] Found collaborated project by name:', targetProjectId, '(user is collaborator, not owner)')
            }
          }
        }
      }
      
      // If no matching name found, get their most recently updated OWNED project
      if (!targetProjectId) {
        const { data: userProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
        
        if (userProjects) {
          targetProjectId = userProjects.id
          console.log('[ViewerWorkspace] Found user\'s most recent owned project:', targetProjectId)
        } else {
          // Last resort: Check if they have any collaborated projects
          const { data: collaboratorRecords } = await supabase
            .from('project_collaborators')
            .select('project_id')
            .eq('user_id', userId)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false })
            .limit(1)
          
          if (collaboratorRecords && collaboratorRecords.length > 0) {
            const collaboratedProjectId = collaboratorRecords[0].project_id
            
            // Get the project details to verify it exists
            const { data: collaboratedProject } = await supabase
              .from('projects')
              .select('id')
              .eq('id', collaboratedProjectId)
              .single()
            
            if (collaboratedProject) {
              targetProjectId = collaboratedProject.id
              console.log('[ViewerWorkspace] Found user\'s most recent collaborated project:', targetProjectId)
            } else {
              console.warn('[ViewerWorkspace] Collaborated project not found:', collaboratedProjectId)
            }
          }
          
          if (!targetProjectId) {
            console.warn('[ViewerWorkspace] No project found for user:', userId)
            return
          }
        }
      }
      
      if (!targetProjectId) {
        console.error('[ViewerWorkspace] Failed to find target project for user:', userId)
        return
      }
      
      console.log('[ViewerWorkspace] Final targetProjectId:', targetProjectId)
      
      // Load the project data
      const { data, error } = await supabase
        .from('projects')
        .select('code, plot_url, stdout, stderr')
        .eq('id', targetProjectId)
        .single()
      
      if (error) {
        console.error('[ViewerWorkspace] Error loading project:', error)
        return
      }
      
      if (data) {
        console.log('[ViewerWorkspace] Loaded project data for:', targetProjectId)
        setViewedCode(data.code || '')
        const plotUrl = data.plot_url || null
        setViewedPlotUrl(plotUrl)
        // Parse plot_url - could be a single URL or JSON array
        if (plotUrl) {
          try {
            const parsed = JSON.parse(plotUrl)
            if (Array.isArray(parsed)) {
              console.log('[ViewerWorkspace] Found multiple plots in project:', parsed.length)
              setViewedPlotUrls(parsed)
            } else {
              setViewedPlotUrls([plotUrl])
            }
          } catch {
            setViewedPlotUrls([plotUrl])
          }
        } else {
          // If no plot_url in project, check latest version for all graphs/plots
          try {
            const versionsResponse = await fetch(`/api/projects/${targetProjectId}/versions`)
            if (versionsResponse.ok) {
              const versionsData = await versionsResponse.json()
              if (versionsData.versions && versionsData.versions.length > 0) {
                const latestVersion = versionsData.versions[0] // Versions are sorted by created_at desc
                if (latestVersion.plot_url) {
                  try {
                    const parsed = JSON.parse(latestVersion.plot_url)
                    if (Array.isArray(parsed)) {
                      console.log('[ViewerWorkspace] Found multiple plots in latest version:', parsed.length)
                      setViewedPlotUrls(parsed)
                    } else {
                      setViewedPlotUrls([latestVersion.plot_url])
                    }
                  } catch {
                    setViewedPlotUrls([latestVersion.plot_url])
                  }
                }
              }
            }
          } catch (error) {
            console.warn('[ViewerWorkspace] Failed to load plots from latest version:', error)
          }
        }
        setViewedStdout(data.stdout || '')
        setViewedStderr(data.stderr || '')
        // Store the target project ID so we can use it consistently - this will trigger the subscription
        console.log('[ViewerWorkspace] Setting targetProjectId to:', targetProjectId)
        setTargetProjectId(targetProjectId || null)
      } else {
        console.warn('[ViewerWorkspace] No project data found for:', targetProjectId)
      }
    }
    loadProject()
  }, [projectId, userId, projectName])

  // Subscribe to real-time code updates from this user
  useEffect(() => {
    if (!userId || !targetProjectId) {
      console.log('[ViewerWorkspace] Skipping subscription setup:', { userId, targetProjectId })
      return
    }

    console.log('[ViewerWorkspace] Setting up subscription for project:', targetProjectId)

    // Clean up any existing subscription first
    if (subscriptionRef.current) {
      console.log('[ViewerWorkspace] Cleaning up existing subscription')
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    // Set up new subscription
    const channel = supabase
      .channel(`viewer-${targetProjectId}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${targetProjectId}`
        },
        (payload) => {
          console.log('[ViewerWorkspace] Received real-time update:', payload)
          const newData = payload.new as any
          
          if (newData.code !== undefined) {
            const newCode = newData.code
            console.log('[ViewerWorkspace] Updating code:', newCode.substring(0, 50) + '...')
            setViewedCode(newCode)
            // Update Monaco editor directly for real-time updates
            if (editorRef.current) {
              const currentValue = editorRef.current.getValue()
              if (currentValue !== newCode) {
                editorRef.current.setValue(newCode)
              }
            }
          }
          
          if (newData.plot_url !== undefined) {
            const plotUrl = newData.plot_url || null
            console.log('[ViewerWorkspace] Updating plot_url:', plotUrl ? 'has plot' : 'no plot')
            setViewedPlotUrl(plotUrl)
            // Parse plot_url - could be a single URL or JSON array
            if (plotUrl) {
              try {
                const parsed = JSON.parse(plotUrl)
                if (Array.isArray(parsed)) {
                  console.log('[ViewerWorkspace] Found multiple plots:', parsed.length)
                  setViewedPlotUrls(parsed)
                } else {
                  setViewedPlotUrls([plotUrl])
                }
              } catch {
                setViewedPlotUrls([plotUrl])
              }
            } else {
              setViewedPlotUrls([])
            }
          }
          
          if (newData.stdout !== undefined) {
            console.log('[ViewerWorkspace] Updating stdout')
            setViewedStdout(newData.stdout || '')
          }
          
          if (newData.stderr !== undefined) {
            console.log('[ViewerWorkspace] Updating stderr')
            setViewedStderr(newData.stderr || '')
          }
        }
      )
      .subscribe((status) => {
        console.log('[ViewerWorkspace] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[ViewerWorkspace] ✅ Successfully subscribed to real-time updates for project:', targetProjectId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[ViewerWorkspace] ❌ Channel error')
        } else if (status === 'TIMED_OUT') {
          console.error('[ViewerWorkspace] ❌ Subscription timed out')
        } else if (status === 'CLOSED') {
          console.log('[ViewerWorkspace] Subscription closed')
        }
      })

    subscriptionRef.current = channel

    return () => {
      console.log('[ViewerWorkspace] Cleaning up subscription')
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [targetProjectId, userId])

  // Polling fallback - refresh data every 3 seconds as backup if real-time fails
  useEffect(() => {
    if (!targetProjectId) return

    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('code, plot_url, stdout, stderr')
          .eq('id', targetProjectId)
          .single()

        if (data) {
          // Only update if something changed to avoid unnecessary re-renders
          setViewedCode(prev => prev !== data.code ? (data.code || '') : prev)
          setViewedStdout(prev => prev !== data.stdout ? (data.stdout || '') : prev)
          setViewedStderr(prev => prev !== data.stderr ? (data.stderr || '') : prev)
          
          // Update plots if changed
          const plotUrl = data.plot_url || null
          if (plotUrl !== viewedPlotUrl) {
            setViewedPlotUrl(plotUrl)
            if (plotUrl) {
              try {
                const parsed = JSON.parse(plotUrl)
                if (Array.isArray(parsed)) {
                  setViewedPlotUrls(parsed)
                } else {
                  setViewedPlotUrls([plotUrl])
                }
              } catch {
                setViewedPlotUrls([plotUrl])
              }
            } else {
              setViewedPlotUrls([])
            }
          }
        }
      } catch (error) {
        console.warn('[ViewerWorkspace] Polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [targetProjectId, viewedPlotUrl])

  // Terminal output is now stored in the database and shared in real-time

  // Ensure Monaco editor updates when viewedCode changes
  useEffect(() => {
    if (editorRef.current && viewedCode !== undefined) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== viewedCode) {
        editorRef.current.setValue(viewedCode)
      }
    }
  }, [viewedCode])

  // Theme detection
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

  const handleImportCode = () => {
    if (onImportCode && viewedCode) {
      onImportCode(viewedCode)
      onClose()
    }
  }

  const handleCopyCode = () => {
    if (viewedCode) {
      navigator.clipboard.writeText(viewedCode)
      alert('Code copied to clipboard!')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 pt-16 sm:pt-20">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full h-full max-w-[95vw] max-h-[calc(95vh-4rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {viewedUserProfile && (
              <UserAvatar
                userId={userId}
                displayName={viewedUserProfile.display_name || 'User'}
                avatarUrl={viewedUserProfile.avatar_url}
                size="sm"
              />
            )}
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-semibold truncate dark:text-white">
                Viewing {viewedUserProfile?.display_name || 'User'}&apos;s Workspace
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Real-time view of their code, terminal, and plots</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              onClick={handleCopyCode}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 sm:gap-2"
            >
              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            {onImportCode && (
              <Button
                onClick={handleImportCode}
                size="sm"
                className="flex items-center gap-1 sm:gap-2"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="destructive"
              size="icon"
              className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white border-0"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content - Side by side */}
        <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 p-2 sm:p-4">
          {/* Left: Code Editor */}
          <div className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden min-h-0">
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-medium dark:text-gray-200">
              Code Editor (Read-only)
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="r"
                value={viewedCode}
                theme={theme}
                onMount={(editor) => {
                  editorRef.current = editor
                  // Set initial value
                  if (viewedCode) {
                    editor.setValue(viewedCode)
                  }
                }}
                onChange={(value) => {
                  // This shouldn't be called since readOnly is true, but just in case
                  if (value !== viewedCode) {
                    setViewedCode(value || '')
                  }
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  readOnly: true,
                }}
              />
            </div>
          </div>

          {/* Right: Terminal and Plot */}
          <div className="flex flex-col gap-3 sm:gap-4 min-h-0">
            {/* Terminal - Fixed height with scroll */}
            <div className="h-64 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-shrink-0">
              <TerminalView 
                stdout={viewedStdout} 
                stderr={viewedStderr} 
                projectId={targetProjectId || undefined}
              />
            </div>

            {/* Plot/Graph Viewer */}
            <div className="flex-1 min-h-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <span className="text-xs font-medium dark:text-gray-200">
                  {viewMode === 'plot' ? 'Plot Viewer' : 'Graph Viewer'}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    className={`px-2 py-1 rounded border ${viewMode === 'plot' ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'bg-transparent border-transparent opacity-60'}`}
                    onClick={() => setViewMode('plot')}
                  >
                    Plot
                  </button>
                  <button
                    className={`px-2 py-1 rounded border ${viewMode === 'graph' ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'bg-transparent border-transparent opacity-60'}`}
                    onClick={() => setViewMode('graph')}
                  >
                    Graph
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <PlotViewer plotUrl={viewedPlotUrl} plotUrls={viewedPlotUrls} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


