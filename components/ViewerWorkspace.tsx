'use client'

import { useState, useEffect, useRef } from 'react'
import { Editor } from '@monaco-editor/react'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from '@/store/useSessionStore'
import { TerminalView } from './TerminalView'
import { PlotViewer } from './PlotViewer'
import { Button } from '@/components/ui/button'
import { X, Download, Copy } from 'lucide-react'
import { UserAvatar } from './UserAvatar'

interface ViewerWorkspaceProps {
  userId: string
  projectId: string
  onClose: () => void
  onImportCode?: (code: string) => void
}

export function ViewerWorkspace({ userId, projectId, onClose, onImportCode }: ViewerWorkspaceProps) {
  const { user } = useSessionStore()
  const [viewedCode, setViewedCode] = useState<string>('')
  const [viewedPlotUrl, setViewedPlotUrl] = useState<string | null>(null)
  const [viewedStdout, setViewedStdout] = useState<string>('')
  const [viewedStderr, setViewedStderr] = useState<string>('')
  const [viewedUserProfile, setViewedUserProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null)
  const [theme, setTheme] = useState<'light' | 'vs-dark'>('light')
  const subscriptionRef = useRef<any>(null)

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

  // Load initial project state
  useEffect(() => {
    const loadProject = async () => {
      const { data } = await supabase
        .from('projects')
        .select('code, plot_url, stdout, stderr')
        .eq('id', projectId)
        .single()
      
      if (data) {
        setViewedCode(data.code || '')
        setViewedPlotUrl(data.plot_url || null)
        setViewedStdout(data.stdout || '')
        setViewedStderr(data.stderr || '')
      }
    }
    loadProject()
  }, [projectId])

  // Subscribe to real-time code updates from this user
  useEffect(() => {
    if (!projectId || !userId) return

    const channel = supabase
      .channel(`viewer-${projectId}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          const newData = payload.new as any
          if (newData.code !== undefined) {
            setViewedCode(newData.code)
          }
          if (newData.plot_url !== undefined) {
            setViewedPlotUrl(newData.plot_url || null)
          }
          if (newData.stdout !== undefined) {
            setViewedStdout(newData.stdout || '')
          }
          if (newData.stderr !== undefined) {
            setViewedStderr(newData.stderr || '')
          }
        }
      )
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [projectId, userId])

  // Terminal output is now stored in the database and shared in real-time

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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {viewedUserProfile && (
              <UserAvatar
                userId={userId}
                displayName={viewedUserProfile.display_name || 'User'}
                avatarUrl={viewedUserProfile.avatar_url}
                size="sm"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold">
                Viewing {viewedUserProfile?.display_name || 'User'}'s Workspace
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Real-time view of their code, terminal, and plots</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyCode}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Code
            </Button>
            {onImportCode && (
              <Button
                onClick={handleImportCode}
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Import to Editor
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content - Side by side */}
        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4 p-4">
          {/* Left: Code Editor */}
          <div className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-medium">
              Code Editor (Read-only)
            </div>
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                defaultLanguage="r"
                value={viewedCode}
                theme={theme}
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
          <div className="flex flex-col gap-4">
            {/* Terminal */}
            <div className="flex-1 min-h-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <TerminalView 
                stdout={viewedStdout} 
                stderr={viewedStderr} 
                projectId={projectId}
              />
            </div>

            {/* Plot Viewer */}
            <div className="h-64 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-medium">
                Plot Viewer
              </div>
              <div className="h-[calc(100%-32px)] overflow-auto">
                <PlotViewer plotUrl={viewedPlotUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

